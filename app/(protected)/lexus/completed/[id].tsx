import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import GlassCard from "../../../../components/lexus/GlassCard";
import PillButton from "../../../../components/lexus/PillButton";
import SectionHeader from "../../../../components/lexus/SectionHeader";
import { LEXUS_FONTS, LexusIcon, LexusThemeColors } from "../../../../components/lexus/theme";
import { useEarlyAccess } from "../../../../context/EarlyAccessContext";
import { useLexusTheme } from "../../../../context/LexusThemeContext";
import { useCallDetail } from "../../../../hooks/useCallDetail";
import { useCalls } from "../../../../hooks/useCalls";
import { useCapabilities } from "../../../../hooks/useCapabilities";
import { useResponsive } from "../../../../hooks/useResponsive";
import { formatBatchName, formatTime, shouldRouteCallToRetryBucket } from "../../../../lib/adapters/calls";
import type { CallSummary } from "../../../../shared/contracts";

const RESULT_FILTERS = ["All", "Qualified", "Neutral", "Retry", "Failed"] as const;

export default function LexusCompletedBatchDetail() {
  const { colors, isDark, plan } = useLexusTheme();
  const { isDesktop } = useResponsive();
  const s = useMemo(() => createStyles(colors, isDark, isDesktop, plan), [colors, isDark, isDesktop, plan]);
  const bottomSpacer = isDesktop ? 112 : 72;

  const { id } = useLocalSearchParams<{ id: string }>();
  const roomId = typeof id === "string" ? decodeURIComponent(id) : "";
  const [activeFilter, setActiveFilter] = useState<(typeof RESULT_FILTERS)[number]>("All");
  const [isRetryingAll, setIsRetryingAll] = useState(false);

  const {
    calls,
    isLoading,
    isBootstrapping,
    error,
    dismissCalls,
    dismissedCallIds,
    retryAttemptsByCallId,
    initiateCall,
    registerRetryAttempt,
  } = useCalls();
  const { can } = useCapabilities();
  const { isStandardCallLocked } = useEarlyAccess();

  const allBatchCalls = useMemo(() => calls.filter((item) => item.roomId === roomId), [calls, roomId]);
  const batchCalls = useMemo(
    () => allBatchCalls.filter((call) => !dismissedCallIds[call.callId]),
    [allBatchCalls, dismissedCallIds]
  );

  const unresolvedRetryCalls = useMemo(
    () => allBatchCalls.filter((call) => shouldRouteCallToRetryBucket(call) && !dismissedCallIds[call.callId]),
    [allBatchCalls, dismissedCallIds]
  );

  const discardedRetryCount = useMemo(
    () => allBatchCalls.filter((call) => shouldRouteCallToRetryBucket(call) && dismissedCallIds[call.callId]).length,
    [allBatchCalls, dismissedCallIds]
  );

  const summary = useMemo(() => {
    const total = allBatchCalls.length;
    const qualified = allBatchCalls.filter((call) => call.state === "completed").length;
    const failed = allBatchCalls.filter((call) => call.state === "failed").length;
    const neutral = allBatchCalls.filter(
      (call) => call.state !== "completed" && call.state !== "failed" && !shouldRouteCallToRetryBucket(call)
    ).length;
    const inProgress = allBatchCalls.some((call) => ["initiated", "dispatching", "ringing", "connected", "active"].includes(call.state));
    const status = !inProgress && unresolvedRetryCalls.length === 0 && total > 0 ? "COMPLETED" : "IN PROGRESS";

    return {
      total,
      qualified,
      neutral,
      failed,
      discarded: discardedRetryCount,
      retryPending: unresolvedRetryCalls.length,
      completedAt: formatTime(allBatchCalls[0]?.initiatedAt),
      status,
    };
  }, [allBatchCalls, unresolvedRetryCalls.length, discardedRetryCount]);

  const outcomeRows = useMemo(() => {
    const bucket = new Map<string, number>();

    allBatchCalls.forEach((call) => {
      const label = shouldRouteCallToRetryBucket(call)
        ? dismissedCallIds[call.callId]
          ? "Discarded"
          : "Retry"
        : call.state === "failed"
        ? "Failed"
        : call.state === "completed"
        ? "Qualified Lead"
        : "Attempt Limit Reached";
      bucket.set(label, (bucket.get(label) || 0) + 1);
    });

    return [...bucket.entries()].map(([label, count]) => ({
      label,
      count,
      ratio: summary.total ? Math.round((count / summary.total) * 100) : 0,
    }));
  }, [allBatchCalls, dismissedCallIds, summary.total]);

  const filteredLeads = useMemo(() => {
    if (activeFilter === "All") {
      return batchCalls;
    }
    if (activeFilter === "Qualified") {
      return batchCalls.filter((call) => call.state === "completed");
    }
    if (activeFilter === "Neutral") {
      return batchCalls.filter((call) => call.state !== "completed" && call.state !== "failed" && !shouldRouteCallToRetryBucket(call));
    }
    if (activeFilter === "Retry") {
      return unresolvedRetryCalls;
    }

    return batchCalls.filter((call) => call.lead_bucket === "Failed" || (call.state === "failed" && !shouldRouteCallToRetryBucket(call)));
  }, [activeFilter, batchCalls, unresolvedRetryCalls]);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <SectionHeader title="Batch Results" subtitle={formatBatchName(roomId)} style={{ marginBottom: 16 }} />

        {!can("calls.history") && (
          <GlassCard style={s.upgradeCard} padded={true} variant="elevated">
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <LexusIcon name="Lock" color={colors.amber} size={18} />
              <Text style={s.upgradeText}>Call history is unavailable on your current plan.</Text>
            </View>
          </GlassCard>
        )}

        {can("calls.history") && (isLoading || isBootstrapping) && (
          <GlassCard style={s.loadingCard} padded={true} variant="elevated">
            <LexusIcon name="Loader" color={colors.textMuted} size={20} />
            <Text style={[s.emptyText, { marginTop: 10 }]}>Loading batch results...</Text>
          </GlassCard>
        )}

        {can("calls.history") && !isLoading && !isBootstrapping && error && (
          <GlassCard style={s.errorCard} padded={true} variant="elevated">
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <LexusIcon name="AlertCircle" color={colors.red} size={18} />
              <Text style={[s.errorText, { flex: 1 }]}>Failed to load batch results</Text>
            </View>
          </GlassCard>
        )}

        {can("calls.history") && !isLoading && !isBootstrapping && !error && (
          <>
            <View style={s.statsRow}>
              <StatCard styles={s} icon="Users" label="Total" value={summary.total} colors={colors} />
              <StatCard styles={s} icon="CheckCircle2" label="Qualified" value={summary.qualified} colors={colors} isAccent />
              <StatCard styles={s} icon="Clock" label="Neutral" value={summary.neutral} colors={colors} />
            </View>

            <SectionHeader title="Outcome Breakdown" />
            <GlassCard style={s.breakdownCard} padded={true} variant="elevated">
              {outcomeRows.length === 0 ? (
                <View style={{ alignItems: "center", paddingVertical: 20 }}>
                  <LexusIcon name="Inbox" color={colors.textMuted} size={20} />
                  <Text style={[s.emptyText, { marginTop: 10 }]}>No outcomes captured yet</Text>
                </View>
              ) : (
                outcomeRows.map((item) => (
                  <View key={item.label} style={s.outcomeRow}>
                    <View style={s.outcomeTop}>
                      <Text style={s.outcomeLabel}>{item.label}</Text>
                      <Text style={s.outcomeRatio}>{item.count} ({item.ratio}%)</Text>
                    </View>
                    <View style={s.outcomeTrack}>
                      <View style={[s.outcomeFill, { width: `${item.ratio}%`, backgroundColor: item.ratio > 50 ? colors.green : colors.amber }]} />
                    </View>
                  </View>
                ))
              )}
            </GlassCard>

            <PillButton
              title="View Billing Details"
              variant="secondary"
              onPress={() => router.push("/(protected)/lexus/wallet" as any)}
              style={{ marginTop: 16 }}
            />

            <View style={s.contactsHeader}>
              <SectionHeader title={`${batchCalls.length} Result(s)`} subtitle="Contact-wise results" />
            </View>
            <View style={s.filterRow}>
              {RESULT_FILTERS.map((filter) => {
                const active = filter === activeFilter;
                return (
                  <TouchableOpacity
                    key={filter}
                    style={[s.filterPill, active && s.filterPillActive]}
                    onPress={() => setActiveFilter(filter)}
                  >
                    <Text style={[s.filterText, active && s.filterTextActive]}>{filter}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {activeFilter === "Retry" && unresolvedRetryCalls.length > 0 && (
              <View style={s.batchActionRow}>
                <Text style={s.batchActionText}>{unresolvedRetryCalls.length} retry lead(s) remain. Retry them all or remove individual entries.</Text>
                <PillButton
                  title={isRetryingAll ? `Retrying ${unresolvedRetryCalls.length}…` : `Retry all (${unresolvedRetryCalls.length})`}
                  onPress={() => {
                    if (unresolvedRetryCalls.length === 0) {
                      return;
                    }

                    Alert.alert(
                      "Retry all contacts",
                      `Retry ${unresolvedRetryCalls.length} lead(s) now? This will create retry calls for all remaining retry candidates in this batch.`,
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Retry all",
                          onPress: async () => {
                            setIsRetryingAll(true);
                            try {
                              for (const retryCall of unresolvedRetryCalls) {
                                registerRetryAttempt(retryCall.callId);
                                await initiateCall({
                                  roomId: retryCall.roomId,
                                  agentName: "maxsas-voice-agent-prod",
                                  direction: "outbound",
                                });
                              }
                            } finally {
                              setIsRetryingAll(false);
                            }
                          },
                        },
                      ]
                    );
                  }}
                  disabled={isRetryingAll}
                  style={s.batchActionButton}
                />
              </View>
            )}

            {filteredLeads.length === 0 ? (
              <GlassCard style={s.emptyCard} padded={true} variant="elevated">
                <LexusIcon name="Inbox" color={colors.textMuted} size={20} />
                <Text style={[s.emptyText, { marginTop: 10 }]}>No contact results for this filter</Text>
              </GlassCard>
            ) : (
              filteredLeads.map((call) => (
                <LeadResultCard
                  key={call.callId}
                  callId={call.callId}
                  call={call}
                  styles={s}
                  colors={colors}
                  roomId={roomId}
                  showRetryAction={activeFilter === "Retry"}
                  dismissCall={dismissCalls}
                  retryAttempts={retryAttemptsByCallId[call.callId] ?? 0}
                  initiateCall={initiateCall}
                  registerRetryAttempt={registerRetryAttempt}
                />
              ))
            )}
          </>
        )}

        <View style={{ height: bottomSpacer }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  styles,
  icon,
  label,
  value,
  colors,
  isAccent = false,
}: {
  styles: ReturnType<typeof createStyles>;
  icon: any;
  label: string;
  value: number;
  colors: LexusThemeColors;
  isAccent?: boolean;
}) {
  return (
    <GlassCard style={[styles.statCard, isAccent && styles.statCardAccent]} padded={false} variant="elevated">
      <View style={styles.statIconWrap}>
        <LexusIcon name={icon} color={isAccent ? colors.green : colors.blue} size={16} />
      </View>
      <Text style={[styles.statValue, isAccent && { color: colors.green }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </GlassCard>
  );
}

function LeadResultCard({
  callId,
  call,
  styles,
  colors,
  roomId,
  showRetryAction,
  dismissCall,
  retryAttempts,
  initiateCall,
  registerRetryAttempt,
}: {
  callId: string;
  call: CallSummary;
  styles: ReturnType<typeof createStyles>;
  colors: LexusThemeColors;
  roomId: string;
  showRetryAction: boolean;
  dismissCall: (callIds: string[]) => void;
  retryAttempts: number;
  initiateCall: (input: {
    roomId: string;
    phoneNumber?: string | null;
    agentName: string;
    direction: "inbound" | "outbound";
  }) => Promise<string | null>;
  registerRetryAttempt: (callId: string) => void;
}) {
  const { detail, lead } = useCallDetail(callId);
  const [isRetrying, setIsRetrying] = useState(false);
  const mobileNumber = lead?.fields.phone || detail?.phoneNumber || "-";
  const stateIcon = call.state === "completed" ? "CheckCircle2" : call.state === "failed" ? "XCircle" : "Clock";
  const canRetry = shouldRouteCallToRetryBucket(call) && mobileNumber !== "-";

  const handlePress = () => {
    router.push(`/(protected)/lexus/call/${encodeURIComponent(call.callId)}` as any);
  };

  const handleTryAgain = async () => {
    if (isStandardCallLocked) {
      Alert.alert("Early access locked", "Retry calling is paused during beta testing. Full call features activate in July.");
      return;
    }

    if (!canRetry) {
      Alert.alert("Retry unavailable", "This contact cannot be retried from the current data.");
      return;
    }

    setIsRetrying(true);
    registerRetryAttempt(callId);

    try {
      const nextCallId = await initiateCall({
        roomId: detail?.roomId || roomId,
        phoneNumber: mobileNumber,
        agentName: detail?.agentName || "maxsas-voice-agent-prod",
        direction: (detail?.direction as "inbound" | "outbound") || "outbound",
      });

      if (!nextCallId) {
        Alert.alert("Retry failed", "We could not start the call again. Please try once more.");
        return;
      }

      router.push(`/(protected)/lexus/call/${encodeURIComponent(nextCallId)}` as any);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleDismissRetry = () => {
    Alert.alert(
      "Remove from retry",
      "This contact will be removed from the retry queue and marked as manually discarded.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => dismissCall([callId]),
        },
      ]
    );
  };

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={handlePress}>
      <GlassCard style={styles.resultCard} padded={true} variant="elevated">
        <View style={styles.resultTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.resultTitle}>{lead?.fields?.name || `Call ${call.callId.slice(0, 8)}`}</Text>
            <Text style={styles.resultPhone}>{mobileNumber}</Text>
          </View>
          <View style={{ gap: 8 }}>
            <LexusIcon name={stateIcon} color={call.state === "completed" ? colors.green : call.state === "failed" ? colors.red : colors.amber} size={18} />
          </View>
        </View>
        <View style={styles.resultMeta}>
          <Text style={styles.resultMetaText}>{formatTime(call.initiatedAt)} • Status: {call.state}</Text>
        </View>
        {retryAttempts > 0 && (
          <Text style={styles.retryInfo}>Retry attempts: {retryAttempts}</Text>
        )}
        {showRetryAction && (
          <View style={styles.retryActionRow}>
            <PillButton
              title={isRetrying ? "Retrying..." : "Try again"}
              variant="secondary"
              onPress={handleTryAgain}
              disabled={isRetrying || !canRetry}
              style={{ flex: 1 }}
            />
            <PillButton
              title="Remove"
              variant="danger"
              onPress={handleDismissRetry}
              style={[{ marginLeft: 10, flex: 1 }, styles.retryRemoveButton]}
            />
          </View>
        )}
      </GlassCard>
    </TouchableOpacity>
  );
}

function createStyles(colors: LexusThemeColors, isDark: boolean, isDesktop: boolean, plan: string) {
  const isPrestige = plan === "prestige";
  const scale = isDesktop ? 0.88 : 1;
  const px = (value: number) => Math.round(value * scale);

  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    scroll: { paddingHorizontal: px(16), paddingBottom: px(32), paddingTop: px(18) },
    upgradeCard: {
      marginBottom: px(16),
      backgroundColor: isDark ? "rgba(245,166,35,0.08)" : "rgba(245,166,35,0.1)",
      borderColor: isDark ? "rgba(245,166,35,0.2)" : "rgba(245,166,35,0.2)",
    },
    upgradeText: { color: colors.amber, fontSize: px(13), fontFamily: LEXUS_FONTS.body, flex: 1 },
    loadingCard: { alignItems: "center", justifyContent: "center", paddingVertical: px(24), marginBottom: px(16) },
    errorCard: {
      marginBottom: px(16),
      backgroundColor: isDark ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.1)",
      borderColor: isDark ? "rgba(239,68,68,0.24)" : "rgba(239,68,68,0.2)",
    },
    errorText: { color: colors.red, fontSize: px(13), fontFamily: LEXUS_FONTS.body },
    emptyText: { color: colors.textMuted, fontSize: px(13), fontFamily: LEXUS_FONTS.body, textAlign: "center" },
    emptyCard: { alignItems: "center", justifyContent: "center", paddingVertical: px(32), marginBottom: px(16) },
    statsRow: { flexDirection: "row", gap: px(10), marginBottom: px(16) },
    statCard: { flex: 1, minHeight: px(100), alignItems: "center", justifyContent: "center" },
    statCardAccent: { backgroundColor: isDark ? "rgba(0,208,132,0.12)" : "rgba(0,208,132,0.1)" },
    statIconWrap: {
      width: px(32),
      height: px(32),
      borderRadius: px(16),
      backgroundColor: colors.blueSoft,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: px(6),
    },
    statValue: { color: colors.text, fontSize: px(18), fontFamily: LEXUS_FONTS.displayMedium, marginBottom: px(2) },
    statLabel: { color: colors.textMuted, fontSize: px(11), fontFamily: LEXUS_FONTS.body, textAlign: "center" },
    breakdownCard: { marginBottom: px(16) },
    outcomeRow: { marginBottom: px(10) },
    outcomeTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: px(4) },
    outcomeLabel: { color: colors.text, fontWeight: "700", fontSize: px(14) },
    outcomeRatio: { color: colors.textMuted, fontSize: px(13) },
    outcomeTrack: {
      height: px(8),
      borderRadius: px(4),
      backgroundColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(16,33,61,0.12)",
      overflow: "hidden",
    },
    outcomeFill: { height: px(8), borderRadius: px(4) },
    contactsHeader: { marginBottom: px(12), marginTop: px(16) },
    filterRow: { flexDirection: "row", gap: px(8), marginBottom: px(14) },
    filterPill: {
      paddingHorizontal: px(12),
      height: px(34),
      borderRadius: px(17),
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: isDark ? "rgba(148,163,184,0.2)" : "rgba(148,163,184,0.14)",
      backgroundColor: isDark ? "rgba(13,31,56,0.5)" : "rgba(79,140,255,0.08)",
    },
    filterPillActive: {
      backgroundColor: isPrestige ? colors.purple : colors.blue,
      borderColor: isPrestige ? colors.purple : colors.blue,
    },
    filterText: { color: colors.textMuted, fontSize: px(12), fontFamily: LEXUS_FONTS.bodySemiBold },
    filterTextActive: { color: "#ffffff", fontSize: px(12), fontFamily: LEXUS_FONTS.bodySemiBold },
    resultCard: { marginBottom: px(10), borderRadius: px(14) },
    resultTop: { flexDirection: "row", alignItems: "center", gap: px(10), marginBottom: px(8) },
    resultTitle: { color: colors.text, fontSize: px(13), fontFamily: LEXUS_FONTS.bodySemiBold },
    resultPhone: { color: colors.textMuted, fontSize: px(11), fontFamily: LEXUS_FONTS.body, marginTop: px(2) },
    resultMeta: { paddingTop: px(8), borderTopWidth: 1, borderTopColor: isDark ? "rgba(148,163,184,0.14)" : "rgba(16,33,61,0.1)" },
    resultMetaText: { color: colors.textFaint, fontSize: px(11), fontFamily: LEXUS_FONTS.body },
    batchActionRow: {
      marginBottom: px(12),
      padding: px(14),
      borderRadius: px(16),
      backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(16,33,61,0.08)",
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: px(12),
    },
    batchActionText: { flex: 1, color: colors.textMuted, fontSize: px(12), fontFamily: LEXUS_FONTS.body },
    batchActionButton: { minWidth: px(150) },
    retryActionRow: { flexDirection: "row", marginTop: px(12), gap: px(10) },
    retryInfo: { marginTop: px(10), color: colors.amber, fontSize: px(12), fontFamily: LEXUS_FONTS.bodySemiBold },
    retryRemoveButton: { minWidth: 96 },
  });
}
