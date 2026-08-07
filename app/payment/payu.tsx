import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import GlassCard from "../../components/lexus/GlassCard";
import PillButton from "../../components/lexus/PillButton";
import StatusPill from "../../components/lexus/StatusPill";
import { LEXUS_FONTS, LexusIcon } from "../../components/lexus/theme";
import { useLexusTheme } from "../../context/LexusThemeContext";
import { useWallet } from "../../hooks/useWallet";
import { verifyPayURedirect } from "../../lib/api/payment";
import { getCurrentAuthUser, setCurrentAuthUser } from "../../lib/auth/session";
import {
    clearPendingPayUPayment,
    getCallbackProviderPaymentId,
    getCallbackReason,
    getCallbackStatus,
    getCallbackTransactionId,
    PayUCallbackParams,
    readPendingPayUPayment,
} from "../../lib/payments/payuFlow";

type CallbackPhase = "booting" | "pending" | "success" | "failure" | "timeout" | "error";

function formatPaise(amountMinor: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountMinor / 100);
}

function readParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function flattenSearchParams(params: Record<string, string | string[] | undefined>): Record<string, string> {
  return Object.entries(params).reduce<Record<string, string>>((accumulator, [key, value]) => {
    const flattened = readParam(value);
    if (flattened) {
      accumulator[key] = flattened;
    }
    return accumulator;
  }, {});
}

function parseCallbackAmountToPaise(rawAmount: string | null | undefined): number {
  if (!rawAmount) {
    return 0;
  }

  const normalized = String(rawAmount).trim();
  if (!normalized) {
    return 0;
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 0;
  }

  // PayU callback amount is usually in rupees with decimals, while app callbacks may send paise.
  if (normalized.includes(".")) {
    return Math.round(parsed * 100);
  }

  return Math.round(parsed);
}

function buildWalletReturnUrl(params: URLSearchParams): string {
  return `/(protected)/lexus/wallet?${params.toString()}`;
}

