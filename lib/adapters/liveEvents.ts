import { LiveCallSnapshot } from "../../context/CallsContext";
import { RealtimeCallEvent } from "../../shared/contracts";

export function parseRealtimeCallEvent(input: string): RealtimeCallEvent | null {
  try {
    const parsed = JSON.parse(input) as Partial<RealtimeCallEvent>;

    if (
      typeof parsed.streamEventId !== "string" ||
      typeof parsed.tenantId !== "string" ||
      typeof parsed.callId !== "string" ||
      typeof parsed.roomId !== "string" ||
      typeof parsed.eventType !== "string" ||
      typeof parsed.callState !== "string" ||
      typeof parsed.stage !== "string" ||
      typeof parsed.occurredAt !== "string"
    ) {
      return null;
    }

    return parsed as RealtimeCallEvent;
  } catch {
    return null;
  }
}

export function liveStageLabel(stage: LiveCallSnapshot["stage"]): string {
  switch (stage) {
    case "queued_dispatching":
      return "Queued / Dispatching";
    case "connecting":
      return "Connecting";
    case "in_progress":
      return "In Progress";
    case "transcript_partial":
      return "Transcript Partial";
    case "transcript_final":
      return "Transcript Final";
    case "lead_extraction_updating":
      return "Lead Extraction Updating";
    case "recording_processing":
      return "Recording Processing";
    case "recording_available":
      return "Recording Available";
    case "analysis_pending":
      return "Analysis Pending";
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
    default:
      return "In Progress";
  }
}

export function liveStageTone(stage: LiveCallSnapshot["stage"]):
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral" {
  switch (stage) {
    case "failed":
      return "danger";
    case "completed":
    case "recording_available":
      return "success";
    case "queued_dispatching":
    case "connecting":
    case "recording_processing":
    case "analysis_pending":
      return "warning";
    case "in_progress":
    case "transcript_partial":
    case "transcript_final":
    case "lead_extraction_updating":
      return "info";
    default:
      return "neutral";
  }
}

export function connectionLabel(state: string): string {
  switch (state) {
    case "connected":
      return "Live stream connected";
    case "connecting":
      return "Connecting live stream";
    case "reconnecting":
      return "Reconnecting live stream";
    case "unsupported":
      return "Realtime unavailable on this device";
    case "closed":
      return "Live stream closed";
    default:
      return "Live stream idle";
  }
}
