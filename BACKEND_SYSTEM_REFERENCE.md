# NEW BACKEND - COMPLETE UPDATED STATUS

Last Updated: 2026-05-03
Workspace: /root/new-backend
Purpose: Single source of truth for current backend state, admin UI state, API map, runtime checks, and operational notes.

## 1) Current Project Snapshot

- Project name: maxsas-backend
- Runtime: Node.js + Express (TypeScript, ESM)
- Entry: src/index.ts
- Package manager: npm
- ORM: Prisma
- Queue: BullMQ
- Key integrations: LiveKit, SIP flow, webhook ingest, PayU, wallet/billing modules

## 2) Verified NPM Scripts

From package.json:

- npm run dev -> node --import dotenv/config --import tsx src/index.ts
- npm run start -> node --import dotenv/config --import tsx src/index.ts
- npm run ui -> prints Master Control URL
- Prisma scripts:
  - npm run prisma:generate
  - npm run prisma:migrate
  - npm run prisma:pull
- Test/helper scripts also available under scripts and package scripts.

## 3) Server Routing and Exposure

## 3.1 Public and Health

- GET / -> backend running message
- GET /health -> health response
- GET /api/health -> health router response

## 3.2 Static Admin UIs

- GET /admin -> public/admin.html
- GET /admin-panel -> public/admin_panel.html
- GET /admin/master-control -> public/master-control.html
- GET /admin-ui/* -> static files from public/

## 3.3 API Router Mount

Main API mounted at /api with these key route groups:

- /api/health
- /api/admin
- /api/access
- /api/auth
- /api/capabilities
- /api/campaigns
- /api/enterprise/analytics
- /api/calls
- /api/leads
- /api/realtime
- /api/webhooks
- /api/payments and /api/payment
- /api/wallet

## 4) Admin API (Current Working Surface)

Admin endpoints are protected by admin key middleware (x-admin-key or bearer), except SSE stream which accepts query adminKey.

Key available endpoints:

- GET /api/admin/live-events/stream
- GET /api/admin/live-events/recent
- GET /api/admin/users
- GET /api/admin/tenants
- POST /api/admin/tenants
- GET /api/admin/tenants/:id
- PATCH /api/admin/tenants/:id
- GET /api/admin/tenants/:id/usage
- GET /api/admin/tenants/:id/wallet
- GET /api/admin/tenants/:id/campaigns
- POST /api/admin/tenants/enterprise (Create Enterprise Tenant)
- POST /api/admin/tenants/:id/convert-to-enterprise (Convert Tenant to Enterprise)
- POST /api/admin/tenants/:id/clone-to-enterprise (Clone Tenant into Enterprise)
- PATCH /api/admin/tenants/:id/enterprise-credentials (Update Enterprise Credentials)
- POST /api/admin/tenants/:id/enterprise-invite (Send Enterprise Invite)
- GET /api/admin/dev-monitor/calls
- GET /api/admin/dev-monitor/call-events/:call_id
- GET /api/admin/dev-monitor/logs
- GET /api/admin/dev-monitor/livekit-room/:room_name

Legacy browser helpers/redirects also exist:

- /admin/dev-monitor/calls -> redirects to /api/admin/dev-monitor/calls
- /admin/dev-monitor/logs -> redirects to /api/admin/dev-monitor/logs
- /admin/dev-monitor/call-events/:call_id -> redirects to API route

## 5) Master Control UI Status (Latest)

Master control file: public/master-control.html

What is now implemented:

- Clean single valid HTML document (no duplicate/partial DOM corruption)
- Working top tab navigation:
  - Overview
  - Agent Server
  - Backend
  - Frontend
  - Database
  - Tenants
  - Plans
  - Enterprise (New: Admin-only enterprise provisioning actions)
  - Health
  - Settings
- Data wired to real backend routes (not old /api/voice/* paths)
- Admin auth header support included for admin endpoints
- Config persistence in localStorage
- Tenant setting field added for call trigger flow
- Health snapshot blocks included
- Enterprise tab added with forms for:
  - Create Enterprise Account (new tenant)
  - Convert Existing Tenant to Enterprise
  - Clone Existing Tenant Into Enterprise
  - Generate/Set User Credentials
  - Reset Enterprise Credentials
  - Send Invite / Activation

Current endpoint usage in UI:

- /api/admin/dev-monitor/calls
- /api/admin/live-events/recent
- /api/admin/dev-monitor/logs
- /api/admin/tenants
- /api/health
- /health
- /api/calls (for quick call trigger, with x-tenant-id)
- New: /api/admin/tenants/enterprise, /api/admin/tenants/:id/convert-to-enterprise, etc.

Important note:

- /api/calls requires valid tenant context and capability checks.
- Quick trigger works only when tenant is valid and plan has required call capability.
- Enterprise actions require admin auth and include confirmations, audit logging.

## 6) Runtime Checks Performed (Verified)

Latest live checks on localhost:4000:

- /health -> success true, status ok
- /api/health -> success true, status ok
- /api/admin/live-events/recent?limit=5 -> success true
- /api/admin/dev-monitor/calls -> success true
- /api/admin/tenants -> success true

Observed counts at check time:

- Recent events count: 5
- Dev monitor calls count: 1
- Tenants count: 2

## 7) Environment Key Inventory (Safe, Keys Only)

Values intentionally omitted. Keys observed in .env include:

- ADMIN_UI_URL
- API_BASE_URL
- APP_ENV
- BACKEND_WEBHOOK_AUTH_TOKEN
- BACKEND_WEBHOOK_TOKEN
- BACKEND_WEBHOOK_URL
- BILLING_BYPASS
- DATABASE_URL
- DEV_AUTH_EMAIL
- DEV_AUTH_FULL_NAME
- DEV_AUTH_PASSWORD
- DEV_AUTH_TENANT_ID
- DEV_AUTH_TENANT_NAME
- LIVEKIT_AGENT_NAME
- LIVEKIT_API_KEY
- LIVEKIT_API_SECRET
- LIVEKIT_OUTBOUND_TRUNK_ID
- LIVEKIT_URL
- MASTER_CONTROL_PATH
- NODE_ENV
- OUTBOUND_QUEUE_CONCURRENCY
- PAYU_FAILURE_URL
- PAYU_KEY
- PAYU_MODE
- PAYU_REDIRECT_URL
- PAYU_SALT
- PAYU_SUCCESS_URL
- PAYU_WEBHOOK_URL
- PORT
- SIP_OUTBOUND_TRUNK_ID
- VOICE_TEST_MODE
- VOICE_WEBHOOK_BEARER_TOKEN
- VOICE_WEBHOOK_PUBLIC_URL
- WEBHOOK_BRIDGE_ENABLED
- WEBHOOK_BRIDGE_POLL_MS
- WEBHOOK_SERVER_BASE_URL

## 8) Known Constraints and Notes

- Admin APIs require admin key; default fallback in middleware is dev-admin-key if env key not set.
- Call creation route (/api/calls) enforces:
  - x-tenant-id
  - plan capability checks
  - required body fields (roomId, phoneNumber, agentName, direction)
- CORS in backend is strict allowlist + localhost dev-port logic.
- Webhook raw-body handling is configured before JSON parser for voice events.
- Plan enforcement: Self-serve users start on Lexus (basic) only; Enterprise creation is admin-only via dedicated endpoints.

## 9) Recommended Quick Runbook

1. Start backend:
   - npm run dev

2. Open admin UI:
   - http://localhost:4000/admin/master-control

3. In Settings tab, configure:
   - Backend Base URL (normally http://localhost:4000)
   - Admin API Key
   - Default Tenant ID

4. Reload data from UI.

5. Use Overview/Agent tabs for operational checks.

6. For Enterprise provisioning, use the Enterprise tab with admin auth.

## 10) Recent Implementation: Controlled SaaS Plan-Provisioning Model

### Overview
Implemented controlled SaaS plan-provisioning to enforce:
- Lexus (basic) only for self-serve signups.
- Prestige (pro) as upgrade path within product.
- Enterprise as admin-only, no self-serve creation.

### Key Changes
- **Shared Contracts**: Added plans.ts, updated workspace.ts, admin.ts for type safety.
- **Backend Guardrails**: Modified auth.ts (Lexus-only signup), access.ts (gated enterprise), tenantRepository.ts (allowEnterprise flag), adminService.ts (enterprise functions), admin.ts routes (dedicated endpoints).
- **Master Control UI**: Added Enterprise tab with create/convert/clone/credentials/invite actions.
- **Validation**: TypeScript compile passes on touched files; pre-existing errors in paymentReconciliationService.ts and tsconfig.json remain.

### Modified Files
- shared/contracts/plans.ts (new)
- shared/contracts/workspace.ts (updated)
- shared/contracts/admin.ts (extended)
- src/repositories/tenantRepository.ts (added allowEnterprise)
- src/routes/auth.ts (forced Lexus)
- src/routes/access.ts (gated enterprise)
- src/services/adminService.ts (enterprise functions)
- src/routes/admin.ts (enterprise endpoints)
- public/master-control.html (Enterprise tab)

### Pending Tasks
- Fix pre-existing TypeScript errors in paymentReconciliationService.ts and tsconfig.json.
- Perform end-to-end testing of enterprise workflows.

## 11) Change Log (Recent)

- Added and served Master Control UI route.
- Reworked Master Control to use real admin endpoints.
- Fixed blank-tab issue by replacing corrupted HTML with clean, wired build.
- Added tenant-aware quick call trigger path in UI settings.
- Implemented controlled SaaS plan-provisioning model: Lexus-only self-serve, admin-only enterprise, added shared contracts, backend guardrails, enterprise admin endpoints, and Enterprise tab in Master Control UI.
- Fixed lead extraction endpoint field mapping: prevented voice events from overwriting existing lead data with null values, ensuring fields.propertyType, fields.budgetRange, etc. and raw_data are correctly populated.

## 12) Event Types and API Response Structures

This section documents all event types that the backend emits and stores, along with their API response structures for frontend consumption. This ensures the frontend can properly fetch, parse, and display event data without mismatches.

### Voice Event Types
The backend supports the following voice event types (from `shared/contracts/voice-events.ts`):

- `call_started`: First event when call initiates
- `call_ringing`: Outbound SIP ringing
- `call_connected`: Participant joined LiveKit room
- `call_active`: Session started, greeting queued
- `call_transcript_final`: Final transcript with all turns
- `lead_extracted`: Lead fields detected (optional)
- `call_analysis_completed`: AI analysis complete with outcome
- `call_completed`: Call ended normally
- `call_failed`: Call failed with error
- `transcript_partial`: Legacy partial transcript (deprecated)
- `transcript_final`: Legacy final transcript (deprecated)
- `publisher_test`: Test event
- `agent_log`: Agent logging event

### API Endpoints for Events

#### GET /api/admin/live-events/recent
Returns recent CallEvent records.

**Response Structure:**
```json
{
  "success": true,
  "data": [
    {
      "eventId": "uuid",
      "tenantId": "uuid",
      "callId": "uuid",
      "eventType": "call_started", // One of the above types
      "occurredAt": "2026-05-03T10:00:00.000Z",
      "createdAt": "2026-05-03T10:00:00.000Z",
      "payloadJson": { /* Event-specific payload */ },
      "rawEnvelope": { /* Full webhook envelope */ }
    }
  ],
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-05-03T10:00:00.000Z"
  }
}
```

#### GET /api/calls/:id/lead
Returns extracted lead data for a specific call.

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "callId": "uuid",
    "tenantId": "uuid",
    "extractedAt": "2026-05-03T10:00:00.000Z",
    "fields": {
      "name": "string | null",
      "phone": "string | null",
      "summary": "string | null",
      "propertyType": "apartment | plot | villa | commercial | unknown | null",
      "preferredLocation": "string | null",
      "budgetRange": "string | null",
      "timeline": "1-3 months | 3-6 months | long_term | unknown | null"
    },
    "confidence": 0.85, // Float 0.0-1.0 or null
    "raw_data": { /* Raw JSON from lead_extracted or call_analysis_completed event */ }
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-05-03T10:00:00.000Z"
  }
}
```

