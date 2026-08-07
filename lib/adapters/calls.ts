import { CallState, CallSummary, PlanCapabilities } from "../../shared/contracts";

const RETRYABLE_OUTCOMES = new Set([
  "busy_line",
  "voicemail_detected",
  "call_failed",
  "user_no_response",
  "not_available_callback_requested",
]);

export function normalizeCallOutcome(outcome?: string | null): string {
  return outcome?.trim().toLowerCase().replace(/[\s-]+/g, "_") || "";
}

export function isRetryOutcome(outcome?: string | null): boolean {
  return RETRYABLE_OUTCOMES.has(normalizeCallOutcome(outcome));
}

export function shouldRouteCallToRetryBucket(
  call: Pick<CallSummary, "state" | "lead_bucket" | "raw_call_outcome">
): boolean {
  if (call.lead_bucket === "Retry") {
    return true;
  }

  if (isRetryOutcome(call.raw_call_outcome)) {
    return true;
  }

  return call.state === "failed" && call.lead_bucket !== "Failed";
}

export function formatDuration(durationSec?: number | null): string {
  if (!durationSec || durationSec <= 0) {
    return "0s";
  }

  const minutes = Math.floor(durationSec / 60);
  const seconds = Math.floor(durationSec % 60);

  if (minutes <= 0) {
    return `${seconds}s`;
  }

  return `${minutes}m ${seconds}s`;
}

export function formatTime(iso?: string): string {
  if (!iso) {
    return "-";
  }

  const date = new Date(iso);
  return date.toLocaleString();
}

export function formatBatchName(roomId: string): string {
  const batchPattern = /^batch-(\d{8})-(\d{4})/;
  const match = roomId.match(batchPattern);

  if (!match) {
    return `Batch ${roomId.slice(0, 8)}`;
  }

  const datePart = match[1];
  const timePart = match[2];
  const year = Number(datePart.slice(0, 4));
  const month = Number(datePart.slice(4, 6)) - 1;
  const day = Number(datePart.slice(6, 8));
  const hours = Number(timePart.slice(0, 2));
  const minutes = Number(timePart.slice(2, 4));

  const date = new Date(year, month, day, hours, minutes, 0);
  return `Batch ${date.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export function statusTone(state: CallState): "success" | "warning" | "danger" | "info" | "neutral" {
  switch (state) {
    case "completed":
      return "success";
    case "failed":
      return "danger";
    case "ringing":
    case "dispatching":
      return "warning";
    case "connected":
    case "active":
      return "info";
    case "initiated":
    default:
      return "neutral";
  }
}

export function getQuickStats(calls: CallSummary[]) {
  const inProgressStates: CallState[] = ["initiated", "dispatching", "ringing", "connected", "active"];
  const inProgress = calls.filter((item) => inProgressStates.includes(item.state)).length;
  const completed = calls.filter((item) => item.state === "completed").length;
  const failed = calls.filter((item) => item.state === "failed").length;

  return {
    inProgress,
    completed,
    failed,
    total: calls.length,
  };
}

export function isCapabilityEnabled(
  capabilities: PlanCapabilities | null,
  key: keyof PlanCapabilities["features"]
): boolean {
  return capabilities?.features[key] === true;
}

export function groupCallsByRoom(calls: CallSummary[]) {
  const byRoom = new Map<string, CallSummary[]>();

  calls.forEach((call) => {
    const roomCalls = byRoom.get(call.roomId) || [];
    roomCalls.push(call);
    byRoom.set(call.roomId, roomCalls);
  });

  return Array.from(byRoom.entries()).map(([roomId, roomCalls]) => {
    const completed = roomCalls.filter((item) => item.state === "completed").length;
    const failed = roomCalls.filter((item) => item.state === "failed").length;
    const inProgress = roomCalls.filter((item) => ["initiated", "dispatching", "ringing", "connected", "active"].includes(item.state)).length;

    return {
      roomId,
      calls: roomCalls,
      total: roomCalls.length,
      completed,
      failed,
      inProgress,
      latestAt: roomCalls[0]?.initiatedAt,
    };
  });
}
