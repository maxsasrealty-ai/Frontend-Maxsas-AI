# Frontend + Backend Complete Implementation Reference

This document captures the repository as it exists today. It is intentionally descriptive, not prescriptive: no refactoring, no invented systems, and no cleanup that would change behavior. The codebase is a split Expo Router frontend plus an Express/Prisma backend, with shared TypeScript contracts and several external integration boundaries.

## 1. System Architecture

The application is organized around four runtime surfaces:

1. Expo React Native frontend in `app/`, `components/`, `context/`, `hooks/`, `lib/`, and `constants/`.
2. Node.js/Express backend in `backend/src/`, with Prisma persistence in `backend/prisma/schema.prisma`.
3. Shared TypeScript contracts in `shared/contracts/` that keep frontend and backend aligned.
4. External voice and payment services, including a LiveKit-based voice server, PayU hosted checkout, and Razorpay wallet flows.

The frontend talks directly to the backend through HTTP and SSE. The backend talks outward to LiveKit, SIP, webhook sources, and payment providers. The code also contains a local dev/admin path and a voice-event bridge path that can forward or ingest external events when enabled.

The important design choice is that the repository already contains the full control plane for call creation, realtime call updates, billing, and admin monitoring. The external voice server is not implemented here, but the contract for it is explicit in the backend services, docs, and webhook payloads.

## 2. Repository Map

### Frontend

- `app/` contains Expo Router pages and nested route groups.
- `components/` contains shared UI primitives and admin/brand-specific screens.
- `context/` contains app state providers, especially call orchestration and theming.
- `hooks/` contains thin hooks over API/state surfaces.
- `lib/` contains API clients, auth/session helpers, realtime SSE client, and adapters.
- `constants/` contains plan/theme constants.

### Backend

- `backend/src/index.ts` bootstraps the HTTP server.
- `backend/src/routes/` mounts the public API surface.
- `backend/src/services/` contains domain services for calls, billing, realtime, admin, telephony, and webhook bridging.
- `backend/src/repositories/` contains persistence access.
- `backend/src/middleware/` contains tenant, capability, admin, and webhook auth guards.
- `backend/src/modules/` contains more specialized route/service bundles, including voice events, billing, and leads.
- `backend/prisma/schema.prisma` defines the active PostgreSQL schema.

### Shared

- `shared/contracts/` defines the request/response and event payload shapes consumed by both sides.

### Docs and Ops

- `docs/` contains setup, architecture, voice, webhook, and payment notes.
- `backend/backend.env`, `backend/.env`, and the root environment files describe deployment/runtime configuration.

## 3. Frontend Implementation

### 3.1 Routing and shells

The app uses Expo Router file-based routing.

- `app/_layout.tsx` is the root shell.
- `app/(public)/` contains the public auth and legal pages.
- `app/(protected)/lexus/` contains the Lexus workspace.
- `app/(protected)/enterprise/` contains the enterprise workspace.
- `app/(protected)/admin/` contains the admin workspace.
- `app/(tabs)/` contains the base tab layout used by the generic app shell.

The root layout currently has auth guard scaffolding present but commented out for dev. That is an intentional behavior in the current codebase, not a missing implementation detail.

### 3.2 Lexus workspace

The Lexus shell in `app/(protected)/lexus/_layout.tsx` wraps the area in `LexusThemeProvider` and `CallsProvider`. That means the Lexus screens are not standalone pages; they are built on the shared live-call state machine.

Important Lexus screens include:

- `app/(protected)/lexus/index.tsx` for the main dashboard.
- `app/(protected)/lexus/calls.tsx` for call history.
- `app/(protected)/lexus/wallet.tsx` for wallet balance and top-ups.
- `app/(protected)/lexus/leads-upload.tsx` for CSV/XLS/XLSX/manual lead staging.
- `app/(protected)/lexus/batches/index.tsx` and `app/(protected)/lexus/batches/[id].tsx` for batch views.
- `app/(protected)/lexus/completed/index.tsx` and `app/(protected)/lexus/completed/[id].tsx` for completed work.
- `app/(protected)/lexus/profile.tsx` for workspace profile details.

The Lexus UI uses a dedicated theme layer under `components/lexus/`, including glass/card/pill/status primitives and a dark, branded presentation.

### 3.3 Enterprise workspace

