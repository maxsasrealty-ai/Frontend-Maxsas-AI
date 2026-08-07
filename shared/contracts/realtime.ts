import { CallState } from "./calls";
import { VoiceEventPayload, VoiceEventType } from "./voice-events";

export type LiveCallStage =
  | "queued_dispatching"
  | "connecting"
  | "in_progress"
  | "transcript_partial"
  | "transcript_final"
  | "lead_extraction_updating"
  | "recording_processing"
  | "recording_available"
  | "analysis_pending"
  | "completed"
  | "failed";

export interface RealtimeCallEvent {
  streamEventId: string;
  tenantId: string;
  callId: string;
  roomId: string;
  occurredAt: string;
  eventType: VoiceEventType;
  callState: CallState;
  stage: LiveCallStage;
  payload: VoiceEventPayload;
}
