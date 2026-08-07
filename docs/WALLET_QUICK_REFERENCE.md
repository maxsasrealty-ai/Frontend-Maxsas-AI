# Quick Reference: Wallet Implementation

## 🚀 Status
Frontend: ✅ COMPLETE  
Backend: ⏳ PENDING (3 endpoints needed)  
UI: ✅ READY  

---

## 📁 Key Files

```
hooks/useWallet.ts                           → Main wallet logic (balance, transactions, topUp)
app/(protected)/lexus/wallet.tsx             → UI rendering (balance card, transaction list)
app/payment/payu.tsx                         → Callback screen (polls balance after PayU)
lib/api/payment.ts                           → API client (fetchWalletBalance, fetchWalletTransactions)
lib/payments/payuFlow.ts                     → PayU URLs and callback handling
shared/contracts/payment.ts                  → TypeScript interfaces (WalletBalanceResponse, etc.)
docs/BACKEND_WALLET_IMPLEMENTATION_GUIDE.md  → Backend implementation spec (READ THIS)
docs/PAYMENT_FRONTEND_API_SPEC.md            → API contracts with examples
docs/WALLET_LAUNCH_CHECKLIST.md              → Testing and debug guide
```

---

## 🔌 Frontend → Backend: 3 Required Endpoints

### 1️⃣ Get Balance
```bash
GET /api/payment/balance
Headers: Authorization: Bearer <token>, x-tenant-id: <tenantId>
Response: { success: true, data: { balancePaise: 500000, balanceFormatted: "₹5,000.00" } }
```

### 2️⃣ Get Transactions
```bash
GET /api/payment/transactions?page=1&pageSize=20
Headers: Authorization: Bearer <token>, x-tenant-id: <tenantId>
Response: { success: true, data: { items: [...], pagination: {...} } }
```

### 3️⃣ Verify PayU Callback
```bash
POST /api/payments/{paymentOrderId}/verify-redirect
Headers: Authorization: Bearer <token>, x-tenant-id: <tenantId>
Body: { merchantTransactionId: "...", payuTransactionId: "...", status: "success" }
Response: { success: true, data: { newBalancePaise: 550000, ... } }
```

---

## 🎯 What Frontend Does (Already Complete)

1. **On Wallet Open**
   - Calls `GET /api/payment/balance`
   - Calls `GET /api/payment/transactions?page=1&pageSize=20`
   - Renders balance card and transaction list

2. **On Top-Up Click**
   - Calls `POST /api/payments/payu/initiate`
   - Gets back: paymentOrderId, merchantTransactionId, payuUrl, hash, txnid, surl, furl, etc.
   - Submits hidden form to PayU with surl/furl from backend (not frontend)

3. **After PayU Payment**
   - PayU redirects to surl with query params: txnid, mihpayid, status
   - Callback screen loads (`app/payment/payu.tsx`)
   - Polls `GET /api/payment/balance` every 3 seconds
   - Calls `POST /api/payments/{paymentOrderId}/verify-redirect` with txnid, mihpayid, status
   - On success: Shows success message, refreshes balance, navigates to wallet

---

## 🧪 Testing Without Backend

Use "Simulate Success (Dev)" button in wallet:
```
Wallet Screen → "Custom Amount" section → "Simulate Success (Dev)" button
```
This calls `POST /api/payments/payu/mock-success` which immediately credits balance (dev-only).

---

## 🐛 Why Wallet Shows "₹--" (Nil)

**It's not a frontend issue.** Frontend is working correctly.

The issue is:
- Backend `GET /api/payment/balance` endpoint not implemented
- Backend `GET /api/payment/transactions` endpoint not implemented
- Frontend has no data to display

**Proof:** Check browser DevTools Network tab:
- Look for request to `/api/payment/balance`
- If it shows 404/500, that's the problem (backend)
- If it shows 200 but response is empty, check backend logic

---

## ✅ Verification Checklist

- [ ] Backend `GET /api/payment/balance` returns data (status 200)
- [ ] Backend `GET /api/payment/transactions` returns array (status 200)
- [ ] Both endpoints check `x-tenant-id` header (only return tenant's data)
- [ ] Both endpoints validate `Authorization` header
- [ ] Transaction records have `providerOrderId` and `providerPaymentId` fields
- [ ] `POST /api/payments/{id}/verify-redirect` validates and credits wallet
- [ ] Wallet UI shows balance and transaction list on open
- [ ] Top-up flow works: Button → PayU → Callback → Updated balance visible

---

## 📚 Documentation

For implementation details:
1. Start: [BACKEND_WALLET_IMPLEMENTATION_GUIDE.md](./docs/BACKEND_WALLET_IMPLEMENTATION_GUIDE.md)
2. API Spec: [PAYMENT_FRONTEND_API_SPEC.md](./docs/PAYMENT_FRONTEND_API_SPEC.md)
3. Debug: [WALLET_LAUNCH_CHECKLIST.md](./docs/WALLET_LAUNCH_CHECKLIST.md)

---

## 🔥 Common Issues & Quick Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Wallet shows "₹--" | Backend endpoint not implemented | Implement `GET /api/payment/balance` |
| "No transactions found" spinner | 404 on transactions endpoint | Implement `GET /api/payment/transactions` |
| 401 error | Auth token missing | Check `Authorization: Bearer <token>` header |
| 403 error | Tenant mismatch | Verify `x-tenant-id` matches user's tenant |
| Top-up stuck at PayU | Callback not implemented | Implement `POST /api/payments/{id}/verify-redirect` |
| Transaction doesn't appear after pay | providerOrderId not stored | Store merchant txn ID in database |

---

## 🚀 Ready for Launch When:

- [ ] All 3 backend endpoints implemented
- [ ] All 3 return correct response format
- [ ] Tenant isolation working (no cross-tenant data leaks)
- [ ] PayU integration tested end-to-end
- [ ] Mock top-up creates visible transaction
- [ ] Real top-up flow works completely
- [ ] No console errors in dev mode

