import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import GlassCard from "../../../components/lexus/GlassCard";
import SectionHeader from "../../../components/lexus/SectionHeader";
import StatusPill from "../../../components/lexus/StatusPill";
import { LexusIcon, LexusThemeColors } from "../../../components/lexus/theme";
import { useLexusTheme } from "../../../context/LexusThemeContext";
import { useResponsive } from "../../../hooks/useResponsive";
import { useWallet } from "../../../hooks/useWallet";
import { WalletTransactionItem } from "../../../lib/api/payment";

const FILTERS = ["all", "credit", "debit"] as const;
type FilterKey = (typeof FILTERS)[number];

function formatSignedAmount(minorAmount: number, currencyCode = "INR"): string {
  const absoluteMinor = Math.abs(minorAmount);
  const amount = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currencyCode,
    currencyDisplay: "symbol",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absoluteMinor / 100);

  return `${minorAmount >= 0 ? "+" : "-"}${amount}`;
}

function getDirection(txn: WalletTransactionItem): "credit" | "debit" {
  return txn.signedAmountMinor >= 0 ? "credit" : "debit";
}

function getStatusText(status: WalletTransactionItem["status"]): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "succeeded":
      return "Success";
    case "failed":
      return "Failed";
    case "reversed":
      return "Reversed";
    case "refunded":
      return "Refunded";
    default:
      return "Pending";
  }
}

function getTxnTone(txn: WalletTransactionItem): "success" | "danger" | "warning" | "info" | "neutral" {
  if (txn.status === "failed") return "danger";
  if (txn.status === "reversed" || txn.status === "refunded") return "warning";
  if (getDirection(txn) === "credit") return "success";
  return txn.isPending ? "warning" : "info";
}

function getTxnBadge(txn: WalletTransactionItem): string {
  if (getDirection(txn) === "credit") {
    return txn.source?.toLowerCase().includes("topup") ? "Wallet Top-up" : "Credit";
  }

  if (txn.description.toLowerCase().includes("batch")) {
    return "Batch Debit";
  }

  return "Debit";
}

