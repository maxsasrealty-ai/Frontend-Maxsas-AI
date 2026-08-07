import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    createCall,
    fetchCalls,
    fetchCapabilities,
    fetchVoiceCallDetail,
    fetchVoiceCalls,
    isVoiceApiConfigured,
} from "../lib/api/calls";
import { bootstrapAuthSession, getCurrentTenantId, subscribeAuthSession } from "../lib/auth/session";
import { RealtimeConnectionState, realtimeClient } from "../lib/realtime/client";
import {
    ApiEnvelope,
    CallState,
    CallSummary,
    LiveCallStage,
    PlanCapabilities,
    RealtimeCallEvent,
    VoiceCallDetailPayload,
    VoiceCallsPayload,
    WorkspaceTenantConfig,
} from "../shared/contracts";
import { pickState, upsertCallSummary } from "./callsUtils";
import { useLexusTheme } from "./LexusThemeContext";

export interface LiveCallSnapshot {
  callId: string;
  stage: LiveCallStage;
  callState: CallState;
  transcriptState: "none" | "partial" | "final";
  partialTranscript: string | null;
  finalTranscriptReady: boolean;
  leadExtractionState: "idle" | "updating" | "ready";
  recordingState: "locked" | "processing" | "available";
  analysisState: "idle" | "pending" | "ready";
  retryable: boolean;
  lastError: string | null;
  lastEventType: string | null;
  lastOccurredAt: string | null;
}

interface CallsContextValue {
  calls: CallSummary[];
  voiceCallsResult: ApiEnvelope<VoiceCallsPayload> | null;
  voiceCallDetailById: Record<string, ApiEnvelope<VoiceCallDetailPayload>>;
  capabilities: PlanCapabilities | null;
  workspaceConfig: WorkspaceTenantConfig | null;
  error: string | null;
  liveByCallId: Record<string, LiveCallSnapshot>;
  liveVersionByCallId: Record<string, number>;
  liveConnectionState: RealtimeConnectionState;
  isLoading: boolean;
  isVoiceLoading: boolean;
  isBootstrapping: boolean;
  refreshCalls: () => Promise<void>;
  refreshVoiceCalls: () => Promise<void>;
  loadVoiceCallDetail: (callId: string) => Promise<ApiEnvelope<VoiceCallDetailPayload>>;
  bootstrapCalls: () => Promise<void>;
  initiateCall: (input: {
    roomId: string;
    phoneNumber?: string | null;
    agentName: string;
    direction: "inbound" | "outbound";
  }) => Promise<string | null>;
  dismissedCallIds: Record<string, true>;
  retryAttemptsByCallId: Record<string, number>;
  dismissCalls: (callIds: string[]) => void;
  registerRetryAttempt: (callId: string) => void;
}

const CallsContext = createContext<CallsContextValue | undefined>(undefined);

const MAX_DEDUPED_EVENT_IDS = 500;
const FALLBACK_TENANT_ID = process.env.EXPO_PUBLIC_TENANT_ID?.trim() || null;

function stageFromState(state: CallState): LiveCallStage {
  switch (state) {
    case "initiated":
    case "dispatching":
      return "queued_dispatching";
    case "ringing":
    case "connected":
      return "connecting";
    case "active":
      return "in_progress";
    case "completed":
      return "completed";
    case "failed":
      return "failed";
    default:
      return "in_progress";
  }
}

async function resolveEffectiveTenantId(currentTenantId: string | null): Promise<string | null> {
  return currentTenantId || (await getCurrentTenantId()) || FALLBACK_TENANT_ID;
}

function getDefaultLiveSnapshot(call: CallSummary, capabilities: PlanCapabilities | null): LiveCallSnapshot {
  return {
    callId: call.callId,
    stage: stageFromState(call.state),
    callState: call.state,
    transcriptState: "none",
    partialTranscript: null,
    finalTranscriptReady: false,
    leadExtractionState: "idle",
    recordingState: capabilities?.features["recordings.playback"] ? "processing" : "locked",
    analysisState: call.state === "completed" ? "pending" : "idle",
    retryable: false,
    lastError: null,
    lastEventType: null,
    lastOccurredAt: null,
  };
}

