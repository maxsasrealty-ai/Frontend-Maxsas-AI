# Frontend / Backend Dependency Audit

Scope: read-only audit of the current frontend architecture and backend dependencies. No runtime behavior was changed.

## Route Groups and Purpose

- app/_layout.tsx: root Expo Router shell. It applies the global dark background and mounts the top-level Stack. The auth guard logic is present but commented out, so it does not currently enforce navigation.
- app/(public): unauthenticated entry surface. This group contains the public landing flow, login, signup, and legal pages. The platform-specific index routes are split across index.native.tsx, index.web.tsx, and a shared index.tsx fallback.
- app/(protected)/lexus: Lexus consumer workspace. This is the primary dashboard shell for calls, batches, completed batches, wallet, profile, and lead upload/detail views.
- app/(protected)/enterprise: enterprise workspace. This group exposes the brokerage dashboard, billing, calls log, campaigns, contacts, and settings views.
- app/(protected)/admin: admin console. This group contains the dashboard, tenant management, and live-feed entry points.
- app/(tabs): Expo scaffold tabs route group. It is still present, but it is separate from the product-specific protected flows.
- app/modal.tsx: sample modal route from the Expo scaffold.

Key nested routes currently used by the product:

- Lexus: batches/index, batches/[id], completed/index, completed/[id], completed/leads/[leadId], calls, wallet, profile, leads-upload.
- Enterprise: campaigns/index, campaigns/[id], calls, contacts/index, contacts/[id], billing, settings/index.
- Admin: index, tenants/index, tenants/[id], live-events/index, live-events/recent.

## Context Providers and Owned State

- LexusThemeProvider in context/LexusThemeContext.tsx owns theme mode, derived colors, and dark/light state. It persists mode in AsyncStorage on native and localStorage on web.
- CallsProvider in context/CallsContext.tsx is the main frontend data orchestrator. It owns calls, voiceCallsResult, voiceCallDetailById, capabilities, workspaceConfig, error, liveByCallId, liveVersionByCallId, liveConnectionState, isLoading, isVoiceLoading, and isBootstrapping.
- CallsProvider also owns the auth bootstrap and tenant bootstrap sequence, SSE subscription lifecycle, in-memory event deduplication, and optimistic call creation.
- context/AuthContext.tsx and context/PlanContext.tsx are currently empty placeholders and do not contribute runtime state.
- hooks/useAuth.ts and hooks/usePlan.ts are also empty placeholders.

## API Client Modules and Endpoints

### lib/api/base-url.ts

- Small helper that normalizes the frontend API base URL for HTTP and SSE clients.
- It preserves the existing EXPO_PUBLIC_API_BASE_URL default and localhost fallback behavior.
- Migration-sensitive because changing this helper would affect all frontend calls at once.

### lib/api/client.ts

- Shared transport wrapper used by all backend-facing API modules.
- Adds Content-Type application/json to every request.
- Adds Authorization Bearer when a token resolver is provided.
- Adds x-tenant-id when tenant resolution succeeds.
- Base URL comes from EXPO_PUBLIC_API_BASE_URL, with http://localhost:4000/api as fallback.
- Tenant resolution uses the current stored auth session first, then EXPO_PUBLIC_TENANT_ID as fallback.
- This module now reads its base URL through the shared helper above so HTTP callers and SSE callers stay aligned.

### lib/api/auth.ts

- POST /auth/signup
- POST /auth/login
- On success, both write the returned user into the auth session store.

Consumers:

- app/(public)/login.tsx
- app/(public)/signup.tsx

### lib/api/calls.ts

- POST /calls
- GET /calls
- GET /calls/:callId
- GET /calls/:callId/transcript
- GET /calls/:callId/recording
- GET /calls/:callId/lead
- GET /capabilities
- GET /campaigns
- GET /campaigns/:campaignId/calls
- GET /api/voice/calls?tenant_id=...&limit=...
- GET /api/voice/calls/:callId

Notes:

