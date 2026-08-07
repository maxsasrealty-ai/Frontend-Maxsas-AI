import { ApiEnvelope } from "../types";

/**
 * ✅ FRONTEND IMPLEMENTATION COMPLETE
 *
 * This file documents what frontend has implemented for Wallet & Payment flows.
 * Backend team: Implement the 3 required endpoints below to make wallet fully functional.
 */

// ============================================================================
// WALLET BALANCE ENDPOINT
// ============================================================================

/**
 * GET /api/payment/balance
 *
 * Frontend calls this when:
 * 1. User opens Wallet screen (via useWallet hook's useEffect)
 * 2. User completes a top-up (callback screen polls)
 * 3. User clicks refresh button on wallet screen
 *
 * Frontend sends headers:
 * - Authorization: Bearer <token> (from auth context)
 * - x-tenant-id: <tenantId> (from auth context)
 *
 * Backend must:
 * - Validate token and tenant ID
 * - Return balance for that tenant ONLY
 * - Never expose balance from other tenants
 */
export interface WalletBalanceEndpoint {
  request: {
    method: "GET";
    path: "/api/payment/balance";
    headers: {
      Authorization: "Bearer <token>";
      "x-tenant-id": "<tenantId>";
    };
  };
  response: ApiEnvelope<{
    tenantId: string;
    balancePaise: number; // e.g., 500000 = ₹5000
    balanceFormatted: string; // e.g., "₹5,000.00"
  }>;
}

// ============================================================================
// WALLET TRANSACTIONS ENDPOINT
// ============================================================================

/**
 * GET /api/payment/transactions?page=1&pageSize=20
 *
 * Frontend calls this when:
 * 1. User opens Wallet screen (via useWallet hook's useEffect)
 * 2. User completes a top-up (callback screen polls)
 * 3. User scrolls to bottom (calls loadMoreTransactions)
 * 4. User clicks refresh button
 *
 * Frontend sends headers:
 * - Authorization: Bearer <token>
 * - x-tenant-id: <tenantId>
 *
 * Query params:
 * - page: number (1-based)
 * - pageSize: number (usually 20)
 *
 * Backend must:
 * - Validate token and tenant ID
 * - Return transactions for that tenant ONLY
 * - Support pagination
 * - Return transactions in reverse chronological order (newest first)
 *
 * IMPORTANT: For payment matching after callback, backend must populate:
 * - providerOrderId: Merchant transaction ID (frontend's txnid sent to PayU)
 * - providerPaymentId: PayU order ID (mihpayid from PayU response)
 *
 * Frontend callback screen matches using: providerOrderId OR providerPaymentId OR amount
 */
export interface WalletTransactionsEndpoint {
  request: {
    method: "GET";
    path: "/api/payment/transactions";
    queryParams: {
      page: number;
      pageSize: number;
    };
    headers: {
      Authorization: "Bearer <token>";
      "x-tenant-id": "<tenantId>";
    };
  };
  response: ApiEnvelope<{
    items: Array<{
      id: string;
      tenantId: string;
      type: "credit" | "debit";
      amountPaise: number;
      amountFormatted: string;
      description: string;
      provider: string | null; // "payu", "razorpay", "internal", etc.
      providerOrderId: string | null; // IMPORTANT: Merchant txn ID for callback matching
      providerPaymentId: string | null; // IMPORTANT: PayU order ID for callback matching
      status: "pending" | "completed" | "failed";
      createdAt: string; // ISO 8601
    }>;
    pagination: {
      page: number;
      pageSize: number;
      totalItems: number;
      totalPages: number;
    };
  }>;
}

// ============================================================================
// PAYMENT VERIFICATION ENDPOINT (CALLED AFTER PAYU CALLBACK)
// ============================================================================

/**
 * POST /api/payments/{paymentOrderId}/verify-redirect
 *
 * Frontend calls this when:
 * User is redirected back from PayU to /payment/payu?txnid=X&mihpayid=Y&status=success
 *
 * Frontend sends headers:
 * - Authorization: Bearer <token>
 * - x-tenant-id: <tenantId>
 * - Content-Type: application/json
 *
 * Path params:
 * - paymentOrderId: ID returned in /api/payments/payu/initiate response
 *
 * Frontend flow:
 * 1. PayU redirects to /payment/payu with callback params
 * 2. Frontend extracts: txnid, mihpayid, status from query params
 * 3. Frontend POSTs to this endpoint with the extracted data
 * 4. Backend validates and updates ledger
 * 5. Frontend refreshes balance/transactions
 * 6. Frontend navigates back to wallet
 *
 * Backend must:
 * - Validate token and tenant ID
 * - Validate that paymentOrderId belongs to this tenant
 * - For status="success":
 *   a. Call PayU API to verify payment (double-check it really succeeded)
 *   b. Update wallet ledger: credit balance
 *   c. Mark transaction as "completed"
 * - For status="failure":
 *   a. Mark transaction as "failed"
 *   b. Do NOT credit balance
 * - Return updated balance so frontend can reflect immediately
 */
