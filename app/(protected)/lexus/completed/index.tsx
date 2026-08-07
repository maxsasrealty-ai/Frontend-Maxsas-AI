import { router } from "expo-router";
import React, { useMemo } from "react";
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View
} from "react-native";
import { LexusIcon, LexusThemeColors } from "../../../../components/lexus/theme";

import GlassCard from "../../../../components/lexus/GlassCard";
import PillButton from "../../../../components/lexus/PillButton";
import SectionHeader from "../../../../components/lexus/SectionHeader";
import StatusPill from "../../../../components/lexus/StatusPill";
import { useLexusTheme } from "../../../../context/LexusThemeContext";
import { useCalls } from "../../../../hooks/useCalls";
import { useCapabilities } from "../../../../hooks/useCapabilities";
import { useResponsive } from "../../../../hooks/useResponsive";
import { formatBatchName, formatTime, groupCallsByRoom } from "../../../../lib/adapters/calls";

// ── SCREEN COMPONENT ──────────────────────────────────────────────────────
export default function LexusCompletedBatches() {
  const { colors, isDark } = useLexusTheme();
  const { isDesktop } = useResponsive();
  const styles = useMemo(() => createStyles(colors, isDark, isDesktop), [colors, isDark, isDesktop]);
  const bottomSpacer = isDesktop ? 112 : 72;

  const { calls, isLoading, isBootstrapping, refreshCalls, error } = useCalls();
  const { can, vocabulary } = useCapabilities();

  // show all batches (running and completed) so active runs can be opened in Live Monitor
  const grouped = groupCallsByRoom(calls);

  const batches = grouped.map((group) => {
    const total = group.total;
    const qualified = group.completed;
    const hot = Math.min(qualified, Math.max(1, Math.floor(qualified * 0.5)));
    const warm = Math.max(0, qualified - hot);
    const cold = Math.max(0, total - qualified);
    const conversionRate = total ? (qualified / total) * 100 : 0;

    const status = group.inProgress > 0 ? "running" : group.completed > 0 && group.failed === 0 ? "completed" : group.total === 0 ? "draft" : "awaiting";

    return {
      id: group.roomId,
      label: formatBatchName(group.roomId),
      completedAt: formatTime(group.latestAt),
      totalLeads: total,
      hot,
      warm,
      cold,
      qualified,
      conversionRate,
      status,
    };
  });

  const filteredBatches = useMemo(() => batches, [batches]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader
          title={`Completed ${vocabulary.batchesLabel}`}
          subtitle={`Review finished AI ${vocabulary.campaignsLabel.toLowerCase()}`}
          style={{ paddingHorizontal: 16, marginTop: 16, marginBottom: 8 }}
          actionLabel="Refresh"
          onAction={() => void refreshCalls()}
        />

        {!can("calls.history") && (
          <View style={styles.listWrap}>
            <GlassCard style={styles.emptyCard} padded={true}>
              <View style={styles.emptyIconBg}>
                <LexusIcon name="Lock" size={24} color={colors.textFaint} />
              </View>
              <Text style={styles.emptyTitle}>Call history is unavailable on your plan.</Text>
              <Text style={styles.emptySubtitle}>{`Upgrade your plan to view completed ${vocabulary.campaignsLabel.toLowerCase()} results.`}</Text>
            </GlassCard>
          </View>
        )}

        {(isLoading || isBootstrapping) && can("calls.history") && (
          <View style={styles.listWrap}>
            <GlassCard style={styles.emptyCard} padded={true}>
              <Text style={styles.emptyTitle}>Loading completed calls...</Text>
            </GlassCard>
          </View>
        )}

        {!isLoading && !isBootstrapping && can("calls.history") && error && (
          <View style={styles.listWrap}>
            <GlassCard style={styles.emptyCard} padded={true}>
              <Text style={styles.emptyTitle}>Failed to load completed calls.</Text>
              <Text style={styles.emptySubtitle}>{error}</Text>
            </GlassCard>
          </View>
        )}

        {/* ── BATCH LIST ── */}
        {can("calls.history") && !isLoading && !isBootstrapping && !error && (
        <View style={styles.listWrap}>
          {filteredBatches.length === 0 ? (
            <GlassCard style={styles.emptyCard} padded={true}>
              <View style={styles.emptyIconBg}>
                <LexusIcon name="InboxX" size={24} color={colors.textFaint} />
              </View>
              <Text style={styles.emptyTitle}>{`No completed ${vocabulary.callsLabel.toLowerCase()} found.`}</Text>
              <Text style={styles.emptySubtitle}>
                New completed batches will appear here automatically.
              </Text>
            </GlassCard>
          ) : (
            filteredBatches.map((batch) => (
              <GlassCard key={batch.id} style={styles.card} padded={true}>
                {/* Header Row */}
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.batchLabel}>{batch.label}</Text>
                    <Text style={styles.batchId}>ID: {batch.id}</Text>
                  </View>
                    <StatusPill label={batch.status.toUpperCase()} tone={batch.status === "completed" ? "success" : batch.status === "running" ? "info" : "warning"} style={{ marginLeft: 8 }} />
                </View>

                {/* Date */}
                <View style={styles.dateRow}>
                  <LexusIcon name="Calendar" size={14} color={colors.textFaint} />
                  <Text style={styles.dateText}>{batch.completedAt}</Text>
                </View>

                {/* KPI Line */}
                <View style={styles.kpiRow}>
                  <View style={styles.kpiCol}>
                    <Text style={styles.kpiVal}>{batch.totalLeads}</Text>
                    <Text style={styles.kpiLab}>{`Total ${vocabulary.leadsLabel}`}</Text>
                  </View>
                  <View style={styles.kpiDivider} />
                  <View style={styles.kpiCol}>
                    <Text style={[styles.kpiVal, { color: colors.green }]}>{batch.hot}</Text>
                    <Text style={styles.kpiLab}>Hot</Text>
                  </View>
                  <View style={styles.kpiDivider} />
                  <View style={styles.kpiCol}>
                    <Text style={[styles.kpiVal, { color: colors.amber }]}>{batch.warm}</Text>
                    <Text style={styles.kpiLab}>Warm</Text>
                  </View>
                  <View style={styles.kpiDivider} />
                  <View style={styles.kpiCol}>
                    <Text style={[styles.kpiVal, { color: colors.textFaint }]}>{batch.cold}</Text>
                    <Text style={styles.kpiLab}>Cold</Text>
                  </View>
                </View>

                {/* Conversion Summary Strip */}
                <View style={styles.summaryBar}>
                  <Text style={styles.summaryText}>
                    Qualified {batch.qualified} / {batch.totalLeads} •{" "}
                    <Text style={{ color: colors.blue, fontWeight: "700" }}>
                      {batch.conversionRate.toFixed(1)}% conversion
                    </Text>
                  </Text>
                </View>

                {/* Primary Action */}
                {batch.status === "running" ? (
                  <PillButton
                    title="View Live Monitor"
                    variant="secondary"
                    style={{ marginTop: 16 }}
                    onPress={() => router.push(`/(protected)/lexus/batches/${encodeURIComponent(batch.id)}` as any)}
                  />
                ) : (
                  <PillButton
                    title="View Results"
                    variant="primary"
                    style={{ marginTop: 16 }}
                    onPress={() => router.push(`/(protected)/lexus/completed/${encodeURIComponent(batch.id)}` as any)}
                  />
                )}
              </GlassCard>
            ))
          )}
        </View>
        )}

        <View style={{ height: bottomSpacer }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── STYLES ─────────────────────────────────────────────────────────────────
function createStyles(colors: LexusThemeColors, isDark: boolean, isDesktop: boolean) {
  const scale = isDesktop ? 0.82 : 1;
  const px = (value: number) => Math.round(value * scale);

  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    scroll: {
      paddingBottom: px(32),
    },
    listWrap: {
      paddingHorizontal: px(16),
    },
    emptyCard: {
      alignItems: "center",
      paddingVertical: px(50),
    },
    emptyIcon: {
      fontSize: px(36),
      marginBottom: px(12),
    },
    emptyIconBg: {
      width: px(56),
      height: px(56),
      borderRadius: px(12),
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(79,140,255,0.08)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: px(16),
    },
    emptyTitle: {
      color: colors.text,
      fontSize: px(16),
      fontWeight: "700",
      marginBottom: px(6),
    },
    emptySubtitle: {
      color: colors.textMuted,
      fontSize: px(14),
      textAlign: "center",
    },
    card: {
      marginBottom: px(16),
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: px(8),
    },
    batchLabel: {
      fontSize: px(18),
      fontWeight: "700",
      color: colors.text,
      marginBottom: px(2),
    },
    batchId: {
      fontSize: px(12),
      color: colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    dateRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: px(6),
      marginBottom: px(16),
    },
    dateText: {
      fontSize: px(13),
      color: colors.textFaint,
    },
    kpiRow: {
      flexDirection: "row",
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(16,33,61,0.08)",
      borderRadius: px(8),
      paddingVertical: px(14),
      marginBottom: px(14),
    },
    kpiCol: {
      flex: 1,
      alignItems: "center",
    },
    kpiDivider: {
      width: 1,
      backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(16,33,61,0.1)",
    },
    kpiVal: {
      fontSize: px(18),
      fontWeight: "800",
      color: colors.text,
      marginBottom: px(2),
    },
    kpiLab: {
      fontSize: px(11),
      color: colors.textMuted,
      textTransform: "uppercase",
    },
    summaryBar: {
      backgroundColor: isDark ? "rgba(79,140,255,0.1)" : "rgba(79,140,255,0.08)",
      borderWidth: 1,
      borderColor: isDark ? "rgba(79,140,255,0.24)" : "rgba(79,140,255,0.18)",
      borderRadius: px(8),
      paddingVertical: px(10),
      paddingHorizontal: px(12),
      alignItems: "center",
    },
    summaryText: {
      fontSize: px(13),
      color: colors.text,
    },
  });
}
