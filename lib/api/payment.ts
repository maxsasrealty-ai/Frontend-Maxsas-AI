import {
    ApiEnvelope,
    CreateOrderRequest,
    CreateOrderResponse,
    VerifyPaymentRequest,
    VerifyPaymentResponse,
} from "../../shared/contracts";
import { apiClient } from "./client";

export type WalletTransactionStatus = "pending" | "succeeded" | "failed" | "reversed" | "refunded";

export interface WalletSummaryResponse {
  tenantId?: string;
  balanceMinor: number;
  currentBalanceMinor: number;
  pendingTotalMinor: number;
  currencyCode: string;
  balanceFormatted: string;
  pendingTotalFormatted: string;
}

export interface WalletTransactionItem {
  id: string;
  createdAt: string;
  amountMinor: number;
  signedAmountMinor: number;
  type?: "credit" | "debit";
  entryType?: string | null;
  currency: string;
  status: WalletTransactionStatus;
  provider: string | null;
  providerOrderId: string | null;
  providerPaymentId: string | null;
  referenceId?: string | null;
  externalTxnId?: string | null;
  paymentOrderId?: string | null;
  paymentGatewayReference?: string | null;
  idempotencyKey: string | null;
  source: string | null;
  transactionSource: string | null;
  description: string;
  amountFormatted: string;
  signedAmountFormatted: string;
  isPending: boolean;
  tenantId?: string;
}

export interface WalletTransactionsResponse {
  items: WalletTransactionItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface VerifyPayURedirectResponse {
  ok?: boolean;
  success?: boolean;
  finalized?: boolean;
  orderStatus?: string;
  status?: string;
  message?: string;
  paymentOrderId?: string;
  merchantTransactionId?: string;
  balanceUpdated?: boolean;
  newBalancePaise?: number;
  newBalanceFormatted?: string;
  walletSummary?: Partial<WalletSummaryResponse>;
  balanceMinor?: number;
  pendingTotalMinor?: number;
  currencyCode?: string;
}

export interface PayUInitiateRequest {
  amount: number;
  description: string;
  email: string;
  phoneNumber: string;
  userId: string;
  successUrl: string;
  failureUrl: string;
}

export interface PayUInitiateResponse {
  paymentOrderId: string;
  merchantTransactionId: string;
  payuKey: string;
  hash: string;
  amount: number;
  email: string;
  phoneNumber: string;
  description: string;
  payuMode: string;
  payuUrl: string;
  successUrl: string;
  failureUrl: string;
}

function formatMinorAmount(amountMinor: number, currencyCode = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currencyCode,
    currencyDisplay: "symbol",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountMinor / 100);
}

function normalizeWalletSummary(raw: unknown): WalletSummaryResponse {
  const data = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const balanceMinor = Number(data.balanceMinor ?? data.currentBalanceMinor ?? data.balancePaise ?? data.balance ?? 0);
  const currentBalanceMinor = Number(data.currentBalanceMinor ?? data.balanceMinor ?? data.balancePaise ?? balanceMinor);
  const pendingTotalMinor = Number(data.pendingTotalMinor ?? data.pendingAmountMinor ?? data.pendingTotalPaise ?? 0);
  const currencyCode = String(data.currencyCode ?? data.currency ?? "INR");

  return {
    tenantId: typeof data.tenantId === "string" ? data.tenantId : undefined,
    balanceMinor,
    currentBalanceMinor,
    pendingTotalMinor,
    currencyCode,
    balanceFormatted: formatMinorAmount(currentBalanceMinor, currencyCode),
    pendingTotalFormatted: formatMinorAmount(pendingTotalMinor, currencyCode),
  };
}

function normalizeTransactionStatus(value: unknown): WalletTransactionStatus {
  const status = String(value ?? "").toLowerCase();

  if (status === "completed" || status === "success" || status === "succeeded") {
    return "succeeded";
  }

  if (status === "reversed" || status === "refunded") {
    return status;
  }

  if (status === "failed") {
    return "failed";
  }

  return "pending";
}