The enterprise shell in `app/(protected)/enterprise/_layout.tsx` provides the enterprise navigation surface. It is a protected workspace with its own tab structure and capability-driven labels. The route set is present even where some screens are lightweight or preview-oriented.

### 3.4 Admin workspace

The admin shell in `app/(protected)/admin/_layout.tsx` provides navigation for admin dashboards, tenants, live feed, and event inspection.

The live feed page is wired to `components/admin/AdminLiveFeedScreen.tsx`, which hydrates historical database events and then subscribes to SSE for new live events.

### 3.5 Frontend state and client layers

The main orchestration layer is `context/CallsContext.tsx`.

It owns:

- auth bootstrap and session-aware tenant resolution,
- initial call/capability fetch,
- SSE subscription setup,
- live event deduplication,
- call detail snapshot refresh,
- lead and voice-call refresh helpers,
- call initiation flows used by the upload and manual trigger paths.

Supporting layers:

- `lib/api/client.ts` is the shared HTTP client and injects `Authorization` and `x-tenant-id` when available.
- `lib/api/auth.ts` handles login and signup.
- `lib/api/calls.ts` handles call, capability, transcript, recording, lead, and batch-related requests.
- `lib/api/payment.ts` handles Razorpay and PayU-related payment calls.
- `lib/api/admin.ts` handles admin requests and live-event URLs.
- `lib/realtime/client.ts` manages SSE subscriptions for call streams.
- `lib/auth/session.ts` persists session and tenant state.

### 3.6 Frontend needs from backend

The frontend depends on the backend for:

- auth/signup/login responses,
- tenant-scoped call lists and call detail,
- transcripts and recordings,
- lead extraction and lead list views,
- workspace capabilities and feature gating,
- wallet balance, transaction history, and payment confirmation,
- admin tenant summaries and live event history,
- SSE streams for live call updates and campaign updates.

### 3.7 Frontend triggers

Known UI triggers include:

- manual or imported lead dispatch from the Lexus lead upload screen,
- wallet top-up and payment verification flows,
- capability-gated views in Lexus and Enterprise shells,
- admin tenant management and live-feed inspection.

## 4. Backend Implementation

### 4.1 Server bootstrap

`backend/src/index.ts` is the entry point. It wires:

- Express server startup,
- CORS for local development origins,
- raw-body handling for voice webhooks,
- JSON parsing for normal API routes,
- a health route,
- optional static admin UI serving,
- 404 and 500 handlers,
- outbound worker startup,
- webhook bridge startup,
- dev-auth seeding.

### 4.2 Route surface

`backend/src/routes/index.ts` mounts the active API surface:

- `/health`
- `/admin`
- `/access`
- `/auth`
- `/capabilities`
- `/campaigns`
- `/enterprise/analytics`
- `/calls`
- `/leads`
- `/realtime`
- `/webhooks`
- `/payments/payu/webhook`
- `/payments`
- `/wallet`
- `/payment/webhook`
- `/payment`

The important point here is that the code contains both `/payment` and `/payments` surfaces, plus both PayU and Razorpay-related routes. The repo should be treated as dual-provider capable, not single-provider-only.

### 4.3 Guard model

The backend uses layered guards:

- `requireTenant` for tenant scoping,
- `requireCapability` for plan/feature gating,
- `requireAdminAccess` for admin routes,
- `verifyWebhookAuth` for protected webhook ingestion.

There are also placeholder middleware files for `lexusGuard` and `enterpriseGuard`, but they are not active behavior drivers in the same way as the tenant/capability/admin guards.

### 4.4 Call flow

The call stack is centered on `backend/src/routes/calls/`, `backend/src/services/callService.ts`, and the repositories under `backend/src/repositories/`.

Observed responsibilities:

- create call requests,
- persist call and request records,
- list calls and call detail,
- expose transcript and recording resources,
- update call state as voice events arrive,
- feed SSE subscribers with normalized realtime events.

### 4.5 Realtime flow

`backend/src/routes/realtime.ts` exposes SSE endpoints:

- `/api/realtime/calls/stream`
- `/api/realtime/campaigns/stream`

These are tenant-aware and capability-gated. The frontend SSE client subscribes to the calls stream and merges events into the live call state.

### 4.6 Voice event ingestion

`backend/src/modules/voice-events/voice-events.router.ts` and `.service.ts` implement the webhook ingestion contract for the external voice system.

