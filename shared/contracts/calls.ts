import { PlanCapabilities } from "./plans";
import { WorkspaceTenantConfig } from "./workspace";

export type CallState =
  | "queued"
  | "initiated"
  | "dispatching"
  | "ringing"
  | "connected"
  | "active"
  | "completed"
  | "failed";

export interface InitiateCallRequest {
  tenantId: string;
  roomId: string;
  phoneNumber?: string | null;
  agentName: string;
  direction: "inbound" | "outbound";
  voiceCalling?: {
    callDurationLimitSec?: number | null;
    callDurationLimitEnabled?: boolean;
  };
}

export interface InitiateCallResponse {
  callId: string;
  tenantId: string;
  roomId: string;
  state: CallState;
  dispatch: {
    webhookUrl: string;
    eventAuthMode: "bearer";
    expectedHeaders: string[];
  };
}

export interface CallSummary {
  callId: string;
  tenantId: string;
  roomId: string;
  state: CallState;
  initiatedAt: string;
  connectedAt?: string;
  completedAt?: string;
  failedAt?: string;
  raw_call_outcome?: string | null;
  raw_call_outcome_confidence?: number | null;
  lead_bucket?: "Qualified" | "Neutral" | "Retry" | "Failed" | "Unknown" | null;
}

export interface CallEventSummary {
  eventType: string;
  count: number;
}

export interface CallDetail extends CallSummary {
  phoneNumber?: string | null;
  agentName?: string | null;
  direction?: string | null;
  durationSec?: number | null;
  transcriptTurns?: number | null;
  recordingUrl?: string | null;
  estimatedCost?: number | null;
  lastError?: string | null;
  eventSummary: CallEventSummary[];
}

export interface TranscriptSegmentItem {
  id: string;
  callId: string;
  speaker: "user" | "agent";
  text: string;
  isFinal: boolean;
  sequenceNo: number;
  occurredAt: string;
  providerMessageId?: string | null;
}

export interface RecordingResponse {
  callId: string;
  tenantId: string;
  available: boolean;
  recordingUrl: string | null;
  signedUrl: string | null;
}

export interface LeadResponse {
  callId: string;
  tenantId: string;
  extractedAt: string;
  fields: {
    name?: string | null;
    phone?: string | null;
    summary?: string;
    propertyType?: string | null;
    preferredLocation?: string | null;
    budgetRange?: string | null;
    timeline?: string | null;
    [key: string]: any;
  };
  raw_data?: Record<string, any> | null;
  confidence: number | any | null;
}

export interface CallsQuery {
  page?: number;
  pageSize?: number;
  status?: CallState;
  from?: string;
  to?: string;
}

export interface TranscriptQuery {
  page?: number;
  pageSize?: number;
}

export interface CapabilitiesResponse {
  tenantId: string;
  capabilities: PlanCapabilities;
  workspaceConfig: WorkspaceTenantConfig;
}

export interface VoiceCall {
  call_id: string;
  status: string;
  transcript_turns?: number | null;
  received_at?: string | null;
  [key: string]: unknown;
}

export interface VoiceCallsPayload {
  ok: boolean;
  count: number;
  calls: VoiceCall[];
}

export interface VoiceCallEvent {
  event_type?: string;
  occurred_at?: string;
  [key: string]: unknown;
}

export interface VoiceCallDetailPayload {
  ok: boolean;
  call_id: string;
  events: VoiceCallEvent[];
  count: number;
}