export default function PayUCallbackScreen() {
  const { colors, isDark, plan } = useLexusTheme();
  const s = useMemo(() => createStyles(colors, isDark, plan), [colors, isDark, plan]);
  const params = useLocalSearchParams();
  const { balance, transactions, refresh, isLoading } = useWallet({ autoRefresh: false });

  const callbackParams = useMemo<PayUCallbackParams>(() => ({
    status: params.payment,
    txnid: params.txnid,
    mihpayid: params.mihpayid,
    payment_order_id: params.payment_order_id,
    merchant_txn_id: params.merchant_txn_id,
    amount: params.amount,
    error: params.error,
    reason: params.reason,
  }), [params.amount, params.error, params.mihpayid, params.payment_order_id, params.merchant_txn_id, params.payment, params.reason, params.txnid]);

  const [phase, setPhase] = useState<CallbackPhase>("booting");
  const [title, setTitle] = useState("Verifying payment");
  const [subtitle, setSubtitle] = useState("Waiting for PayU and backend confirmation.");
  const [snack, setSnack] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);

  const mountedRef = useRef(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phaseRef = useRef<CallbackPhase>(phase);
  const isCheckingRef = useRef(isChecking);
  const verifyStartedRef = useRef(false);

  const merchantTransactionId = useMemo(() => getCallbackTransactionId(callbackParams), [callbackParams]);
  const providerPaymentId = useMemo(() => getCallbackProviderPaymentId(callbackParams), [callbackParams]);
  const callbackStatus = useMemo(() => getCallbackStatus(callbackParams), [callbackParams]);
  const callbackReason = useMemo(() => getCallbackReason(callbackParams), [callbackParams]);
  const payuReturnPayload = useMemo(() => flattenSearchParams(params as Record<string, string | string[] | undefined>), [params]);

  const stopTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    isCheckingRef.current = isChecking;
  }, [isChecking]);

  const clearSnackLater = useCallback((nextMessage: string, delayMs = 2500) => {
    setSnack(nextMessage);
    setTimeout(() => {
      if (mountedRef.current) {
        setSnack((current) => (current === nextMessage ? null : current));
      }
    }, delayMs);
  }, []);

  const goToWallet = useCallback(
    (status: "success" | "failure", reason?: string | null) => {
      const walletParams = new URLSearchParams();
      walletParams.set("payment", status);

      if (merchantTransactionId) {
        walletParams.set("txnid", merchantTransactionId);
      }

      if (providerPaymentId) {
        walletParams.set("mihpayid", providerPaymentId);
      }

      const amountPaise = readParam(params.amount);
      if (amountPaise) {
        walletParams.set("amount", amountPaise);
      }

      if (reason) {
        walletParams.set("reason", reason);
      }

      const target = buildWalletReturnUrl(walletParams);
      console.info("PayU callback redirecting to wallet", {
        status,
        reason,
        target,
        merchantTransactionId,
        providerPaymentId,
      });
      router.replace(target as any);
    },
    [merchantTransactionId, params.amount, providerPaymentId]
  );

  const showFailure = useCallback(
    async (message: string) => {
      stopTimeout();
      setPhase("failure");
      setTitle("Payment not completed");
      setSubtitle(message);
      setSnack(message);
      await clearPendingPayUPayment();
      await refresh();
    },
    [refresh, stopTimeout]
  );

  const pollForConfirmation = useCallback(async () => {
    if (verifyStartedRef.current) {
      return;
    }

    verifyStartedRef.current = true;
    setIsChecking(true);
    setPhase("pending");
    setTitle("Finalizing payment");
    setSubtitle("Sending the PayU return payload to the backend so the ledger can be finalized.");
    setSnack("Verifying payment with backend...");

    console.info("PayU callback verification started", {
      merchantTransactionId: pendingTxnId,
      paymentOrderId,
      providerPaymentId,
      callbackStatus,
      callbackReason,
      callbackAmountPaise,
      pendingAmountPaise,
    });

    const storedPayment = await readPendingPayUPayment();
    const paymentOrderId = readParam(params.payment_order_id) || storedPayment?.paymentOrderId || null;
    const pendingTxnId = merchantTransactionId || storedPayment?.merchantTransactionId || null;
    const callbackAmountPaise = parseCallbackAmountToPaise(readParam(params.amount));
    const pendingAmountPaise = storedPayment?.amountPaise ?? callbackAmountPaise;

    const currentAuthUser = await getCurrentAuthUser();
    if (!currentAuthUser && storedPayment?.authUser) {
      await setCurrentAuthUser(storedPayment.authUser);
    }

    if (callbackStatus === "failure") {
      await showFailure(callbackReason || "PayU reported a payment failure.");
      setIsChecking(false);
      return;
    }

    if (!pendingTxnId) {
      setPhase("error");
      setTitle("Payment callback missing");
      setSubtitle("We could not identify the payment attempt. Please return to Wallet and try again.");
      setSnack("Payment state was not recoverable.");
      setIsChecking(false);
      return;
    }

    if (!paymentOrderId) {
      setPhase("error");
      setTitle("Payment order missing");
      setSubtitle("We could not find the payment order ID needed to finalize the wallet credit.");
      setSnack("Payment order ID was not recoverable.");
      await refresh();
      setIsChecking(false);
      return;
    }

    try {
      const response = await verifyPayURedirect(paymentOrderId, {
        ...payuReturnPayload,
        paymentOrderId,
        merchantTransactionId: pendingTxnId,
        payuTransactionId: providerPaymentId || readParam(params.mihpayid) || "",
        status: callbackStatus || readParam(params.payment) || "success",
      });

      console.info("PayU callback verification completed", {
        success: response.success,
        finalized: response.data?.finalized,
        orderStatus: response.data?.orderStatus,
        balanceUpdated: response.data?.balanceUpdated,
        newBalancePaise: response.data?.newBalancePaise,
        message: response.data?.message,
      });

      if (!response.success) {
        throw new Error(response.error?.message || "Payment verification failed");
      }

      const finalized =
        response.data?.finalized === true ||
        response.data?.balanceUpdated === true ||
        ["success", "completed"].includes(String(response.data?.orderStatus || "").toLowerCase());

      setAttemptCount((value) => value + 1);
      if (finalized) {
        setPhase("success");
        setTitle("Payment confirmed");
        setSubtitle(
          typeof response.data?.newBalancePaise === "number"
            ? `Wallet updated to ${formatPaise(response.data.newBalancePaise)}.`
            : "Wallet updated successfully."
        );
        clearSnackLater("Wallet synced successfully.", 2200);
      } else {
        setPhase("pending");
        setTitle("Awaiting wallet sync");
        setSubtitle(response.data?.message || "Backend accepted the callback. Refreshing the latest database snapshot.");
        clearSnackLater("Fetching latest wallet data...", 1800);
      }

      await refresh();
      await clearPendingPayUPayment();
      stopTimeout();

      if (finalized) {
        const walletParams = new URLSearchParams();
        walletParams.set("payment", "success");
        walletParams.set("txnid", pendingTxnId);
        walletParams.set("amount", String(pendingAmountPaise || 0));
        if (providerPaymentId) {
          walletParams.set("mihpayid", providerPaymentId);
        }

        timeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            router.replace(buildWalletReturnUrl(walletParams) as any);
          }
        }, 500);
      }
      setIsChecking(false);
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Payment verification failed";
      setPhase("failure");
      setTitle("Verification failed");
      setSubtitle(message);
      setSnack("Verification failed. Showing latest wallet data.");
      await refresh();
    }

    setIsChecking(false);
  }, [callbackReason, callbackStatus, clearSnackLater, merchantTransactionId, payuReturnPayload, providerPaymentId, refresh, showFailure, stopTimeout, params.amount, params.payment_order_id]);

  useEffect(() => {
    mountedRef.current = true;
    void pollForConfirmation();

    return () => {
      mountedRef.current = false;
      stopTimeout();
    };
  }, [pollForConfirmation, stopTimeout]);

  const handleRetry = useCallback(() => {
    verifyStartedRef.current = false;
    void pollForConfirmation();
  }, [pollForConfirmation]);

  const handleBackToWallet = useCallback(() => {
    goToWallet(phase === "success" ? "success" : "failure", callbackReason);
  }, [callbackReason, goToWallet, phase]);

  const statusTone = phase === "success" ? "success" : phase === "failure" || phase === "error" || phase === "timeout" ? "danger" : "info";

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.shell}>
          <GlassCard style={s.heroCard} padded={true} variant="accent">
            <View style={s.heroTopRow}>
              <StatusPill label={phase === "pending" ? "Processing" : phase} tone={statusTone as any} />
              <Text style={s.stepCount}>{attemptCount > 0 ? `Attempt ${attemptCount + 1}` : "Live sync"}</Text>
            </View>

            <Text style={s.heroTitle}>{title}</Text>
            <Text style={s.heroSubtitle}>{subtitle}</Text>

            <View style={s.loaderRow}>
              {(isChecking || isLoading) ? <ActivityIndicator color={colors.blue} /> : null}
              <Text style={s.loaderText}>{phase === "success" ? "Wallet data updated" : phase === "failure" ? "Payment failed" : "Reading wallet data from database"}</Text>
            </View>

            <View style={s.metaRow}>
              <MetaChip label="Txn" value={merchantTransactionId || "pending"} />
              <MetaChip label="PayU" value={providerPaymentId || "n/a"} />
            </View>
          </GlassCard>

          <GlassCard style={s.snapshotCard} padded={true} variant="elevated">
            <View style={s.snapshotHeader}>
              <Text style={s.snapshotTitle}>Live wallet snapshot</Text>
              <Text style={s.snapshotSubtitle}>Fresh from backend wallet tables</Text>
            </View>
            <View style={s.snapshotBalanceRow}>
              <Text style={s.snapshotBalanceLabel}>Balance</Text>
              <Text style={s.snapshotBalanceValue}>{balance?.balanceFormatted || "₹--"}</Text>
            </View>
            <View style={s.snapshotTxWrap}>
              {transactions.slice(0, 3).map((txn) => (
                <View key={txn.id} style={s.snapshotTxnRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.snapshotTxnTitle} numberOfLines={1}>{txn.description}</Text>
                    <Text style={s.snapshotTxnMeta} numberOfLines={1}>{new Date(txn.createdAt).toLocaleString("en-IN")}</Text>
                  </View>
                  <Text style={[s.snapshotTxnAmount, txn.signedAmountMinor >= 0 ? s.snapshotCredit : s.snapshotDebit]}>
                    {txn.signedAmountFormatted}
                  </Text>
                </View>
              ))}
              {transactions.length === 0 && !isLoading && (
                <Text style={s.snapshotEmpty}>No wallet transactions found yet.</Text>
              )}
            </View>
          </GlassCard>

          {(phase === "pending" || phase === "booting") && (
            <GlassCard style={s.noticeCard} padded={true} variant="elevated">
              <View style={s.noticeRow}>
                <LexusIcon name="ShieldCheck" color={colors.blue} size={18} />
                <Text style={s.noticeText}>We verify once, then refresh the latest balance and ledger rows from the backend.</Text>
              </View>
            </GlassCard>
          )}

          {phase === "success" && (
            <GlassCard style={s.successCard} padded={true} variant="elevated">
              <View style={s.noticeRow}>
                <LexusIcon name="CheckCircle2" color={colors.green} size={18} />
                <Text style={s.successText}>Payment verified. Your Wallet screen will reopen with the latest balance and transaction.</Text>
              </View>
            </GlassCard>
          )}

          {(phase === "failure" || phase === "timeout" || phase === "error") && (
            <GlassCard style={s.errorCard} padded={true} variant="elevated">
              <View style={s.noticeRow}>
                <LexusIcon name="AlertCircle" color={colors.red} size={18} />
                <Text style={s.errorText}>{subtitle}</Text>
              </View>
            </GlassCard>
          )}

          <View style={s.actionsRow}>
            <PillButton
              title={phase === "pending" && isChecking ? "Verifying..." : "Back to Wallet"}
              onPress={handleBackToWallet}
              variant="primary"
              disabled={isChecking && phase === "pending"}
              style={s.actionButton}
            />
            {(phase === "failure" || phase === "error") && (
              <PillButton
                title="Retry sync"
                onPress={handleRetry}
                variant="secondary"
                disabled={isChecking}
                style={s.actionButton}
              />
            )}
          </View>

          {snack && (
            <View style={s.snackWrap}>
              <GlassCard style={s.snackCard} padded={true} variant="elevated">
                <View style={s.noticeRow}>
                  <LexusIcon name="Sparkles" color={colors.blue} size={16} />
                  <Text style={s.snackText}>{snack}</Text>
                </View>
              </GlassCard>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaChip}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useLexusTheme>["colors"], isDark: boolean, plan: string) {
  const isPrestige = plan === "prestige";

  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    scroll: {
      flexGrow: 1,
      paddingHorizontal: 16,
      paddingVertical: 20,
    },
    shell: {
      flex: 1,
      justifyContent: "center",
      gap: 14,
      maxWidth: 720,
      alignSelf: "center",
      width: "100%",
    },
    heroCard: {
      backgroundColor: isPrestige ? (isDark ? "rgba(216,180,254,0.08)" : "rgba(216,180,254,0.12)") : isDark ? "#060f22" : "#0d1f53",
      borderColor: isPrestige ? (isDark ? "rgba(216,180,254,0.22)" : "transparent") : "rgba(255,255,255,0.12)",
    },
    heroTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    stepCount: {
      color: colors.textMuted,
      fontSize: 12,
      fontFamily: LEXUS_FONTS.bodySemiBold,
    },
    heroTitle: {
      color: colors.text,
      fontSize: 30,
      fontFamily: LEXUS_FONTS.display,
      marginBottom: 8,
    },
    heroSubtitle: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: LEXUS_FONTS.body,
    },
    loaderRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginTop: 18,
    },
    loaderText: {
      color: colors.textMuted,
      fontSize: 13,
      fontFamily: LEXUS_FONTS.bodySemiBold,
      flex: 1,
    },
    metaRow: {
      flexDirection: "row",
      gap: 10,
      marginTop: 18,
      flexWrap: "wrap",
    },
    noticeCard: {
      backgroundColor: isDark ? "rgba(79,140,255,0.08)" : "rgba(79,140,255,0.06)",
      borderColor: colors.border,
    },
    noticeRow: {
      flexDirection: "row",
      gap: 10,
      alignItems: "flex-start",
    },
    noticeText: {
      color: colors.text,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: LEXUS_FONTS.body,
      flex: 1,
    },
    snapshotCard: {
      backgroundColor: isDark ? "rgba(7,12,24,0.95)" : "rgba(255,255,255,0.9)",
      borderColor: colors.border,
    },
    snapshotHeader: {
      marginBottom: 10,
    },
    snapshotTitle: {
      color: colors.text,
      fontSize: 15,
      fontFamily: LEXUS_FONTS.bodySemiBold,
    },
    snapshotSubtitle: {
      color: colors.textMuted,
      fontSize: 11,
      fontFamily: LEXUS_FONTS.body,
      marginTop: 2,
    },
    snapshotBalanceRow: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    snapshotBalanceLabel: {
      color: colors.textMuted,
      fontSize: 12,
      fontFamily: LEXUS_FONTS.bodySemiBold,
    },
    snapshotBalanceValue: {
      color: colors.text,
      fontSize: 24,
      fontFamily: LEXUS_FONTS.displayMedium,
    },
    snapshotTxWrap: {
      gap: 8,
    },
    snapshotTxnRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.06)",
    },
    snapshotTxnTitle: {
      color: colors.text,
      fontSize: 12,
      fontFamily: LEXUS_FONTS.bodySemiBold,
    },
    snapshotTxnMeta: {
      color: colors.textMuted,
      fontSize: 10,
      fontFamily: LEXUS_FONTS.body,
      marginTop: 1,
    },
    snapshotTxnAmount: {
      fontSize: 12,
      fontFamily: LEXUS_FONTS.bodySemiBold,
    },
    snapshotCredit: { color: colors.green },
    snapshotDebit: { color: colors.red },
    snapshotEmpty: {
      color: colors.textMuted,
      fontSize: 12,
      fontFamily: LEXUS_FONTS.body,
    },
    successCard: {
      backgroundColor: isDark ? "rgba(0,208,132,0.12)" : "rgba(0,208,132,0.1)",
      borderColor: isDark ? "rgba(0,208,132,0.24)" : "rgba(0,208,132,0.2)",
    },
    successText: {
      color: colors.green,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: LEXUS_FONTS.bodySemiBold,
      flex: 1,
    },
    errorCard: {
      backgroundColor: isDark ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.1)",
      borderColor: isDark ? "rgba(239,68,68,0.24)" : "rgba(239,68,68,0.18)",
    },
    errorText: {
      color: colors.red,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: LEXUS_FONTS.bodySemiBold,
      flex: 1,
    },
    actionsRow: {
      flexDirection: "row",
      gap: 10,
      flexWrap: "wrap",
      marginTop: 4,
    },
    actionButton: {
      flexGrow: 1,
      minWidth: 140,
    },
    snackWrap: {
      position: "relative",
      marginTop: 6,
    },
    snackCard: {
      backgroundColor: isDark ? "rgba(6,13,27,0.96)" : "rgba(255,255,255,0.96)",
      borderColor: colors.borderStrong,
    },
    snackText: {
      color: colors.text,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: LEXUS_FONTS.bodySemiBold,
      flex: 1,
    },
  });
}

const styles = StyleSheet.create({
  metaChip: {
    flexGrow: 1,
    minWidth: 150,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.2)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  metaLabel: {
    color: "rgba(232,237,245,0.62)",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    fontFamily: LEXUS_FONTS.bodySemiBold,
    marginBottom: 4,
  },
  metaValue: {
    color: "#fff",
    fontSize: 12,
    fontFamily: LEXUS_FONTS.bodySemiBold,
  },
});