# TESTING_RUNBOOK

## Purpose
Run reliable local/integration tests for outbound calls and webhook ingestion without production billing side effects.

## Test-safe env flags
Set these in `backend/.env`:
- `APP_ENV=development`
- `VOICE_TEST_MODE=true`
- `BILLING_BYPASS=true`

## Start backend
1. `cd backend`
2. `npm run dev`

## Test webhook ingestion
1. `npm run test:voice-webhook`
2. Expected:
   - HTTP 202
   - `publisher_test` accepted
   - Event persisted in `call_events`

## Test UI-triggered outbound flow
1. `npm run test:outbound-call`
2. Expected:
   - Row in `outbound_call_requests`
   - Row in `call_sessions` with status transition queued -> dispatching -> ringing/failed

## Verify data quickly (example SQL)
- `SELECT event_id, event_type, occurred_at FROM call_events ORDER BY created_at DESC LIMIT 20;`
- `SELECT id, status, phone_number FROM call_sessions ORDER BY created_at DESC LIMIT 20;`
- `SELECT id, status, call_session_id FROM outbound_call_requests ORDER BY created_at DESC LIMIT 20;`
- `SELECT id, status, amount_paise, notes FROM usage_records ORDER BY created_at DESC LIMIT 20;`

## Common failures
- `INVALID_JSON_BODY`: webhook sender is not JSON.
- `UNAUTHORIZED`: missing/invalid `VOICE_WEBHOOK_BEARER_TOKEN`.
- `OUTBOUND_CALL_FAILED`: LiveKit env missing or trunk/dispatch failed.