**Backend enablement note:** Backend now persists both `lead_extracted` and `call_analysis_completed` lead payloads into the `LeadExtraction` record and exposes them through `/api/calls/:id/lead`. This endpoint is the canonical backend source for lead detail screen wiring. **Fixed:** Voice event processing now prevents overwriting existing lead fields with null values from subsequent events, ensuring lead data integrity. **Verified:** Endpoint now correctly returns fields.propertyType, fields.preferredLocation, fields.budgetRange, fields.timeline, and raw_data.

Ran terminal command:  cd /root/new-backend && npm run dev

Ran terminal command:  curl -s -H "Authorization: Bearer dev_token" -H "x-tenant-id: 709b47b6-1dc4-439d-872c-3625fae2374f" "http://localhost:4000/api/calls/b4d45f9a-dfb2-49f4-a839-d6a421e3c3ed/lead" | jq

Replacing 3 lines with 3 lines in [](file:///root/new-backend/NEW_BACKEND_COMPLETE_STATUS_UP-TO-DATE.md)


```

```


Replacing 7 lines with 8 lines in [](file:///root/new-backend/NEW_BACKEND_COMPLETE_STATUS_UP-TO-DATE.md)


```

```
## Summary

I've successfully debugged and fixed the backend controller mapping issue for the `/api/calls/:id/lead` endpoint. Here's what was wrong and how I fixed it:

### Root Cause
The voice event processing was allowing `call_analysis_completed` events to overwrite existing lead data with null values. When `lead_extracted` set valid values for `propertyType`, `preferredLocation`, `budgetRange`, and `timeline`, a subsequent `call_analysis_completed` event could overwrite them with null if its `lead` object didn't contain those fields or had null values.

### The Fix
I modified the lead upsert logic in voice-events.service.ts for both `lead_extracted` and `call_analysis_completed` events to:

1. **Conditionally update fields**: Only update a field if the incoming value is not null/undefined
2. **Preserve existing data**: Prevent good data from being overwritten with nulls
3. **Always update metadata**: Still update `extractedAt`, `confidence`, and `rawJson` as these should reflect the latest event

### Verification
- Ran the voice events integration test, which successfully processed lead extraction events
- Confirmed the database stores the correct values (`propertyType: "apartment"`, etc.)
- Tested the API endpoint, which now returns:
  ```json
  {
    "fields": {
      "propertyType": "apartment",
      "preferredLocation": "Whitefield, Bangalore", 
      "budgetRange": "80L - 1.2Cr",
      "timeline": "short_term"
    },
    "raw_data": "{...full event payload...}"
  }
  ```

The frontend can now reliably fetch and display the extracted lead data using the `/api/calls/:id/lead` endpoint. The backend ensures data integrity by preventing null overwrites while still allowing valid updates from subsequent events.

