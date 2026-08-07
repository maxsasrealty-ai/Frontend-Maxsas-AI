export interface CreateOrderRequest {
  amountPaise: number; // e.g. 100000 = ₹1000
}

export interface CreateOrderResponse {
  orderId: string;
  amountPaise: number;
  mock: boolean; // true when running without real Razorpay keys
}

export interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  message?: string;
}

export interface WalletBalanceResponse {
  tenantId: string;
  balancePaise: number;
  balanceFormatted: string; // e.g. "₹1,000.00"
}

export type WalletTransactionType = "credit" | "debit";
export type WalletTransactionStatus = "pending" | "completed" | "failed";

export interface WalletTransactionItem {
  id: string;
  tenantId: string;
  type: WalletTransactionType;
  amountPaise: number;
  amountFormatted: string; // e.g. "₹500.00"
  description: string;
  provider: string | null;
  providerOrderId: string | null;
  providerPaymentId: string | null;
  status: WalletTransactionStatus;
  createdAt: string;
}

export interface WalletTransactionsResponse {
  items: WalletTransactionItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}