export interface PaymentVerifyRedirectEndpoint {
  request: {
    method: "POST";
    path: "/api/payments/{paymentOrderId}/verify-redirect";
    pathParams: {
      paymentOrderId: string;
    };
    headers: {
      Authorization: "Bearer <token>";
      "x-tenant-id": "<tenantId>";
      "Content-Type": "application/json";
    };
    body: {
      merchantTransactionId: string; // Frontend's txnid sent to PayU
      payuTransactionId: string; // mihpayid from PayU callback
      status: "success" | "failure";
    };
  };
  response: ApiEnvelope<{
    paymentOrderId: string;
    merchantTransactionId: string;
    status: "completed" | "failed";
    balanceUpdated: boolean;
    newBalancePaise: number; // For frontend to show immediately
    newBalanceFormatted: string;
  }>;
}

// ============================================================================
// COMPLETE EXAMPLE: User Top-Up Flow
// ============================================================================

/**
 * Step-by-step of what happens when user clicks "₹500" quick top-up:
 *
 * 1. Frontend: useWallet.topUp(50000) called
 * 2. Frontend → Backend: POST /api/payments/payu/initiate
 *    Request:
 *    {
 *      amount: 50000,
 *      description: "Wallet top-up",
 *      email: "user@example.com",
 *      phoneNumber: "9876543210",
 *      userId: "user-123",
 *      successUrl: "<backend-controlled URL>" ,
 *      failureUrl: "<backend-controlled URL>"
 *    }
 *    Response:
 *    {
 *      success: true,
 *      data: {
 *        paymentOrderId: "order-uuid-1234",
 *        merchantTransactionId: "txn-uuid-5678",
 *        payuUrl: "https://cbjs.payu.in/payment",
 *        key: "D0Fjcc",
 *        hash: "computed-hash-value",
 *        txnid: "txn-uuid-5678",
 *        amount: "500.00",
 *        productinfo: "Wallet top-up",
 *        firstname: "John",
 *        email: "user@example.com",
 *        phone: "9876543210",
 *        surl: "<backend's success callback URL>",
 *        furl: "<backend's failure callback URL>",
 *        service_provider: "payu_paisa"
 *      }
 *    }
 *
 * 3. Frontend: Builds hidden form and submits to PayU
 *    Form fields: key, txnid, amount, hash, surl, furl, etc.
 *    Action: https://cbjs.payu.in/payment (POST)
 *
 * 4. PayU: Processes payment
 *    User enters card/UPI details, authorizes
 *
 * 5. PayU: Redirects browser to surl (success callback URL from backend)
 *    URL structure: https://app.example.com/payment/payu?txnid=txn-uuid-5678&mihpayid=payu-order-xyz&status=success
 *
 * 6. Frontend: app/payment/payu.tsx loads
 *    - Extracts query params: txnid, mihpayid, status
 *    - Saves pending payment data to AsyncStorage
 *    - Calls: POST /api/payments/{paymentOrderId}/verify-redirect
 *    - Polls: GET /api/payment/balance & /api/payment/transactions every 3 seconds
 *    - Shows: Success/failure message
 *
 * 7. Frontend → Backend: POST /api/payments/order-uuid-1234/verify-redirect
 *    Request body:
 *    {
 *      merchantTransactionId: "txn-uuid-5678",
 *      payuTransactionId: "payu-order-xyz",
 *      status: "success"
 *    }
 *
 * 8. Backend: Validates and updates ledger
 *    - Validates merchant transaction exists
 *    - Calls PayU API: verify the payment really succeeded
 *    - Credits wallet: balancePaise += 50000
 *    - Creates ledger entry with status="completed"
 *    - Returns: newBalancePaise, newBalanceFormatted
 *
 * 9. Frontend: Receives verify-redirect response, polls balance again
 *    GET /api/payment/balance → Shows updated balance
 *    GET /api/payment/transactions → Shows new transaction in list
 *
 * 10. Frontend: Shows success, navigates to Wallet
 *     User sees: Balance updated, new transaction visible
 *
 * ============================================================================
 * KEY BACKEND RESPONSIBILITIES:
 * ============================================================================
 * 1. Implement all 3 endpoints above
 * 2. All endpoints MUST check x-tenant-id header and return data for that tenant only
 * 3. All endpoints MUST validate Authorization bearer token
 * 4. For verify-redirect: Call PayU API to double-check payment before crediting wallet
 * 5. For verify-redirect: Return newBalance so frontend can show immediately
 * 6. Ensure transaction records have providerOrderId and providerPaymentId populated
 *    so frontend can match them after callback
 */
