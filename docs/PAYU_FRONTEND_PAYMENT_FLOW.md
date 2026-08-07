# PayU Frontend Payment Flow Reference

This document describes the current frontend PayU wallet top-up flow and the exact request/response contract the backend must support.

## Purpose

This file is intended as a backend-facing reference for the frontend payment integration. It captures the active flow, files, payload shapes, callback expectations, and UI update behavior.

## Direct answers

These are the current answers based on the live frontend implementation:

1. Frontend stack: Expo React Native with file-based routing via `expo-router`. The same codebase supports web and native/mobile targets.
2. PayU initiate and form submission live in `hooks/useWallet.ts`. Web submission happens in `submitPayUHostedForm(data)`. Native navigation into the WebView checkout happens in `openPayUCheckoutNative(data)`, and the actual WebView form submit is in `app/(protected)/lexus/wallet/checkout.tsx`.
3. The payment flow is both web and native.
4. Web uses a hidden form submit in the same tab. Native uses the in-app WebView checkout screen.
5. On success, the wallet page shows a success message, refreshes wallet balance, and the transaction list updates through `refreshBalance()`.
6. On failure, the wallet page shows a failure message. There is no dedicated retry button in the current UI.
7. There is now a dedicated callback route at `app/payment/payu.tsx`. The callback screen waits for backend confirmation before returning to Wallet.
8. The frontend currently expects `PayUInitiateResponse` from `lib/api/payment.ts`.
9. `successUrl` and `failureUrl` are currently sent by the frontend in the initiate request. They are not only backend-provided today.
10. No, the current implementation does not add explicit debug logs for the final PayU payload or form action URL.

## Key files

- `hooks/useWallet.ts`
  - `topUp(amountPaise)`
  - `submitPayUHostedForm(data)`
  - `openPayUCheckoutNative(data)`
  - `simulateTopUpSuccess(amountPaise)`
  - `refreshBalance()`

- `lib/api/payment.ts`
  - `initiatePayUCheckout(payload)`
  - `PayUInitiateRequest`
  - `PayUInitiateResponse`

- `app/(protected)/lexus/wallet/checkout.tsx`
  - `PayUCheckoutScreen`
  - WebView checkout page for native/mobile flows

- `app/(protected)/lexus/wallet.tsx`
  - Wallet screen UI
  - handles `?payment=success` and `?payment=failure`

## Flow overview

### 1. User initiates top-up

When the user presses a quick top-up button or enters a manual amount, `useWallet.topUp(amountPaise)` is called.

### 2. Frontend calls backend

The frontend sends an `initiatePayUCheckout` request to the backend endpoint:

- URL: `/payments/payu/initiate`
- Method: `POST`
- Body shape: `PayUInitiateRequest`

### 3. Backend responds with PayU checkout data

Frontend expects a successful response with `PayUInitiateResponse`.

### 4. Web vs native handling

- Web: `submitPayUHostedForm(data)` creates a hidden HTML form and POSTs it directly to `data.payuUrl` in the same browser tab.
- Native/mobile: `openPayUCheckoutNative(data)` navigates to `app/(protected)/lexus/wallet/checkout.tsx` with PayU params as query values, then that screen renders a WebView and auto-submits the form.

### 5. Native checkout WebView

`PayUCheckoutScreen` constructs a small HTML page with a hidden form and auto-submits to `payload.payuUrl`.

The WebView also intercepts navigation events to:

- open `upi:`, `intent:`, `phonepe:`, `paytmmp:`, `tez:` via `Linking.openURL`
- intercept non-http(s) schemes and delegate to `Linking.openURL`
- detect `successUrl` / `failureUrl` and return to the wallet page

### 6. Wallet callback handling

`app/payment/payu.tsx` now owns the callback lifecycle and:

- reads the PayU return parameters and the durable pending-payment record
- shows a loading state while backend reconciliation is still pending
- polls wallet balance and transaction APIs until the webhook-confirmed credit is visible
- clears the pending-payment record after confirmation or terminal failure
- redirects back to the Wallet screen with `payment=success` or `payment=failure`

`app/(protected)/lexus/wallet.tsx` still consumes the `payment` query parameter for the final UI state, but it is no longer the primary callback processor.

## Backend request contract

### `PayUInitiateRequest`

```ts
export interface PayUInitiateRequest {
  amount: number;        // amount in paise
  description: string;
  email: string;
  phoneNumber: string;
  userId: string;
  successUrl: string;
  failureUrl: string;
}
```