function applyLiveEvent(
  previous: LiveCallSnapshot,
  event: RealtimeCallEvent,
  capabilities: PlanCapabilities | null
): LiveCallSnapshot {
  const canPlayback = capabilities?.features["recordings.playback"] === true;
  const next: LiveCallSnapshot = {
    ...previous,
    stage: event.stage,
    callState: pickState(previous.callState, event.callState),
    lastEventType: event.eventType,
    lastOccurredAt: event.occurredAt,
  };

  if (event.eventType === "transcript_partial") {
    const payload = event.payload as { text?: string | null };
    next.stage = "transcript_partial";
    next.transcriptState = "partial";
    next.partialTranscript = payload.text || previous.partialTranscript;
  }

  if (event.eventType === "transcript_final") {
    const payload = event.payload as { text?: string | null };
    next.stage = "transcript_final";
    next.transcriptState = "final";
    next.partialTranscript = payload.text || previous.partialTranscript;
    next.finalTranscriptReady = true;
  }

  if (event.eventType === "call_completed") {
    const payload = event.payload as { recording_url?: string | null };
    next.stage = "analysis_pending";
    next.analysisState = "pending";
    next.leadExtractionState = "updating";
    next.recordingState = canPlayback ? (payload.recording_url ? "available" : "processing") : "locked";
  }

  if (event.eventType === "lead_extracted") {
    next.stage = "completed";
    next.leadExtractionState = "ready";
    next.analysisState = "ready";
  }

  if (event.eventType === "call_failed") {
    const payload = event.payload as { error?: string; retryable?: boolean };
    next.stage = "failed";
    next.lastError = payload.error || "Call failed";
    next.retryable = payload.retryable === true;
    next.analysisState = "idle";
  }

  if (event.eventType === "call_started") {
    next.stage = "in_progress";
  }

  return next;
}

