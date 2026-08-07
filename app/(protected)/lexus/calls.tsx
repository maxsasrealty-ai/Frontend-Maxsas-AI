import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import GlassCard from "../../../components/lexus/GlassCard";
import PillButton from "../../../components/lexus/PillButton";
import SectionHeader from "../../../components/lexus/SectionHeader";
import StatusPill from "../../../components/lexus/StatusPill";
import { LEXUS_FONTS, LexusIcon, LexusThemeColors } from "../../../components/lexus/theme";
import { useLexusTheme } from "../../../context/LexusThemeContext";
import { useCalls } from "../../../hooks/useCalls";
import { useCapabilities } from "../../../hooks/useCapabilities";
import { useResponsive } from "../../../hooks/useResponsive";
import { formatDuration, formatTime, shouldRouteCallToRetryBucket, statusTone } from "../../../lib/adapters/calls";
import { connectionLabel } from "../../../lib/adapters/liveEvents";

const LEXUS_VISIBLE_STATES = ["queued", "initiated", "dispatching", "ringing", "connected", "active", "completed", "failed"] as const;
const DEFAULT_RECENT_LIMIT = 8;
const FILTERS = ["Qualified", "Live", "Retry", "Failed", "Neutral", "Unknown", "All"] as const;
type LeadBucketFilter = (typeof FILTERS)[number];

function formatCompactDuration(durationSec?: number | null): string {
  if (!durationSec || durationSec <= 0) {
    return "0s";
  }

  const minutes = Math.floor(durationSec / 60);
  const seconds = Math.floor(durationSec % 60);

  if (minutes <= 0) {
    return `${seconds}s`;
  }

  return `${minutes}.${String(seconds).padStart(2, "0")} min`;
}

function getCallSortKey(call: any, liveSnapshot?: any): number {
  const leadBucket = call.lead_bucket;
  const liveStage = liveSnapshot?.stage;
  const callState = liveSnapshot?.callState || call.state;
  const isQualified = leadBucket === "Qualified";
  const isLive = ["connecting", "in_progress", "transcript_partial", "transcript_final", "lead_extraction_updating", "analysis_pending"].includes(liveStage) || ["connected", "active", "ringing", "dispatching", "initiated"].includes(callState);

  if (isQualified) return 0;
  if (isLive) return 1;
  if (leadBucket === "Retry" || shouldRouteCallToRetryBucket(call)) return 2;
  if (leadBucket === "Neutral") return 3;
  if (leadBucket === "Failed") return 4;
  if (leadBucket === "Unknown" || !leadBucket) return 5;
  return 6;
}

function getCallLastActivity(call: any, liveSnapshot?: any): number {
  const candidates = [liveSnapshot?.lastOccurredAt, call.completedAt, call.failedAt, call.connectedAt, call.initiatedAt];
  for (const value of candidates) {
    if (value) {
      const ts = new Date(value).getTime();
      if (!Number.isNaN(ts)) {
        return ts;
      }
    }
  }

  return 0;
}