The backend accepts normalized voice events, verifies bearer auth, preserves raw headers and envelope data, persists events, updates call state, and publishes them into the realtime/admin streams.

The supported event types in the shared contract are:

- `transcript_partial`
- `transcript_final`
- `call_ringing`
- `call_connected`
- `call_started`
- `lead_extracted`
- `call_completed`
- `call_failed`
- `publisher_test`

### 4.7 Telephony boundary

`backend/src/services/telephonyService.ts` is the boundary to the external voice stack.

It is responsible for:

- creating LiveKit rooms,
- attempting agent dispatch,
- creating SIP participants,
- attaching metadata that includes call, tenant, room, phone number, and agent data,
- passing webhook URLs and related metadata into the external voice system.

### 4.8 Webhook bridge

`backend/src/services/webhookBridgeService.ts` is an optional polling bridge.

When enabled, it can pull recent external voice events from a configured upstream and re-ingest them into the backend. This is a separate path from direct webhook POSTs and is controlled by environment flags.

### 4.9 Billing and wallet flow

The backend billing path separates wallet funding from usage debit.

- Payment/order creation and verification live under payment routes and services.
- Wallet accounting is tracked in wallet and wallet-ledger repositories.
- Call usage debits are enforced through the billing service and usage records.

### 4.10 Admin surface

The admin service and routes provide tenant summaries, wallet and usage visibility, and live event inspection. The frontend admin screen depends on a dev admin key and the admin live-event stream URL.

## 5. Database Model

The active schema is Prisma over PostgreSQL. That is the current source of truth, even where some repo docs still mention SQLite.

The main data model includes:

- tenants and tenant-scoped settings,
- users and auth state,
- calls and call-session records,
- voice events and realtime event persistence,
- transcripts,
- lead extraction records,
- campaigns,
- wallet balances and wallet ledger entries,
- payment orders, payment attempts, payment webhooks, and reconciliation records,
- outbound request records,
- usage records for billing/debit tracking.

The practical implication is that the backend keeps both operational call records and billing records in the same Prisma-backed database, so call creation, voice event arrival, and payment flows all converge on the same tenant scope.

## 6. Shared Contracts

The shared contracts are the main cross-boundary type layer.

Key contract areas:

- `api` for envelope shapes and generic API responses,
- `calls` for call data and call state shapes,
- `campaigns` for campaign records and summaries,
- `payment` for wallet balances, orders, verification, and transaction lists,
- `plans` for capability and plan vocabulary,
- `workspace` for workspace metadata and branding config,
- `realtime` for live call event shapes,
- `voice-events` for webhook envelopes and normalized voice payloads,
- `admin` for tenant/admin records and live-event summaries,
- `leads-upload` for preview and row-normalization payloads.

The most important contract in the repo is the voice event envelope. It carries `event_type`, `tenant_id`, `call_id`, `room_id`, `occurred_at`, and a typed payload. That shape is what keeps the backend, realtime stream, and frontend detail views aligned.

## 7. Backend ⇄ Server Wiring

The external server boundary is the LiveKit/Python voice system described in the docs and wired by the backend telephony services.

### What the backend sends to the server

- Call and tenant metadata.
- LiveKit room metadata containing call id, tenant id, room id, direction, phone number, and agent name.
- Webhook URLs for voice events and agent logs.
- SIP/trunk identifiers.
- Agent dispatch requests.

### What the server sends back to the backend

- Voice event webhooks for started, connected, ringing, partial transcript, final transcript, lead extraction, completed, failed, and publisher test cases.
- Raw event headers and envelope payloads, which the backend stores for traceability.
- Call progress details that drive SSE updates and call state transitions.

### Why this matters

The backend is not just a storage layer here. It is the control plane that:

1. creates the upstream call/room dispatch,
2. receives the downstream voice events,
3. updates persistence,
4. fans out live updates to the frontend and admin views.

## 8. Event Lifecycle

The end-to-end call lifecycle is:

1. The frontend creates or stages a lead/call request.
2. The backend stores the call request and dispatches the call to the external voice system.
3. The external system creates or joins the LiveKit/SIP path.
4. Voice events arrive through the webhook route or bridge path.
5. The backend normalizes the event, persists it, and updates the call state.
6. The backend emits SSE updates.
7. The frontend `CallsContext` merges the event into live snapshots.
8. The admin live feed optionally hydrates recent database events and then continues on SSE.

