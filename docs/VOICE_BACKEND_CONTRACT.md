# Voice Backend Foundation Contract (Phase 1)

This note documents the foundation layer implemented in this repository for voice event ingestion and plan-aware SaaS capability handling.

## Scope
- Frontend and backend remain in one repository.
- Voice runtime remains external (DigitalOcean server).
- Backend is the contract boundary and source of truth.
- This phase adds foundations only, not final UI flows.

## Module Boundaries

### Shared Contracts
Location: shared/contracts

Purpose:
- Define frozen voice event envelope and payload types.
- Define call lifecycle status typing.
- Define API envelope types.
- Define centralized plan capability types.

### Backend Routing and Bootstrap
Location: backend/src

Purpose:
- Express app bootstrap and API base router.
- Health route.
- Voice webhook route shell under /api/webhooks/voice/events.
- Access capabilities route shell under /api/access/capabilities.

### Backend Voice Event Ingestion Foundation
Location: backend/src/middleware, backend/src/services

Purpose:
- Bearer token auth for webhook requests.
- Header requirements: x-event-id, x-call-id, x-occurred-at.
- Envelope validation shell.
- Event normalization shell.
- Idempotency-ready event processing guard.
- Raw payload/raw headers preservation in normalized event shape.
- Tenant-aware request context shape.

### Backend Access / Capability Foundation
Location: backend/src/services/accessService.ts

Purpose:
- Central Basic/Pro/Enterprise capability map.
- Reusable hasCapability/assertCapability utilities.
- Future middleware integration point for route-level gating.

### Frontend Foundation
Location: lib/api, lib/realtime, context, hooks

Purpose:
- Typed API client shell.
- Calls/capabilities method shells.
- Realtime interface shell (no heavy runtime implementation yet).
- Calls context and hook scaffolding for future screen integration.

## Frozen Voice Event Contract (Accepted by Backend)

Envelope:

{
  "event_type": "string",
  "tenant_id": "string",
  "call_id": "string",
  "room_id": "string",
  "occurred_at": "iso-8601",
  "payload": {}
}

Supported event_type values:
- transcript_partial
- transcript_final
- call_started
- lead_extracted
- call_completed
- call_failed

Required webhook headers:
- X-Event-Id
- X-Call-Id
- X-Occurred-At
- Authorization: Bearer <token>

## Next Integration Direction
- Persist normalized events and call state transitions.
- Materialize transcript/recording/lead extraction read models.
- Introduce capability middleware gates on protected backend routes.
- Wire Lexus/Enterprise screens to calls API and realtime client incrementally.
