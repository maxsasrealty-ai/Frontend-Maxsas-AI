import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import GlassCard from "../../../components/lexus/GlassCard";
import PillButton from "../../../components/lexus/PillButton";
import SectionHeader from "../../../components/lexus/SectionHeader";
import StatusPill from "../../../components/lexus/StatusPill";
import { LEXUS_FONTS, LexusIcon, LexusThemeColors } from "../../../components/lexus/theme";
import { useLexusTheme } from "../../../context/LexusThemeContext";
import { useCapabilities } from "../../../hooks/useCapabilities";
import { useResponsive } from "../../../hooks/useResponsive";
import { useWallet } from "../../../hooks/useWallet";
import { WalletTransactionItem } from "../../../lib/api/payment";
import { getCurrentAuthUser } from "../../../lib/auth/session";
import { clearPendingPayUPayment } from "../../../lib/payments/payuFlow";

const FILTERS = ["all", "credit", "debit"] as const;
const QUICK_TOPUPS = [100, 500, 1000] as const;
const MIN_TOPUP_RUPEES = 1;
const EARLY_ACCESS_MOCK_MODE = true;
const MOCK_AVAILABLE_BALANCE_TEXT = "₹12,840.00";
const MOCK_PENDING_BALANCE_TEXT = "₹1,260.00";
const MOCK_CURRENCY_TEXT = "INR";
const MOCK_TRANSACTIONS: WalletTransactionItem[] = [
  {
    id: "mock-wallet-1",
    amountMinor: 500000,
    status: "succeeded",
    signedAmountMinor: 500000,
    type: "credit",
    entryType: "topup",
    currency: "INR",
    description: "Launch waitlist wallet credit",
    provider: "mock",
    providerOrderId: "WL-900101",
    providerPaymentId: null,
    referenceId: null,
    externalTxnId: null,
    paymentOrderId: null,
    paymentGatewayReference: null,
    idempotencyKey: "mock-idempotency-1",
    source: "early-access",
    transactionSource: "early-access",
    amountFormatted: "₹5,000.00",
    signedAmountFormatted: "₹5,000.00",
    isPending: false,
    createdAt: "2026-06-09T11:20:00.000Z",
  },
  {
    id: "mock-wallet-2",
    amountMinor: 1400,
    status: "pending",
    signedAmountMinor: -1400,
    type: "debit",
    entryType: "reserve",
    currency: "INR",
    description: "Reserved for beta demo wave",
    provider: "mock",
    providerOrderId: "WL-900102",
    providerPaymentId: null,
    referenceId: null,
    externalTxnId: null,
    paymentOrderId: null,
    paymentGatewayReference: null,
    idempotencyKey: "mock-idempotency-2",
    source: "early-access",
    transactionSource: "early-access",
    amountFormatted: "₹14.00",
    signedAmountFormatted: "₹14.00",
    isPending: true,
    createdAt: "2026-06-09T09:45:00.000Z",
  },
  {
    id: "mock-wallet-3",
    amountMinor: 2800,
    status: "succeeded",
    signedAmountMinor: -2800,
    type: "debit",
    entryType: "reserve",
    currency: "INR",
    description: "AI call simulation reserve",
    provider: "mock",
    providerOrderId: "WL-900103",
    providerPaymentId: null,
    referenceId: null,
    externalTxnId: null,
    paymentOrderId: null,
    paymentGatewayReference: null,
    idempotencyKey: "mock-idempotency-3",
    source: "early-access",
    transactionSource: "early-access",
    amountFormatted: "₹28.00",
    signedAmountFormatted: "₹28.00",
    isPending: false,
    createdAt: "2026-06-08T17:10:00.000Z",
  },
];

type FilterKey = (typeof FILTERS)[number];

function formatSignedAmount(minorAmount: number, currencyCode = "INR"): string {
  const absoluteMinor = Math.abs(minorAmount);
  const major = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currencyCode,
    currencyDisplay: "symbol",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absoluteMinor / 100);

  return `${minorAmount >= 0 ? "+" : "-"}${major}`;
}

