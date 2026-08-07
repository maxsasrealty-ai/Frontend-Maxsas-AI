import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import GlassCard from "../../../components/lexus/GlassCard";
import SectionHeader from "../../../components/lexus/SectionHeader";
import StatusPill from "../../../components/lexus/StatusPill";
import { LEXUS_FONTS, LexusIcon, LexusThemeColors } from "../../../components/lexus/theme";
import { useLexusTheme } from "../../../context/LexusThemeContext";
import { useCalls } from "../../../hooks/useCalls";
import { useCapabilities } from "../../../hooks/useCapabilities";
import { useResponsive } from "../../../hooks/useResponsive";
import { formatBatchName } from "../../../lib/adapters/calls";
import { fetchCallDetail } from "../../../lib/api/calls";
import { CallDetail, CallSummary } from "../../../shared/contracts";

type BatchLedgerRow = {
  batchId: string;
  label: string;
  dateKey: string;
  dateLabel: string;
  totalCalls: number;
  connectedCalls: number;
  zeroChargeCalls: number;
  totalUsageMinor: number;
  totalUsageFormatted: string;
  status: "completed" | "running" | "queued" | "failed";
  latestAt: string;
};

function formatMinorAmount(minorAmount: number, currencyCode = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currencyCode,
    currencyDisplay: "symbol",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(minorAmount / 100);
}

