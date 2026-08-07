import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import {
  fetchWalletBalance,
  fetchWalletTransactions,
  initiatePayUCheckout,
  simulatePayUSuccessTopUp,
  WalletSummaryResponse,
  WalletTransactionItem,
} from "../lib/api/payment";
import { getCurrentAuthUser } from "../lib/auth/session";
import { buildPayUReturnUrl, writePendingPayUPayment } from "../lib/payments/payuFlow";

export interface UseWalletOptions {
  autoRefresh?: boolean;
}

export interface UseWalletReturn {
  balance: WalletSummaryResponse | null;
  summary: WalletSummaryResponse | null;
  transactions: WalletTransactionItem[];
  totalTransactions: number;
  isLoading: boolean;
  isTopUpLoading: boolean;
  error: string | null;
  topUpResult: { success: boolean; mock: boolean; amountFormatted: string; orderId?: string } | null;
  refresh: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  topUp: (amountPaise: number) => Promise<boolean>;
  simulateTopUpSuccess: (amountPaise: number) => Promise<boolean>;
  loadMoreTransactions: () => Promise<void>;
}

export function useWallet(options: UseWalletOptions = {}): UseWalletReturn {
  const { autoRefresh = true } = options;
  const [balance, setBalance] = useState<WalletSummaryResponse | null>(null);
  const [transactions, setTransactions] = useState<WalletTransactionItem[]>([]);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isTopUpLoading, setIsTopUpLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [topUpResult, setTopUpResult] = useState<UseWalletReturn["topUpResult"]>(null);
  const pageRef = useRef(1);
  const PAGE_SIZE = 20;

  const submitPayUHostedForm = useCallback((data: {
    payuUrl: string;
    payuKey: string;
    merchantTransactionId: string;
    amount: number;
    hash: string;
    email: string;
    phoneNumber: string;
    successUrl: string;
    failureUrl: string;
  }) => {
    if (Platform.OS !== "web" || typeof document === "undefined") {
      return;
    }

    const amountInRupees = (data.amount / 100).toFixed(2);
    const firstName = (data.email.split("@")[0] || "user").slice(0, 60);

    const payload = {
      key: data.payuKey,
      txnid: data.merchantTransactionId,
      amount: amountInRupees,
      productinfo: "wallet_topup",
      firstname: firstName,
      email: data.email,
      phone: data.phoneNumber,
      hash: data.hash,
      surl: data.successUrl,
      furl: data.failureUrl,
      service_provider: "payu_paisa",
    };

    if (__DEV__) {
      console.debug("PayU form action", data.payuUrl);
      console.debug("PayU payload", payload);
    }

    const form = document.createElement("form");
    form.method = "POST";
    form.action = data.payuUrl;
    form.style.display = "none";

    Object.entries(payload).forEach(([name, value]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = value;
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  }, []);

  const normalizeHostedCallbackUrl = useCallback((url: string): string => {
    if (!url) {
      return url;
    }

    try {
      const parsed = new URL(url);
      const isLocalhost = ["localhost", "127.0.0.1"].includes(parsed.hostname);
      if (parsed.protocol === "http:" && !isLocalhost) {
        parsed.protocol = "https:";
      }
      return parsed.toString();
    } catch {
      return url;
    }
  }, []);

  const openPayUCheckoutNative = useCallback((data: {
    payuUrl: string;
    payuKey: string;
    merchantTransactionId: string;
    amount: number;
    hash: string;
    email: string;
    phoneNumber: string;
    successUrl: string;
    failureUrl: string;
  }) => {
    const params = new URLSearchParams({
      payuUrl: data.payuUrl,
      payuKey: data.payuKey,
      merchantTransactionId: data.merchantTransactionId,
      amount: String(data.amount),
      hash: data.hash,
      email: data.email,
      phoneNumber: data.phoneNumber,
      successUrl: data.successUrl,
      failureUrl: data.failureUrl,
    });

    router.push(`/(protected)/lexus/wallet/checkout?${params.toString()}` as any);
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [balRes, txRes] = await Promise.all([
        fetchWalletBalance(),
        fetchWalletTransactions(1, PAGE_SIZE),
      ]);
      let nextError: string | null = null;

      if (balRes.success) {
        setBalance(balRes.data);
      } else {
        nextError = balRes.error?.message ?? "Failed to load balance";
      }

      if (txRes.success) {
        setTransactions(txRes.data.items);
        setTotalTransactions(txRes.data.total);
        pageRef.current = 1;
      } else {
        nextError = nextError ?? txRes.error?.message ?? "Failed to load transactions";
      }

      setError(nextError);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshBalance = refresh;

  const loadMoreTransactions = useCallback(async () => {
    const nextPage = pageRef.current + 1;
    try {
      const res = await fetchWalletTransactions(nextPage, PAGE_SIZE);
      if (res.success) {
        setTransactions((prev) => [...prev, ...res.data.items]);
        setTotalTransactions(res.data.total);
        pageRef.current = nextPage;
      }
    } catch {
      // Silent fail — user can retry
    }
  }, []);

  const topUp = useCallback(async (amountPaise: number): Promise<boolean> => {
    setIsTopUpLoading(true);
    setTopUpResult(null);
    setError(null);
    try {
      if (amountPaise < 100) {
        setError("Minimum top-up amount is ₹1.");
        return false;
      }

      const authUser = await getCurrentAuthUser();
      if (!authUser?.tenantId) {
        setError("Tenant session is not ready. Please sign in again.");
        return false;
      }

      const email = authUser.email || "demo.user@example.com";
      const phoneNumber = "9876543210";
      const userId = authUser.id || `tenant-user-${authUser.tenantId}`;
      const successUrl = buildPayUReturnUrl("success", amountPaise);
      const failureUrl = buildPayUReturnUrl("failure", amountPaise);

      const res = await initiatePayUCheckout({
        amount: amountPaise,
        description: "Wallet top-up",
        email,
        phoneNumber,
        userId,
        successUrl,
        failureUrl,
      });

      if (!res.success) {
        setError(res.error?.message ?? "Failed to initiate PayU checkout");
        return false;
      }

      // Prefer backend-provided URLs. Keep frontend-built URLs as fallback only.
      const checkoutData = res.data;
      const successUrlToUse = normalizeHostedCallbackUrl(checkoutData.successUrl ?? successUrl);
      const failureUrlToUse = normalizeHostedCallbackUrl(checkoutData.failureUrl ?? failureUrl);

      await writePendingPayUPayment({
        amountPaise,
        paymentOrderId: checkoutData.paymentOrderId,
        merchantTransactionId: checkoutData.merchantTransactionId,
        authUser: {
          id: authUser.id,
          email: authUser.email,
          fullName: authUser.fullName,
          tenantId: authUser.tenantId,
          tenantName: authUser.tenantName,
          createdAt: authUser.createdAt,
        },
        email,
        phoneNumber,
        successUrl: successUrlToUse,
        failureUrl: failureUrlToUse,
        initiatedAt: new Date().toISOString(),
        source: Platform.OS === "web" ? "web" : "native",
      });

      setTopUpResult({
        success: true,
        mock: false,
        orderId: res.data.paymentOrderId,
        amountFormatted: `₹${(amountPaise / 100).toLocaleString("en-IN")}`,
      });

      // Use backend-returned URLs when submitting the hosted form or opening native checkout.
      const submitData = {
        ...checkoutData,
        successUrl: successUrlToUse,
        failureUrl: failureUrlToUse,
      };

      if (Platform.OS === "web") {
        submitPayUHostedForm(submitData as any);
      } else {
        openPayUCheckoutNative(submitData as any);
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
      return false;
    } finally {
      setIsTopUpLoading(false);
    }
  }, [normalizeHostedCallbackUrl, openPayUCheckoutNative, submitPayUHostedForm]);

  const simulateTopUpSuccess = useCallback(async (amountPaise: number): Promise<boolean> => {
    setIsTopUpLoading(true);
    setTopUpResult(null);
    setError(null);

    try {
      if (amountPaise < 100) {
        setError("Minimum top-up amount is ₹1.");
        return false;
      }

      const authUser = await getCurrentAuthUser();
      const res = await simulatePayUSuccessTopUp({
        amount: amountPaise,
        userId: authUser?.id,
      });

      if (!res.success) {
        setError(res.error?.message ?? "Failed to simulate payment success");
        return false;
      }

      setTopUpResult({
        success: true,
        mock: true,
        amountFormatted: `₹${(amountPaise / 100).toLocaleString("en-IN")}`,
        orderId: res.data.ledgerEntryId,
      });

      await refresh();

      setTransactions((prev) => {
        const syntheticTransaction: WalletTransactionItem = {
          id: `mock-${res.data.ledgerEntryId}`,
          tenantId: authUser?.tenantId ?? "mock-tenant",
          createdAt: new Date().toISOString(),
          amountMinor: amountPaise,
          signedAmountMinor: amountPaise,
          currency: "INR",
          status: "succeeded",
          provider: "payu",
          providerOrderId: null,
          providerPaymentId: null,
          idempotencyKey: null,
          source: "mock",
          transactionSource: "mock",
          description: "Wallet top-up (mock)",
          amountFormatted: `₹${(amountPaise / 100).toLocaleString("en-IN")}`,
          signedAmountFormatted: `₹${(amountPaise / 100).toLocaleString("en-IN")}`,
          isPending: false,
        };

        if (prev.some((item) => item.id === syntheticTransaction.id)) {
          return prev;
        }

        return [syntheticTransaction, ...prev];
      });

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Simulation failed");
      return false;
    } finally {
      setIsTopUpLoading(false);
    }
  }, [refresh]);

  useEffect(() => {
    if (!autoRefresh) {
      return;
    }

    void refresh();
  }, [autoRefresh, refresh]);

  return {
    balance,
    summary: balance,
    transactions,
    totalTransactions,
    isLoading,
    isTopUpLoading,
    error,
    topUpResult,
    refresh,
    refreshBalance,
    topUp,
    simulateTopUpSuccess,
    loadMoreTransactions,
  };
}
