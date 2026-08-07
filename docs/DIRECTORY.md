# Project Directory Structure

This document lists all main files and folders in the Maxsas-AI-Livekit project.

**Last updated:** April 2026

---

## Root Level

| Path | Description |
|------|-------------|
| `app/` | Expo React Native frontend (screens, navigation) |
| `backend/` | Node.js/Express backend (API, business logic, Prisma) |
| `components/` | Shared React Native UI components |
| `constants/` | Frontend constants (themes, plans) |
| `context/` | React context providers (global state) |
| `docs/` | Project documentation |
| `hooks/` | Custom React hooks |
| `lib/` | Shared frontend libraries (API client, realtime, adapters) |
| `shared/contracts/` | TypeScript DTOs shared between frontend and backend |
| `scripts/` | Utility scripts |
| `assets/` | Fonts and images |
| `backend/.env` | Backend environment variables (gitignored) |
| `.env.example` | Frontend env example (`EXPO_PUBLIC_*`) |
| `AI_INSTRUCTIONS.md` | Mandatory AI coding assistant guidelines |

---

## app/

| Path | Description |
|------|-------------|
| `_layout.tsx` | Root Expo Router layout |
| `(public)/` | Public screens (login, landing, signup, terms, privacy, refund) |
| `(protected)/` | Authenticated workspace screens |
| `(tabs)/` | Legacy tab layout (not part of Lexus/Enterprise flows) |

### app/(public)/
- `index.tsx` — Landing page (web: marketing SaaS layout; native: redirect)
- `login.tsx` — Login screen
- `signup.tsx` — Signup screen

### app/(protected)/lexus/
| File | Description |
|------|-------------|
| `_layout.tsx` | Lexus tab navigator |
| `index.tsx` | Home / Command Center |
| `leads-upload.tsx` | Lead upload screen — CSV picker + **"Create Single Call" modal** (phone + name input; validated before dispatch) |
| `calls.tsx` | Call history log with live SSE badges |
| `wallet.tsx` | Balance & billing portal (Razorpay / mock mode) |
| `profile.tsx` | Account settings summary |
| `batches/` | Campaign/batch management screens |
| `completed/index.tsx` | List of completed campaigns |
| `completed/[id].tsx` | Campaign results & KPIs |
| `completed/leads/[leadId].tsx` | Individual lead insight detail |

### app/(protected)/enterprise/
- `dashboard/`, `calls/`, `campaigns/`, `contacts/`, `agents/`, `analytics/`, `leads/`, `teams/`, `billing/`, `settings/`, `integrations/`, `white-label/`

### app/(protected)/admin/
| File | Description |
|------|-------------|
| `_layout.tsx` | Admin header nav (Dashboard / Tenants pills + Exit Admin) |
| `index.tsx` | Admin Dashboard — usage stats blocks + Provision Workspace form |
| `tenants/index.tsx` | Tenant list |
| `tenants/[id].tsx` | Tenant details — wallet, campaigns card, last top-up provider |

---

## backend/src/

### Entry Point
- `index.ts` — Express app bootstrap. Loads `backend/.env`, sets up CORS, JSON body parsing, **webhook debug logger** (`/api/webhooks/*`), **telephony env logging** on startup, mounts `/api` router.

### routes/
| Path | Endpoints |
|------|-----------|
| `routes/index.ts` | Aggregates all route mounts |
| `routes/health.ts` | `GET /api/health` |
| `routes/access.ts` | `GET /api/access` |
| `routes/capabilities.ts` | `GET /api/capabilities` |
| `routes/calls/create.ts` | `POST /api/calls` |
| `routes/calls/list.ts` | `GET /api/calls` |
| `routes/calls/detail.ts` | `GET /api/calls/:callId` |
| `routes/calls/transcript.ts` | `GET /api/calls/:callId/transcript` |
| `routes/calls/recording.ts` | `GET /api/calls/:callId/recording` |
| `routes/calls/lead.ts` | `GET /api/calls/:callId/lead` |
| `routes/campaigns.ts` | `GET/POST/PATCH/DELETE /api/campaigns` |
| `routes/realtime.ts` | `GET /api/realtime/calls/stream`, `GET /api/realtime/campaigns/stream` |
| `routes/webhooks/voice.ts` | `POST /api/webhooks/voice/events` |
| `routes/payment.ts` | `POST /api/payment/create-order`, `POST /api/payment/verify`, `POST /api/payment/webhook` |
| `routes/admin.ts` | `/api/admin/*` (mounted; deferred production phase) |
| `routes/lexus/` | `agents.ts`, `analytics.ts`, `leads.ts` |
| `routes/enterprise/` | `agents.ts`, `analytics.ts`, `integrations.ts`, `leads.ts`, `whiteLabel.ts` |

