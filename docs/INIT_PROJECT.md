# INIT_PROJECT

## 1) Clone and install
1. Install Node.js 20+ and PostgreSQL 14+.
2. From repository root, install frontend dependencies:
   - `npm install`
3. Install backend dependencies:
   - `cd backend`
   - `npm install`

## 2) Configure backend env
1. Copy or edit `backend/.env`.
2. Required variables:
   - `DATABASE_URL`
   - `VOICE_WEBHOOK_BEARER_TOKEN`
   - `APP_ENV`
   - `VOICE_TEST_MODE`
   - `BILLING_BYPASS`
3. For LiveKit dispatch in non-test mode, also set:
   - `LIVEKIT_URL`
   - `LIVEKIT_API_KEY`
   - `LIVEKIT_API_SECRET`
   - `SIP_OUTBOUND_TRUNK_ID`

## 3) Generate Prisma client and migrate
1. `cd backend`
2. `npm run prisma:generate`
3. `npm run prisma:migrate`

## 4) Start backend and frontend
1. Backend:
   - `cd backend`
   - `npm run dev`
2. Frontend (new terminal):
   - `cd ..`
   - `npm run start`

## 5) Smoke checks
1. Health check:
   - `GET http://localhost:4000/`
2. Webhook test:
   - `cd backend`
   - `npm run test:voice-webhook`
3. Outbound test:
   - `npm run test:outbound-call`
