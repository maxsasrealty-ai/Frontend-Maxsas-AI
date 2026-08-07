# Payment Flow: Frontend → Backend API Specification

**Date:** May 21, 2026  
**Purpose:** Exact frontend API integration details, endpoints, headers, and polling behavior.

---

## Summary Answers

### Q1: Frontend backend-list endpoint kaunsi call karta hai?

**Endpoints:**
- `GET /api/payment/balance` — Fetch wallet balance
- `GET /api/payment/transactions?page=1&pageSize=20` — Fetch transaction list (paginated)
- `POST /api/payments/payu/initiate` — Initiate PayU checkout
- `POST /api/payments/payu/mock-success` — Dev-only: simulate successful payment

**File:** [lib/api/payment.ts](lib/api/payment.ts)

```ts
export async function fetchWalletBalance(): Promise<ApiEnvelope<WalletBalanceResponse>> {
  return apiClient.get<WalletBalanceResponse>("/payment/balance");
}

export async function fetchWalletTransactions(
  page = 1,
  pageSize = 20
): Promise<ApiEnvelope<WalletTransactionsResponse>> {
  return apiClient.get<WalletTransactionsResponse>(
    `/payment/transactions?page=${page}&pageSize=${pageSize}`
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
```

---

### Q2: Tenant scope frontend se kaise bheja ja raha hai — header x-tenant-id ya query param?

**Answer:** Via HTTP header `x-tenant-id` (not query param).

**File:** [lib/api/client.ts](lib/api/client.ts)

```ts
private async request<TResponse>(
  path: string,
  init: RequestInit
): Promise<ApiEnvelope<TResponse>> {
  const token = await this.resolveToken();
  const tenantId = await this.resolveTenantId();

  response = await fetch(`${this.baseUrl}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(tenantId ? { "x-tenant-id": tenantId } : {}),  // ← HERE
      ...(init.headers || {}),
    },
  });
}
```

**How tenantId is resolved:**

```ts
private async resolveTenantId(): Promise<string | null> {
  if (!this.getTenantId) {
    return null;
  }

  const tenantId = this.getTenantId();
  return tenantId instanceof Promise ? tenantId : tenantId;
}

// Initialization in apiClient:
export const apiClient = new ApiClient({
  baseUrl: defaultApiBaseUrl,
  getTenantId: async () => {
    const tenantId = await getCurrentTenantId();  // From auth session
    return tenantId || defaultTenantId;
  },
  getAuthToken: () => defaultAuthToken,
});
```

**File:** [lib/auth/session.ts](lib/auth/session.ts)

```ts
export function getCurrentTenantIdSync(): string | null {
  return cachedAuthUser?.tenantId ?? null;
}

export async function getCurrentTenantId(): Promise<string | null> {
  await hydrateAuthSession();
  return cachedAuthUser?.tenantId ?? null;
}
```

**Every request includes both headers:**
```
Authorization: Bearer <token>
x-tenant-id: <tenantId>
```

---

### Q3: Kya frontend caching layer use kar raha hai (React Query / SWR / localStorage)?

**Answer:** No external caching library. Uses plain React state (`useState`) in `useWallet` hook.

**Caching behavior:**
- `cache: "no-store"` in all fetch requests (disable HTTP cache)
- State persisted in component via `useState`
- Pending payment persisted in AsyncStorage/localStorage via `writePendingPayUPayment()`
- No SWR, React Query, or TanStack Query

**File:** [hooks/useWallet.ts](hooks/useWallet.ts)

```ts
const [balance, setBalance] = useState<WalletBalanceResponse | null>(null);
const [transactions, setTransactions] = useState<WalletTransactionItem[]>([]);
const [totalTransactions, setTotalTransactions] = useState(0);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [topUpResult, setTopUpResult] = useState<UseWalletReturn["topUpResult"]>(null);
```

Persisted pending payment:
```ts
export interface PayUPendingPayment {
  amountPaise: number;
  merchantTransactionId: string;
  email: string;
  phoneNumber: string;
  successUrl: string;
  failureUrl: string;
  initiatedAt: string;
  source: "web" | "native";
}

