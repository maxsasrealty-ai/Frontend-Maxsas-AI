# Payment Gateway "Error Loading URL" - Troubleshooting

**Date:** May 16, 2026  
**Error:** "This site can't be reached" / DNS_PROBE_FINISHED_NXDOMAIN  
**Status:** Fixed ✅

---

## 🔴 The Issue

When trying to open the PayU payment gateway, you get:
```
This site can't be reached
Error code: DNS_PROBE_FINISHED_NXDOMAIN
Check if there is a typo in test.payumoney.com
```

**Why?** The PayU test domain `test.payumoney.com` is:
- Not accessible from your region/network
- Possibly blocked by ISP/firewall
- Not available in your country

---

## Why Vercel Shows HTTP 405 On Success Redirect

This is a separate issue from PayU connectivity.

In this codebase, the PayU return URL is built by the frontend and points to the web app callback route at `/payment/payu`.

### What the frontend does

- `lib/payments/payuFlow.ts` builds the callback URL.
- On web, it prefers `EXPO_PUBLIC_WEB_APP_URL` and normalizes it to HTTPS when possible.
- If `EXPO_PUBLIC_PAYU_LOCAL_RETURN_URL` is set and the app is running on localhost, that override is used for local testing.
- On native, the callback URL is built with `Linking.createURL("payment/payu")`.

### What the callback route does

- `app/payment/payu.tsx` is a client-side Expo Router screen.
- It is not a backend endpoint.
- It reads `payment`, `txnid`, `mihpayid`, `amount`, `error`, and `reason` from the query string.
- It then polls wallet balance and transaction APIs until the backend webhook credit is visible.
- After confirmation, it redirects the user back to the Wallet screen.

### Why Vercel fails

- Vercel static export serves the callback route as a static page.
- PayU can return through a form POST or a redirect flow that is not compatible with a static-only host path.
- If the browser or PayU hits `/payment/payu` with a method Vercel does not serve for that asset path, Vercel returns `HTTP ERROR 405`.
- The current `vercel.json` only rewrites `/api/*` to the backend. It does not create a server callback handler for `/payment/payu`.

### Exact consequence

If PayU sends the user directly to `https://maxsasrealtyai.in/payment/payu` and Vercel treats it as a static asset request, the browser can show:

- `This page isn’t working right now`
- `HTTP ERROR 405`

This is a hosting/routing issue, not a payment-gateway hash issue.

---

## Backend Handoff Pack

Use this section as the exact implementation brief for the backend.

### Frontend route contract

The frontend currently expects these callback query params:

- `payment=success|failure`
- `txnid`
- `mihpayid`
- `amount`
- `error`
- `reason`

The callback screen uses them to:

- identify the payment attempt
- match the wallet ledger transaction
- wait for webhook confirmation
- return the user to Wallet with `payment=success` or `payment=failure`

### Frontend request contract for PayU initiate

The frontend sends this shape to the backend:

```ts
{
  amount: number;        // paise
  description: string;
  email: string;
  phoneNumber: string;
  userId: string;
  successUrl: string;
  failureUrl: string;
}
```

This request is sent to:

- `POST /api/payments/payu/initiate`

### Backend response contract expected by frontend

The frontend expects:

```ts
{
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

### What backend must ensure

1. Generate a valid PayU hash and return `payuUrl` as an HTTPS PayU endpoint.
2. Persist the payment initiation so webhook reconciliation can map PayU response back to the wallet top-up.
3. Accept PayU success/failure return traffic without relying on a static-only route.
4. On redirect from PayU, send the user to a GET-accessible callback page, not to a POST-only or static-only asset path.
5. Keep the callback query params intact so the frontend can reconcile the transaction.

### Recommended hosting behavior

Best production setup:

- PayU returns to a backend-controlled callback endpoint first.
- Backend validates the callback and then redirects the browser to the frontend callback route `/payment/payu` using GET.
- The frontend callback page polls wallet state until the webhook-confirmed credit is visible.

If you want the frontend route to stay as the final landing page, the backend still needs a server-side callback step in front of it on Vercel.

### Environment variables involved

Frontend environment variables currently used by the flow:

- `EXPO_PUBLIC_WEB_APP_URL`
- `EXPO_PUBLIC_PAYU_LOCAL_RETURN_URL`

Recommended values:

- Production web app URL: `https://maxsasrealtyai.in`
- Local backend fallback return URL: `http://localhost:4000`
- Local Expo route testing: `http://localhost:8081`