function toLocalDateKey(value: string): string {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateLabel(dateKey: string): string {
  const date = new Date(`${dateKey}T00:00:00`);
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getCallTimestamp(call: CallSummary, detail?: CallDetail | null): string {
  return detail?.completedAt ?? call.completedAt ?? call.failedAt ?? call.connectedAt ?? call.initiatedAt;
}

function getBatchStatus(calls: CallSummary[]): BatchLedgerRow["status"] {
  if (calls.some((call) => call.state === "failed")) {
    return "failed";
  }

  if (calls.some((call) => call.state === "active" || call.state === "connected" || call.state === "ringing")) {
    return "running";
  }

  if (calls.some((call) => call.state === "completed")) {
    return "completed";
  }

  return "queued";
}

export default function LexusUsageLedger() {
  const { colors, isDark } = useLexusTheme();
  const { isDesktop } = useResponsive();
  const { can, vocabulary } = useCapabilities();
  const { calls, isLoading, isBootstrapping, error, refreshCalls } = useCalls();
  const styles = useMemo(() => createStyles(colors, isDark, isDesktop), [colors, isDark, isDesktop]);
  const bottomSpacer = isDesktop ? 112 : 72;

  const [detailMap, setDetailMap] = useState<Record<string, CallDetail>>({});
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const loadedCallIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    const missingCallIds = calls
      .map((call) => call.callId)
      .filter((callId) => !loadedCallIdsRef.current.has(callId));

    if (missingCallIds.length === 0) {
      return;
    }

    void (async () => {
      const results = await Promise.all(
        missingCallIds.map(async (callId) => {
          const response = await fetchCallDetail(callId);
          return { callId, response };
        })
      );

      if (cancelled) {
        return;
      }

      setDetailMap((current) => {
        const next = { ...current };
        results.forEach(({ callId, response }) => {
          loadedCallIdsRef.current.add(callId);
          if (response.success && response.data) {
            next[callId] = response.data;
          }
        });
        return next;
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [calls]);

  const batches = useMemo(() => {
    const grouped = new Map<string, CallSummary[]>();

    calls.forEach((call) => {
      const key = call.roomId || call.callId;
      const bucket = grouped.get(key) ?? [];
      bucket.push(call);
      grouped.set(key, bucket);
    });

    const rows: BatchLedgerRow[] = Array.from(grouped.entries()).map(([batchId, batchCalls]) => {
      const sortedByRecent = [...batchCalls].sort((left, right) => {
        const leftStamp = new Date(getCallTimestamp(left, detailMap[left.callId]) || left.initiatedAt).getTime();
        const rightStamp = new Date(getCallTimestamp(right, detailMap[right.callId]) || right.initiatedAt).getTime();
        return rightStamp - leftStamp;
      });

      const latestCall = sortedByRecent[0];
      const latestDetail = detailMap[latestCall.callId];
      const latestAt = getCallTimestamp(latestCall, latestDetail);
      const dateKey = toLocalDateKey(latestAt);
      let totalUsageMinor = 0;
      let connectedCalls = 0;
      let zeroChargeCalls = 0;

      batchCalls.forEach((call) => {
        const detail = detailMap[call.callId];
        const usageMinor = Number(detail?.estimatedCost ?? 0);
        const connected = call.state === "connected" || call.state === "active" || call.state === "completed";
        if (connected) {
          connectedCalls += 1;
        }
        if (!connected || usageMinor === 0) {
          zeroChargeCalls += 1;
        }
        totalUsageMinor += Number.isFinite(usageMinor) ? usageMinor : 0;
      });

      return {
        batchId,
        label: formatBatchName(batchId),
        dateKey,
        dateLabel: formatDateLabel(dateKey),
        totalCalls: batchCalls.length,
        connectedCalls,
        zeroChargeCalls,
        totalUsageMinor,
        totalUsageFormatted: formatMinorAmount(totalUsageMinor),
        status: getBatchStatus(batchCalls),
        latestAt,
      };
    });

    rows.sort((left, right) => new Date(right.latestAt).getTime() - new Date(left.latestAt).getTime());
    return rows;
  }, [calls, detailMap]);

  const dateOptions = useMemo(() => {
    const unique = Array.from(new Set(batches.map((batch) => batch.dateKey)));
    return unique.sort((left, right) => right.localeCompare(left));
  }, [batches]);

  const visibleBatches = useMemo(() => {
    if (!selectedDateKey) {
      return batches;
    }

    return batches.filter((batch) => batch.dateKey === selectedDateKey);
  }, [batches, selectedDateKey]);

  const summary = useMemo(() => {
    const totalUsageMinor = visibleBatches.reduce((sum, batch) => sum + batch.totalUsageMinor, 0);
    const zeroChargeBatches = visibleBatches.filter((batch) => batch.totalUsageMinor === 0).length;
    return {
      totalBatches: visibleBatches.length,
      totalUsageMinor,
      totalUsageFormatted: formatMinorAmount(totalUsageMinor),
      zeroChargeBatches,
    };
  }, [visibleBatches]);

  const selectedDateLabel = selectedDateKey ? formatDateLabel(selectedDateKey) : "All dates";

  if (!can("calls.history")) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <SectionHeader title="Usage Ledger" subtitle="Batch-wise usage deductions" style={{ marginTop: 16 }} />
          <View style={styles.listWrap}>
            <GlassCard style={styles.emptyCard} padded={true}>
              <View style={styles.emptyIconBg}>
                <LexusIcon name="Lock" size={24} color={colors.textFaint} />
              </View>
              <Text style={styles.emptyTitle}>Usage ledger is unavailable on your plan.</Text>
              <Text style={styles.emptySubtitle}>{`Upgrade to view ${vocabulary.batchesLabel.toLowerCase()} deductions.`}</Text>
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
          title="Usage Ledger"
          subtitle="Batch-wise deductions with a date filter"
          style={{ paddingHorizontal: 16, marginTop: 16, marginBottom: 8 }}
          actionLabel="Refresh"
          onAction={() => void refreshCalls()}
        />

        {(isLoading || isBootstrapping) && (
          <View style={styles.listWrap}>
            <GlassCard style={styles.emptyCard} padded={true}>
              <Text style={styles.emptyTitle}>Loading usage ledger...</Text>
            </GlassCard>
          </View>
        )}

        {!isLoading && !isBootstrapping && error && (
          <View style={styles.listWrap}>
            <GlassCard style={styles.emptyCard} padded={true}>
              <Text style={styles.emptyTitle}>Failed to load usage ledger.</Text>
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
                    <Text style={styles.summaryLabel}>Selected Date</Text>
                    <Text style={styles.summaryValue}>{selectedDateLabel}</Text>
                  </View>
                  <StatusPill label={selectedDateKey ? "Filtered" : "All"} tone={selectedDateKey ? "info" : "success"} />
                </View>

                <View style={styles.summaryGrid}>
                  <SummaryTile label="Batches" value={String(summary.totalBatches)} icon="Layers3" colors={colors} styles={styles} />
                  <SummaryTile label="Deducted" value={summary.totalUsageFormatted} icon="Wallet" colors={colors} styles={styles} />
                  <SummaryTile label="Zero charge" value={String(summary.zeroChargeBatches)} icon="ShieldOff" colors={colors} styles={styles} />
                  <SummaryTile label="Dates" value={String(dateOptions.length)} icon="Calendar" colors={colors} styles={styles} />
                </View>

                <TouchableOpacity style={styles.filterButton} onPress={() => setPickerOpen(true)}>
                  <LexusIcon name="Calendar" size={16} color={colors.blue} />
                  <Text style={styles.filterButtonText}>{selectedDateKey ? "Change date filter" : "Pick a date"}</Text>
                  <LexusIcon name="ChevronDown" size={16} color={colors.textFaint} />
                </TouchableOpacity>

                {selectedDateKey && (
                  <TouchableOpacity style={styles.clearFilterButton} onPress={() => setSelectedDateKey(null)}>
                    <Text style={styles.clearFilterText}>Clear date filter</Text>
                  </TouchableOpacity>
                )}
              </GlassCard>
            </View>

            <View style={styles.listWrap}>
              {visibleBatches.length === 0 ? (
                <GlassCard style={styles.emptyCard} padded={true}>
                  <View style={styles.emptyIconBg}>
                    <LexusIcon name="InboxX" size={24} color={colors.textFaint} />
                  </View>
                  <Text style={styles.emptyTitle}>No batches found for this date.</Text>
                  <Text style={styles.emptySubtitle}>Pick another date to see that day&apos;s batch deductions.</Text>
                </GlassCard>
              ) : (
                visibleBatches.map((batch) => (
                  <GlassCard key={batch.batchId} style={styles.batchCard} padded={true}>
                    <View style={styles.cardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.batchLabel}>{batch.label}</Text>
                        <Text style={styles.batchId}>ID: {batch.batchId}</Text>
                      </View>
                      <StatusPill
                        label={batch.status.toUpperCase()}
                        tone={batch.status === "completed" ? "success" : batch.status === "running" ? "info" : batch.status === "failed" ? "warning" : "neutral"}
                      />
                    </View>

                    <View style={styles.dateRow}>
                      <LexusIcon name="Calendar" size={14} color={colors.textFaint} />
                      <Text style={styles.dateText}>{batch.dateLabel}</Text>
                    </View>

                    <View style={styles.amountRow}>
                      <View>
                        <Text style={styles.amountLabel}>Usage deducted</Text>
                        <Text style={styles.amountValue}>{batch.totalUsageFormatted}</Text>
                      </View>
                      {batch.totalUsageMinor === 0 ? <StatusPill label="Zero charge" tone="neutral" /> : <StatusPill label="Billed" tone="success" />}
                    </View>

                    <View style={styles.kpiRow}>
                      <BatchStat label="Calls" value={String(batch.totalCalls)} styles={styles} />
                      <View style={styles.kpiDivider} />
                      <BatchStat label="Connected" value={String(batch.connectedCalls)} styles={styles} />
                      <View style={styles.kpiDivider} />
                      <BatchStat label="Zero charge" value={String(batch.zeroChargeCalls)} styles={styles} />
                    </View>

                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={[styles.openButton, styles.secondaryActionButton]}
                        onPress={() =>
                          router.push(
                            (batch.status === "running"
                              ? `/(protected)/lexus/batches/${encodeURIComponent(batch.batchId)}`
                              : `/(protected)/lexus/completed/${encodeURIComponent(batch.batchId)}`) as any
                          )
                        }
                      >
                        <Text style={styles.openButtonText}>Open batch details</Text>
                        <LexusIcon name="ArrowRight" size={16} color={colors.blue} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.openButton, styles.primaryActionButton]}
                        onPress={() => router.push(`/(protected)/lexus/usage-ledger/${encodeURIComponent(batch.batchId)}` as any)}
                      >
                        <Text style={[styles.openButtonText, { color: "#fff" }]}>View Batch Billing</Text>
                        <LexusIcon name="ReceiptText" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </GlassCard>
                ))
              )}
            </View>
          </>
        )}

        <View style={{ height: bottomSpacer }} />
      </ScrollView>

      <Modal visible={pickerOpen} animationType="fade" transparent onRequestClose={() => setPickerOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pick a date</Text>
              <TouchableOpacity onPress={() => setPickerOpen(false)}>
                <LexusIcon name="X" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setSelectedDateKey(null);
                setPickerOpen(false);
              }}
            >
              <Text style={styles.modalOptionText}>All dates</Text>
            </TouchableOpacity>

            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              {dateOptions.map((dateKey) => (
                <TouchableOpacity
                  key={dateKey}
                  style={[styles.modalOption, selectedDateKey === dateKey && styles.modalOptionActive]}
                  onPress={() => {
                    setSelectedDateKey(dateKey);
                    setPickerOpen(false);
                  }}
                >
                  <Text style={[styles.modalOptionText, selectedDateKey === dateKey && styles.modalOptionTextActive]}>
                    {formatDateLabel(dateKey)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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

function BatchStat({ label, value, styles }: { label: string; value: string; styles: ReturnType<typeof createStyles>; }) {
  return (
    <View style={styles.kpiCol}>
      <Text style={styles.kpiVal}>{value}</Text>
      <Text style={styles.kpiLab}>{label}</Text>
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
      marginBottom: px(14),
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
    filterButton: {
      minHeight: px(48),
      borderRadius: px(14),
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.68)",
      paddingHorizontal: px(14),
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: px(10),
    },
    filterButtonText: {
      flex: 1,
      color: colors.text,
      fontSize: px(14),
      fontWeight: "700",
    },
    clearFilterButton: {
      marginTop: px(10),
      alignSelf: "flex-start",
    },
    clearFilterText: {
      color: colors.blue,
      fontSize: px(13),
      fontWeight: "700",
    },
    batchCard: {
      marginBottom: px(16),
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: px(8),
      gap: px(8),
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
      marginBottom: px(14),
    },
    dateText: {
      fontSize: px(13),
      color: colors.textFaint,
    },
    amountRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: px(12),
      gap: px(10),
    },
    amountLabel: {
      color: colors.textMuted,
      fontSize: px(12),
      marginBottom: px(3),
    },
    amountValue: {
      color: colors.text,
      fontSize: px(22),
      fontWeight: "800",
    },
    kpiRow: {
      flexDirection: "row",
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(16,33,61,0.08)",
      borderRadius: px(12),
      paddingVertical: px(14),
      marginBottom: px(12),
    },
    kpiCol: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    kpiVal: {
      color: colors.text,
      fontSize: px(16),
      fontWeight: "800",
      marginBottom: px(2),
    },
    kpiLab: {
      color: colors.textFaint,
      fontSize: px(11),
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    kpiDivider: {
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
    actionRow: {
      flexDirection: "row",
      gap: px(10),
    },
    secondaryActionButton: {
      flex: 1,
    },
    primaryActionButton: {
      flex: 1,
      backgroundColor: colors.blue,
      borderColor: colors.blue,
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
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "flex-end",
      padding: px(16),
    },
    modalSheet: {
      backgroundColor: colors.surface,
      borderRadius: px(20),
      padding: px(16),
      borderWidth: 1,
      borderColor: colors.borderStrong,
      maxHeight: "85%",
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: px(12),
    },
    modalTitle: {
      color: colors.text,
      fontSize: px(18),
      fontWeight: "800",
    },
    modalOption: {
      minHeight: px(48),
      borderRadius: px(14),
      paddingHorizontal: px(14),
      justifyContent: "center",
      backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(16,33,61,0.04)",
      marginBottom: px(10),
    },
    modalOptionActive: {
      backgroundColor: isDark ? "rgba(79,140,255,0.18)" : "rgba(79,140,255,0.12)",
    },
    modalOptionText: {
      color: colors.text,
      fontSize: px(14),
      fontWeight: "600",
    },
    modalOptionTextActive: {
      color: colors.blue,
      fontWeight: "800",
    },
  });
}