await writePendingPayUPayment(payment);  // Stored in AsyncStorage or localStorage
```

---

### Q4: Callback flow ke baad frontend kya karta hai — polling, single fetch, ya rely on websocket/webhook?

**Answer:** Polling. Frontend continuously calls `fetchWalletBalance()` and `fetchWalletTransactions()` until the backend webhook has updated the wallet ledger.

**File:** [app/payment/payu.tsx](app/payment/payu.tsx) — `pollForConfirmation()` function

```ts
const POLL_INTERVAL_MS = 3000;  // Poll every 3 seconds
const POLL_TIMEOUT_MS = 120000; // Max wait: 2 minutes

const pollForConfirmation = useCallback(async () => {
  const currentJob = ++activeJobRef.current;
  const startedAt = Date.now();
  setIsChecking(true);
  setPhase("pending");

  while (mountedRef.current && activeJobRef.current === currentJob) {
    try {
      const [balanceRes, txRes] = await Promise.all([
        fetchWalletBalance(),
        fetchWalletTransactions(1, MAX_TX_FETCH),
      ]);

      if (balanceRes.success && txRes.success) {
        const matchedTxn = txRes.data.items.find((item) => {
          if (item.type !== "credit") return false;

          // Match by provider order ID or payment ID
          if (item.providerOrderId && item.providerOrderId === pendingTxnId) {
            return true;
          }
          if (providerPaymentId && item.providerPaymentId === providerPaymentId) {
            return true;
          }

          // Match by amount + wallet keyword in description
          return item.amountPaise === pendingAmountPaise && 
                 item.description.toLowerCase().includes("wallet");
        });

        if (matchedTxn) {
          // ✅ Webhook has confirmed the credit
          setPhase("success");
          await clearPendingPayUPayment();
          router.replace(buildWalletReturnUrl(successParams));
          return;
        }
      }
    } catch (error) {
      console.warn("PayU confirmation poll failed", error);
    }

    // Check timeout
    if (Date.now() - startedAt >= POLL_TIMEOUT_MS) {
      setPhase("timeout");
      return;
    }

    // Wait before next poll
    await wait(POLL_INTERVAL_MS);
  }
}, []);
```

**Polling expectations:**
1. PayU returns user to `/payment/payu?payment=success&txnid=...&mihpayid=...`
2. Frontend extracts query params
3. Frontend polls **every 3 seconds**
4. Frontend checks if wallet has a matching credit transaction
5. On match: success screen, clear pending data, return to wallet
6. On 2-minute timeout: show "Still waiting" screen with retry button

---

### Q5: Koi console/network error dikhta hai jab wallet list refresh karte ho?

**Answer:** No explicit console errors. Network errors are caught and return standardized `ApiEnvelope` with error code.

**Error handling:** [lib/api/client.ts](lib/api/client.ts)

```ts
catch (error) {
  return {
    success: false,
    error: {
      code: "NETWORK_ERROR",
      message: error instanceof Error ? error.message : "Unable to reach the server.",
    },
  };
}
```

**Fallback error response:**

```ts
const fallbackCode = response.ok ? "INVALID_RESPONSE" : `HTTP_${response.status}`;
const fallbackMessage =
  response.status === 405
    ? "API route exists but does not allow this method. Verify your backend deployment and route mapping."
    : response.ok
      ? "Server returned an unexpected response format."
      : `Request failed with status ${response.status}.`;

