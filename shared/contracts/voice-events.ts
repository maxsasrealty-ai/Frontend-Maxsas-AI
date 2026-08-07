export type VoiceEventType =
  | "transcript_partial"
  | "transcript_final"
  | "call_ringing"
  | "call_connected"
  | "call_started"
  | "lead_extracted"
  | "call_completed"
  | "call_failed"
  | "publisher_test";

export type Speaker = "user" | "agent";

export interface TranscriptEventPayload {
  speaker: Speaker;
  text: string;
  final: boolean;
  sequence_no: number;
  provider_message_id: string | null;
  raw: unknown | null;
}

export interface CallStartedPayload {
  phone_number: string | null;
  agent_name: string;
  direction: "inbound" | "outbound";
  status: "started";
}

export interface CallRingingPayload {
  status: "ringing";
}

export interface CallConnectedPayload {
  status: "connected";
  connected_at?: string;
}

export interface LeadExtractedPayload {
  extracted_at: string;
  fields: {
    name: string | null;
    phone: string | null;
    summary: string;
    intent?: string | null;
    property_type?: string | null;
    location?: string | null;
    budget?: string | null;
    timeline?: string | null;
    phone_number?: string | null;
  };
  confidence: number | null;
  raw: unknown | null;
}

export interface PublisherTestPayload {
  message?: string;
  meta?: Record<string, unknown>;
}

export interface CallCompletedPayload {
  status: "completed";
  ended_by: "participant_disconnected" | "shutdown_signal" | "max_duration_timeout";
  duration_sec: number;
  transcript_turns: number;
  recording_url: string | null;
}

export interface CallFailedPayload {
  status: "failed";
  error: string;
  stage: string;
  retryable: boolean;
}

export type VoiceEventPayloadByType = {
  transcript_partial: TranscriptEventPayload;
  transcript_final: TranscriptEventPayload;
  call_ringing: CallRingingPayload;
  call_connected: CallConnectedPayload;
  call_started: CallStartedPayload;
  lead_extracted: LeadExtractedPayload;
  call_completed: CallCompletedPayload;
  call_failed: CallFailedPayload;
  publisher_test: PublisherTestPayload;
};

export type VoiceEventPayload = VoiceEventPayloadByType[VoiceEventType];

export interface VoiceEventEnvelope<TType extends VoiceEventType = VoiceEventType> {
  event_type: TType;
  tenant_id: string;
  call_id: string;
  room_id: string;
  occurred_at: string;
  payload: VoiceEventPayloadByType[TType];
}

export interface VoiceEventHeaders {
  eventId: string;
  callId: string;
  occurredAt: string;
}

export interface NormalizedVoiceEvent {
  eventId: string;
  eventType: VoiceEventType;
  tenantId: string;
  callId: string;
  roomId: string;
  occurredAt: string;
  payload: VoiceEventPayload;
  rawEnvelope: unknown;
  rawHeaders: Record<string, string | string[] | undefined>;
}

export type CallLifecycleStatus = "started" | "in_progress" | "completed" | "failed";
