## Maxsas-AI-Livekit Architecture

**Last updated:** April 2026

This project is a full-stack application with:

- **Frontend:** Expo React Native (TypeScript), file-based routing via Expo Router
- **Backend:** Node.js, Express, TypeScript, Prisma ORM (SQLite)
- **Voice:** LiveKit + Python Agent on an external DigitalOcean server

---

### System Architecture

```text
EXPO FRONTEND (localhost:8081, web + native)
      │   REST calls (Authorization / x-tenant-id headers)
      │   SSE stream  (GET /api/realtime/calls/stream)
      ▼
EXPRESS BACKEND (localhost:4000)
      │   Prisma ↔ SQLite (backend/prisma/dev.db)
      │   In-memory SSE fanout per tenant
      │   Exposed publicly via ngrok for local dev
      ▼
LIVEKIT SERVER (157.245.108.130:7880, Docker)
      │   Python Agent (uv run python agent.py dev)
      │   Sarvam STT → Groq LLM → Cartesia TTS
      ▼
   OUTBOUND SIP CALLS (via SIP trunk ST_xxx)
      │   Voice result webhooks
      ▼
BACKEND /api/webhooks/voice/events
      │   Normalized → Prisma → SSE push back to frontend
```

---

### Directory Structure

- `app/` — Expo React Native app (file-based routing)
- `backend/` — Node.js/Express API server
  - `src/index.ts` — Entry point (CORS, JSON body, webhook logger, route mount)
  - `src/routes/` — Route handlers
  - `src/services/` — Business logic (call, telephony, voice events, payment, realtime)
  - `src/repositories/` — Prisma DB access layer
  - `src/middleware/` — Auth guards and request context
  - `prisma/schema.prisma` — SQLite schema
- `components/` — Shared React Native UI components
- `constants/`, `context/`, `hooks/`, `lib/` — Frontend shared logic
- `shared/contracts/` — Shared TypeScript DTOs (used by both frontend and backend)
- `docs/` — Documentation

---

#### Frontend (`app/` & `components/`)

- Uses **Expo Router** for file-based navigation.
- Route groups:
  - `app/(public)/` — Landing, login, signup, terms, privacy, refund
  - `app/(protected)/lexus/` — Lexus workspace (basic/pro plan users)
  - `app/(protected)/enterprise/` — Enterprise workspace
  - `app/(protected)/admin/` — Admin panel
- UI primitives live in `components/lexus/` (GlassCard, PillButton, StatusPill, SectionHeader, theme.ts).
- Global state via React context (`context/CallsContext.tsx`).
- Capability-driven feature gating: every feature checks `useCapabilities()`.

---

#### Backend (`backend/`)

- Express server with TypeScript
- **Key env check on startup:** logs `[TELEPHONY ENV] URL/API_KEY/API_SECRET/TRUNK_ID: Set|Missing`
- **Webhook debug logger:** any request to `/api/webhooks/*` is logged (method, path, headers, body) before routing
- API routes in `backend/src/routes/`
- Business logic in `backend/src/services/`
  - `telephonyService.ts` — LiveKit SDK orchestration (Room + AgentDispatch + SIP)
  - `voiceEventService.ts` — Webhook payload normalization → Prisma → SSE push
  - `callService.ts` — Call state machine orchestration
  - `paymentService.ts` — Razorpay + idempotent wallet debit
  - `realtimeService.ts` — In-memory SSE listener registry
- Data persistence via Prisma (`backend/src/repositories/`)
- Middleware: `requireTenant`, `requireCapability`, `requireAdminAccess`, `verifyWebhookAuth`, `lexusGuard`, `enterpriseGuard`

---

#### AI Voice Server (External)

- LiveKit + Python Agent run on a separate Ubuntu machine (DigitalOcean, `157.245.108.130`)
- Handles Sarvam STT, Groq LLM, Cartesia TTS.
- *For details, refer to `docs/VOICE_AGENT_SETUP.md`.*

---

### Key Conventions

- TypeScript everywhere (strict mode)
- Shared contracts (`shared/contracts/`) used by both frontend and backend — never duplicate types
- Keep business logic out of route handlers (use services/repositories)
- Use React context for global state in frontend
- Capability flags (`useCapabilities`) drive all feature gating — never hardcode plan checks in UI
- Env vars loaded from `backend/.env` via `--env-file` flag or `process.loadEnvFile`
