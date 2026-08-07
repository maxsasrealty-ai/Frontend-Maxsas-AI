import { useCallback, useEffect, useState } from "react";

import { fetchCallDetail, fetchCallLead, fetchCallTranscript } from "../lib/api/calls";
import { CallDetail, LeadResponse, TranscriptSegmentItem } from "../shared/contracts";
import { useCalls } from "./useCalls";

export function useCallDetail(callId?: string) {
  const { liveVersionByCallId, liveByCallId } = useCalls();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<CallDetail | null>(null);
  const [lead, setLead] = useState<LeadResponse | null>(null);
  const [transcript, setTranscript] = useState<TranscriptSegmentItem[]>([]);
  const liveVersion = callId ? liveVersionByCallId[callId] || 0 : 0;

  const reload = useCallback(async () => {
    if (!callId) {
      setDetail(null);
      setLead(null);
      setTranscript([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [detailRes, leadRes, transcriptRes] = await Promise.all([
        fetchCallDetail(callId),
        fetchCallLead(callId),
        fetchCallTranscript(callId),
      ]);

      if (!detailRes.success) {
        setError(detailRes.error?.message || "Failed to load call details");
      } else {
        setDetail(detailRes.data);
      }

      if (leadRes.success) {
        setLead(leadRes.data);
      } else {
        setLead(null);
      }

      if (transcriptRes && Array.isArray(transcriptRes as any)) {
        setTranscript((transcriptRes as any) || []);
      } else if (transcriptRes && transcriptRes.success) {
        // Handle both `data: [...]` and `data: { transcript: [...] }`
        const data = transcriptRes.data as any;
        if (Array.isArray(data)) {
          setTranscript(data);
        } else if (data && Array.isArray(data.transcript)) {
          setTranscript(data.transcript);
        } else {
          setTranscript([]);
        }
      } else {
        setTranscript([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setIsLoading(false);
    }
  }, [callId]);

  useEffect(() => {
    void reload();
  }, [reload, liveVersion]);

  return {
    isLoading,
    error,
    detail,
    lead,
    transcript,
    live: callId ? liveByCallId[callId] || null : null,
    reload,
  };
}
