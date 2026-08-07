import {
    ApiEnvelope,
    CallDetail,
    CallsQuery,
    CallSummary,
    CampaignCallRecord,
    CampaignRecord,
    CapabilitiesResponse,
    InitiateCallRequest,
    InitiateCallResponse,
    LeadResponse,
    RecordingResponse,
    TranscriptQuery,
    TranscriptSegmentItem,
    VoiceCallDetailPayload,
    VoiceCallsPayload,
} from "../../shared/contracts";

import { apiClient } from "./client";

function toQueryString(query?: Record<string, string | number | undefined>): string {
  if (!query) {
    return "";
  }

  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  });

  const encoded = params.toString();
  return encoded ? `?${encoded}` : "";
}

const VOICE_API_BASE_URL = process.env.EXPO_PUBLIC_VOICE_API_BASE_URL?.trim().replace(/\/$/, "") || "";
const VOICE_API_TOKEN = process.env.EXPO_PUBLIC_VOICE_API_BEARER_TOKEN?.trim() || "";

export function isVoiceApiConfigured(): boolean {
  return Boolean(VOICE_API_BASE_URL && VOICE_API_TOKEN);
}

async function fetchVoiceApi<TResponse>(path: string): Promise<ApiEnvelope<TResponse>> {
  if (!isVoiceApiConfigured()) {
    return {
      success: false,
      error: {
        code: "VOICE_API_NOT_CONFIGURED",
        message: "Voice API is not configured",
      },
    };
  }

  try {
    const response = await fetch(`${VOICE_API_BASE_URL}${path}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${VOICE_API_TOKEN}`,
      },
    });

    const json = (await response.json()) as TResponse;
    if (!response.ok) {
      return {
        success: false,
        error: {
          code: "VOICE_API_REQUEST_FAILED",
          message: `Voice API request failed with status ${response.status}`,
          details: json,
        },
      };
    }

    return {
      success: true,
      data: json,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "VOICE_API_UNREACHABLE",
        message: error instanceof Error ? error.message : "Unable to reach voice API",
      },
    };
  }
}

export async function createCall(
  payload: Omit<InitiateCallRequest, "tenantId">
): Promise<ApiEnvelope<InitiateCallResponse>> {
  return apiClient.post<Omit<InitiateCallRequest, "tenantId">, InitiateCallResponse>(
    "/calls",
    payload
  );
}

export async function fetchCalls(query?: CallsQuery): Promise<ApiEnvelope<CallSummary[]>> {
  const path = `/calls${toQueryString({
    page: query?.page,
    pageSize: query?.pageSize,
    status: query?.status,
    from: query?.from,
    to: query?.to,
  })}`;

  return apiClient.get<CallSummary[]>(path);
}

export async function fetchCallDetail(callId: string): Promise<ApiEnvelope<CallDetail>> {
  return apiClient.get<CallDetail>(`/calls/${encodeURIComponent(callId)}?_t=${Date.now()}`);
}

export async function fetchCallTranscript(
  callId: string,
  query?: TranscriptQuery
): Promise<ApiEnvelope<TranscriptSegmentItem[]>> {
  const path = `/calls/${encodeURIComponent(callId)}/transcript${toQueryString({
    page: query?.page,
    pageSize: query?.pageSize,
    _t: Date.now(),
  })}`;

  return apiClient.get<TranscriptSegmentItem[]>(path);
}

export async function fetchCallRecording(callId: string): Promise<ApiEnvelope<RecordingResponse>> {
  return apiClient.get<RecordingResponse>(`/calls/${encodeURIComponent(callId)}/recording`);
}

export async function fetchCallLead(callId: string): Promise<ApiEnvelope<LeadResponse>> {
  return apiClient.get<LeadResponse>(`/calls/${encodeURIComponent(callId)}/lead?_t=${Date.now()}`);
}

export async function fetchCapabilities(): Promise<ApiEnvelope<CapabilitiesResponse>> {
  return apiClient.get<CapabilitiesResponse>(`/capabilities?_t=${Date.now()}`);
}

export async function fetchCampaigns(query?: { page?: number; pageSize?: number; status?: string }): Promise<ApiEnvelope<CampaignRecord[]>> {
  const path = `/campaigns${toQueryString({
    page: query?.page,
    pageSize: query?.pageSize,
    status: query?.status,
  })}`;

  return apiClient.get<CampaignRecord[]>(path);
}

export async function fetchCampaignCalls(campaignId: string): Promise<ApiEnvelope<CampaignCallRecord[]>> {
  return apiClient.get<CampaignCallRecord[]>(`/campaigns/${encodeURIComponent(campaignId)}/calls`);
}

export async function fetchVoiceCalls(
  tenantId: string,
  limit = 50
): Promise<ApiEnvelope<VoiceCallsPayload>> {
  const path = `/api/voice/calls${toQueryString({
    tenant_id: tenantId,
    limit,
  })}`;

  return fetchVoiceApi<VoiceCallsPayload>(path);
}

export async function fetchVoiceCallDetail(callId: string): Promise<ApiEnvelope<VoiceCallDetailPayload>> {
  const path = `/api/voice/calls/${encodeURIComponent(callId)}`;
  return fetchVoiceApi<VoiceCallDetailPayload>(path);
}