### services/
| File | Role |
|------|------|
| `telephonyService.ts` | LiveKit SDK: Room creation → AgentDispatch → SIP participant (outbound call). Reads `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `SIP_OUTBOUND_TRUNK_ID` (fallback: `LIVEKIT_OUTBOUND_TRUNK_ID`). |
| `callService.ts` | Call orchestration — delegates to telephonyService, catches errors, publishes `call_failed` to SSE. |
| `voiceEventService.ts` | Voice webhook pipeline: normalize → idempotency guard → state transition → Prisma → SSE publish. Hooks into `paymentService` on `call_completed`. |
| `realtimeService.ts` | In-memory SSE tenant listener registry and event fanout. |
| `accessService.ts` | Tenant capability resolution with caching. |
| `campaignService.ts` | Campaign domain business logic. |
| `paymentService.ts` | Razorpay order creation / HMAC verify + idempotent wallet debit via `processIdempotentDebit`. |
| `adminService.ts` | Admin tenant management — includes `lastProvider` field from most recent credit transaction. |
| `calls/callStateMachine.ts` | Legal state transition logic for call lifecycle. |

### repositories/
`callRepository`, `eventRepository`, `transcriptRepository`, `leadRepository`, `tenantRepository`, `campaignRepository`, `walletRepository`

### middleware/
| File | Role |
|------|------|
| `requestContext.ts` | Injects `requestId` and `tenantId` into `req.requestContext` |
| `requireTenant.ts` | Guards routes where tenant ID is mandatory |
| `requireCapability.ts` | Guards by `CapabilityKey` |
| `requireAdminAccess.ts` | Guards admin routes via `x-admin-key` or Bearer token |
| `verifyWebhookAuth.ts` | Bearer token check for webhook endpoint (`VOICE_WEBHOOK_BEARER_TOKEN`) |
| `lexusGuard.ts` | Workspace guard for Lexus routes |
| `enterpriseGuard.ts` | Workspace guard for Enterprise routes |

### prisma/
- `schema.prisma` — SQLite. Models: `Tenant`, `CallSession`, `CallEvent`, `TranscriptSegment`, `LeadExtraction`, `Campaign`, `CampaignCall`, `CampaignContact`, `WalletTransaction`.

---

## shared/contracts/

| File | Contents |
|------|----------|
| `api.ts` | `ApiEnvelope<T>` response wrapper |
| `plans.ts` | `PlanKey`, `CapabilityKey`, `PlanCapabilities` |
| `workspace.ts` | `WorkspaceTenantConfig`, vocabulary, branding, voice agent display |
| `calls.ts` | `CallSummary`, `CallDetail`, `CallState`, transcript/lead/recording types |
| `realtime.ts` | `RealtimeCallEvent`, `LiveCallStage` |
| `voice-events.ts` | Voice webhook payload contracts, `VoiceEventType` |
| `campaigns.ts` | Campaign CRUD/list/detail contracts |
| `payment.ts` | Provider-neutral top-up contracts |
| `admin.ts` | `TenantAdminRecord`, `TenantUsageSummary` |
| `index.ts` | Barrel export |

---

## components/

| Path | Contents |
|------|----------|
| `components/lexus/` | `GlassCard`, `PillButton`, `SectionHeader`, `StatusPill`, `theme.ts`, `live/`, `locks/` |
| `components/enterprise/` | `EnterpriseStatCard`, `EnterpriseSurface`, `EnterpriseWorkspaceBanner`, `EnterpriseSidebar` (stub), `IntegrationCard` (stub), `WhiteLabelPanel` (stub) |
| `components/landing/` | Nav, HeroSection, FooterSection, etc. |
| `components/ui/` | Common UI (Button, Card, Input, etc.) |

---

## hooks/

| File | Role |
|------|------|
| `useCalls.ts` | `useCallsContext` alias |
| `useCallDetail.ts` | Fetches call detail, lead, transcript; refreshes on live SSE update |
| `useCapabilities.ts` | Capability checks, plan label, vocabulary, branding, voice display |
| `useWorkspaceProfile.ts` | Workspace surface: config, type, plan label, inventory AI flags |

---

## lib/

| Path | Contents |
|------|----------|
| `lib/api/client.ts` | `ApiClient` with typed `get/post/patch`, injects `x-tenant-id` |
| `lib/api/calls.ts` | `createCall`, `fetchCalls`, `fetchCallDetail`, etc. |
| `lib/api/admin.ts` | Admin API client (injects `x-admin-key`) |
| `lib/api/payment.ts` | Payment API client (Razorpay order/verify) |
| `lib/realtime/client.ts` | `SseRealtimeClient` with reconnect backoff |
| `lib/adapters/calls.ts` | Call formatting helpers |
| `lib/adapters/liveEvents.ts` | SSE event parsing, stage labels |

---

## docs/

| File | Purpose |
|------|---------|
| `SETUP.md` | Full setup guide (frontend, backend, DB, ngrok, env vars) |
| `ARCHITECTURE.md` | System diagram and architecture overview |
| `DIRECTORY.md` | This file — full file/folder reference |
| `IMPLEMENTATION_STATUS.md` | Feature completion status |
| `FRONTEND_BACKEND_PROGRESS.md` | Canonical technical handoff (single source of truth) |
| `VOICE_AGENT_SETUP.md` | Remote LiveKit server + Python agent guide |
| `VOICE_BACKEND_CONTRACT.md` | Voice event webhook contract |
| `WEBHOOK_LOCAL_SETUP.md` | Local webhook testing via ngrok |
