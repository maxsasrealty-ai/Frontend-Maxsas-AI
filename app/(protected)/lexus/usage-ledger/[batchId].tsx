import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import GlassCard from "../../../../components/lexus/GlassCard";
import SectionHeader from "../../../../components/lexus/SectionHeader";
import StatusPill from "../../../../components/lexus/StatusPill";
import { LEXUS_FONTS, LexusIcon, LexusThemeColors } from "../../../../components/lexus/theme";
import { useLexusTheme } from "../../../../context/LexusThemeContext";
import { useCalls } from "../../../../hooks/useCalls";
import { useCapabilities } from "../../../../hooks/useCapabilities";
import { useResponsive } from "../../../../hooks/useResponsive";
import { fetchCallDetail, fetchCallLead } from "../../../../lib/api/calls";
import { CallDetail, LeadResponse } from "../../../../shared/contracts";

function formatMinorAmount(minorAmount: number, currencyCode = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currencyCode,
    currencyDisplay: "symbol",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(minorAmount / 100);
}

function formatDurationShort(durationSec?: number | null): string {
  const safe = Math.max(0, Math.floor(durationSec ?? 0));
  if (safe <= 0) {
    return "0s";
  }

  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;

  if (minutes <= 0) {
    return `${seconds}s`;
  }

  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

function getLeadLabel(lead: LeadResponse | null, callId: string): string {
  return lead?.fields?.name?.trim() || callId;
}

export default function BatchBillingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ batchId?: string | string[] }>();
  const batchId = Array.isArray(params.batchId) ? params.batchId[0] : params.batchId;
  const { colors, isDark } = useLexusTheme();
  const { isDesktop } = useResponsive();
  const { can } = useCapabilities();
  const { calls, isLoading, isBootstrapping, error } = useCalls();
  const styles = useMemo(() => createStyles(colors, isDark, isDesktop), [colors, isDark, isDesktop]);
  const bottomSpacer = isDesktop ? 112 : 72;

  const [detailMap, setDetailMap] = useState<Record<string, CallDetail>>({});
  const [leadMap, setLeadMap] = useState<Record<string, LeadResponse>>({});

  const batchCalls = useMemo(() => calls.filter((call) => call.roomId === batchId), [calls, batchId]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const results = await Promise.all(
        batchCalls.map(async (call) => {
          const [detailResponse, leadResponse] = await Promise.all([fetchCallDetail(call.callId), fetchCallLead(call.callId)]);
          return {
            callId: call.callId,
            detail: detailResponse.success ? detailResponse.data : null,
            lead: leadResponse.success ? leadResponse.data : null,
          };
        })
      );

      if (cancelled) {
        return;
      }

      setDetailMap((current) => {
        const next = { ...current };
        results.forEach((item) => {
          if (item.detail) {
            next[item.callId] = item.detail;
          }
        });
        return next;
      });

      setLeadMap((current) => {
        const next = { ...current };
        results.forEach((item) => {
          if (item.lead) {
            next[item.callId] = item.lead;
          }
        });
        return next;
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [batchCalls]);

  const summary = useMemo(() => {
    let totalUsageMinor = 0;
    let totalDurationSec = 0;
    let zeroCharge = 0;

    batchCalls.forEach((call) => {
      const detail = detailMap[call.callId];
      const usageMinor = Number(detail?.estimatedCost ?? 0);
      const durationSec = Number(detail?.durationSec ?? 0);
      const connected = call.state === "connected" || call.state === "active" || call.state === "completed";

      totalUsageMinor += Number.isFinite(usageMinor) ? usageMinor : 0;
      totalDurationSec += Number.isFinite(durationSec) ? durationSec : 0;
      if (!connected || usageMinor === 0) {
        zeroCharge += 1;
      }
    });

    return {
      totalCalls: batchCalls.length,
      totalUsageMinor,
      totalUsageFormatted: formatMinorAmount(totalUsageMinor),
      totalDurationSec,
      zeroCharge,
    };
  }, [batchCalls, detailMap]);

  if (!can("calls.history")) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <SectionHeader title="Batch Billing" subtitle="Lead-wise usage within a batch" style={{ marginTop: 16 }} />
          <View style={styles.listWrap}>
            <GlassCard style={styles.emptyCard} padded={true}>
              <Text style={styles.emptyTitle}>Batch billing is unavailable on your plan.</Text>
            </GlassCard>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!batchId) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <SectionHeader title="Batch Billing" subtitle="Lead-wise usage within a batch" style={{ marginTop: 16 }} />
          <View style={styles.listWrap}>
            <GlassCard style={styles.emptyCard} padded={true}>
              <Text style={styles.emptyTitle}>Missing batch id.</Text>
            </GlassCard>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <SectionHeader
          title="Batch Billing"
          subtitle={`Lead-wise deductions for batch ${batchId}`}
          style={{ paddingHorizontal: 16, marginTop: 16, marginBottom: 8 }}
          actionLabel="Back"
          onAction={() => router.back()}
        />

        {(isLoading || isBootstrapping) && (
          <View style={styles.listWrap}>
            <GlassCard style={styles.emptyCard} padded={true}>
              <Text style={styles.emptyTitle}>Loading batch billing...</Text>
            </GlassCard>
          </View>
        )}

        {!isLoading && !isBootstrapping && error && (
          <View style={styles.listWrap}>
            <GlassCard style={styles.emptyCard} padded={true}>
              <Text style={styles.emptyTitle}>Failed to load batch billing.</Text>
              <Text style={styles.emptySubtitle}>{error}</Text>
            </GlassCard>
          </View>
        )}

        {!isLoading && !isBootstrapping && !error && (
          <>
            <View style={styles.listWrap}>
              <GlassCard style={styles.summaryCard} padded={true}>
                <View style={styles.summaryTopRow}>
                  <View>
                    <Text style={styles.summaryLabel}>Batch ID</Text>
                    <Text style={styles.summaryValue}>{batchId}</Text>
                  </View>
                  <StatusPill label={`${summary.totalCalls} calls`} tone="info" />
                </View>

                <View style={styles.summaryGrid}>
                  <SummaryTile label="Total amount" value={summary.totalUsageFormatted} icon="Wallet" colors={colors} styles={styles} />
                  <SummaryTile label="Duration" value={formatDurationShort(summary.totalDurationSec)} icon="Clock" colors={colors} styles={styles} />
                  <SummaryTile label="Zero charge" value={String(summary.zeroCharge)} icon="ShieldOff" colors={colors} styles={styles} />
                  <SummaryTile label="Leads" value={String(summary.totalCalls)} icon="Users" colors={colors} styles={styles} />
                </View>
              </GlassCard>
            </View>

            <View style={styles.listWrap}>
              {batchCalls.length === 0 ? (
                <GlassCard style={styles.emptyCard} padded={true}>
                  <View style={styles.emptyIconBg}>
                    <LexusIcon name="InboxX" size={24} color={colors.textFaint} />
                  </View>
                  <Text style={styles.emptyTitle}>No calls found for this batch.</Text>
                </GlassCard>
              ) : (
                batchCalls.map((call) => {
                  const detail = detailMap[call.callId];
                  const lead = leadMap[call.callId];
                  const usageMinor = Number(detail?.estimatedCost ?? 0);
                  const durationText = formatDurationShort(detail?.durationSec ?? 0);
                  const leadLabel = getLeadLabel(lead, call.callId);

                  return (
                    <GlassCard key={call.callId} style={styles.rowCard} padded={true}>
                      <View style={styles.rowHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.rowLeadId}>Lead ID: {leadLabel}</Text>
                          <Text style={styles.rowSubtext}>Call ID: {call.callId}</Text>
                        </View>
                        {usageMinor === 0 ? <StatusPill label="Zero charge" tone="neutral" /> : <StatusPill label="Billed" tone="success" />}
                      </View>

                      <View style={styles.rowMetrics}>
                        <Metric label="Duration" value={durationText} styles={styles} />
                        <View style={styles.metricDivider} />
                        <Metric label="Deducted" value={formatMinorAmount(usageMinor)} styles={styles} />
                        <View style={styles.metricDivider} />
                        <Metric label="Status" value={call.state.toUpperCase()} styles={styles} />
                      </View>

                      <TouchableOpacity
                        style={styles.openButton}
                        onPress={() => router.push(`/(protected)/lexus/call/${encodeURIComponent(call.callId)}` as any)}
                      >
                        <Text style={styles.openButtonText}>Open lead details</Text>
                        <LexusIcon name="ArrowRight" size={16} color={colors.blue} />
                      </TouchableOpacity>
                    </GlassCard>
                  );
                })
              )}
            </View>
          </>
        )}

        <View style={{ height: bottomSpacer }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryTile({ label, value, icon, colors, styles }: { label: string; value: string; icon: React.ComponentProps<typeof LexusIcon>["name"]; colors: LexusThemeColors; styles: ReturnType<typeof createStyles>; }) {
  return (
    <View style={styles.summaryTile}>
      <LexusIcon name={icon} size={16} color={colors.blue} />
      <Text style={styles.summaryTileLabel}>{label}</Text>
      <Text style={styles.summaryTileValue}>{value}</Text>
    </View>
  );
}

function Metric({ label, value, styles }: { label: string; value: string; styles: ReturnType<typeof createStyles>; }) {
  return (
    <View style={styles.metricCol}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

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
    summaryCard: {
      marginBottom: px(16),
    },
    summaryTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: px(14),
      gap: px(10),
    },
    summaryLabel: {
      color: colors.textMuted,
      fontSize: px(12),
      fontFamily: LEXUS_FONTS.bodyMedium,
      marginBottom: px(4),
    },
    summaryValue: {
      color: colors.text,
      fontSize: px(18),
      fontFamily: LEXUS_FONTS.heading,
      fontWeight: "700",
    },
    summaryGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: px(10),
    },
    summaryTile: {
      flexGrow: 1,
      flexBasis: "48%",
      backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(16,33,61,0.06)",
      borderRadius: px(14),
      padding: px(12),
      gap: px(6),
    },
    summaryTileLabel: {
      color: colors.textMuted,
      fontSize: px(12),
    },
    summaryTileValue: {
      color: colors.text,
      fontSize: px(16),
      fontWeight: "700",
    },
    rowCard: {
      marginBottom: px(16),
    },
    rowHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: px(10),
      marginBottom: px(10),
    },
    rowLeadId: {
      color: colors.text,
      fontSize: px(16),
      fontWeight: "800",
      marginBottom: px(2),
    },
    rowSubtext: {
      color: colors.textMuted,
      fontSize: px(12),
    },
    rowMetrics: {
      flexDirection: "row",
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(16,33,61,0.08)",
      borderRadius: px(12),
      paddingVertical: px(14),
      marginBottom: px(12),
    },
    metricCol: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: px(6),
    },
    metricValue: {
      color: colors.text,
      fontSize: px(16),
      fontWeight: "800",
      marginBottom: px(2),
      textAlign: "center",
    },
    metricLabel: {
      color: colors.textFaint,
      fontSize: px(11),
      textTransform: "uppercase",
      letterSpacing: 0.4,
      textAlign: "center",
    },
    metricDivider: {
      width: 1,
      backgroundColor: colors.border,
    },
    openButton: {
      minHeight: px(46),
      borderRadius: px(12),
      backgroundColor: isDark ? "rgba(79,140,255,0.12)" : "rgba(79,140,255,0.08)",
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: px(8),
      paddingHorizontal: px(14),
    },
    openButtonText: {
      color: colors.blue,
      fontSize: px(14),
      fontWeight: "700",
    },
    emptyCard: {
      alignItems: "center",
      paddingVertical: px(50),
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
  });
}
