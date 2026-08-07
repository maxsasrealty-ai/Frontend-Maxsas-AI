[//]: # (---- STRICT BACKEND/DB AUDIT ----)

## Section 1: Model Classification
- Tenant: Required
- User: Required
- WalletTransaction: Required
- CallSession: Required
- CallEvent: Required
- TranscriptSegment: Required
- LeadExtraction: Required
- UsageRecord: Required
- OutboundCallRequest: Required
- Campaign: Required
- CampaignCall: Required
- CampaignContact: Required
- Lead (src/models/Lead.ts): Unused (empty, remove)
- Subscription (src/models/Subscription.ts): Unused (empty, remove)
- User (src/models/User.ts): Unused (empty, remove)

## Section 2: Critical Issues
- Remove empty models: Lead, Subscription, User (src/models)
- Remove dead repositories/services/routes not mapped to schema
- Ensure all tenant_id fields are indexed and used in all queries
- Validate all relations for ON DELETE CASCADE/SET NULL as needed
- Remove SQLite-specific types/fields

## Section 3: Clean Schema Proposal
- See backend/docs/DB_MIGRATION_NOTES.md

## Section 4: Files to Remove / Refactor
- backend/src/models/Lead.ts
- backend/src/models/Subscription.ts
- backend/src/models/User.ts
- Any repository/service/route not referencing a required model (see grep results)
# Maxsas Implementation Status

**Last updated:** April 2026

## 1. Scope
This document outlines the implementation status, capabilities, and explicit boundaries of the **Frontend & Backend Maxsas SaaS mono-repository** exclusively. 
This document explicitly *does not* govern or detail the operational logic of the external LiveKit/Python voice worker, which is deployed physically separate from this repository.

## 2. Current Implementation Summary
The repository builds and runs a multi-tenant React Native (Expo Web/Native) frontend paired with a Node/Express/TypeScript backend. It provides a Role-Based workspace (Lexus vs. Enterprise vs. Admin), backed by:
- LiveKit SDK integration for outbound SIP calls via `telephonyService.ts`
- Idempotent Razorpay-based wallet consumption
- Live Server-Sent Events (SSE) for call transcription and state updates
- Feature gating through `useCapabilities` hook and `requireCapability` middleware
- Admin panel for cross-tenant observability

## 3. Completed Build Phases

- [x] **Phase 1: Shared DTO/Contracts** — Tight boundaries for the monorepo
- [x] **Phase 2: Backend Bootstrap + Tenant/Access Layer** — Capabilities & Auth Middleware
- [x] **Phase 3: Backend Voice/Event Ingestion** — Receiving inbound payloads via Webhook
- [x] **Phase 4: Frontend API/Realtime Layer** — Streaming updates to browser context via SSE
- [x] **Phase 5: Lexus Contract-Backed Workspace** — Core product view layout
- [x] **Workspace Config Abstraction** — Scaling plans dynamically
- [x] **Prestige Naming Normalization** — Renaming capabilities logically in contracts
- [x] **Enterprise Workspace Implementation** — Advanced sidebars and metrics
- [x] **Campaign Backend Domain** — Batch campaign triggers and tracking
- [x] **Wallet/Payment Foundation** — Credit & Debit tracking per Tenant
- [x] **Razorpay Migration** — Explicit native provider ordering and idempotency layers
- [x] **Admin Panel Implementation** — Secure administrative portal with restructured routing
- [x] **Admin Panel Restructuring** — Separate Dashboard and Tenants routing, Campaigns card, lastProvider field
- [x] **Idempotent Wallet Debit** — `processIdempotentDebit` via Prisma `$transaction`, `call_completed` → debit hook
- [x] **Telephony Service (LiveKit SDK)** — `telephonyService.ts`: Room → AgentDispatch → SIP participant
- [x] **Telephony Error → SSE Propagation** — `callService.ts` catches telephony errors and publishes `call_failed` events
- [x] **Env-Canonical Telephony Config** — Backend accepts `SIP_OUTBOUND_TRUNK_ID` (+ `LIVEKIT_OUTBOUND_TRUNK_ID` fallback)
- [x] **Startup Telephony Env Logging** — `[TELEPHONY ENV]` log on backend start (safe, no secrets exposed)
- [x] **Webhook Debug Logger** — `/api/webhooks/*` middleware logs method, path, headers, body in terminal
- [x] **Single Call Modal UX** — `leads-upload.tsx` now opens a modal (phone + name input) before dispatching `POST /api/calls`
- [x] **Database Env Fix** — `DATABASE_URL` properly loaded via `--env-file=backend/.env` flag or `process.loadEnvFile`
- [x] **Dev-Only Login Route Buttons** — Shortcuts available under `__DEV__`

## 4. Shared Contracts Implemented
Found in `shared/contracts/`:
- **`api.ts`**: Uniform API Envelope `ApiEnvelope<T>` wrappers.
- **`plans.ts`**: Capability matrices for `basic`, `pro`, `enterprise` plans.
- **`voice-events.ts`**: Strictly-typed LiveKit webhook payloads and call lifecycle events.
- **`calls.ts`**: `CallSession`, `TranscriptSegment`, `LeadExtraction` types.
- **`realtime.ts`**: Server-Sent Event (SSE) structure definitions.
- **`workspace.ts`**: `WorkspaceTenantConfig` resolving UI branding per plan.
- **`campaigns.ts`**: Multi-lead call pipeline contracts.
- **`payment.ts`**: Provider-neutral top-up constructs.
- **`admin.ts`**: Administrative Tenant lists, Aggregated Usages, System Wallet structs.
- **`index.ts`**: Consolidated barrel export.

## 5. Backend Implementation

### Entry Point (`index.ts`)
- Express JSON setup, CORS for `localhost:8081/19006/3000`
- **`/api/webhooks/*` debug logger** middleware (logs method, path, headers, body)
- **Telephony env verification** log on startup: `[TELEPHONY ENV] URL/API_KEY/API_SECRET/TRUNK_ID: Set|Missing`
- Mounts `/api` router

### Middleware (`middleware/`)
- `requireTenant.ts`, `requireCapability.ts`, `requireAdminAccess.ts`: Access/Gating
- `verifyWebhookAuth.ts`: Bearer token security on webhook endpoints
- `lexusGuard.ts`, `enterpriseGuard.ts`: Workspace-specific guards

### Services (`services/`)
- **`telephonyService.ts`**: Full LiveKit SDK integration — Room creation, AgentDispatch, SIP participant bridging. Accepts `SIP_OUTBOUND_TRUNK_ID` or `LIVEKIT_OUTBOUND_TRUNK_ID` (fallback).
- **`callService.ts`**: Orchestrates call creation → telephony dispatch → publishes `call_failed` SSE on error.
- **`voiceEventService.ts`**: Webhook pipeline → idempotency → state machine → Prisma → SSE publish → wallet debit on `call_completed`.
- **`paymentService.ts`**: Razorpay order creation/HMAC verify + `processIdempotentDebit` atomic wallet debit.
- **`adminService.ts`**: Admin tenant management including `lastProvider` from most recent credit transaction.
- **`realtimeService.ts`**: In-memory tenant listener registry and event fanout.
- **`accessService.ts`**: Capability resolution with caching.

### Repositories (`repositories/`)
- `callRepository`, `eventRepository`, `transcriptRepository`, `leadRepository`, `tenantRepository`, `campaignRepository`, `walletRepository`

### Prisma Models (`schema.prisma`)
- Provider: SQLite
- Models: `Tenant`, `CallSession`, `CallEvent`, `TranscriptSegment`, `LeadExtraction`, `Campaign`, `CampaignCall`, `CampaignContact`, `WalletTransaction`

## 6. Frontend Implementation

### API / Realtime Clients
- `lib/api/client.ts`: Typed `ApiClient` with `x-tenant-id` injection
- `lib/api/calls.ts`, `admin.ts`, `payment.ts`: Domain-specific API calls
- `lib/realtime/client.ts`: `SseRealtimeClient` with reconnect backoff and ID deduplication

### Context / Hooks
- `context/CallsContext.tsx`: Live call state, SSE subscription, deduplication, optimistic create
- `hooks/useCalls.ts`, `useCallDetail.ts`, `useCapabilities.ts`, `useWorkspaceProfile.ts`

### Screens Modified / Added (recent)
- **`leads-upload.tsx`**: "Create Single Call" now opens a **modal** requiring phone number input (+ optional name). No direct API dispatch without user input. CSV simulation path also opens the modal.
- **`admin/index.tsx`**: Decoupled from Tenant list; serves as Dashboard (usage stats + Provision Workspace form)
- **`admin/tenants/index.tsx`**: Tenant list (moved from admin root)
- **`admin/tenants/[id].tsx`**: Tenant details with Campaigns card + lastProvider wallet display
- **`lexus/wallet.tsx`**: Shows "Awaiting Integration" card instead of blocking alert when Razorpay is pending

### Component Primitives (`components/`)
- `GlassCard`, `PillButton`, `SectionHeader`, `StatusPill` — Lexus design system

## 7. Workspace Model

| Plan Key | Display Name | Route Group |
|----------|-------------|-------------|
| `basic` | Lexus | `/(protected)/lexus/` |
| `pro` | Prestige | `/(protected)/lexus/` |
| `enterprise` | Enterprise | `/(protected)/enterprise/` |

## 8. Payment Model
- **Wallet Balance**: `tenant.walletBalancePaise` — single source of truth
- **Idempotent Debit**: `processIdempotentDebit` via Prisma `$transaction` prevents double-billing
- **`call_completed` → debit**: Auto-debits wallet when voice event confirmed complete
- **Razorpay mode**: Real validation + HMAC webhook verification
- **Mock mode**: Same flow, mocked if API keys are absent

## 9. Realtime Model
- SSE endpoint: `GET /api/realtime/calls/stream`
- Webhook events → `voiceEventService` → `publishRealtimeVoiceEvent` → SSE push to frontend
- Frontend: `SseRealtimeClient` with bounded dedup (LRU 500 IDs)

## 10. Telephony (LiveKit SIP)

### Canonical Environment Variables
```env
LIVEKIT_URL=wss://...          # Required
LIVEKIT_API_KEY=...            # Required
LIVEKIT_API_SECRET=...         # Required
SIP_OUTBOUND_TRUNK_ID=ST_...   # Required (or LIVEKIT_OUTBOUND_TRUNK_ID as fallback)
```

### Dispatch Sequence (on `POST /api/calls`)
1. `RoomServiceClient.createRoom` — creates locked audio workspace
2. `AgentDispatchClient.createDispatch` — notifies Python agent to join the room
3. `SipClient.createSipParticipant` — bridges outbound phone number into the room
4. On success: DB state → `ringing`, SSE `call_started` push to frontend
5. On failure: SSE `call_failed` push with error message

## 11. Route and Screen Inventory

### Backend API Routes
```
GET  /api/health
GET  /api/access
GET  /api/capabilities
POST /api/calls
GET  /api/calls
GET  /api/calls/:callId
GET  /api/calls/:callId/transcript
GET  /api/calls/:callId/recording
GET  /api/calls/:callId/lead
GET  /api/campaigns
POST /api/campaigns
GET  /api/campaigns/:id
PATCH/DELETE /api/campaigns/:id
GET  /api/realtime/calls/stream
GET  /api/realtime/campaigns/stream
POST /api/webhooks/voice/events
POST /api/payment/create-order
POST /api/payment/verify
POST /api/payment/webhook
/api/admin/*    (mounted; deferred production phase)
```

### Frontend Routes
- **Public**: `/(public)/login`, `/(public)/signup`
- **Lexus**: `/(protected)/lexus/`, `calls`, `wallet`, `profile`, `leads-upload`, `batches/`, `completed/`
- **Enterprise**: `/(protected)/enterprise/dashboard`, `billing`, `campaigns`, etc.
- **Admin**: `/(protected)/admin/` (Dashboard), `admin/tenants/` (List), `admin/tenants/[id]` (Detail)

## 12. Known Deferred Work
- Production Razorpay native checkout module (`react-native-razorpay`)
- Auth token wiring (`useAuth`, `AuthContext`, `backend/routes/auth.ts` are stubs)
- Distributed realtime fanout (current SSE registry is in-memory only)
- Firebase integration (stub files exist, not active)
- Vapi integration (stub file exists, not active)
- Granular Sub-Team groupings inside Enterprise
- Inventory properties mapping logic
- Admin panel: acceptance criteria for production promotion not yet defined

## 13. Important Files Map

| Category | Files |
|----------|-------|
| Contracts | `shared/contracts/api.ts`, `voice-events.ts`, `admin.ts`, `payment.ts` |
| Backend Schema | `backend/prisma/schema.prisma` |
| Backend Entry | `backend/src/index.ts` |
| Services | `telephonyService.ts`, `callService.ts`, `voiceEventService.ts`, `paymentService.ts` |
| Frontend App Root | `app/_layout.tsx`, `app/(protected)/_layout.tsx` |
| Lexus Pages | `leads-upload.tsx` (modal), `calls.tsx`, `wallet.tsx` |
| Enterprise Pages | `enterprise/index.tsx`, `components/enterprise/EnterpriseSidebar.tsx` |
| Admin Pages | `admin/index.tsx`, `admin/tenants/index.tsx`, `admin/tenants/[id].tsx` |

## 14. Immediate Next Steps
1. Wire real Razorpay native checkout client (`react-native-razorpay`)
2. Implement auth (`useAuth`, `AuthContext`, `backend/routes/auth.ts`)
3. Abstract call-cost duration mechanics for accurate billing
4. Define admin panel acceptance criteria for production promotion
5. Write integration tests: webhook idempotency, call state machine, capability guards
