# Maxsas-AI-Livekit

**Maxsas Realty AI** — A full-stack SaaS application for AI-powered real estate lead qualification via voice calling.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Expo / React Native (TypeScript, web + native) |
| Backend | Node.js / Express / TypeScript |
| Database | SQLite via Prisma ORM |
| Voice Engine | LiveKit + Python Agent (DigitalOcean, external) |
| STT | Sarvam (Hindi) |
| LLM | Groq (llama-3.3-70b-versatile) |
| TTS | Cartesia (Hindi voice) |
| Payments | Razorpay |
| Realtime | Server-Sent Events (SSE) |

## Quick Start

### Frontend
```bash
npm install
npx expo start
```

### Backend
```bash
cd backend
npm install
npm run dev
# or from the root:
npx tsx --env-file=backend/.env backend/src/index.ts
```

### Expose Webhooks (local dev)
```bash
ngrok http 4000
```

## Lead Upload & Contact Flow

- Upload supports CSV, XLS, XLSX (from 99acres, MagicBricks, CRM, etc)
- Required column: Number (10-digit Indian mobile, must start 6-9)
- Optional: Name, Email, Company, City, Source
- Parser auto-detects header row, dedupes by phone/email, and normalizes phone to +91XXXXXXXXXX
- Noisy/malformed numbers are rejected; ambiguous/multi-number fields are skipped
- Manual Add: Only 10-digit Indian mobile allowed, input is hard-capped and validated
- Contacts are kept local until user starts calls (no DB save before trigger)

See docs/SETUP.md and docs/ARCHITECTURE.md for more details.
## Architecture

```
EXPO FRONTEND (web/native)
      |  REST API (x-tenant-id header)
      |  SSE (realtime stream)
      v
EXPRESS BACKEND (port 4000)
      |  Prisma / SQLite
      |  Raised to public internet via ngrok
      v
LIVEKIT + PYTHON AGENT (157.245.108.130:7880)
      ↓ webhooks → /api/webhooks/voice/events
      ↓ outbound SIP calls via SIP trunk
```

## Workspace / Plan Model

| Plan Key | Display Name | Route Group |
|----------|-------------|-------------|
| `basic`  | Lexus | `/app/(protected)/lexus/` |
| `pro` | Prestige | `/app/(protected)/lexus/` |
| `enterprise` | Enterprise | `/app/(protected)/enterprise/` |

## Key Environment Variables (`backend/.env`)

```env
DATABASE_URL="file:./prisma/dev.db"
VOICE_WEBHOOK_BEARER_TOKEN="dev_secret_token_livekit_99"