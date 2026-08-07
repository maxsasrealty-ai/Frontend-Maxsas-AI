# ENV_REFERENCE

## Core backend
- `APP_ENV`: `development | staging | production`
- `PORT`: backend port, default `4000`
- `API_BASE_URL`: external backend base URL for callbacks/logging

## Database
- `DATABASE_URL`: Postgres URL (required)

## Voice and telephony
- `VOICE_WEBHOOK_BEARER_TOKEN`: token to validate inbound voice webhook
- `LIVEKIT_URL`: LiveKit server URL
- `LIVEKIT_API_KEY`: LiveKit API key
- `LIVEKIT_API_SECRET`: LiveKit API secret
- `SIP_OUTBOUND_TRUNK_ID`: outbound SIP trunk id
- `LIVEKIT_OUTBOUND_TRUNK_ID`: fallback trunk id if SIP_OUTBOUND_TRUNK_ID is unset

## Behavior controls
- `VOICE_TEST_MODE`: `true | false`
- `BILLING_BYPASS`: `true | false`

## Optional test helpers
- `TEST_TENANT_ID`: used by outbound test script
- `TEST_PHONE_NUMBER`: used by outbound test script

## Production guidance
- Keep `VOICE_TEST_MODE=false` and `BILLING_BYPASS=false`.
- Store secrets in a vault or platform secret manager.
- Rotate webhook and provider credentials periodically.