function normalizeTransactionItem(raw: unknown): WalletTransactionItem {
  const data = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const currency = String(data.currency ?? data.currencyCode ?? "INR");
  const signedAmountMinor = Number(data.signedAmountMinor ?? data.signedAmountPaise ?? data.amountMinor ?? data.amountPaise ?? 0);
  const amountMinor = Math.abs(Number(data.amountMinor ?? data.amountPaise ?? signedAmountMinor));
  const normalizedStatus = normalizeTransactionStatus(data.status ?? data.paymentStatus);
  const provider = typeof data.provider === "string"
    ? data.provider
    : typeof data.transactionSource === "string"
      ? data.transactionSource
      : typeof data.referenceType === "string"
        ? data.referenceType
        : typeof data.entryType === "string"
          ? data.entryType
          : null;
  const providerOrderId = typeof data.providerOrderId === "string"
    ? data.providerOrderId
    : typeof data.paymentOrderId === "string"
      ? data.paymentOrderId
      : typeof data.referenceId === "string"
        ? data.referenceId
        : null;
  const providerPaymentId = typeof data.providerPaymentId === "string"
    ? data.providerPaymentId
    : typeof data.externalTxnId === "string"
      ? data.externalTxnId
      : typeof data.payuTxnId === "string"
        ? data.payuTxnId
        : null;
  const referenceId = typeof data.referenceId === "string" ? data.referenceId : null;
  const externalTxnId = typeof data.externalTxnId === "string" ? data.externalTxnId : null;
  const paymentOrderId = typeof data.paymentOrderId === "string" ? data.paymentOrderId : null;
  const paymentGatewayReference = typeof data.paymentGatewayReference === "string"
    ? data.paymentGatewayReference
    : externalTxnId || referenceId || paymentOrderId;
  const idempotencyKey = typeof data.idempotencyKey === "string" ? data.idempotencyKey : null;
  const source = typeof data.source === "string"
    ? data.source
    : typeof data.referenceType === "string"
      ? data.referenceType
      : null;
  const transactionSource = typeof data.transactionSource === "string" ? data.transactionSource : source;
  const type = data.type === "debit" ? "debit" : "credit";
  const entryType = typeof data.entryType === "string" ? data.entryType : null;
  const description = typeof data.description === "string" && data.description.trim().length > 0 ? data.description : "Wallet transaction";
  const createdAt = typeof data.createdAt === "string" ? data.createdAt : new Date().toISOString();
  const resolvedSignedAmountMinor = Number.isFinite(signedAmountMinor) ? signedAmountMinor : amountMinor;

  return {
    id: String(data.id ?? `${provider ?? "txn"}-${createdAt}`),
    createdAt,
    amountMinor,
    signedAmountMinor: resolvedSignedAmountMinor,
    type,
    entryType,
    currency,
    status: normalizedStatus,
    provider,
    providerOrderId,
    providerPaymentId,
    referenceId,
    externalTxnId,
    paymentOrderId,
    paymentGatewayReference,
    idempotencyKey,
    source,
    transactionSource,
    description,
    amountFormatted: formatMinorAmount(amountMinor, currency),
    signedAmountFormatted: formatMinorAmount(Math.abs(resolvedSignedAmountMinor), currency),
    isPending: normalizedStatus === "pending",
    tenantId: typeof data.tenantId === "string" ? data.tenantId : undefined,
  };
}

function normalizeTransactionsResponse(raw: unknown): WalletTransactionsResponse {
  const data = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const itemsRaw = Array.isArray(data.items)
    ? data.items
    : Array.isArray(data.transactions)
      ? data.transactions
      : Array.isArray(raw)
        ? raw
        : [];
  const pagination = data.pagination && typeof data.pagination === "object" ? (data.pagination as Record<string, unknown>) : {};
  const total = Number(data.total ?? data.totalItems ?? pagination.totalItems ?? itemsRaw.length);
  const page = Number(data.page ?? pagination.page ?? 1);
  const limit = Number(data.limit ?? data.pageSize ?? pagination.pageSize ?? (itemsRaw.length > 0 ? itemsRaw.length : 20));
  const totalPages = Number(data.totalPages ?? pagination.totalPages ?? (limit > 0 ? Math.ceil(total / limit) : 1));

  return {
    items: itemsRaw.map((item) => normalizeTransactionItem(item)),
    total,
    page,
    limit,
    totalPages,
  };
}