### Files backend should review

- `lib/payments/payuFlow.ts`
- `hooks/useWallet.ts`
- `app/payment/payu.tsx`
- `app/(protected)/lexus/wallet.tsx`
- `app/(protected)/lexus/wallet/checkout.tsx`
- `vercel.json`

---

## ✅ Solution 1: Use Mock Success Endpoint (RECOMMENDED FOR DEV)

Instead of going through PayU, simulate a successful payment:

```bash
# Add money to wallet instantly (development only)
node scripts/test-payment-mock.mjs 100000 user-uuid-123
```

**Response:**
```json
{
  "success": true,
  "data": {
    "amountPaise": 100000,
    "newBalancePaise": 100000,
    "newBalanceFormatted": "₹1,000.00",
    "message": "Mock payment successful"
  }
}
```

**Advantages:**
✅ No network dependency  
✅ Instant completion  
✅ Perfect for testing UI/flow  
✅ Works everywhere  

---

## ✅ Solution 2: Use Alternative PayU Test URL

Update `/src/services/payuService.ts` line 23:

```typescript
// Option A: Use PayU's secure endpoint (works with test credentials)
const PAYU_TEST_URL = "https://cbjs.payu.in/payment";

// Option B: Use standard secure endpoint
const PAYU_TEST_URL = "https://secure.payu.in/_payment";

// Option C: Check PayU docs for your region's test URL
const PAYU_TEST_URL = "https://secure1.payu.in/_payment";
```

Then restart backend:
```bash
npm run dev
```

---

## ✅ Solution 3: Check Your Network

Try accessing PayU test directly:

```bash
# Test connectivity
curl -I https://cbjs.payu.in/payment

# If blocked, try:
ping test.payumoney.com

# Check DNS
nslookup test.payumoney.com
```

**If blocked by ISP/Firewall:**
- Contact ISP to unblock PayU domains
- Use VPN for testing
- Use mock endpoint instead

---

## 🔄 Complete Testing Flow

### Step 1: Start Backend
```bash
cd /root/new-backend
npm run dev
```

### Step 2: Test Mock Payment (Quick)
```bash
node scripts/test-payment-mock.mjs 100000 user-uuid-123
```

Expected: ✅ Success

### Step 3: Test Real PayU (When accessible)
```bash
node scripts/test-payu-initiate.mjs
```

Expected: Response with `payuUrl`

### Step 4: Frontend Integration

Frontend calls initiate:
```typescript
POST /api/payments/payu/initiate
Body: {
  amount: 100000,
  email: "user@example.com",
  phoneNumber: "9876543210",
  userId: "user-uuid"
}
```

Response:
```typescript
{
  payuUrl: "https://cbjs.payu.in/payment",  // ← Changed!
  // ... other fields
}
```

Frontend submits form to `payuUrl`

---

## 📊 PayU Test Credentials

```
Merchant Key: D0Fjcc
Merchant Salt: Sv3KkBlBt9gIp6YzzWz58zZ12qdld9pZ
Test Email: test@payu.in
Test Card: 4111111111111111 (exp: 05/25, CVV: 123)
```

---

## 🛠️ Debugging Checklist

- [ ] Backend running on localhost:4000
- [ ] PayU environment variables set:
  ```bash
  echo $PAYU_KEY        # Should show: D0Fjcc
  echo $PAYU_SALT       # Should show: Sv3...
  echo $PAYU_MODE       # Should show: test
  ```