function getTransactionDirection(txn: WalletTransactionItem): "credit" | "debit" {
  return txn.signedAmountMinor >= 0 ? "credit" : "debit";
}

function getStatusLabel(status: WalletTransactionItem["status"]): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "succeeded":
      return "Completed";
    case "failed":
      return "Failed";
    case "reversed":
    case "refunded":
      return "Completed";
    default:
      return "Pending";
  }
}

function getProviderLabel(txn: WalletTransactionItem): string {
  if (txn.provider?.trim()) {
    return txn.provider.trim().toUpperCase();
  }

  return "SYSTEM";
}

function getProviderReference(txn: WalletTransactionItem): string | null {
  const rawRef = txn.providerOrderId || txn.providerPaymentId || txn.referenceId || txn.externalTxnId || txn.paymentOrderId;
  if (!rawRef) {
    return null;
  }

  const trimmed = rawRef.trim();
  if (!trimmed) {
    return null;
  }

  return `#${trimmed.slice(-6).toUpperCase()}`;
}

function getDisplayDescription(txn: WalletTransactionItem): string {
  const fallback = getTransactionDirection(txn) === "credit" ? "Wallet top-up" : "Call charge";
  if (!txn.description?.trim()) {
    return fallback;
  }

  return txn.description;
}

function readSearchParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export default function LexusWallet() {
  const { colors, isDark, plan } = useLexusTheme();
  const { isDesktop } = useResponsive();
  const s = useMemo(() => createStyles(colors, isDark, isDesktop, plan), [colors, isDark, isDesktop, plan]);
  const bottomSpacer = isDesktop ? 112 : 72;

  useCapabilities(); // Hook for capability checking
  const router = useRouter();
  const params = useLocalSearchParams();
  const paymentStatus = useMemo(() => {
    return readSearchParam(params.payment);
  }, [params.payment]);

  const {
    balance,
    summary,
    transactions,
    totalTransactions,
    isLoading,
    isTopUpLoading,
    error,
    topUpResult,
    refresh,
    topUp,
    simulateTopUpSuccess,
    loadMoreTransactions,
  } = useWallet();

  const [filter, setFilter] = useState<FilterKey>("all");
  const [manualTopUpRupees, setManualTopUpRupees] = useState("");
  const [isAdminTester, setIsAdminTester] = useState(false);

  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    void getCurrentAuthUser().then((user) => {
      if (!mounted) {
        return;
      }

      const email = user?.email?.trim().toLowerCase() ?? "";
      setIsAdminTester(email === "admin@maxsas.com");
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!paymentStatus) {
      return;
    }

    let cancelled = false;

    void (async () => {
      if (paymentStatus === "success") {
        if (!cancelled) {
          setPaymentMessage("Payment completed successfully. Fetching latest wallet data from backend.");
        }

        await refresh();
      } else if (paymentStatus === "failure") {
        if (!cancelled) {
          setPaymentMessage("Payment failed. Your wallet balance was not updated.");
        }
      }

      await clearPendingPayUPayment();

      if (!cancelled) {
        void router.replace("/(protected)/lexus/wallet" as any);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [paymentStatus, refresh, router]);

  const displayTransactions = EARLY_ACCESS_MOCK_MODE ? MOCK_TRANSACTIONS : transactions;
  const displayTotalTransactions = EARLY_ACCESS_MOCK_MODE ? MOCK_TRANSACTIONS.length : totalTransactions;
  const availableBalanceText = EARLY_ACCESS_MOCK_MODE ? MOCK_AVAILABLE_BALANCE_TEXT : summary?.balanceFormatted ?? balance?.balanceFormatted ?? "₹--";
  const pendingBalanceText = EARLY_ACCESS_MOCK_MODE ? MOCK_PENDING_BALANCE_TEXT : summary?.pendingTotalFormatted ?? "₹0.00";
  const currencyText = EARLY_ACCESS_MOCK_MODE ? MOCK_CURRENCY_TEXT : summary?.currencyCode ?? "INR";

  const filteredTxns = useMemo(() => {
    if (filter === "all") {
      return displayTransactions;
    }
    return displayTransactions.filter((txn) => getTransactionDirection(txn) === filter);
  }, [displayTransactions, filter]);

  const hasMore = displayTransactions.length < displayTotalTransactions;
  const isLocalhostRuntime =
    Platform.OS === "web" &&
    typeof window !== "undefined" &&
    ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const showSimulateSuccessButton = isLocalhostRuntime || isAdminTester;

  const hasPendingLedger = EARLY_ACCESS_MOCK_MODE
    ? true
    : Boolean((summary?.pendingTotalMinor ?? 0) > 0 || transactions.some((item) => item.status === "pending"));

  async function handleQuickTopUp(amountPaise: number) {
    const ok = await topUp(amountPaise);
    if (!ok) {
      Alert.alert("Top-Up Failed", "Please try again or contact support.");
    }
  }

  async function handleManualTopUp() {
    const rupees = Number(manualTopUpRupees.trim());

    if (!Number.isFinite(rupees) || !Number.isInteger(rupees)) {
      Alert.alert("Invalid Amount", "Please enter a valid whole number amount.");
      return;
    }

    if (rupees < MIN_TOPUP_RUPEES) {
      Alert.alert("Minimum Amount", `Minimum top-up amount is ₹${MIN_TOPUP_RUPEES}.`);
      return;
    }

    const ok = await topUp(rupees * 100);
    if (!ok) {
      Alert.alert("Top-Up Failed", "Please try again or contact support.");
      return;
    }

    setManualTopUpRupees("");
  }

  async function handleSimulateSuccess() {
    const rupees = Number(manualTopUpRupees.trim() || String(MIN_TOPUP_RUPEES));

    if (!Number.isFinite(rupees) || !Number.isInteger(rupees)) {
      Alert.alert("Invalid Amount", "Please enter a valid whole number amount.");
      return;
    }

    if (rupees < MIN_TOPUP_RUPEES) {
      Alert.alert("Minimum Amount", `Minimum top-up amount is ₹${MIN_TOPUP_RUPEES}.`);
      return;
    }

    const ok = await simulateTopUpSuccess(rupees * 100);
    if (!ok) {
      Alert.alert("Simulation Failed", "Unable to simulate successful payment.");
      return;
    }

    setManualTopUpRupees("");
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <SectionHeader title="Wallet" subtitle="Track balance & transactions" style={{ marginTop: 18 }} />

        {error && (
          <GlassCard style={s.errorCard} padded={true} variant="elevated">
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <LexusIcon name="AlertCircle" color={colors.red} size={18} />
              <Text style={s.errorText}>{error}</Text>
            </View>
          </GlassCard>
        )}

        <GlassCard style={[s.balanceHero, hasPendingLedger && s.balanceHeroPending]} padded={true} variant="accent">
          <View style={s.balanceTop}>
            <View>
              <Text style={s.balanceHeading}>Available Balance</Text>
              <Text style={s.balanceValue}>{availableBalanceText}</Text>
            </View>
            <View style={s.balanceStatusWrap}>
              <StatusPill label={hasPendingLedger ? "Syncing" : "Live"} tone={hasPendingLedger ? "info" : "success"} />
              {hasPendingLedger && <ActivityIndicator color={colors.amber} size="small" />}
            </View>
          </View>
          <View style={s.balanceDivider} />
          <View style={s.balanceGrid}>
            <View style={s.balanceGridCell}>
              <LexusIcon name="Wallet" color={colors.blue} size={16} />
              <Text style={s.balanceGridLabel}>Available</Text>
              <Text style={s.balanceGridValue}>{availableBalanceText}</Text>
            </View>
            <View style={s.balanceGridCell}>
              <LexusIcon name="Lock" color={colors.amber} size={16} />
              <Text style={s.balanceGridLabel}>Pending</Text>
              <Text style={s.balanceGridValue}>{pendingBalanceText}</Text>
            </View>
            <View style={s.balanceGridCell}>
              <LexusIcon name="CreditCard" color={colors.green} size={16} />
              <Text style={s.balanceGridLabel}>Currency</Text>
              <Text style={s.balanceGridValue}>{currencyText}</Text>
            </View>
          </View>
        </GlassCard>

        <View style={s.headerRow}>
          <SectionHeader title="Wallet Summary" subtitle="Your spending patterns" />
          <TouchableOpacity onPress={() => void refresh()}>
            <View style={s.refreshButton}>
              <LexusIcon name="RefreshCw" color={colors.blue} size={16} />
            </View>
          </TouchableOpacity>
        </View>
        <View style={s.statsGrid}>
          <StatCard styles={s} icon="Wallet" label="Balance" value={availableBalanceText} />
          <StatCard styles={s} icon="Lock" label="Pending" value={pendingBalanceText} />
          <StatCard styles={s} icon="CreditCard" label="Currency" value={currencyText} />
        </View>

        <GlassCard style={s.infoCard} padded={true} variant="elevated">
          <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
            <LexusIcon name="Info" color={colors.blue} size={16} />
            <Text style={s.infoText}>Early-access mode is active. Full wallet charging details will be revealed with the July launch.</Text>
          </View>
        </GlassCard>

        <SectionHeader title="Recharge Account" subtitle="Quick top-up options" />
        <View style={s.quickActionsRow}>
          {QUICK_TOPUPS.map((amount) => (
            <PillButton
              key={amount}
              title={`₹${(amount / 100).toLocaleString("en-IN")}`}
              variant="secondary"
              style={s.quickActionButton}
              disabled={isTopUpLoading}
              onPress={() => void handleQuickTopUp(amount)}
            />
          ))}
        </View>

        <GlassCard style={s.manualTopUpCard} padded={true} variant="elevated">
          <Text style={s.manualTopUpLabel}>Custom Amount (Min ₹{MIN_TOPUP_RUPEES})</Text>
          <View style={s.manualTopUpRow}>
            <TextInput
              style={s.manualTopUpInput}
              placeholder="Enter amount"
              placeholderTextColor={colors.textFaint}
              keyboardType="number-pad"
              value={manualTopUpRupees}
              onChangeText={setManualTopUpRupees}
            />
            <PillButton
              title="Proceed"
              onPress={() => void handleManualTopUp()}
              disabled={isTopUpLoading}
              style={{ minWidth: 90 }}
            />
          </View>
          {showSimulateSuccessButton && (
            <PillButton
              title="Simulate Success (Dev)"
              variant="ghost"
              disabled={isTopUpLoading}
              onPress={() => void handleSimulateSuccess()}
              style={s.devSimulationButton}
            />
          )}
        </GlassCard>

        {isTopUpLoading && (
          <GlassCard style={s.loadingCard} padded={true}>
            <ActivityIndicator color={colors.blue} />
            <Text style={[s.pendingText, { marginTop: 10 }]}>Processing top-up...</Text>
          </GlassCard>
        )}
        {topUpResult?.success && (
          <GlassCard style={s.successCard} padded={true} variant="elevated">
            <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
              <LexusIcon name="CheckCircle2" color={colors.green} size={18} />
              <Text style={s.successText}>
                {topUpResult.mock
                  ? `${topUpResult.amountFormatted} credited (demo)`
                  : `Order ${topUpResult.orderId} created`}
              </Text>
            </View>
          </GlassCard>
        )}
        {paymentMessage && (
          <GlassCard style={paymentStatus === "success" ? s.successCard : s.errorCard} padded={true} variant="elevated">
            <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
              <LexusIcon name={paymentStatus === "success" ? "CheckCircle2" : "AlertCircle"} color={paymentStatus === "success" ? colors.green : colors.red} size={18} />
              <Text style={paymentStatus === "success" ? s.successText : s.errorText}>{paymentMessage}</Text>
            </View>
          </GlassCard>
        )}

        <SectionHeader title="Transaction History" subtitle="All wallet activity" />
        <View style={s.filterRow}>
          {FILTERS.map((item) => {
            const active = item === filter;
            return (
              <TouchableOpacity key={item} style={[s.filterPill, active && s.filterPillActive]} onPress={() => setFilter(item)}>
                <Text style={[s.filterText, active && s.filterTextActive]}>{item.charAt(0).toUpperCase() + item.slice(1)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {!EARLY_ACCESS_MOCK_MODE && isLoading && transactions.length === 0 ? (
          <View style={s.centerContainer}>
            <ActivityIndicator color={colors.blue} size="large" />
            <Text style={[s.pendingText, { marginTop: 12 }]}>Loading transactions...</Text>
          </View>
        ) : filteredTxns.length === 0 ? (
          <GlassCard style={s.emptyCard} padded={true} variant="elevated">
            <LexusIcon name="Inbox" color={colors.textMuted} size={24} />
            <Text style={[s.pendingText, { marginTop: 10 }]}>No transactions found</Text>
          </GlassCard>
        ) : (
          filteredTxns.map((txn) => (
            <GlassCard key={txn.id} style={[s.txnCard, txn.status === "pending" && s.txnCardPending]} padded={false} variant="elevated">
              <View style={s.txnTop}>
                <View style={[s.txnIconWrap, getTransactionDirection(txn) === "credit" && { backgroundColor: isDark ? "rgba(0,208,132,0.12)" : "rgba(0,208,132,0.14)" }]}>
                  <LexusIcon name={getTransactionDirection(txn) === "credit" ? "ArrowDown" : "ArrowUp"} color={getTransactionDirection(txn) === "credit" ? colors.green : colors.red} size={14} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.txnDescription}>{getDisplayDescription(txn)}</Text>
                  <View style={s.txnMetaRow}>
                    <View style={s.txnProviderBadge}>
                      <Text style={s.txnProviderText}>{getProviderLabel(txn)}</Text>
                    </View>
                    {getProviderReference(txn) && <Text style={s.txnRefText}>{getProviderReference(txn)}</Text>}
                    <Text style={s.txnMeta}>{new Date(txn.createdAt).toLocaleString("en-IN")}</Text>
                  </View>
                </View>
                <View style={s.txnAmountColumn}>
                  <TxnStatusBadge status={txn.status} />
                  <Text style={getTransactionDirection(txn) === "credit" ? s.txnAmountCredit : s.txnAmountDebit}>
                    {formatSignedAmount(txn.signedAmountMinor, txn.currency)}
                  </Text>
                </View>
              </View>
            </GlassCard>
          ))
        )}

        {hasMore && (
          <TouchableOpacity style={s.loadMoreButton} onPress={() => void loadMoreTransactions()}>
            <Text style={s.loadMoreText}>Load more</Text>
          </TouchableOpacity>
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
}: {
  styles: ReturnType<typeof createStyles>;
  icon: any;
  label: string;
  value: string;
}) {
  const { colors } = useLexusTheme();

  return (
    <GlassCard style={styles.statCard} padded={false} variant="elevated">
      <View style={styles.statIconWrap}>
        <LexusIcon name={icon} color={colors.blue} size={16} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </GlassCard>
  );
}

function TxnStatusBadge({ status }: { status: WalletTransactionItem["status"] }) {
  const { colors } = useLexusTheme();

  const toneStyles = (() => {
    switch (status) {
      case "pending":
        return { backgroundColor: "rgba(245,158,11,0.14)", borderColor: "rgba(245,158,11,0.25)", color: colors.amber };
      case "succeeded":
        return { backgroundColor: "rgba(0,208,132,0.12)", borderColor: "rgba(0,208,132,0.22)", color: colors.green };
      case "failed":
        return { backgroundColor: "rgba(239,68,68,0.12)", borderColor: "rgba(239,68,68,0.22)", color: colors.red };
      case "reversed":
      case "refunded":
        return { backgroundColor: "rgba(79,140,255,0.12)", borderColor: "rgba(79,140,255,0.22)", color: colors.blue };
      default:
        return { backgroundColor: "rgba(245,158,11,0.14)", borderColor: "rgba(245,158,11,0.25)", color: colors.amber };
    }
  })();

  return (
    <View style={{
      alignSelf: "flex-end",
      borderRadius: 999,
      borderWidth: 1,
      borderColor: toneStyles.borderColor,
      backgroundColor: toneStyles.backgroundColor,
      paddingHorizontal: 8,
      paddingVertical: 4,
    }}>
      <Text style={{ color: toneStyles.color, fontSize: 10, fontFamily: LEXUS_FONTS.bodySemiBold }}>{getStatusLabel(status)}</Text>
    </View>
  );
}

function createStyles(colors: LexusThemeColors, isDark: boolean, isDesktop: boolean, plan: string) {
  const isPrestige = plan === "prestige";
  const scale = isDesktop ? 0.88 : 1;
  const px = (value: number) => Math.round(value * scale);

  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    scroll: { paddingHorizontal: px(16), paddingTop: px(18), paddingBottom: px(32) },
    centerContainer: { alignItems: "center", justifyContent: "center", paddingVertical: px(40) },
    headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: px(12) },
    refreshButton: {
      width: px(38),
      height: px(38),
      borderRadius: px(19),
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.blueSoft,
    },
    errorCard: {
      marginBottom: px(14),
      backgroundColor: isDark ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.1)",
      borderColor: isDark ? "rgba(239,68,68,0.24)" : "rgba(239,68,68,0.2)",
    },
    errorText: { color: colors.red, fontSize: px(13), fontFamily: LEXUS_FONTS.body, flex: 1 },
    balanceHero: {
      marginBottom: px(16),
      backgroundColor: isPrestige
        ? isDark
          ? "rgba(216,180,254,0.08)"
          : "rgba(216,180,254,0.12)"
        : isDark
        ? "#060f22"
        : "#0d1f53",
      borderColor: isPrestige
        ? isDark
          ? "rgba(216,180,254,0.2)"
          : "transparent"
        : "rgba(255,255,255,0.12)",
    },
    balanceHeroPending: {
      borderWidth: 1,
      borderColor: colors.amber,
    },
    balanceTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: px(14) },
    balanceStatusWrap: { flexDirection: "row", alignItems: "center", gap: px(8) },
    balanceHeading: { color: colors.textMuted, fontSize: px(13), fontFamily: LEXUS_FONTS.bodySemiBold, marginBottom: px(6) },
    balanceValue: { color: isPrestige ? colors.purple : "#ffffff", fontSize: px(48), fontFamily: LEXUS_FONTS.display, marginBottom: px(12) },
    balanceDivider: { height: 1, backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.1)", marginBottom: px(12) },
    balanceGrid: { flexDirection: "row", gap: px(10) },
    balanceGridCell: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: px(10),
      borderRadius: px(10),
      backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.1)",
    },
    balanceGridLabel: { color: "rgba(255,255,255,0.65)", fontSize: px(11), fontFamily: LEXUS_FONTS.body, marginTop: px(4) },
    balanceGridValue: { color: "#ffffff", fontSize: px(16), fontFamily: LEXUS_FONTS.displayMedium, marginTop: px(2) },
    statsGrid: { flexDirection: "row", gap: px(10), marginBottom: px(16) },
    statCard: { flex: 1, minHeight: px(100), alignItems: "center", justifyContent: "center" },
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
    statLabel: { color: colors.textMuted, fontSize: px(12), fontFamily: LEXUS_FONTS.body, textAlign: "center" },
    infoCard: {
      marginBottom: px(16),
      backgroundColor: isDark ? "rgba(79,140,255,0.09)" : "rgba(79,140,255,0.08)",
      borderColor: colors.border,
    },
    infoText: { color: colors.textMuted, fontSize: px(13), fontFamily: LEXUS_FONTS.body, flex: 1 },
    quickActionsRow: { flexDirection: "row", gap: px(8), marginBottom: px(16) },
    quickActionButton: { flex: 1 },
    manualTopUpCard: { marginBottom: px(16) },
    manualTopUpLabel: { color: colors.text, fontSize: px(14), fontFamily: LEXUS_FONTS.bodySemiBold, marginBottom: px(10) },
    manualTopUpRow: { flexDirection: "row", gap: px(8), alignItems: "center", marginBottom: px(10) },
    manualTopUpInput: {
      flex: 1,
      height: px(42),
      borderRadius: px(10),
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.text,
      paddingHorizontal: px(12),
      backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
      fontFamily: LEXUS_FONTS.body,
      fontSize: px(14),
    },
    devSimulationButton: { marginTop: px(8), alignSelf: "flex-start" },
    loadingCard: { alignItems: "center", justifyContent: "center", paddingVertical: px(20) },
    successCard: {
      marginBottom: px(12),
      backgroundColor: isDark ? "rgba(0,208,132,0.12)" : "rgba(0,208,132,0.1)",
      borderColor: isDark ? "rgba(0,208,132,0.24)" : "rgba(0,208,132,0.2)",
    },
    successText: { color: colors.green, fontSize: px(13), fontFamily: LEXUS_FONTS.bodySemiBold, flex: 1 },
    pendingText: { color: colors.textMuted, fontSize: px(13), fontFamily: LEXUS_FONTS.body },
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
      backgroundColor: isPrestige
        ? isDark
          ? "rgba(216,180,254,0.15)"
          : "rgba(216,180,254,0.12)"
        : isDark
        ? "rgba(79,140,255,0.22)"
        : "rgba(79,140,255,0.18)",
      borderColor: isPrestige ? colors.purple : colors.blue,
    },
    filterText: { color: colors.textMuted, fontFamily: LEXUS_FONTS.bodySemiBold, fontSize: px(12) },
    filterTextActive: { color: isPrestige ? colors.purple : colors.text, fontFamily: LEXUS_FONTS.bodySemiBold, fontSize: px(12) },
    emptyCard: { alignItems: "center", justifyContent: "center", paddingVertical: px(32) },
    txnCard: { marginBottom: px(10), borderRadius: px(14), paddingVertical: px(12), paddingHorizontal: px(12) },
    txnCardPending: {
      borderWidth: 1,
      borderColor: colors.amber,
    },
    txnTop: { flexDirection: "row", alignItems: "center", gap: px(10) },
    txnIconWrap: {
      width: px(32),
      height: px(32),
      borderRadius: px(16),
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.14)",
    },
    txnDescription: { color: colors.text, fontSize: px(13), fontFamily: LEXUS_FONTS.bodySemiBold },
    txnMetaRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: px(6), marginTop: px(4) },
    txnProviderBadge: {
      borderRadius: px(999),
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: isDark ? "rgba(79,140,255,0.14)" : "rgba(79,140,255,0.12)",
      paddingHorizontal: px(8),
      paddingVertical: px(2),
    },
    txnProviderText: { color: colors.blue, fontSize: px(10), fontFamily: LEXUS_FONTS.bodySemiBold },
    txnRefText: { color: colors.textMuted, fontSize: px(11), fontFamily: LEXUS_FONTS.bodySemiBold },
    txnMeta: { color: colors.textMuted, fontSize: px(11), fontFamily: LEXUS_FONTS.body, marginTop: px(2) },
    txnAmountColumn: { alignItems: "flex-end", gap: px(8) },
    txnAmountCredit: { color: colors.green, fontSize: px(13), fontFamily: LEXUS_FONTS.bodySemiBold },
    txnAmountDebit: { color: colors.red, fontSize: px(13), fontFamily: LEXUS_FONTS.bodySemiBold },
    txnStatusBadge: {
      alignSelf: "flex-end",
      borderRadius: px(999),
      borderWidth: 1,
      paddingHorizontal: px(8),
      paddingVertical: px(4),
    },
    txnStatusBadgeText: { fontSize: px(10), fontFamily: LEXUS_FONTS.bodySemiBold },
    loadMoreButton: { alignItems: "center", justifyContent: "center", paddingVertical: px(14), marginVertical: px(12), borderRadius: px(10), backgroundColor: "rgba(79, 140, 255, 0.1)", borderWidth: 1, borderColor: "rgba(79, 140, 255, 0.2)" },
    loadMoreText: { color: colors.blue, fontSize: px(13), fontFamily: LEXUS_FONTS.bodySemiBold },
  });
}
