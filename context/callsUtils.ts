import { CallState, CallSummary, RealtimeCallEvent } from "../shared/contracts";
import { isRetryOutcome } from "../lib/adapters/calls";

const CALL_STATE_RANK: Record<CallState, number> = {
  queued: 1,
  initiated: 1,
  dispatching: 2,
  ringing: 3,
  connected: 4,
  active: 5,
  completed: 6,
  failed: 6,
};

export function pickState(current: CallState, incoming: CallState): CallState {
  if (current === "completed" || current === "failed") {
    return current;
  }

  return CALL_STATE_RANK[incoming] >= CALL_STATE_RANK[current] ? incoming : current;
}

export function upsertCallSummary(existing: CallSummary[], event: RealtimeCallEvent): CallSummary[] {
  const index = existing.findIndex((item) => item.callId === event.callId);
  const base: CallSummary =
    index >= 0
      ? existing[index]
      : {
          callId: event.callId,
          tenantId: event.tenantId,
          roomId: event.roomId,
          state: "dispatching",
          initiatedAt: event.occurredAt,
        };

  const nextState = pickState(base.state, event.callState);
  const eventPayload = event.payload as Record<string, unknown> | undefined;
  const rawCallOutcome =
    (eventPayload?.raw_call_outcome as string | undefined) ??
    (eventPayload?.rawCallOutcome as string | undefined) ??
    base.raw_call_outcome ??
    null;

  const leadBucket =
    (eventPayload?.lead_bucket as CallSummary["lead_bucket"] | undefined) ??
    (eventPayload?.leadBucket as CallSummary["lead_bucket"] | undefined) ??
    (isRetryOutcome(rawCallOutcome) || (nextState === "failed" && base.lead_bucket !== "Failed") ? "Retry" : null) ??
    base.lead_bucket ??
    null;

  const merged: CallSummary = {
    ...base,
    state: nextState,
    roomId: event.roomId || base.roomId,
    connectedAt: nextState === "connected" || nextState === "active" ? event.occurredAt : base.connectedAt,
    completedAt: nextState === "completed" ? event.occurredAt : base.completedAt,
    failedAt: nextState === "failed" ? event.occurredAt : base.failedAt,
    raw_call_outcome: rawCallOutcome,
    raw_call_outcome_confidence:
      (eventPayload?.raw_call_outcome_confidence as number | undefined) ??
      (eventPayload?.rawCallOutcomeConfidence as number | undefined) ??
      base.raw_call_outcome_confidence ??
      null,
    lead_bucket: leadBucket,
  };

  if (index < 0) {
    return [merged, ...existing];
  }

  const clone = [...existing];
  clone[index] = merged;
  return clone;
}