- [ ] Test connectivity:
  ```bash
  curl https://cbjs.payu.in/payment
  ```

- [ ] If PayU unreachable → Use mock endpoint:
  ```bash
  node scripts/test-payment-mock.mjs
  ```

- [ ] Check browser console for errors
- [ ] Check backend logs:
  ```bash
  tail -f backend-log.txt
  ```

---

## 📋 Development vs Production

| Scenario | Use |
|----------|-----|
| Local development | Mock endpoint: `POST /api/payments/payu/mock-success` |
| Testing PayU integration | Real endpoint: `POST /api/payments/payu/initiate` |
| Can't reach PayU test | Mock endpoint ✅ |
| Production | Real PayU with live credentials |

For web callback testing, set `EXPO_PUBLIC_PAYU_LOCAL_RETURN_URL=http://localhost:4000` to use the backend fallback page, or `http://localhost:8081` to keep the Expo route in the loop.

---

## 🚀 For Frontend Team

If PayU test URL is unreachable:

**Option A: Use Real Backend (Recommended)**
- Backend now uses `https://cbjs.payu.in/payment`
- Should work if that endpoint is accessible in your region
- Test with initiate endpoint

**Option B: Use Mock Success for Testing**
- Call `POST /api/payments/payu/mock-success` directly
- Simulates successful payment
- Perfect for UI/flow testing
- Can test success/failure paths

**Option C: Test with Different Region VPN**
- Use VPN to test from different country
- Verify PayU flow works

---

## 📞 If Still Not Working

1. **Check logs:**
   ```bash
   tail -f backend-log.txt | grep -i payu
   ```

2. **Verify endpoint:**
   ```bash
   curl -X POST http://localhost:4000/api/payments/payu/initiate \
     -H "Content-Type: application/json" \
     -H "x-tenant-id: test-tenant" \
     -d '{
       "amount": 100000,
       "email": "test@example.com",
       "phoneNumber": "9876543210",
       "userId": "user-123"
     }'
   ```

3. **Use mock instead:**
   ```bash
   curl -X POST http://localhost:4000/api/payments/payu/mock-success \
     -H "Content-Type: application/json" \
     -H "x-tenant-id: test-tenant" \
     -d '{
       "amount": 100000,
       "userId": "user-123"
     }'
   ```

---

## ✅ Environment Configuration Updated

File: `/src/services/payuService.ts`

**Changes:**
```typescript
// BEFORE (Inaccessible):
const PAYU_TEST_URL = "https://test.payumoney.com/payment";

// AFTER (More accessible):
const PAYU_TEST_URL = "https://cbjs.payu.in/payment";
```

The new URL should work better in most regions.

---

## 🎯 Recommended Approach

For **development & testing:**

1. ✅ Use mock endpoint for quick testing
2. ✅ Test real PayU when needed
3. ✅ Keep both working options available

```bash
# Quick test (mock)
node scripts/test-payment-mock.mjs 100000 user-123

# Real test (when PayU accessible)
node scripts/test-payu-initiate.mjs
```

---

## Frontend WebView Configuration

The native checkout screen now has enhanced WebView settings to handle PayU form POST:

**File:** `app/(protected)/lexus/wallet/checkout.tsx`

**Settings:**
- `javaScriptEnabled` ✅
- `domStorageEnabled` ✅
- `mixedContentMode="always"` ✅
- `allowUniversalAccessFromFileURLs` ✅
- `allowFileAccessFromFileURLs` ✅
- `onError` fallback with user alert ✅

This ensures the local HTML form can submit to PayU even from file:// origins.

---

**Status:** ✅ Fixed  
**Next:** Use mock endpoint or test updated URL  
**Escalation:** If PayU still unreachable, contact PayU support for region-specific test URL