- The voice API does not use the shared apiClient; it calls the voice base URL directly with its own bearer token.
- isVoiceApiConfigured gates voice calls and voice call detail.

Consumers:

- context/CallsContext.tsx
- hooks/useCallDetail.ts
- app/(protected)/lexus/calls.tsx
- app/(protected)/lexus/completed/leads/[leadId].tsx
- app/(protected)/enterprise/calls.tsx
- app/(protected)/enterprise/contacts/[id].tsx
- components/admin/AdminLiveFeedScreen.tsx

### lib/api/payment.ts

- POST /payment/create-order
- POST /payment/verify
- GET /payment/balance
- GET /payment/transactions?page=...&pageSize=...
- POST /payments/payu/initiate
- POST /payments/payu/mock-success

Consumers:

- hooks/useWallet.ts

Notes:

- createOrder and verifyPayment are exported but currently unused by the frontend.

### lib/api/leads.ts

- POST /leads/upload/preview
- POST /leads/manual/preview

Current state:

- No frontend consumer was found for these helpers in the current workspace snapshot.

### lib/api/admin.ts

- Uses a hardcoded dev-admin-key bearer token for all admin calls.
- GET /admin/tenants
- GET /admin/tenants/:tenantId
- POST /admin/tenants
- PATCH /admin/tenants/:tenantId
- GET /admin/tenants/:tenantId/usage
- GET /admin/tenants/:tenantId/wallet
- GET /admin/tenants/:tenantId/campaigns?page=...&pageSize=...
- GET /admin/live-events/recent?limit=...
- GET /admin/users?limit=...&query=...
- buildAdminLiveEventsStreamUrl resolves to /admin/live-events/stream?adminKey=...

Consumers:

- app/(protected)/admin/index.tsx
- app/(protected)/admin/tenants/index.tsx
- app/(protected)/admin/tenants/[id].tsx
- app/(protected)/admin/live-events/index.tsx
- components/admin/AdminLiveFeedScreen.tsx

## Realtime and SSE Flows

- lib/realtime/client.ts creates an EventSource to /realtime/calls/stream?tenantId=... using EXPO_PUBLIC_API_BASE_URL or the localhost fallback.
- It listens for call_event messages, parses them through parseRealtimeCallEvent, and reconnects with exponential backoff when the stream drops.
- It publishes connection state changes: idle, connecting, connected, reconnecting, unsupported, closed.
- context/CallsContext.tsx subscribes to the realtime client only when calls.history is enabled and a tenantId is available.
- CallsContext deduplicates streamEventId values in memory, upserts calls, updates live snapshots, and increments liveVersionByCallId per call.
- CallsContext disconnects the SSE client on unmount.

Admin live feed path:

- components/admin/AdminLiveFeedScreen.tsx opens a separate EventSource using the admin stream URL from lib/api/admin.ts.
- It listens for connected, admin_live_event, and heartbeat events.
- It also hydrates the initial view from GET /admin/live-events/recent?limit=3.
- When an event is selected, it fetches GET /calls/:callId to populate the side panel.
- Recent DB events and live SSE events are merged and deduplicated in memory by event identity.

## Tenant and Auth Resolution Flow

- lib/auth/session.ts stores the current auth user in AsyncStorage on native and localStorage on web under maxsas.auth.session.user.
- signupWithEmailPassword and loginWithEmailPassword write the returned user into that session store.
- subscribeAuthSession notifies consumers whenever the stored session changes.
- bootstrapAuthSession hydrates the session and returns the current tenantId if one exists.
- getCurrentTenantId is the primary tenant source used by apiClient and CallsProvider.
- If the stored session has no tenantId, apiClient falls back to EXPO_PUBLIC_TENANT_ID.
- CallsProvider waits for bootstrapAuthSession before bootstrapping calls and capabilities. If no tenant is available, it clears the call state.
- app/(public)/login.tsx and app/(public)/signup.tsx redirect to /(protected)/lexus after successful auth.
- app/(protected)/lexus/profile.tsx reads the current auth user, subscribes to session updates, and clears the session on logout.