### Notes

- `amount` is always passed in paise.
- `successUrl` and `failureUrl` are full callback URLs.
  - On web, the URL is built from `EXPO_PUBLIC_WEB_APP_URL` when provided, otherwise from the current secure origin and normalized to HTTPS when appropriate.
  - For local fallback testing, set `EXPO_PUBLIC_PAYU_LOCAL_RETURN_URL` to `http://localhost:4000` to use the backend fallback page, or `http://localhost:8081` to test the Expo web route.
  - On native, the URL is built with `Linking.createURL("payment/payu")`.
- `email`, `phoneNumber`, and `userId` are derived from the authenticated user.
- The frontend currently sends both `successUrl` and `failureUrl` as part of the initiate request.
- The pending payment is persisted across the redirect so app resumes/background transitions can recover the flow.

## Backend response contract

### `PayUInitiateResponse`

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

### Required response fields

- `paymentOrderId`: frontend stores this for display only.
- `merchantTransactionId`: used as PayU `txnid`.
- `payuKey`: PayU merchant key.
- `hash`: SHA512 hash required for PayU checkout.
- `amount`: original amount in paise.
- `email`: customer email.
- `phoneNumber`: customer phone.
- `description`: optional text for payment metadata.
- `payuMode`: PayU mode indicator (`test` / `live` / other).
- `payuUrl`: MUST be an HTTPS PayU URL.
- `successUrl` / `failureUrl`: callback URLs sent back to the client on redirect.
- The frontend consumes this shape directly from `lib/api/payment.ts` and passes the fields through to the form payload unchanged, except for converting amount from paise to rupees when building the hosted form.

## PayU form generation

### Web path

`submitPayUHostedForm(data)` posts these PayU form fields:

- `key`
- `txnid`
- `amount` (converted from paise to rupees)
- `productinfo` = `wallet_topup`
- `firstname` = first part of email
- `email`
- `phone`
- `hash`
- `surl` = successUrl
- `furl` = failureUrl
- `service_provider` = `payu_paisa`

### Native path

`checkout.tsx` builds the same form fields and submits them from a WebView.

Note: the amount that goes into the PayU form is `amount / 100`.

## Callback expectations

The backend must ensure PayU checkout redirects to the provided `successUrl` or `failureUrl`.

Frontend behavior:

- On `successUrl` redirect, the app returns to the wallet page and refreshes balance.
- On `failureUrl` redirect, the wallet page shows a failure message.

## UI update behavior

The frontend now verifies payment success by waiting for the wallet ledger and transaction APIs to show the webhook-confirmed credit before it shows the final success state.

The backend must therefore:

- mark the payment attempt as succeeded or failed in the DB
- update the wallet balance and transaction history
- support both test and live PayU modes consistently

The frontend will refresh the wallet balance after success and display updated transactions.

Current UI behavior is intentionally lightweight: success/failure is surfaced through the wallet page message, not through a dedicated toast or standalone result screen.

## Dev-only support

The frontend also calls a dev mock endpoint:

- `POST /payments/payu/mock-success`

This is used only for simulated balance crediting during development.

## Important backend requirements

- Backend should accept tenant context via the normal request flow.
- The frontend client uses `lib/api/client.ts`, which injects `x-tenant-id` when available.
- Do not rely on a request body field named `tenantId` unless the backend also supports it; the frontend sends tenant scope through headers.
- `payuUrl` must be HTTPS, not a `upi:` deep link.
- The route must return response data in the format expected by `PayUInitiateResponse`.

## Notes for backend developers

- The frontend uses `router.push("/(protected)/lexus/wallet/checkout?${params}")` for native PayU checkout.
- The callback screen at `app/payment/payu.tsx` performs confirmation polling, then returns to Wallet.
- The wallet screen still listens for `?payment=success` and `?payment=failure` and refreshes data on success.
- A correct backend flow should persist the payment order/attempt and reconcile via webhook or callback.
- If the backend returns a non-HTTPS `payuUrl`, the native WebView flow will fail.
- If you want payload-level debugging, it is not present today and should be added explicitly in the checkout submission path.

## Summary

This document is the current frontend reference for the PayU wallet top-up flow. Backend implementation should match the request/response contract exactly, persist payment status, and support both test and live PayU modes so the UI displays accurate wallet balance and transaction state.
