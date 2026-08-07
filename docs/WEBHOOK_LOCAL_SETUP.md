# Local Webhook Setup (PowerShell)

This document outlines the exact end-to-end setup to bridge the external voice server (LiveKit/Python agent) back into your local Maxsas repository running on Windows.

**Last updated:** April 2026

## 1. Local Backend Diagnostics
- **Backend Port:** `4000` (Defined in `backend/src/index.ts`)
- **Webhook Route:** `/api/webhooks/voice/events` (Mounted via `backend/src/routes/index.ts`)
- **Auth Token Env:** `VOICE_WEBHOOK_BEARER_TOKEN` (Checked by `backend/src/middleware/verifyWebhookAuth.ts`)
- **Webhook Debug Logger:** All requests to `/api/webhooks/*` are automatically logged to the backend terminal (method, path, headers, body) — no extra setup needed.

> **⚠ Blocker Identified:** Your `backend/.env` file is currently missing the `VOICE_WEBHOOK_BEARER_TOKEN` variable entirely. If not set, the middleware purposefully fails closed (Status 500) preventing any payload ingestion. 

## 2. Setting Up `.env`
Run this exact PowerShell command to append the missing key to your backend environment securely:

```powershell
Add-Content -Path backend\.env -Value "`nVOICE_WEBHOOK_BEARER_TOKEN=`"dev_secret_token_livekit_99`""
```

## 3. Verify Local Env Token Extraction
Verify the token is attached by executing this regex match check natively inside PowerShell:

```powershell
Select-String -Path backend\.env -Pattern "VOICE_WEBHOOK_BEARER_TOKEN"
```

## 4. Run the Backend
Ensure the backend is actively listening on port 4000. Open a separate PowerShell terminal and run:

```powershell
# Recommended — loads backend/.env via --env-file flag:
npx tsx --env-file=backend\.env backend/src/index.ts

# Alternative (if running from backend/ folder):
cd backend && npm run dev
```

On startup you should see:
```
[TELEPHONY ENV] URL: Set, API_KEY: Set, API_SECRET: Set, TRUNK_ID: Set
Backend listening on port 4000
```

## 5. Expose Webhooks via Tunnel (ngrok)
External agents cannot hit `localhost:4000`. You must expose this port to the public internet using `ngrok`. Open another PowerShell window and run:

```powershell
ngrok http 4000
```

*Expected Output snippet:*
```text
Forwarding                    https://1234-abcd.ngrok-free.app -> http://localhost:4000
```

## 6. Remote Server `.env.local` Configurations
Copy the **Forwarding** URL from the ngrok output above, and append the route string `/api/webhooks/voice/events`. Place it into the external voice agent's (`Vobiz`) `.env.local` configurations like this:

```env
# Remote Server Target
BACKEND_WEBHOOK_URL="https://<YOUR_NGROK_ID>.ngrok-free.app/api/webhooks/voice/events"
BACKEND_WEBHOOK_AUTH_TOKEN="dev_secret_token_livekit_99"
```

## 7. Immediate Local Test (PowerShell script)
To verify everything is active before turning on the external server, test your local connection by opening PowerShell and executing this exact block. It invokes a fake `call_started` state straight through to the endpoint organically mimicking the agent.

```powershell
$headers = @{
    "Authorization" = "Bearer dev_secret_token_livekit_99"
    "Content-Type"  = "application/json"
}

$body = @{
    event_type = "call_started"
    tenant_id  = "test_tenant"
    call_id    = "manual-test-call-123"
    room_id    = "room_test_123"
    occurred_at= (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
    payload    = @{
        status       = "started"
        phone_number = "+919876543210"
        agent_name   = "lexus-agent"
        direction    = "outbound"
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "http://localhost:4000/api/webhooks/voice/events" -Method Post -Headers $headers -Body $body
```

If successful, the backend will return a `202 Accepted` response holding `{ "success": true, "data": { "accepted": true ... } }`.
