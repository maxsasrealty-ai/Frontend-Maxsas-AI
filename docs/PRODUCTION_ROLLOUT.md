# PRODUCTION_ROLLOUT

## Phase 1: Data and migration readiness
1. Point `DATABASE_URL` to managed Postgres.
2. Run in backend:
   - `npm run prisma:generate`
   - `npm run prisma:migrate`
3. Confirm required tables exist:
   - `tenants`, `users`, `call_sessions`, `call_events`, `call_transcripts`, `lead_extractions`, `wallet_ledger`, `usage_records`, `outbound_call_requests`

## Phase 2: Voice event reliability
1. Configure webhook auth token in backend and Python agent sender.
2. Verify event id uniqueness (`event_id`) from sender.
3. Enable monitoring for 4xx/5xx webhook responses.

## Phase 3: Billing controls
1. Production values:
   - `VOICE_TEST_MODE=false`
   - `BILLING_BYPASS=false`
2. Verify wallet balance checks and usage records on `call_completed`.

## Phase 4: Outbound call operations
1. Ensure LiveKit/SIP env values are configured and valid.
2. Trigger outbound calls from UI via `POST /api/calls`.
3. Track lifecycle in DB and logs.

## Phase 5: Observability and support
1. Centralize structured logs.
2. Add alerting for:
   - webhook failures
   - dispatch failures
   - repeated insufficient balance errors
3. Add dashboard over `call_events` and `usage_records`.

## Manual infrastructure steps
- Provision managed Postgres with backup retention and TLS.
- Restrict DB access to backend host/VPC.
- Configure HTTPS reverse proxy for backend webhook endpoint.
