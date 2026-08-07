import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchCallDetail, fetchCallLead, fetchCampaignCalls } from "../lib/api/calls";
import { fetchWalletSummary } from "../lib/api/payment";
import { CallDetail, LeadResponse } from "../shared/contracts";

function paiseToINR(paise: number | null | undefined) {
  if (paise === null || paise === undefined) return "₹0.00";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(paise / 100);
}

export function useCallBilling(opts: { callId?: string; campaignId?: string } = {}) {
  const { callId, campaignId } = opts;
  const [callDetail, setCallDetail] = useState<CallDetail | null>(null);
  const [lead, setLead] = useState<LeadResponse | null>(null);
  const [campaignCalls, setCampaignCalls] = useState<any[] | null>(null);
  const [walletSummary, setWalletSummary] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (callId) {
        const [dRes, lRes] = await Promise.all([fetchCallDetail(callId), fetchCallLead(callId)]);
        if (dRes.success) setCallDetail(dRes.data);
        else setCallDetail(null);

        if (lRes.success) setLead(lRes.data);
        else setLead(null);
      }

      if (campaignId) {
        const callsRes = await fetchCampaignCalls(campaignId);
        if (callsRes.success) setCampaignCalls(callsRes.data || []);
        else setCampaignCalls([]);
      }

      const wRes = await fetchWalletSummary();
      if (wRes.success) setWalletSummary(wRes.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }, [callId, campaignId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const computeBilling = useCallback((d: CallDetail | null) => {
    if (!d) return null;

    const duration = typeof d.durationSec === "number" ? Math.max(0, Math.floor(d.durationSec)) : 0;
    const connected = (d.state === "connected" || d.state === "active" || d.state === "completed");
    const billedMinutes = connected && duration > 0 ? Math.ceil(duration / 60) : 0;

    // Prefer backend-provided estimatedCost when present (in paise), otherwise leave undefined
    const debitPaise = typeof d.estimatedCost === "number" ? Math.round(d.estimatedCost) : null;

    return {
      durationSec: duration,
      connected,
      billedMinutes,
      // backend may not expose per-minute rate; compute if both debit & billedMinutes available
      ratePerMinutePaise:
        debitPaise !== null && billedMinutes > 0 ? Math.round(debitPaise / billedMinutes) : null,
      debitPaise,
      debitFormatted: paiseToINR(debitPaise),
    };
  }, []);

  const billing = useMemo(() => computeBilling(callDetail), [callDetail, computeBilling]);

  const campaignAggregate = useMemo(() => {
    if (!campaignCalls) return null;
    let totalCalls = campaignCalls.length;
    let connected = 0;
    let zeroCharge = 0;
    let billedMinutes = 0;
    let totalDebitPaise = 0;

    for (const c of campaignCalls) {
      const duration = typeof c.durationSec === "number" ? Math.max(0, Math.floor(c.durationSec)) : 0;
      const state = c.state || c.status || "";
      const isConnected = ["connected", "active", "completed"].includes(state);
      const billed = isConnected && duration > 0 ? Math.ceil(duration / 60) : 0;
      const debit = typeof c.estimatedCost === "number" ? Math.round(c.estimatedCost) : 0;

      if (isConnected) connected += 1;
      if (!isConnected || debit === 0) zeroCharge += 1;
      billedMinutes += billed;
      totalDebitPaise += debit;
    }

    return {
      totalCalls,
      connected,
      zeroCharge,
      billedMinutes,
      totalDebitPaise,
      totalDebitFormatted: paiseToINR(totalDebitPaise),
    };
  }, [campaignCalls]);

  return {
    loading,
    error,
    callDetail,
    lead,
    billing,
    campaignCalls,
    campaignAggregate,
    walletSummary,
    reload,
  } as const;
}

export default useCallBilling;
