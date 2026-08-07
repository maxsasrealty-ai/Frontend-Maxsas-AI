Vercel deployment checklist for maxsas-backend

Required environment variables (minimum for production):

- DATABASE_URL: Postgres connection string
- NODE_ENV: production
- APP_ENV: production
- AUTH_BEARER_TOKEN: bearer token used by services (or set to a secure value)
- ADMIN_API_KEY: key for admin API access
- PUBLIC_APP_URL or FRONTEND_BASE_URL: public URL of the frontend (used for payment redirects)

Optional but recommended:

- API_BASE_URL: explicit backend base URL (defaults to https://<VERCEL_URL> when present)
- VERCEL_URL: (set automatically by Vercel at runtime)
- REDIS_URL: Redis instance for queues
- LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET: LiveKit credentials
- SIP_OUTBOUND_TRUNK_ID or LIVEKIT_OUTBOUND_TRUNK_ID
- VOICE_WEBHOOK_PUBLIC_URL
- VOICE_WEBHOOK_BEARER_TOKEN or BACKEND_WEBHOOK_TOKEN or BACKEND_WEBHOOK_AUTH_TOKEN
- PAYU_KEY, PAYU_SALT, PAYU_MODE (test|live) and/or RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET

CORS / Origins

- Use `CORS_ALLOWED_ORIGINS` to provide a comma-separated list of allowed origins (e.g., https://app.example.com,https://admin.example.com).
- The backend also derives allowed origins from `API_BASE_URL` and `PUBLIC_APP_URL` when present.

Frontend URL patterns (preserved contract)

- API root: https://<backend-host>/api
- Health: GET https://<backend-host>/health
- Webhooks: https://<backend-host>/api/webhooks/voice/events
- Calls: https://<backend-host>/api/calls/...
- Admin UI (static): https://<backend-host>/admin (or served separately on the frontend)

Frontend Expo env vars

- `EXPO_PUBLIC_API_BASE_URL`: must point to the backend host, for example `https://api.example.com`
- `EXPO_PUBLIC_VOICE_API_BASE_URL`: use if voice traffic is routed to a separate backend host
- `EXPO_PUBLIC_AUTH_BEARER_TOKEN`: optional dev fallback token
- `EXPO_PUBLIC_TENANT_ID`: optional dev fallback tenant ID

If the frontend still calls `/api/auth/login` without a full host, the browser will send that request to the frontend origin. On Vercel that produces a 405 when the frontend project is only serving static web output and does not also proxy or host the backend POST route.

In this repo, the web client resolves its API base from `EXPO_PUBLIC_API_BASE_URL`. If that variable is missing in production, the client falls back to the current site origin under `/api`, which only works when the backend is actually mounted there. For a separate backend deployment, set `EXPO_PUBLIC_API_BASE_URL` to the real backend host before building and redeploying.

Notes

- Long-running workers (outbound call worker, account deletion sweeper, webhook bridge) must run outside Vercel (use a VM/container or a worker platform). The serverless functions will not host long-lived background processes.
- The app derives `API_BASE_URL` from `VERCEL_URL` if `API_BASE_URL` is not set. Set `API_BASE_URL` explicitly if you need a canonical URL different from the Vercel generated domain.

Quick local test commands

```bash
# start locally
npm run dev

# test health
curl -i http://localhost:4000/health

# test API (replace with actual endpoint)
curl -i -X GET http://localhost:4000/api/calls -H "Origin: http://localhost:3000"
```



to mujhe krna kya h is problem ka soltion(fix) kis jagah kiya jayega frontend ya backend

Is case me main fix frontend side par hai, backend logic me nahi.

Reason ye hai ki login request auth.ts se ja rahi hai, aur base URL logic base-url.ts me production par relative /api fallback use kar raha hai. Vercel par agar EXPO_PUBLIC_API_BASE_URL set nahi hai, to request frontend origin par chali jaati hai aur 405 milta hai.

Kya karna hai:

Frontend Vercel env me EXPO_PUBLIC_API_BASE_URL set karo

Isko apne real backend URL par point karo, jaise https://your-backend-domain.com/api
Fir redeploy karo
Agar same-origin /api use karna hai, to backend proxy/rewrite chahiye

Tab backend ko Vercel ya reverse proxy ke through /api/auth/login handle karna hoga
Sirf frontend static deploy se ye automatically nahi hoga
Short answer: agar backend alag deploy hai, fix frontend deployment config me hoga. Backend code tab change karna padega jab route hi missing ho ya method galat expose ho, lekin tumhare error me sabse likely issue route mapping / base URL hai.


fronend / .env
EXPO_PUBLIC_API_BASE_URL=http://134.209.157.41:4000/api
EXPO_PUBLIC_VOICE_API_BASE_URL=http://134.209.157.41:8080