## Frontend Env Variables

- EXPO_PUBLIC_API_BASE_URL
- EXPO_PUBLIC_TENANT_ID
- EXPO_PUBLIC_VOICE_API_BASE_URL
- EXPO_PUBLIC_VOICE_API_BEARER_TOKEN

Observed fallbacks:

- http://localhost:4000/api for the main backend API when EXPO_PUBLIC_API_BASE_URL is missing.
- localhost tenant fallback through EXPO_PUBLIC_TENANT_ID when the session is not yet hydrated or missing tenant data.

## Do Not Change Yet

- The root auth guard in app/_layout.tsx is still commented out. Navigation currently relies on manual routing and session conventions, not enforced protected-group redirects.
- context/AuthContext.tsx, context/PlanContext.tsx, hooks/useAuth.ts, hooks/usePlan.ts, and lib/api/base-url.ts are empty placeholders. They should not be treated as active runtime abstractions.
- app/(protected)/admin/live-events/recent.tsx is empty even though the admin layout links to it. The actual hydrated DB recent feed lives in components/admin/AdminLiveFeedScreen.tsx and the /admin/live-events/recent API endpoint.
- The admin API and live-feed stream are hardwired to dev-admin-key. Replacing this without a coordinated backend change will break the admin console.
- The voice API bypasses apiClient and uses its own bearer token and base URL. It is not coupled to the main API transport or tenant header flow.
- The frontend HTTP client, admin live-feed stream, and realtime SSE client all share the same base URL helper. Changing it is migration-sensitive because it fans out to every backend call path.
- Payment and wallet screens depend on the current /payment/* and /payments/payu/* contract. Do not rewrite them to wallet-prefixed routes without a backend contract update.
- CallsContext is the implicit data bootstrapper for Lexus and Enterprise screens. Moving or removing it will change loading, caching, and live-update behavior across both workspace shells.
- The in-memory SSE dedupe set in CallsContext is not persisted. Changing the stream/reconnect behavior can reintroduce duplicate events if the backend replay contract changes.

## Audit Notes

- Several files in the current tree are scaffold-like or empty, so older comments and placeholder names overstate the amount of real abstraction that exists today.
- The current frontend is functionally coupled to the backend through session storage, tenant-id fallbacks, hardcoded admin auth, and route-level assumptions about mounted providers.

## Migration Readiness Checklist

This checklist was prepared from code inspection in this turn. It is the expected validation path before any backend move or infrastructure split.

- App boot and route resolution: verify public, Lexus, enterprise, and admin route groups still mount without redirect loops or missing screens.
- Auth/session bootstrap: verify signup, login, session hydration, and logout still write and clear the stored auth user correctly.
- Tenant-scoped API flow: verify API requests still include the resolved tenant id and continue to fall back to EXPO_PUBLIC_TENANT_ID when the session is missing.
- Lexus dashboard/calls loading: verify CallsProvider still hydrates calls, capabilities, and voice call data in the Lexus shell.
- Live call updates through SSE: verify the calls stream still reconnects and deduplicates events by streamEventId.
- Admin live feed: verify historical hydration from /admin/live-events/recent still works and SSE continuation still uses the admin live-events stream URL.
- Calls list/detail/transcript/recording retrieval: verify the calls API endpoints continue to return the same envelope and contract shapes expected by the UI.
- Lead upload/manual dispatch: verify lead preview and dispatch paths still stay distinct from transcript-driven lead extraction.
- Wallet and payment flows: verify both /payment/* and /payments/payu/* paths remain wired and that the frontend continues to handle the current dual-provider state.
- Backend health and route integrity: verify /health and the full route mount table still exist and respond as expected.
- Webhook and voice-event paths: verify raw-body webhook handling, webhook auth, voice event normalization, and dedupe behavior still function as before.

Expected result: no route renames, no contract-shape drift, no tenant leakage, and no regression in SSE or wallet/payment behavior.