async function callWalletEndpoint<TResponse>(primaryPath: string, fallbackPath: string): Promise<ApiEnvelope<TResponse>> {
  const primary = await apiClient.get<TResponse>(primaryPath);

  if (primary.success) {
    return primary;
  }

  const fallbackCode = primary.error?.code ?? "";
  if (fallbackCode === "HTTP_404" || fallbackCode === "HTTP_405") {
    return apiClient.get<TResponse>(fallbackPath);
  }

  return primary;
}

export interface DevMockTopUpRequest {
  amount: number;
  userId?: string;
}

export interface DevMockTopUpResponse {
  tenantId: string;
  walletAccountId: string;
  amountPaise: number;
  amountFormatted: string;
  newBalancePaise: number;
  newBalanceFormatted: string;
  ledgerEntryId: string;
}

export async function createOrder(
  amountPaise: number
): Promise<ApiEnvelope<CreateOrderResponse>> {
  const body: CreateOrderRequest = { amountPaise };
  return apiClient.post<CreateOrderRequest, CreateOrderResponse>(
    "/payment/create-order",
    body
  );
}

export async function verifyPayment(
  razorpay_order_id: string,
  razorpay_payment_id: string,
  razorpay_signature: string
): Promise<ApiEnvelope<VerifyPaymentResponse>> {
  const body: VerifyPaymentRequest = {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  };
  return apiClient.post<VerifyPaymentRequest, VerifyPaymentResponse>("/payment/verify", body);
}

export async function fetchWalletSummary(): Promise<ApiEnvelope<WalletSummaryResponse>> {
  const response = await callWalletEndpoint<WalletSummaryResponse>("/wallet/summary", "/payment/balance");

  if (!response.success || !response.data) {
    return response;
  }

  return {
    ...response,
    data: normalizeWalletSummary(response.data),
  };
}

export async function fetchWalletBalance(): Promise<ApiEnvelope<WalletSummaryResponse>> {
  return fetchWalletSummary();
}

export async function fetchWalletTransactions(
  page = 1,
  limit = 20
): Promise<ApiEnvelope<WalletTransactionsResponse>> {
  const response = await callWalletEndpoint<WalletTransactionsResponse>(`/wallet/transactions?page=${page}&limit=${limit}`, `/payment/transactions?page=${page}&pageSize=${limit}`);

  if (!response.success || !response.data) {
    return response;
  }

  return {
    ...response,
    data: normalizeTransactionsResponse(response.data),
  };
}

export async function verifyPayURedirect(
  paymentOrderId: string,
  payload: Record<string, string>
): Promise<ApiEnvelope<VerifyPayURedirectResponse>> {
  const endpoints = [
    `/payments/${encodeURIComponent(paymentOrderId)}/verify-redirect`,
    `/payments/payu/${encodeURIComponent(paymentOrderId)}/verify-redirect`,
    "/payments/verify-redirect",
  ];

  let lastResponse: ApiEnvelope<VerifyPayURedirectResponse> | null = null;

  for (const endpoint of endpoints) {
    const response = await apiClient.post<Record<string, string>, VerifyPayURedirectResponse>(endpoint, {
      ...payload,
      paymentOrderId,
    });

    if (response.success) {
      return response;
    }

    lastResponse = response;

    const errorCode = response.error?.code ?? "";
    if (errorCode !== "HTTP_404" && errorCode !== "HTTP_405") {
      break;
    }
  }

  return (
    lastResponse ?? {
      success: false,
      error: {
        code: "VERIFY_FAILED",
        message: "Payment verification failed.",
      },
    }
  );
}

export async function initiatePayUCheckout(
  payload: PayUInitiateRequest
): Promise<ApiEnvelope<PayUInitiateResponse>> {
  return apiClient.post<PayUInitiateRequest, PayUInitiateResponse>(
    "/payments/payu/initiate",
    payload
  );
}

export async function simulatePayUSuccessTopUp(
  payload: DevMockTopUpRequest
): Promise<ApiEnvelope<DevMockTopUpResponse>> {
  return apiClient.post<DevMockTopUpRequest, DevMockTopUpResponse>(
    "/payments/payu/mock-success",
    payload
  );
}
