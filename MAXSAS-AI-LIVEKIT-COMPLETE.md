# Maxsas-AI-Livekit: Complete Frontend & System Reference

## Overview
Maxsas Realty AI is a full-stack SaaS platform for AI-powered real estate lead qualification via voice calling. This document provides a comprehensive reference for the frontend (Expo React Native) and its integration with the backend and external services.

---

## 1. Tech Stack
| Layer      | Technology                                    |
|------------|-----------------------------------------------|
| Frontend   | Expo / React Native (TypeScript, web + native)|
| Backend    | Node.js / Express / TypeScript                |
| Database   | SQLite via Prisma ORM                         |
| Voice      | LiveKit + Python Agent (DigitalOcean)         |
| STT        | Sarvam (Hindi)                                |
| LLM        | Groq (llama-3.3-70b-versatile)                |
| TTS        | Cartesia (Hindi voice)                        |
| Payments   | Razorpay                                     |
| Realtime   | Server-Sent Events (SSE)                      |

---

## 2. System Architecture
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

---

## 3. Repository Structure
- `app/` — Expo Router pages (file-based routing)
- `components/` — Shared UI primitives, admin/brand-specific screens
- `context/` — App state providers (auth, calls, theming)
- `hooks/` — Custom hooks for API/state
- `lib/` — API clients, adapters, SSE, auth helpers
- `constants/` — Plan/theme constants
- `backend/` — Express server, routes, services, Prisma, middleware
- `shared/contracts/` — TypeScript contracts for request/response/event payloads
- `docs/` — Documentation (setup, architecture, voice, webhook, payment, etc.)

---

## 4. Frontend Implementation
### 4.1 Routing & Layout
- Expo Router file-based navigation.
- `app/_layout.tsx` is the root shell. It handles font loading, splash startup UI, auth bootstrap, and the top-level `<Stack>`.
- Auth guard is active: unauthenticated users in `(protected)` are redirected to `/(public)/login`, and authenticated users in `(public)` land at `/(protected)/lexus`.
- `app/(public)/` — public landing, login, signup, and legal pages.
- `app/(protected)/lexus/` — Lexus user workspace: dashboard, calls, batches, completed, wallet, profile, lead upload.
- `app/(protected)/enterprise/` — enterprise workspace: campaigns, calls, contacts, billing, settings.
- `app/(protected)/admin/` — admin console: admin dashboard, tenant management, live events.
- `app/(tabs)/` — legacy Expo scaffold tabs shell; present but separate from the main product flows.
- `app/modal.tsx` remains a sample modal route.

### 4.2 Responsive Design
- `hooks/useResponsive.ts` provides runtime device breakpoints: `isDesktop`, `isTablet`, `isMobile`.
- Key screens adapt layout, spacing, and content density using the responsive hook.
- The landing page, auth screens, Lexus dashboard, calls, and lead upload all use responsive layout logic.
- Platform-specific extensions are used where needed; web/navigator-specific fallback files remain compatible.

### 4.3 Theming & Design System
- Global dark theme with a premium glassmorphic aesthetic.
- Theme tokens are centralized in `constants/theme.ts` and Lexus-specific theme helpers in `components/lexus/theme.ts`.
- `LexusThemeProvider` persists the theme mode on native via AsyncStorage and on web via localStorage.
- Consistent accent colors, border radii, and typography are applied across the UI.

### 4.4 Auth & Security
- Auth session storage is implemented in `lib/auth/session.ts` and hydrated at startup.
- `bootstrapAuthSession()` and `subscribeAuthSession()` drive session readiness and route-level auth redirects.
- Public sign-in/up screens redirect to the protected Lexus workspace after success.
- Protected-route access is enforced by the root layout, not by a separate route guard component.

### 4.5 API Contracts & Transport
- Main backend API base URL is configured by `EXPO_PUBLIC_API_BASE_URL`; fallback is `http://localhost:4000/api`.
- Tenant resolution uses the current auth session first, then `EXPO_PUBLIC_TENANT_ID` as fallback.
- Shared API transport is centralized in `lib/api/client.ts` with JSON headers, bearer auth, and `x-tenant-id`.
- Voice API and admin API are intentionally separate: voice uses its own base URL and bearer token, while admin uses a dev-admin key.

### 4.6 Workspace Feature Gating
- Lexus, enterprise, and admin features are gated by route group, tenant capability, and plan state.
- Locked or premium-only UI shows upgrade messaging without removing protected screens from the route tree.
- The frontend maintains navigation stability while gating access to enterprise and admin behavior.

---

## 5. Lead Upload & Contact Flow
- Supports CSV/XLS/XLSX upload (99acres, MagicBricks, CRM, etc.)
- Required: 10-digit Indian mobile (starts 6-9)
- Optional: Name, Email, Company, City, Source
- Auto-detects header, dedupes, normalizes phone to +91XXXXXXXXXX
- Rejects malformed numbers; skips ambiguous fields
- Manual add: only 10-digit Indian mobile, validated
- Contacts are local until calls are triggered

---

## 6. Plans & Workspaces
| Plan Key     | Display Name | Route Group                      |
|--------------|--------------|----------------------------------|
| `basic`      | Lexus        | `/app/(protected)/lexus/`        |
| `pro`        | Prestige     | `/app/(protected)/lexus/`        |
| `enterprise` | Enterprise   | `/app/(protected)/enterprise/`   |

---

## 7. Environment Variables (Backend)
- `DATABASE_URL` — SQLite/Postgres connection
- `VOICE_WEBHOOK_BEARER_TOKEN` — Webhook auth
- `APP_ENV` — `development | staging | production`
- `VOICE_TEST_MODE` — `true | false`
- `BILLING_BYPASS` — `true | false`
- `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` — Voice infra
- `SIP_OUTBOUND_TRUNK_ID`, `LIVEKIT_OUTBOUND_TRUNK_ID` — SIP config

---

## 8. Setup & Development
1. Install Node.js 20+ and PostgreSQL 14+.
2. `npm install` (frontend)
3. `cd backend && npm install` (backend)
4. Configure `backend/.env` (see above)
5. `npm run prisma:generate` and `npm run prisma:migrate` (backend)
6. Start backend: `npm run dev` (in backend)
7. Start frontend: `npx expo start` (in root)

Local full-stack (frontend + backend):

1. Create a `.env.local` in the repo root with at least:

      ```env
      EXPO_PUBLIC_API_BASE_URL=http://localhost:4000/api
      EXPO_PUBLIC_TENANT_ID=<your-tenant-id>
      ```

2. From the repo root run:

      ```bash
      npm install
      npm run dev:full
      ```

This runs the Expo frontend and the backend concurrently for local development.

---

## 9. Testing & Production
- See `docs/TESTING_RUNBOOK.md` for local/integration test flows.
- See `docs/PRODUCTION_ROLLOUT.md` for production rollout steps.
- See `docs/SETUP.md` and `docs/ARCHITECTURE.md` for more details.

---

## 10. References
- For contracts, see `shared/contracts/`.
- For API, see `lib/api/` and `backend/src/routes/`.
- For theming, see `constants/theme.ts` and `components/lexus/theme.ts`.
- For plan logic, see `constants/plans.ts` and `context/PlanContext.tsx`.

---

## 11. Additional Notes
- All business logic is in backend `services/` and models in `models/`.
- Context providers manage global state in frontend.
- Use ngrok for local webhook testing.
- Store secrets securely and rotate regularly.

---

*This document is auto-generated for ultimate reference. For any updates, always check the latest codebase and docs folder.*
