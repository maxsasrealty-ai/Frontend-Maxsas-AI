import { describe, expect, it } from "@jest/globals";

import { CallSummary, RealtimeCallEvent } from "../shared/contracts";
import { upsertCallSummary } from "./callsUtils";

function baseCall(): CallSummary {
  return {
    callId: "call-1",
    tenantId: "tenant-1",
    roomId: "room-1",
    state: "active",
    initiatedAt: "2026-05-01T00:00:00.000Z",
  };
}

function makeEvent(overrides: Partial<RealtimeCallEvent> & { payload?: unknown } = {}): RealtimeCallEvent {
  return {
    streamEventId: "evt-1",
    tenantId: "tenant-1",
    callId: "call-1",
    roomId: "room-1",
    occurredAt: "2026-05-01T00:01:00.000Z",
    eventType: "call_completed",
    callState: "completed",
    stage: "completed",
    payload: {
      raw_call_outcome: "Matched high intent",
      raw_call_outcome_confidence: 0.91,
      lead_bucket: "Qualified",
    },
    ...overrides,
  } as RealtimeCallEvent;
}

describe("upsertCallSummary", () => {
  it("merges lead classification fields from SSE events", () => {
    const result = upsertCallSummary([baseCall()], makeEvent());
    expect(result[0].lead_bucket).toBe("Qualified");
    expect(result[0].raw_call_outcome).toBe("Matched high intent");
    expect(result[0].raw_call_outcome_confidence).toBe(0.91);
  });

  it("preserves existing classifier values when the event omits them", () => {
    const result = upsertCallSummary(
      [
        {
          ...baseCall(),
          lead_bucket: "Neutral",
          raw_call_outcome: "Existing label",
          raw_call_outcome_confidence: 0.4,
        },
      ],
      makeEvent({ payload: {} })
    );

    expect(result[0].lead_bucket).toBe("Neutral");
    expect(result[0].raw_call_outcome).toBe("Existing label");
    expect(result[0].raw_call_outcome_confidence).toBe(0.4);
  });

  it("routes failed calls into the retry bucket when no explicit failed bucket exists", () => {
    const result = upsertCallSummary(
      [
        {
          ...baseCall(),
          state: "dispatching",
        },
      ],
      makeEvent({
        eventType: "call_failed",
        callState: "failed",
        stage: "failed",
        payload: {
          status: "failed",
          stage: "busy_line",
          error: "Busy line",
          retryable: true,
        },
      })
    );

    expect(result[0].state).toBe("failed");
    expect(result[0].lead_bucket).toBe("Retry");
  });

  it("routes retryable raw outcomes into the retry bucket", () => {
    const result = upsertCallSummary(
      [
        {
          ...baseCall(),
          state: "completed",
        },
      ],
      makeEvent({
        payload: {
          status: "completed",
          ended_by: "shutdown_signal",
          duration_sec: 12,
          transcript_turns: 1,
          recording_url: null,
          raw_call_outcome: "voicemail_detected",
        } as any,
      })
    );

    expect(result[0].lead_bucket).toBe("Retry");
  });
});