export function CallsProvider({ children }: { children: React.ReactNode }) {
  const [calls, setCalls] = useState<CallSummary[]>([]);
  const [voiceCallsResult, setVoiceCallsResult] = useState<ApiEnvelope<VoiceCallsPayload> | null>(null);
  const [voiceCallDetailById, setVoiceCallDetailById] = useState<Record<string, ApiEnvelope<VoiceCallDetailPayload>>>({});
  const [capabilities, setCapabilities] = useState<PlanCapabilities | null>(null);
  const [workspaceConfig, setWorkspaceConfig] = useState<WorkspaceTenantConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [liveByCallId, setLiveByCallId] = useState<Record<string, LiveCallSnapshot>>({});
  const [liveVersionByCallId, setLiveVersionByCallId] = useState<Record<string, number>>({});
  const [liveConnectionState, setLiveConnectionState] = useState<RealtimeConnectionState>("idle");
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceLoading, setIsVoiceLoading] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [dismissedCallIds, setDismissedCallIds] = useState<Record<string, true>>({});
  const [retryAttemptsByCallId, setRetryAttemptsByCallId] = useState<Record<string, number>>({});
  const seenEventIdsRef = useRef<Set<string>>(new Set());
  const seenEventQueueRef = useRef<string[]>([]);

  const { callDurationLimit, callDurationLimitEnabled } = useLexusTheme();

  const markSeen = useCallback((eventId: string): boolean => {
    if (seenEventIdsRef.current.has(eventId)) {
      return true;
    }

    seenEventIdsRef.current.add(eventId);
    seenEventQueueRef.current.push(eventId);

    if (seenEventQueueRef.current.length > MAX_DEDUPED_EVENT_IDS) {
      const removed = seenEventQueueRef.current.shift();
      if (removed) {
        seenEventIdsRef.current.delete(removed);
      }
    }

    return false;
  }, []);

  const refreshCalls = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchCalls();
      if (response.success) {
        setCalls(response.data);
        setLiveByCallId((current) => {
          const next = { ...current };
          response.data.forEach((call) => {
            if (!next[call.callId]) {
              next[call.callId] = getDefaultLiveSnapshot(call, capabilities);
            }
          });
          return next;
        });
      } else {
        setError(response.error?.message || "Failed to refresh calls");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error while refreshing calls");
    } finally {
      setIsLoading(false);
    }
  }, [capabilities]);

  const refreshVoiceCalls = useCallback(async () => {
    setIsVoiceLoading(true);
    try {
      const currentTenantId = await resolveEffectiveTenantId(tenantId);

      if (!currentTenantId) {
        setVoiceCallsResult({
          success: false,
          error: {
            code: "TENANT_NOT_READY",
            message: "Tenant session is not ready yet",
          },
        });
        return;
      }

      if (!isVoiceApiConfigured()) {
        setVoiceCallsResult({
          success: true,
          data: {
            ok: true,
            count: 0,
            calls: [],
          },
        });
        return;
      }

      const response = await fetchVoiceCalls(currentTenantId);
      setVoiceCallsResult(response);
    } finally {
      setIsVoiceLoading(false);
    }
  }, [tenantId]);

  const loadVoiceCallDetail = useCallback(async (callId: string): Promise<ApiEnvelope<VoiceCallDetailPayload>> => {
    if (!isVoiceApiConfigured()) {
      const response: ApiEnvelope<VoiceCallDetailPayload> = {
        success: false,
        error: {
          code: "VOICE_API_NOT_CONFIGURED",
          message: "Voice API is not configured",
        },
      };

      setVoiceCallDetailById((current) => ({
        ...current,
        [callId]: response,
      }));

      return response;
    }

    const response = await fetchVoiceCallDetail(callId);
    setVoiceCallDetailById((current) => ({
      ...current,
      [callId]: response,
    }));
    return response;
  }, []);

  const bootstrapCalls = useCallback(async () => {
    const currentTenantId = await resolveEffectiveTenantId(tenantId);
    if (!currentTenantId) {
      return;
    }

    setIsBootstrapping(true);
    setError(null);
    try {
      const [callsResult, capabilitiesResult, voiceCallsResult] = await Promise.all([
        fetchCalls(),
        fetchCapabilities(),
        isVoiceApiConfigured()
          ? fetchVoiceCalls(currentTenantId)
          : Promise.resolve({
              success: true as const,
              data: {
                ok: true,
                count: 0,
                calls: [],
              },
            }),
      ]);

      if (callsResult.success) {
        setCalls(callsResult.data);
      } else {
        setError(callsResult.error?.message || "Failed to load calls");
      }

      if (capabilitiesResult.success) {
        setCapabilities(capabilitiesResult.data.capabilities);
        setWorkspaceConfig(capabilitiesResult.data.workspaceConfig);

        if (callsResult.success) {
          const initialLive: Record<string, LiveCallSnapshot> = {};
          callsResult.data.forEach((call) => {
            initialLive[call.callId] = getDefaultLiveSnapshot(call, capabilitiesResult.data.capabilities);
          });
          setLiveByCallId(initialLive);
        }
      } else {
        setError(capabilitiesResult.error?.message || "Failed to load capabilities");
      }

      setVoiceCallsResult(voiceCallsResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error while bootstrapping calls");
    } finally {
      setIsBootstrapping(false);
    }
  }, [tenantId]);

  const initiateCall = useCallback(
    async (input: {
      roomId: string;
      phoneNumber?: string | null;
      agentName: string;
      direction: "inbound" | "outbound";
    }): Promise<string | null> => {
      const optimistic: CallSummary = {
        callId: `optimistic-${Date.now()}`,
        tenantId: "pending",
        roomId: input.roomId,
        state: "dispatching",
        initiatedAt: new Date().toISOString(),
      };

      setCalls((current) => [optimistic, ...current]);

      let response;
      try {
        const payload = {
          roomId: input.roomId,
          phoneNumber: input.phoneNumber ?? null,
          agentName: input.agentName,
          direction: input.direction,
          voiceCalling: {
            callDurationLimitSec: callDurationLimit ?? null,
            callDurationLimitEnabled: callDurationLimitEnabled === true,
          },
        };

        response = await createCall(payload);
      } catch (err) {
        setCalls((current) => current.filter((item) => item.callId !== optimistic.callId));
        setError(
          err instanceof Error
            ? err.message
            : "Failed to initiate call. Please verify API base URL and backend availability."
        );
        return null;
      }

      if (!response.success) {
        setCalls((current) => current.filter((item) => item.callId !== optimistic.callId));
        setError(response.error?.message || "Failed to initiate call");
        return null;
      }

      setError(null);

      const createdCall: CallSummary = {
        callId: response.data.callId,
        tenantId: response.data.tenantId,
        roomId: response.data.roomId,
        state: response.data.state,
        initiatedAt: new Date().toISOString(),
      };

      setCalls((current) => [createdCall, ...current.filter((item) => item.callId !== optimistic.callId)]);
      setLiveByCallId((current) => ({
        ...current,
        [createdCall.callId]: {
          ...getDefaultLiveSnapshot(createdCall, capabilities),
          stage: "queued_dispatching",
        },
      }));
      return response.data.callId;
    },
    [capabilities, callDurationLimit, callDurationLimitEnabled]
  );

  const dismissCalls = useCallback((callIds: string[]) => {
    if (callIds.length === 0) {
      return;
    }

    setDismissedCallIds((current) => {
      const next = { ...current };
      callIds.forEach((callId) => {
        next[callId] = true;
      });
      return next;
    });
  }, []);

  const registerRetryAttempt = useCallback((callId: string) => {
    setRetryAttemptsByCallId((current) => ({
      ...current,
      [callId]: (current[callId] || 0) + 1,
    }));
  }, []);

  useEffect(() => {
    const activeTenantId = tenantId || FALLBACK_TENANT_ID;

    if (!capabilities?.features["calls.history"] || !activeTenantId) {
      return;
    }

    let cancelled = false;
    const subscription = realtimeClient.subscribeToCallEvents(
      activeTenantId,
      (event) => {
        if (cancelled) {
          return;
        }

        if (markSeen(event.streamEventId)) {
          return;
        }

        setCalls((current) => upsertCallSummary(current, event));

        setLiveByCallId((current) => {
          const fallbackCall: CallSummary = {
            callId: event.callId,
            tenantId: event.tenantId,
            roomId: event.roomId,
            state: event.callState,
            initiatedAt: event.occurredAt,
          };

          const previous = current[event.callId] || getDefaultLiveSnapshot(fallbackCall, capabilities);
          return {
            ...current,
            [event.callId]: applyLiveEvent(previous, event, capabilities),
          };
        });

        setLiveVersionByCallId((current) => ({
          ...current,
          [event.callId]: (current[event.callId] || 0) + 1,
        }));
      },
      (state) => {
        setLiveConnectionState(state);
      }
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [capabilities, markSeen, tenantId]);

  useEffect(() => {
    let mounted = true;

    void bootstrapAuthSession().then((currentTenantId) => {
      if (!mounted) {
        return;
      }

      setTenantId(currentTenantId || FALLBACK_TENANT_ID);
      setIsSessionReady(true);
    });

    const unsubscribe = subscribeAuthSession((currentTenantUser) => {
      if (!mounted) {
        return;
      }

      setTenantId(currentTenantUser?.tenantId ?? FALLBACK_TENANT_ID);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      calls,
      voiceCallsResult,
      voiceCallDetailById,
      capabilities,
      workspaceConfig,
      error,
      liveByCallId,
      liveVersionByCallId,
      liveConnectionState,
      isLoading,
      isVoiceLoading,
      isBootstrapping,
      refreshCalls,
      refreshVoiceCalls,
      loadVoiceCallDetail,
      bootstrapCalls,
      initiateCall,
      dismissedCallIds,
      retryAttemptsByCallId,
      dismissCalls,
      registerRetryAttempt,
    }),
    [
      calls,
      voiceCallsResult,
      voiceCallDetailById,
      capabilities,
      workspaceConfig,
      error,
      liveByCallId,
      liveVersionByCallId,
      liveConnectionState,
      isLoading,
      isVoiceLoading,
      isBootstrapping,
      refreshCalls,
      refreshVoiceCalls,
      loadVoiceCallDetail,
      bootstrapCalls,
      initiateCall,
      dismissedCallIds,
      retryAttemptsByCallId,
      dismissCalls,
      registerRetryAttempt,
    ]
  );

  useEffect(() => {
    if (!isSessionReady) {
      return;
    }

    const activeTenantId = tenantId || FALLBACK_TENANT_ID;

    if (!activeTenantId) {
      setCalls([]);
      setVoiceCallsResult(null);
      setVoiceCallDetailById({});
      setLiveByCallId({});
      setLiveVersionByCallId({});
      setError(null);
      setIsLoading(false);
      setIsVoiceLoading(false);
      setIsBootstrapping(false);
      return;
    }

    void bootstrapCalls();
  }, [bootstrapCalls, isSessionReady, tenantId]);

  useEffect(() => {
    return () => {
      void realtimeClient.disconnect();
    };
  }, []);

  return <CallsContext.Provider value={value}>{children}</CallsContext.Provider>;
}

export function useCallsContext(): CallsContextValue {
  const context = useContext(CallsContext);
  if (!context) {
    throw new Error("useCallsContext must be used within a CallsProvider");
  }

  return context;
}