The important runtime detail is deduplication. Both the frontend call stream and the admin event feed avoid double-processing by event id, so repeated SSE delivery or bridge replay does not corrupt the visible state.

## 9. Env Matrix

### Frontend env

Observed frontend env usage:

- `EXPO_PUBLIC_API_BASE_URL`
- `EXPO_PUBLIC_TENANT_ID`
- `EXPO_PUBLIC_VOICE_API_BASE_URL`
- `EXPO_PUBLIC_VOICE_API_BEARER_TOKEN`

The frontend defaults `EXPO_PUBLIC_API_BASE_URL` to `http://localhost:4000/api` and falls back to `EXPO_PUBLIC_TENANT_ID` when session state does not provide a tenant id.

### Backend env

Observed backend env contract:

- `APP_ENV`
- `NODE_ENV`
- `PORT`
- `DATABASE_URL`
- `REDIS_URL`
- `OUTBOUND_QUEUE_CONCURRENCY`
- `API_BASE_URL`
- `VOICE_WEBHOOK_PUBLIC_URL`
- `BACKEND_WEBHOOK_URL`
- `LIVEKIT_AGENT_NAME`
- `LIVEKIT_URL`
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`
- `SIP_OUTBOUND_TRUNK_ID`
- `LIVEKIT_OUTBOUND_TRUNK_ID`
- `VOICE_WEBHOOK_BEARER_TOKEN`
- `BACKEND_WEBHOOK_TOKEN`
- `BACKEND_WEBHOOK_AUTH_TOKEN`
- `WEBHOOK_BRIDGE_ENABLED`
- `WEBHOOK_SERVER_BASE_URL`
- `WEBHOOK_BRIDGE_POLL_MS`
- `VOICE_TEST_MODE`
- `BILLING_BYPASS`

### Dev auth env

The backend dev-auth seed also reads:

- `DEV_AUTH_EMAIL`
- `DEV_AUTH_PASSWORD`
- `DEV_AUTH_FULL_NAME`
- `DEV_AUTH_TENANT_ID`
- `DEV_AUTH_TENANT_NAME`

### Important env coupling

- The backend derives voice webhook and agent-log URLs from `VOICE_WEBHOOK_PUBLIC_URL` or `API_BASE_URL`.
- The backend accepts multiple webhook token env names as fallbacks.
- The frontend admin live feed uses a fixed dev admin key in local/dev usage.

## 10. Auth and Tenant Model

Authentication and tenancy are separate concerns in the codebase.

The frontend persists session state locally and attaches tenant context to requests. The backend reads the tenant context from request middleware and normalizes tenant ids before query execution.

The practical effect is:

- frontend API calls generally include `Authorization` when a token exists,
- frontend API calls include `x-tenant-id` when a tenant can be resolved,
- backend services and repositories treat tenant id as required scope for most business data,
- admin routes are keyed differently and do not behave like normal tenant-scoped user routes.

The repo also contains dev-auth seeding with known defaults. That is intended for local bootstrap, not a substitute for production auth.

## 11. Admin Features

The admin surface is intentionally narrow but functional.

Observed admin capabilities:

- tenant list and tenant detail views,
- tenant creation and update routes,
- tenant usage and wallet summaries,
- admin user search/listing,
- live event stream and recent database event hydration,
- event detail inspection from the live feed UI.

The admin frontend is coupled to the backend through a fixed dev admin key. That is a deliberate local/dev shortcut in the current codebase and should be preserved as an explicit implementation detail in any rebuild.

## 12. Payments and Wallets

The codebase contains two overlapping payment paths:

1. Razorpay wallet/order verification flow.
2. PayU hosted checkout flow.

This is not a contradiction in the repository; it is an observed dual-provider state.

### Wallet behavior

The wallet UI fetches balance and transactions, can initiate top-ups, and can simulate dev-only top-up behavior when real keys are not present.

### Payment backend behavior

The backend persists order/attempt/webhook/reconciliation data and updates wallet ledger state. The call billing path then consumes wallet balance through usage records and debit operations.

### Practical rebuild constraint

Do not simplify this to a single provider unless the implementation itself changes. The current repo already has both integrations present.

## 13. Lead Upload and Lead Extraction

Lead handling exists in two forms.

### Upload preview path

The frontend lead upload page parses CSV/XLS/XLSX locally, normalizes rows, and stages contacts for dispatch. The backend also exposes preview routes for CSV text, uploaded file data, or row arrays.

### Extraction path

The voice-event pipeline extracts lead signals from transcripts. The extraction logic currently identifies patterns such as intent, property type, location, budget, timeline, and phone number, then stores those signals in persistence and/or event payloads.

### Why this matters

The frontend lead upload flow and the backend transcript extraction flow are separate. One is an inbound staging path for outbound calls; the other is an inference path driven by live conversations.

## 14. Build, Run, and Deploy

### Frontend

- Install dependencies with `npm install`.
- Start Expo with `npx expo start`.
- The app is configured as an Expo Router project, so route file structure is part of the build behavior.

### Backend

- Install backend dependencies in `backend/`.
- Run the server with the backend dev script if available.
- The backend requires `DATABASE_URL` and any external service envs needed for the features you use.

### Operational notes

- Redis is used for queueing, but the repo also supports direct fallback behavior when Redis is unavailable or disabled.
- Some features only work when the external voice server, webhook endpoint, and LiveKit settings are configured.
- The repo contains docs for local webhook tunneling and voice-agent setup; those docs are useful, but the code should remain the source of truth.

## 15. Hidden Coupling Points

These are the coupling points that matter most if the system is rebuilt elsewhere:

- `EXPO_PUBLIC_API_BASE_URL` on the frontend and `API_BASE_URL` on the backend both affect request routing.
- Tenant resolution is not purely server-side; the frontend may fall back to `EXPO_PUBLIC_TENANT_ID`.
- Voice webhook auth token naming has multiple accepted env keys on the backend.
- Admin live feed uses a fixed dev admin key in the current client implementation.
- Realtime events are deduped by id in both the calls context and the admin feed.
- The backend normalizes tenant ids before repository access.
- Billing can be bypassed in test mode, so usage and wallet behavior can differ in dev from production.
- Docs mention SQLite in places, but the active schema is PostgreSQL.

## 16. Rebuild Checklist

If this repository is being recreated in another server-side system, the minimum viable checklist is:

1. Recreate the route surface exactly, including calls, realtime, admin, access, auth, payment, wallet, campaigns, leads, and webhooks.
2. Recreate the shared contract shapes before wiring UI or event ingestion.
3. Preserve tenant normalization and capability gating.
4. Preserve SSE streams for calls and campaigns.
5. Preserve webhook auth, raw-body handling, and event deduplication.
6. Preserve the dual payment-provider state until the implementation is intentionally unified.
7. Preserve the LiveKit/SIP dispatch boundary and the external voice event envelope.
8. Preserve the dev admin key behavior for local admin tooling if compatibility with this repo is required.
9. Preserve the wallet/usage debit split.
10. Preserve the lead upload preview path and transcript-based lead extraction path as separate flows.

## 17. Known Gaps and Risk Notes

This repository is functional, but not every file is complete.

- Some context/hooks files are placeholders or empty shells.
- Some admin and enterprise screens are lightweight or preview-oriented.
- Some docs are outdated relative to the current Prisma/PostgreSQL schema.
- The repo has deliberate dev shortcuts, especially around auth seeding and admin access.
- The backend can operate with or without the webhook bridge, which changes where live events originate.
- The external voice system is not implemented in this repository, so its exact behavior depends on the remote service and the webhook contract staying stable.

## Appendix: High-Value Source Files

If you need to inspect the implementation again, start here:

- [frontend root layout](app/_layout.tsx)
- [Lexus workspace shell](app/(protected)/lexus/_layout.tsx)
- [Calls provider](context/CallsContext.tsx)
- [shared realtime contract](shared/contracts/realtime.ts)
- [shared voice event contract](shared/contracts/voice-events.ts)
- [HTTP API client](lib/api/client.ts)
- [admin API client](lib/api/admin.ts)
- [backend entrypoint](backend/src/index.ts)
- [backend route mount table](backend/src/routes/index.ts)
- [backend config contract](backend/src/lib/config.ts)
- [voice event router](backend/src/modules/voice-events/voice-events.router.ts)
- [telephony service](backend/src/services/telephonyService.ts)
- [billing service](backend/src/modules/billing/billing.service.ts)
- [Prisma schema](backend/prisma/schema.prisma)