export default function TransactionHistoryScreen() {
  const router = useRouter();
  const { colors, isDark } = useLexusTheme();
  const { isDesktop } = useResponsive();
  const styles = useMemo(() => createStyles(colors, isDark, isDesktop), [colors, isDark, isDesktop]);
  const bottomSpacer = isDesktop ? 112 : 72;

  const { balance, summary, transactions, totalTransactions, isLoading, isTopUpLoading, error, refresh, loadMoreTransactions } = useWallet();
  const [filter, setFilter] = useState<FilterKey>("all");

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((txn) => {
      if (filter === "all") return true;
      return getDirection(txn) === filter;
    });
  }, [filter, transactions]);

  const counts = useMemo(() => {
    return {
      all: transactions.length,
      credit: transactions.filter((txn) => getDirection(txn) === "credit").length,
      debit: transactions.filter((txn) => getDirection(txn) === "debit").length,
    };
  }, [transactions]);

  const creditTotal = useMemo(
    () => transactions.filter((txn) => getDirection(txn) === "credit").reduce((sum, txn) => sum + txn.signedAmountMinor, 0),
    [transactions]
  );
  const debitTotal = useMemo(
    () => Math.abs(transactions.filter((txn) => getDirection(txn) === "debit").reduce((sum, txn) => sum + txn.signedAmountMinor, 0)),
    [transactions]
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <SectionHeader
          title="Transaction History"
          subtitle="Credit and debit activity for your wallet"
          style={{ paddingHorizontal: 16, marginTop: 16, marginBottom: 8 }}
          actionLabel="Back"
          onAction={() => router.back()}
        />

        {(isLoading || isTopUpLoading) && (
          <View style={styles.listWrap}>
            <GlassCard style={styles.emptyCard} padded={true}>
              <Text style={styles.emptyTitle}>Loading transaction history...</Text>
            </GlassCard>
          </View>
        )}

        {!isLoading && error && (
          <View style={styles.listWrap}>
            <GlassCard style={styles.emptyCard} padded={true}>
              <Text style={styles.emptyTitle}>Failed to load wallet transactions.</Text>
              <Text style={styles.emptySubtitle}>{error}</Text>
            </GlassCard>
          </View>
        )}

        {!isLoading && !error && (
          <>
            <View style={styles.listWrap}>
              <GlassCard style={styles.summaryCard} padded={true} variant="accent">
                <View style={styles.summaryTopRow}>
                  <View>
                    <Text style={styles.summaryLabel}>Available balance</Text>
                    <Text style={styles.summaryValue}>{summary?.balanceFormatted ?? balance?.balanceFormatted ?? "₹0.00"}</Text>
                  </View>
                  <StatusPill label="Live" tone="success" />
                </View>

                <View style={styles.summaryGrid}>
                  <SummaryTile label="Credits" value={formatSignedAmount(creditTotal)} icon="ArrowDownLeft" colors={colors} styles={styles} />
                  <SummaryTile label="Debits" value={formatSignedAmount(-debitTotal)} icon="ArrowUpRight" colors={colors} styles={styles} />
                  <SummaryTile label="Pending" value={summary?.pendingTotalFormatted ?? "₹0.00"} icon="Clock" colors={colors} styles={styles} />
                  <SummaryTile label="Transactions" value={String(counts.all)} icon="ReceiptText" colors={colors} styles={styles} />
                </View>
              </GlassCard>
            </View>

            <View style={styles.listWrap}>
              <View style={styles.filterRow}>
                {FILTERS.map((item) => (
                  <TouchableOpacity
                    key={item}
                    onPress={() => setFilter(item)}
                    style={[styles.filterChip, filter === item && styles.filterChipActive]}
                  >
                    <Text style={[styles.filterChipText, filter === item && styles.filterChipTextActive]}>
                      {item === "all" ? "All" : item === "credit" ? "Credit" : "Debit"}
                    </Text>
                    <View style={[styles.filterCountBadge, filter === item && styles.filterCountBadgeActive]}>
                      <Text style={[styles.filterCountText, filter === item && styles.filterCountTextActive]}>
                        {counts[item]}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.listWrap}>
              {filteredTransactions.length === 0 ? (
                <GlassCard style={styles.emptyCard} padded={true}>
                  <View style={styles.emptyIconBg}>
                    <LexusIcon name="InboxX" size={24} color={colors.textFaint} />
                  </View>
                  <Text style={styles.emptyTitle}>No transactions found for this filter.</Text>
                  <Text style={styles.emptySubtitle}>Use Credit or Debit to focus on wallet top-ups or batch deductions.</Text>
                </GlassCard>
              ) : (
                filteredTransactions.map((txn) => <TransactionCard key={txn.id} txn={txn} styles={styles} colors={colors} />)
              )}
            </View>

            {transactions.length < totalTransactions && (
              <View style={styles.listWrap}>
                <TouchableOpacity style={styles.loadMoreButton} onPress={() => void loadMoreTransactions()}>
                  <Text style={styles.loadMoreText}>Load More</Text>
                </TouchableOpacity>
              </View>
            )}
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

function TransactionCard({ txn, styles, colors }: { txn: WalletTransactionItem; styles: ReturnType<typeof createStyles>; colors: LexusThemeColors }) {
  const direction = getDirection(txn);
  const tone = getTxnTone(txn);

  return (
    <GlassCard style={[styles.txnCard, direction === "credit" && styles.txnCardCredit, direction === "debit" && styles.txnCardDebit]} padded={true} variant="elevated">
      <View style={styles.txnTopRow}>
        <View style={styles.txnIconWrap}>
          <LexusIcon name={direction === "credit" ? "ArrowDownLeft" : "ArrowUpRight"} color={direction === "credit" ? colors.green : colors.red} size={16} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.txnTitle}>{getTxnBadge(txn)}</Text>
          <Text style={styles.txnSubtitle}>{txn.description}</Text>
        </View>
        <View style={styles.txnAmountBlock}>
          <Text style={[styles.txnAmount, direction === "credit" ? styles.txnAmountCredit : styles.txnAmountDebit]}>{formatSignedAmount(txn.signedAmountMinor)}</Text>
          <StatusPill label={getStatusText(txn.status)} tone={tone} />
        </View>
      </View>

      <View style={styles.txnMetaRow}>
        <Text style={styles.txnMetaText}>{new Date(txn.createdAt).toLocaleString("en-IN")}</Text>
        <Text style={styles.txnMetaText}>{txn.provider ? txn.provider.toUpperCase() : "LEDGER"}</Text>
      </View>

      <View style={styles.txnFootRow}>
        <Text style={styles.txnFootText}>Source: {txn.source || txn.transactionSource || "wallet"}</Text>
        <Text style={styles.txnFootText}>{txn.isPending ? "Pending ledger entry" : txn.id.slice(0, 10)}</Text>
      </View>
    </GlassCard>
  );
}

function createStyles(colors: LexusThemeColors, isDark: boolean, isDesktop: boolean) {
  const scale = isDesktop ? 0.84 : 1;
  const px = (value: number) => Math.round(value * scale);

  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    scroll: { paddingBottom: px(32) },
    listWrap: { paddingHorizontal: px(16) },
    summaryCard: { marginBottom: px(16) },
    summaryTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: px(14), gap: px(10) },
    summaryLabel: { color: colors.textMuted, fontSize: px(12), marginBottom: px(4) },
    summaryValue: { color: colors.text, fontSize: px(18), fontWeight: "800" },
    summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: px(10) },
    summaryTile: { flexGrow: 1, flexBasis: "48%", padding: px(12), borderRadius: px(14), backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(16,33,61,0.06)", gap: px(6) },
    summaryTileLabel: { color: colors.textMuted, fontSize: px(12) },
    summaryTileValue: { color: colors.text, fontSize: px(16), fontWeight: "700" },
    filterRow: { flexDirection: "row", flexWrap: "wrap", gap: px(8), marginBottom: px(12) },
    filterChip: { flexDirection: "row", alignItems: "center", gap: px(8), borderRadius: px(999), borderWidth: 1, borderColor: colors.border, backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(16,33,61,0.04)", paddingHorizontal: px(12), paddingVertical: px(8) },
    filterChipActive: { backgroundColor: isDark ? "rgba(79,140,255,0.14)" : "rgba(79,140,255,0.12)", borderColor: colors.blue, shadowColor: colors.blue, shadowOpacity: 0.25, shadowRadius: 12, elevation: 5 },
    filterChipText: { color: colors.textMuted, fontSize: px(12), fontWeight: "700" },
    filterChipTextActive: { color: colors.text, fontSize: px(12), fontWeight: "800" },
    filterCountBadge: { minWidth: px(20), height: px(20), borderRadius: px(10), alignItems: "center", justifyContent: "center", paddingHorizontal: px(6), backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(16,33,61,0.08)" },
    filterCountBadgeActive: { backgroundColor: colors.blue },
    filterCountText: { color: colors.textMuted, fontSize: px(11), fontWeight: "700" },
    filterCountTextActive: { color: "#fff", fontSize: px(11), fontWeight: "700" },
    emptyCard: { alignItems: "center", paddingVertical: px(46) },
    emptyIconBg: { width: px(56), height: px(56), borderRadius: px(12), backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(79,140,255,0.08)", alignItems: "center", justifyContent: "center", marginBottom: px(16) },
    emptyTitle: { color: colors.text, fontSize: px(16), fontWeight: "800", marginBottom: px(6), textAlign: "center" },
    emptySubtitle: { color: colors.textMuted, fontSize: px(14), textAlign: "center" },
    txnCard: { marginBottom: px(12), borderWidth: 1, borderColor: colors.border, backgroundColor: isDark ? "rgba(10,16,28,0.94)" : "rgba(255,255,255,0.84)" },
    txnCardCredit: { borderColor: "rgba(34,197,94,0.22)" },
    txnCardDebit: { borderColor: "rgba(239,68,68,0.22)" },
    txnTopRow: { flexDirection: "row", alignItems: "flex-start", gap: px(10), marginBottom: px(10) },
    txnIconWrap: { width: px(32), height: px(32), borderRadius: px(16), alignItems: "center", justifyContent: "center", backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(16,33,61,0.05)" },
    txnTitle: { color: colors.text, fontSize: px(15), fontWeight: "800", marginBottom: px(2) },
    txnSubtitle: { color: colors.textMuted, fontSize: px(12), lineHeight: px(16) },
    txnAmountBlock: { alignItems: "flex-end", gap: px(6) },
    txnAmount: { fontSize: px(16), fontWeight: "800" },
    txnAmountCredit: { color: colors.green },
    txnAmountDebit: { color: colors.red },
    txnMetaRow: { flexDirection: "row", justifyContent: "space-between", gap: px(10), marginBottom: px(8) },
    txnMetaText: { color: colors.textFaint, fontSize: px(11) },
    txnFootRow: { flexDirection: "row", justifyContent: "space-between", gap: px(10) },
    txnFootText: { color: colors.textMuted, fontSize: px(11) },
    loadMoreButton: { minHeight: px(46), borderRadius: px(14), borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", backgroundColor: isDark ? "rgba(79,140,255,0.12)" : "rgba(79,140,255,0.08)" },
    loadMoreText: { color: colors.blue, fontSize: px(14), fontWeight: "800" },
  });
}