return {
  success: false,
  error: {
    code: fallbackCode,
    message: fallbackMessage,
    details: {
      path,
      status: response.status,
      statusText: response.statusText,
      contentType,
      bodyPreview: rawBody.slice(0, 300),
      expectedJson: looksJson,
    },
  },
};
```

**No visible errors means:**
- Network is OK
- Backend returned valid JSON envelope
- Status is 200 OK

**Debug in dev:** Use `__DEV__` logging in useWallet.ts or check Network tab in browser DevTools.

---

## 🛠️ Frontend Developer Instructions

**For Wallet Top-Up Flow (useWallet.ts):**

When `initiatePayUCheckout()` returns backend response data, **use the backend-returned `successUrl` and `failureUrl` directly** — do NOT overwrite them with frontend-built `/payment/payu` URLs. Change `const checkoutData = { ...res.data, successUrl, failureUrl }` to `const checkoutData = res.data` so that the PayU form posts `surl` and `furl` fields directly from the server. The `submitPayUHostedForm()` function must construct and POST a hidden form with these fields: `key`, `txnid`, `amount` (converted from paise to rupees), `productinfo`, `firstname`, `email`, `phone`, `hash`, `surl`, `furl`, `service_provider` to `data.payuUrl`. After PayU redirects the user back, the callback screen (`app/payment/payu.tsx`) should immediately POST to `/api/payments/{paymentOrderId}/verify-redirect` with JSON body `{ merchantTransactionId, payuTransactionId: mihpayid, status }` and include the `x-tenant-id` header. The backend will validate and update the ledger; then the frontend must call `GET /api/payment/transactions?page=1&pageSize=20` to refresh the transaction list before navigating back to Wallet, ensuring the new payment appears instantly for the tenant.

---

## API Contracts

### Request: `POST /api/payments/payu/initiate`

**Headers:**
```
Authorization: Bearer <token>
x-tenant-id: <tenantId>
Content-Type: application/json
```

**Body:**
```ts
{
  amount: number;        // paise (e.g., 100000 = ₹1,000)
  description: string;   // "Wallet top-up"
  email: string;
  phoneNumber: string;
  userId: string;        // From auth session
  successUrl: string;    // Backend-controlled or frontend fallback
  failureUrl: string;    // Backend-controlled or frontend fallback
}
```

**From:** [lib/api/payment.ts](lib/api/payment.ts)

```ts
export interface PayUInitiateRequest {
  amount: number;
  description: string;
  email: string;
  phoneNumber: string;
  userId: string;
  successUrl: string;
  failureUrl: string;
}
```

### Response: `POST /api/payments/payu/initiate`

**Expected shape:**
```ts
{
  success: true,
  data: {
    paymentOrderId: string;
    merchantTransactionId: string;
    payuKey: string;
    hash: string;
    amount: number;
    email: string;
    phoneNumber: string;
    description: string;
    payuMode: string;  // "test" or "live"
    payuUrl: string;   // HTTPS PayU endpoint
    successUrl: string;
    failureUrl: string;
  }
}
```

**From:** [lib/api/payment.ts](lib/api/payment.ts)

```ts
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
```

### Request: `GET /api/payment/balance`

**Headers:**
```
Authorization: Bearer <token>
x-tenant-id: <tenantId>
```

**Response:**
```ts
{
  success: true,
  data: {
    tenantId: string;
    walletAccountId: string;
    balancePaise: number;
    balanceFormatted: string;  // e.g., "₹1,000.00"
  }
}
```

### Request: `GET /api/payment/transactions?page=1&pageSize=20`

**Headers:**
```
Authorization: Bearer <token>
x-tenant-id: <tenantId>
```

**Response:**
```ts
{
  success: true,
  data: {
    items: [
      {
        id: string;
        tenantId: string;
        type: "credit" | "debit";
        amountPaise: number;
        amountFormatted: string;
        description: string;
        provider: string;        // "payu", "razorpay", etc.
        providerOrderId: string | null;
        providerPaymentId: string | null;
        status: "pending" | "completed" | "failed";
        createdAt: string;       // ISO 8601
      },
      ...
    ],
    pagination: {
      page: number;
      pageSize: number;
      totalItems: number;
      totalPages: number;
    }
  }
}
```

### Request: `POST /api/payments/{paymentOrderId}/verify-redirect`

**Called by:** Callback screen after PayU returns user  
**Purpose:** Validate PayU callback and update wallet ledger

**Headers:**
```
Authorization: Bearer <token>
x-tenant-id: <tenantId>
Content-Type: application/json
```

**Body:**
```ts
{
  merchantTransactionId: string;  // txnid from PayU callback
  payuTransactionId: string;      // mihpayid from PayU callback
  status: "success" | "failure";  // from payment query param
}
```

**Response:**
```ts
{
  success: true,
  data: {
    paymentOrderId: string;
    merchantTransactionId: string;
    status: "completed" | "failed";
    balanceUpdated: boolean;
    newBalancePaise: number;
    newBalanceFormatted: string;
  }
}
```

**Behavior:**
- Validate PayU callback parameters
- Match merchant transaction ID in backend records
- If status is "success": confirm wallet credit via PayU verification, update ledger
- If status is "failure": mark payment as failed, do not credit wallet
- Return updated balance so frontend can refresh UI

---

## Frontend Wallet Component Flow

**File:** [app/(protected)/lexus/wallet.tsx](app/(protected)/lexus/wallet.tsx)

```ts
export default function WalletScreen() {
  const {
    balance,
    transactions,
    totalTransactions,
    isLoading,
    error,
    topUpResult,
    refreshBalance,
    topUp,
    loadMoreTransactions,
  } = useWallet();

  // On mount: load balance + first page of transactions
  useEffect(() => {
    void refreshBalance();
  }, [refreshBalance]);

  // Render balance card
  <Text>{balance ? balance.balanceFormatted : "₹--"}</Text>

  // Render transaction list
  {transactions.map((txn) => (
    <TransactionRow
      key={txn.id}
      type={txn.type}
      amount={txn.amountFormatted}
      description={txn.description}
      status={txn.status}
      createdAt={txn.createdAt}
    />
  ))}

  // Render "Load more" button if more transactions exist
  {hasMore && (
    <TouchableOpacity onPress={() => void loadMoreTransactions()}>
      <Text>Load more transactions</Text>
    </TouchableOpacity>
  )}

  // Render top-up quick buttons
  {QUICK_TOPUPS.map((amount) => (
    <PillButton
      key={amount}
      title={`₹${(amount / 100).toLocaleString("en-IN")}`}
      onPress={() => void topUp(amount)}
      disabled={isTopUpLoading}
    />
  ))}
}
```

---

## Top-Up Flow (useWallet.ts)

**File:** [hooks/useWallet.ts](hooks/useWallet.ts)

```ts
const topUp = useCallback(async (amountPaise: number): Promise<boolean> => {
  setIsTopUpLoading(true);
  setError(null);

  try {
    const authUser = await getCurrentAuthUser();
    if (!authUser?.tenantId) {
      setError("Tenant session not ready");
      return false;
    }

    // Step 1: Build return URLs (frontend fallback)
    const successUrl = buildPayUReturnUrl("success", amountPaise);
    const failureUrl = buildPayUReturnUrl("failure", amountPaise);

    // Step 2: Call backend to initiate PayU checkout
    const res = await initiatePayUCheckout({
      amount: amountPaise,
      description: "Wallet top-up",
      email: authUser.email || "demo.user@example.com",
      phoneNumber: "9876543210",
      userId: authUser.id,
      successUrl,
      failureUrl,
    });

    if (!res.success) {
      setError(res.error?.message ?? "Failed to initiate PayU checkout");
      return false;
    }

    // Step 3: Prefer backend-returned URLs (they are authoritative)
    const checkoutData = res.data;
    const successUrlToUse = checkoutData.successUrl ?? successUrl;
    const failureUrlToUse = checkoutData.failureUrl ?? failureUrl;

    // Step 4: Persist pending payment for recovery across app resume
    await writePendingPayUPayment({
      amountPaise,
      merchantTransactionId: checkoutData.merchantTransactionId,
      email: authUser.email || "demo.user@example.com",
      phoneNumber: "9876543210",
      successUrl: successUrlToUse,
      failureUrl: failureUrlToUse,
      initiatedAt: new Date().toISOString(),
      source: Platform.OS === "web" ? "web" : "native",
    });

    // Step 5: Submit form to PayU
    if (Platform.OS === "web") {
      submitPayUHostedForm({
        ...checkoutData,
        successUrl: successUrlToUse,
        failureUrl: failureUrlToUse,
      });
    } else {
      openPayUCheckoutNative({
        ...checkoutData,
        successUrl: successUrlToUse,
        failureUrl: failureUrlToUse,
      });
    }

    return true;
  } finally {
    setIsTopUpLoading(false);
  }
}, [openPayUCheckoutNative, submitPayUHostedForm]);
```

---

## Key Points for Backend

1. **Tenant header is required:** Every request has `x-tenant-id` header. Filter all queries by this tenant.
2. **Balance and transactions are separate endpoints:** Frontend calls both in parallel (`Promise.all()`).
3. **Transaction matching uses provider fields:** Callback screen matches by `providerOrderId` (merchant txn) or `providerPaymentId` (PayU order ID).
4. **Polling is 3-second intervals for up to 2 minutes:** Backend webhook must update wallet within ~120 seconds.
5. **Frontend is stateless:** No caching layer. Each API response is the source of truth.
6. **No explicit error logging in frontend:** Network issues are caught gracefully and shown to user as state error.

---

**Status:** ✅ Documented  
**Next:** Backend implements exact request/response contracts and webhook webhook reconciliation.
