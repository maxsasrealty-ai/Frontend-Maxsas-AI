import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import { Platform } from "react-native";

const PAYU_PENDING_PAYMENT_KEY = "maxsas.payu.pending-payment";

export interface PayUPendingPayment {
  amountPaise: number;
  paymentOrderId?: string;
  merchantTransactionId: string;
  authUser?: {
    id: string;
    email: string;
    fullName: string;
    tenantId: string;
    tenantName?: string;
    createdAt: string;
  };
  email: string;
  phoneNumber: string;
  successUrl: string;
  failureUrl: string;
  initiatedAt: string;
  source: "web" | "native";
}

export interface PayUCallbackParams {
  status?: string | string[];
  txnid?: string | string[];
  mihpayid?: string | string[];
  payment_order_id?: string | string[];
  merchant_txn_id?: string | string[];
  amount?: string | string[];
  error?: string | string[];
  reason?: string | string[];
}

function readSearchValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function normalizeWebOrigin(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function isAbsoluteHttpUrl(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeAbsoluteOrigin(value: string | undefined): string | null {
  if (!isAbsoluteHttpUrl(value)) {
    return null;
  }

  try {
    const url = new URL(value as string);
    if (url.protocol === "http:" && !isLocalhostOrigin(url.origin)) {
      url.protocol = "https:";
    }

    return url.origin;
  } catch {
    return null;
  }
}

function isLocalhostOrigin(value: string): boolean {
  return value.startsWith("http://localhost") || value.startsWith("http://127.0.0.1") || value.startsWith("https://localhost") || value.startsWith("https://127.0.0.1");
}

async function readStorageValue(key: string): Promise<string | null> {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

async function writeStorageValue(key: string, value: string | null): Promise<void> {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    try {
      if (value === null) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, value);
      }
    } catch {
      // Ignore storage failures; payment return can still proceed.
    }

    return;
  }

  try {
    if (value === null) {
      await AsyncStorage.removeItem(key);
    } else {
      await AsyncStorage.setItem(key, value);
    }
  } catch {
    // Ignore storage failures on native.
  }
}

function getSecureWebOrigin(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const origin = window.location.origin;

  if (isLocalhostOrigin(origin)) {
    const configuredLocalReturnUrl = normalizeAbsoluteOrigin(process.env.EXPO_PUBLIC_PAYU_LOCAL_RETURN_URL?.trim());
    if (configuredLocalReturnUrl && isLocalhostOrigin(configuredLocalReturnUrl)) {
      return configuredLocalReturnUrl;
    }

    return origin;
  }

  const configuredPublicUrl = normalizeAbsoluteOrigin(process.env.EXPO_PUBLIC_WEB_APP_URL?.trim());
  if (configuredPublicUrl) {
    return configuredPublicUrl;
  }

  if (origin.startsWith("http://")) {
    return origin.replace("http://", "https://");
  }

  return origin;
}

export function buildPayUReturnUrl(status: "success" | "failure", amountPaise: number): string {
  const query = new URLSearchParams({
    payment: status,
    amount: String(amountPaise),
  });

  if (Platform.OS === "web" && typeof window !== "undefined") {
    const origin = getSecureWebOrigin();
    if (origin) {
      const url = new URL("/payment/payu", origin);
      url.search = query.toString();
      console.info("PayU return URL resolved", {
        status,
        amountPaise,
        origin,
        target: url.toString(),
      });
      return url.toString();
    }
  }

  const nativeUrl = `${Linking.createURL("payment/payu")}?${query.toString()}`;
  console.info("PayU return URL resolved", {
    status,
    amountPaise,
    origin: "native-linking",
    target: nativeUrl,
  });
  return nativeUrl;
}

export async function readPendingPayUPayment(): Promise<PayUPendingPayment | null> {
  const raw = await readStorageValue(PAYU_PENDING_PAYMENT_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as PayUPendingPayment;
  } catch {
    return null;
  }
}

export async function writePendingPayUPayment(payment: PayUPendingPayment): Promise<void> {
  await writeStorageValue(PAYU_PENDING_PAYMENT_KEY, JSON.stringify(payment));
}

export async function clearPendingPayUPayment(): Promise<void> {
  await writeStorageValue(PAYU_PENDING_PAYMENT_KEY, null);
}

export function getCallbackStatus(params: PayUCallbackParams): string | null {
  const status = readSearchValue(params.status).toLowerCase();

  if (!status) {
    return null;
  }

  if (status.includes("success")) {
    return "success";
  }

  if (status.includes("fail") || status.includes("cancel") || status.includes("error")) {
    return "failure";
  }

  return status;
}

export function getCallbackTransactionId(params: PayUCallbackParams): string | null {
  const txnid = readSearchValue(params.txnid) || readSearchValue(params.merchant_txn_id);
  return txnid || null;
}

export function getCallbackProviderPaymentId(params: PayUCallbackParams): string | null {
  const paymentId = readSearchValue(params.mihpayid) || readSearchValue(params.payment_order_id);
  return paymentId || null;
}

export function getCallbackReason(params: PayUCallbackParams): string | null {
  const message = readSearchValue(params.reason) || readSearchValue(params.error);
  return message || null;
}