export default function LexusCallsLifecycle() {
  const { colors, isDark, plan } = useLexusTheme();
  const { isDesktop } = useResponsive();
  const s = useMemo(() => createStyles(colors, isDark, isDesktop, plan), [colors, isDark, isDesktop, plan]);
  const bottomSpacer = isDesktop ? 112 : 72;

  const {
    calls,
    refreshCalls,
    isLoading,
    error,
    liveConnectionState,
    liveByCallId,
    liveVersionByCallId,
  } = useCalls();
  useCapabilities(); // Hook for capability checking
  const [leadBucketFilter, setLeadBucketFilter] = useState<LeadBucketFilter>("Qualified");
  const [olderExpanded, setOlderExpanded] = useState(false);

  const visibleCalls = useMemo(() => {
    return calls.filter((call) => LEXUS_VISIBLE_STATES.includes(call.state as (typeof LEXUS_VISIBLE_STATES)[number]));
  }, [calls]);

  const bucketCounts = useMemo(() => {
    const counts: Record<LeadBucketFilter, number> = {
      Qualified: 0,
      Live: 0,
      Retry: 0,
      Failed: 0,
      Neutral: 0,
      Unknown: 0,
      All: visibleCalls.length,
    };

    visibleCalls.forEach((call) => {
      const liveSnapshot = liveByCallId[call.callId];
      const key = getFilterKey(call, liveSnapshot);
      counts[key] += 1;
      if (["connected", "active", "ringing", "dispatching", "initiated"].includes(call.state)) {
        counts.Live += 1;
      }
    });

    return counts;
  }, [liveByCallId, visibleCalls]);

  const filteredCalls = useMemo(() => {
    return [...visibleCalls]
      .filter((call) => matchesBucketFilter(call, leadBucketFilter, liveByCallId[call.callId]))
      .sort((a, b) => {
        const aLive = liveByCallId[a.callId];
        const bLive = liveByCallId[b.callId];
        const aRank = getCallSortKey(a, aLive);
        const bRank = getCallSortKey(b, bLive);
        if (aRank !== bRank) {
          return aRank - bRank;
        }

        return getCallLastActivity(b, bLive) - getCallLastActivity(a, aLive);
      });
  }, [leadBucketFilter, liveByCallId, visibleCalls]);

  const recentCalls = useMemo(() => filteredCalls.slice(0, DEFAULT_RECENT_LIMIT), [filteredCalls]);
  const olderCalls = useMemo(() => filteredCalls.slice(DEFAULT_RECENT_LIMIT), [filteredCalls]);
  const hiddenOlderCount = olderCalls.length;
  const visibleRecentCount = recentCalls.length;
  const liveVisibleCount = filteredCalls.filter((call) => ["connected", "active", "ringing", "dispatching", "initiated"].includes(call.state)).length;
  const qualifiedVisibleCount = filteredCalls.filter((call) => call.lead_bucket === "Qualified").length;
  const retryCount = bucketCounts.Retry;



  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} stickyHeaderIndices={[2]}>
        <SectionHeader title="Calls" subtitle="Lexus sales command center" style={{ marginTop: 18 }} />

        <GlassCard style={s.connectionCard} padded={true} variant="accent">
          <View style={s.connectionRow}>
            <View style={s.liveDot} />
            <Text style={s.connectionText}>{connectionLabel(liveConnectionState)}</Text>
          </View>
          <Text style={s.connectionMeta}>
            {qualifiedVisibleCount} qualified · {liveVisibleCount} live · {hiddenOlderCount} hidden older
            {retryCount > 0 ? ` · ${retryCount} retry` : ""}
          </Text>
        </GlassCard>

        <View style={s.commandStrip}>
          <View style={s.commandMetric}>
            <Text style={s.commandMetricValue}>{visibleRecentCount}</Text>
            <Text style={s.commandMetricLabel}>Visible now</Text>
          </View>
          <View style={s.commandMetric}>
            <Text style={s.commandMetricValue}>{hiddenOlderCount}</Text>
            <Text style={s.commandMetricLabel}>Older hidden</Text>
          </View>
          <View style={s.commandMetric}>
            <Text style={s.commandMetricValue}>{qualifiedVisibleCount}</Text>
            <Text style={s.commandMetricLabel}>Qualified</Text>
          </View>
          <View style={s.commandMetric}>
            <Text style={s.commandMetricValue}>{liveVisibleCount}</Text>
            <Text style={s.commandMetricLabel}>Live</Text>
          </View>
        </View>

        <View style={s.headerRow}>
          <SectionHeader title="Recent Calls" subtitle={`${filteredCalls.length} high-signal calls`} />
          <TouchableOpacity onPress={() => void refreshCalls()}>
            <View style={s.refreshButton}>
              <LexusIcon name="RefreshCw" color={colors.blue} size={16} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={s.filterRow}>
          {FILTERS.map((bucket) => (
            <TouchableOpacity
              key={bucket}
              onPress={() => setLeadBucketFilter(bucket)}
              style={[
                s.filterChip,
                bucket === "Qualified" && s.filterChipQualified,
                leadBucketFilter === bucket && s.filterChipActive,
              ]}
            >
              <View style={s.filterChipInner}>
                <Text style={[s.filterChipText, bucket === "Qualified" && s.filterChipTextQualified, leadBucketFilter === bucket && s.filterChipTextActive]}>{bucket}</Text>
                <View style={[s.filterCountBadge, bucket === "Qualified" && s.filterCountBadgeQualified, leadBucketFilter === bucket && s.filterCountBadgeActive]}>
                  <Text style={[s.filterCountText, bucket === "Qualified" && s.filterCountTextQualified, leadBucketFilter === bucket && s.filterCountTextActive]}>
                    {bucketCounts[bucket] ?? 0}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {isLoading && (
          <GlassCard style={s.emptyCard} padded={true} variant="elevated">
            <LexusIcon name="Loader" color={colors.textMuted} size={20} />
            <Text style={s.emptyText}>Loading live command center...</Text>
          </GlassCard>
        )}

        {!isLoading && error && (
          <GlassCard style={s.errorCard} padded={true} variant="elevated">
            <LexusIcon name="AlertCircle" color={colors.red} size={20} />
            <Text style={s.errorText}>Failed to load calls: {error}</Text>
          </GlassCard>
        )}

        {!isLoading && !error && filteredCalls.length === 0 && (
          <GlassCard style={s.emptyCard} padded={true} variant="elevated">
            <LexusIcon name="Inbox" color={colors.textMuted} size={20} />
            <Text style={s.emptyText}>No calls found for this filter</Text>
          </GlassCard>
        )}

        {!isLoading && !error && filteredCalls.length > 0 && (
          <>
            <View style={s.sectionLabelRow}>
              <Text style={s.sectionLabel}>Priority Queue</Text>
              <Text style={s.sectionLabelMeta}>Qualified and live calls stay at the top</Text>
            </View>
            <View style={s.list}>
              {recentCalls.map((call, index) => (
                <CallCard key={call.callId} call={call} liveSnapshot={liveByCallId[call.callId]} liveVersion={liveVersionByCallId[call.callId]} styles={s} colors={colors} isDark={isDark} isPriority={index === 0 || call.lead_bucket === "Qualified"} />
              ))}
            </View>

            <View style={s.olderHeaderRow}>
              <View>
                <Text style={s.sectionLabel}>Older Calls</Text>
                <Text style={s.sectionLabelMeta}>Collapsed to reduce clutter and cognitive load</Text>
              </View>
              <TouchableOpacity onPress={() => setOlderExpanded((current) => !current)}>
                <Text style={s.expandText}>{olderExpanded ? "Collapse" : `Show ${hiddenOlderCount}`}</Text>
              </TouchableOpacity>
            </View>

            {olderExpanded && olderCalls.length > 0 && (
              <View style={s.compactList}>
                {olderCalls.map((call) => (
                  <CompactCallCard key={call.callId} call={call} liveSnapshot={liveByCallId[call.callId]} styles={s} colors={colors} />
                ))}
              </View>
            )}
          </>
        )}

        <View style={{ height: bottomSpacer }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function CallCard({
  call,
  liveSnapshot,
  liveVersion,
  styles,
  colors,
  isDark,
  isPriority,
}: {
  call: any;
  liveSnapshot?: any;
  liveVersion?: number;
  styles: ReturnType<typeof createStyles>;
  colors: LexusThemeColors;
  isDark: boolean;
  isPriority: boolean;
}) {
  const stateIconMap = {
    completed: "CheckCircle2",
    failed: "XCircle",
    ringing: "Phone",
    queued: "Clock",
  } as Record<string, any>;

  const stateIcon = stateIconMap[call.state] || "Phone";
  const isQualified = call.lead_bucket === "Qualified";
  const isRetryCandidate = shouldRouteCallToRetryBucket(call);
  const isLive = ["connected", "active", "ringing", "dispatching", "initiated"].includes(call.state) || ["connecting", "in_progress", "analysis_pending", "lead_extraction_updating"].includes(liveSnapshot?.stage);
  const activityLabel = liveSnapshot?.lastEventType ? liveSnapshot.lastEventType.replace(/_/g, " ") : call.state;
  const versionLabel = typeof liveVersion === "number" ? `v${liveVersion}` : null;

  return (
    <GlassCard style={[styles.callCard, isQualified && styles.callCardQualified, isLive && styles.callCardLive, isPriority && styles.callCardPriority]} padded={false} variant="elevated">
      <View style={styles.callHeader}>
        <View style={[styles.callIconWrap, isQualified && styles.callIconWrapQualified]}>
          <LexusIcon name={stateIcon} color={isQualified ? colors.green : colors.blue} size={16} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.callRoom}>{call.roomId}</Text>
          <Text style={styles.callTime}>{formatTime(call.initiatedAt)}</Text>
        </View>
        <View style={styles.statusRow}>
          {isLive && <StatusPill label="LIVE" tone="info" />}
          <StatusPill label={call.state} tone={statusTone(call.state)} />
          {call.lead_bucket && (
            <StatusPill
              label={call.lead_bucket}
              tone={
                call.lead_bucket === "Qualified"
                  ? "success"
                  : call.lead_bucket === "Retry"
                  ? "warning"
                  : call.lead_bucket === "Failed"
                  ? "danger"
                  : "neutral"
              }
            />
          )}
          {isRetryCandidate && call.lead_bucket !== "Retry" && <StatusPill label="RETRY" tone="warning" />}
        </View>
      </View>

      <View style={styles.callMetaRow}>
        <Text style={styles.callMetaText}>ID {call.callId.slice(0, 8)}</Text>
        {versionLabel && <Text style={styles.callMetaText}>{versionLabel}</Text>}
      </View>

      <View style={styles.callInsightsRow}>
        <View style={styles.callInsightPill}>
          <Text style={styles.callInsightLabel}>Lead</Text>
          <Text style={styles.callInsightValue}>{call.lead_bucket || "Unknown"}</Text>
        </View>
        <View style={styles.callInsightPill}>
          <Text style={styles.callInsightLabel}>Activity</Text>
          <Text style={styles.callInsightValue}>{activityLabel}</Text>
        </View>
      </View>

      <View style={styles.callMetricsRow}>
        <MiniMetric label="Duration" value={formatDuration(call.durationSec)} styles={styles} />
        <View style={styles.metricDivider} />
        <MiniMetric label="State" value={call.state} styles={styles} />
        <View style={styles.metricDivider} />
        <MiniMetric label="Bucket" value={call.lead_bucket || "Unknown"} styles={styles} />
      </View>

      {call.state === "completed" && (
        <PillButton
          title="View Lead Details"
          variant="secondary"
          style={styles.detailsButton}
          onPress={() => router.push(`/(protected)/lexus/call/${encodeURIComponent(call.callId)}` as any)}
        />
      )}
    </GlassCard>
  );
}

function CompactCallCard({
  call,
  liveSnapshot,
  styles,
  colors,
}: {
  call: any;
  liveSnapshot?: any;
  styles: ReturnType<typeof createStyles>;
  colors: LexusThemeColors;
}) {
  const isQualified = call.lead_bucket === "Qualified";
  const isLive = ["connected", "active", "ringing", "dispatching", "initiated"].includes(call.state) || ["connecting", "in_progress", "analysis_pending", "lead_extraction_updating"].includes(liveSnapshot?.stage);
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={() => router.push(`/(protected)/lexus/call/${encodeURIComponent(call.callId)}` as any)}>
      <GlassCard style={[styles.compactCard, isQualified && styles.compactCardQualified, isLive && styles.compactCardLive]} padded={true} variant="elevated">
        <View style={styles.compactRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.compactTitle}>{call.roomId}</Text>
            <Text style={styles.compactMeta}>{formatTime(call.initiatedAt)}</Text>
          </View>
          <View style={styles.compactPills}>
            {isLive && <StatusPill label="LIVE" tone="info" />}
            <StatusPill label={call.lead_bucket || "Unknown"} tone={call.lead_bucket === "Qualified" ? "success" : call.lead_bucket === "Retry" ? "warning" : call.lead_bucket === "Failed" ? "danger" : "neutral"} />
          </View>
        </View>
        <View style={styles.compactFooter}>
          <Text style={styles.compactFooterText}>{call.callId.slice(0, 10)}</Text>
          <Text style={styles.compactFooterText}>{formatCompactDuration(call.durationSec)}</Text>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
}

function MiniMetric({ label, value, styles }: { label: string; value: string; styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.miniMetric}>
      <Text style={styles.miniMetricValue}>{value}</Text>
      <Text style={styles.miniMetricLabel}>{label}</Text>
    </View>
  );
}

function getFilterKey(call: any, liveSnapshot?: any): LeadBucketFilter {
  const bucket = call.lead_bucket;
  const state = liveSnapshot?.callState || call.state;

  if (bucket === "Qualified") return "Qualified";
  if (["connected", "active", "ringing", "dispatching", "initiated"].includes(state)) return "Live";
  if (shouldRouteCallToRetryBucket(call)) return "Retry";
  if (bucket === "Failed") return "Failed";
  if (bucket === "Neutral") return "Neutral";
  if (bucket === "Unknown" || !bucket) return "Unknown";
  return "Unknown";
}

function matchesBucketFilter(call: any, filter: LeadBucketFilter, liveSnapshot?: any): boolean {
  if (filter === "All") {
    return true;
  }

  return getFilterKey(call, liveSnapshot) === filter;
}

function createStyles(colors: LexusThemeColors, isDark: boolean, isDesktop: boolean, plan: string) {
  const isPrestige = plan === "prestige";
  const scale = isDesktop ? 0.88 : 1;
  const px = (value: number) => Math.round(value * scale);

  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    scroll: { paddingHorizontal: px(16), paddingTop: px(18), paddingBottom: px(32) },
    connectionCard: {
      marginBottom: px(18),
      minHeight: px(44),
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "rgba(0,208,132,0.10)" : "rgba(0,208,132,0.10)",
      borderColor: isDark ? "rgba(0,208,132,0.24)" : "rgba(0,168,107,0.2)",
    },
    connectionRow: { flexDirection: "row", alignItems: "center", gap: px(8) },
    liveDot: {
      width: px(8),
      height: px(8),
      borderRadius: px(4),
      backgroundColor: colors.green,
      shadowColor: colors.green,
      shadowOpacity: 0.8,
      shadowRadius: 10,
      elevation: 6,
    },
    connectionText: { color: colors.green, fontSize: px(13), fontFamily: LEXUS_FONTS.bodyMedium, textTransform: "uppercase", letterSpacing: 0.8 },
    connectionMeta: { color: colors.textMuted, fontSize: px(11), marginTop: px(6), fontFamily: LEXUS_FONTS.body },
    commandStrip: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: px(10),
      marginBottom: px(14),
    },
    commandMetric: {
      flexGrow: 1,
      flexBasis: "22%",
      minWidth: px(76),
      paddingVertical: px(12),
      paddingHorizontal: px(12),
      borderRadius: px(14),
      backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(16,33,61,0.06)",
      borderWidth: 1,
      borderColor: colors.border,
    },
    commandMetricValue: { color: colors.text, fontSize: px(18), fontFamily: LEXUS_FONTS.heading, fontWeight: "800" },
    commandMetricLabel: { color: colors.textMuted, fontSize: px(11), marginTop: px(2), fontFamily: LEXUS_FONTS.body },
    headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: px(12) },
    refreshButton: {
      width: px(38),
      height: px(38),
      borderRadius: px(19),
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.blueSoft,
    },
    filterRow: { flexDirection: "row", flexWrap: "wrap", gap: px(8), marginBottom: px(16) },
    filterChip: {
      borderWidth: 1,
      borderColor: isPrestige ? "rgba(216,180,254,0.2)" : "rgba(79,140,255,0.15)",
      borderRadius: px(999),
      paddingHorizontal: px(12),
      paddingVertical: px(7),
      backgroundColor: isDark ? "rgba(4,12,24,0.35)" : "rgba(255,255,255,0.08)",
      overflow: "hidden",
    },
    filterChipActive: {
      borderColor: isPrestige ? "rgba(216,180,254,0.5)" : "rgba(79,140,255,0.42)",
      backgroundColor: isPrestige ? "rgba(216,180,254,0.12)" : "rgba(79,140,255,0.12)",
      shadowColor: colors.blue,
      shadowOpacity: 0.35,
      shadowRadius: 18,
      elevation: 8,
    },
    filterChipQualified: {
      borderColor: isPrestige ? "rgba(216,180,254,0.55)" : "rgba(79,140,255,0.42)",
      backgroundColor: isPrestige ? "rgba(216,180,254,0.12)" : "rgba(79,140,255,0.10)",
      shadowColor: colors.blue,
      shadowOpacity: 0.28,
      shadowRadius: 14,
      elevation: 6,
    },
    filterChipInner: { flexDirection: "row", alignItems: "center", gap: px(8) },
    filterChipText: { color: colors.textMuted, fontSize: px(12), fontFamily: LEXUS_FONTS.bodySemiBold },
    filterChipTextQualified: { color: isPrestige ? colors.purple : colors.blue, fontSize: px(12), fontFamily: LEXUS_FONTS.bodySemiBold },
    filterChipTextActive: { color: colors.text, fontSize: px(12), fontFamily: LEXUS_FONTS.bodySemiBold },
    filterCountBadge: {
      minWidth: px(20),
      height: px(20),
      borderRadius: px(10),
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: px(6),
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(16,33,61,0.08)",
    },
    filterCountBadgeQualified: {
      backgroundColor: isPrestige ? "rgba(216,180,254,0.20)" : "rgba(79,140,255,0.18)",
    },
    filterCountBadgeActive: {
      backgroundColor: colors.blue,
    },
    filterCountText: { color: colors.textMuted, fontSize: px(11), fontFamily: LEXUS_FONTS.bodySemiBold },
    filterCountTextQualified: { color: isPrestige ? colors.purple : colors.blue, fontSize: px(11), fontFamily: LEXUS_FONTS.bodySemiBold },
    filterCountTextActive: { color: "#fff", fontSize: px(11), fontFamily: LEXUS_FONTS.bodySemiBold },
    sectionLabelRow: { marginBottom: px(10) },
    sectionLabel: { color: colors.text, fontSize: px(16), fontFamily: LEXUS_FONTS.heading, fontWeight: "800" },
    sectionLabelMeta: { color: colors.textMuted, fontSize: px(12), marginTop: px(2) },
    olderHeaderRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: px(8), marginBottom: px(10) },
    expandText: { color: colors.blue, fontSize: px(13), fontFamily: LEXUS_FONTS.bodySemiBold },
    emptyCard: {
      paddingVertical: px(32),
      alignItems: "center",
      justifyContent: "center",
      gap: px(10),
    },
    emptyText: { color: colors.textMuted, fontSize: px(14), fontFamily: LEXUS_FONTS.body },
    errorCard: {
      paddingVertical: px(32),
      alignItems: "center",
      justifyContent: "center",
      gap: px(10),
      backgroundColor: isDark ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.1)",
      borderColor: isDark ? "rgba(239,68,68,0.24)" : "rgba(239,68,68,0.2)",
    },
    errorText: { color: colors.red, fontSize: px(14), fontFamily: LEXUS_FONTS.body },
    list: { marginBottom: px(8) },
    compactList: { gap: px(8), marginBottom: px(8) },
    callCard: {
      paddingVertical: px(14),
      paddingHorizontal: px(12),
      marginBottom: px(10),
      borderRadius: px(14),
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: isDark ? "rgba(10,16,28,0.94)" : "rgba(255,255,255,0.82)",
    },
    callCardPriority: {
      borderColor: isPrestige ? "rgba(216,180,254,0.32)" : "rgba(79,140,255,0.30)",
      shadowColor: colors.blue,
      shadowOpacity: 0.28,
      shadowRadius: 20,
      elevation: 8,
    },
    callCardQualified: {
      borderColor: isPrestige ? "rgba(216,180,254,0.42)" : "rgba(79,140,255,0.38)",
      backgroundColor: isDark ? "rgba(11,20,36,0.98)" : "rgba(247,250,255,0.98)",
      shadowColor: colors.blue,
      shadowOpacity: 0.34,
      shadowRadius: 24,
      elevation: 10,
    },
    callCardLive: {
      borderColor: "rgba(0,208,132,0.22)",
    },
    callHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: px(10),
      marginBottom: px(10),
    },
    callIconWrap: {
      width: px(32),
      height: px(32),
      borderRadius: px(16),
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.blueSoft,
    },
    callIconWrapQualified: {
      backgroundColor: isDark ? "rgba(0,208,132,0.12)" : "rgba(0,208,132,0.10)",
    },
    callRoom: { color: colors.text, fontSize: px(15), fontFamily: LEXUS_FONTS.bodySemiBold, marginBottom: px(2) },
    callTime: { color: colors.textMuted, fontSize: px(12), fontFamily: LEXUS_FONTS.body },
    statusRow: { flexDirection: "row", gap: px(6), alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" },
    callMetaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: px(10) },
    callMetaText: { color: colors.textFaint, fontSize: px(12), fontFamily: LEXUS_FONTS.body },
    callInsightsRow: { flexDirection: "row", gap: px(8), marginBottom: px(10) },
    callInsightPill: {
      flex: 1,
      paddingVertical: px(8),
      paddingHorizontal: px(10),
      borderRadius: px(12),
      backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(16,33,61,0.05)",
      borderWidth: 1,
      borderColor: colors.border,
    },
    callInsightLabel: { color: colors.textMuted, fontSize: px(10), textTransform: "uppercase", letterSpacing: 0.5 },
    callInsightValue: { color: colors.text, fontSize: px(13), fontFamily: LEXUS_FONTS.bodySemiBold, marginTop: px(2) },
    callMetricsRow: {
      flexDirection: "row",
      alignItems: "stretch",
      backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(16,33,61,0.05)",
      borderRadius: px(12),
      paddingVertical: px(10),
      marginBottom: px(12),
    },
    miniMetric: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: px(6) },
    miniMetricValue: { color: colors.text, fontSize: px(14), fontFamily: LEXUS_FONTS.bodySemiBold },
    miniMetricLabel: { color: colors.textFaint, fontSize: px(10), marginTop: px(2), textTransform: "uppercase", letterSpacing: 0.4 },
    metricDivider: { width: 1, backgroundColor: colors.border },
    compactCard: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: isDark ? "rgba(10,16,28,0.92)" : "rgba(255,255,255,0.78)",
      paddingVertical: px(10),
      paddingHorizontal: px(12),
      borderRadius: px(12),
    },
    compactCardQualified: {
      borderColor: isPrestige ? "rgba(216,180,254,0.28)" : "rgba(79,140,255,0.28)",
    },
    compactCardLive: {
      borderColor: "rgba(0,208,132,0.22)",
    },
    compactRow: { flexDirection: "row", alignItems: "center", gap: px(8), marginBottom: px(8) },
    compactTitle: { color: colors.text, fontSize: px(14), fontFamily: LEXUS_FONTS.bodySemiBold },
    compactMeta: { color: colors.textMuted, fontSize: px(11), marginTop: px(2) },
    compactPills: { flexDirection: "row", gap: px(6), flexWrap: "wrap", justifyContent: "flex-end" },
    compactFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    compactFooterText: { color: colors.textFaint, fontSize: px(11), fontFamily: LEXUS_FONTS.body },
    detailsButton: { marginTop: px(8) },
  });
}
