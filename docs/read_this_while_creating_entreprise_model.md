Paste this as your `.md` content:

# BACKEND_FRONTEND_SYSTEM_REFERENCE_ENTERPRISE_V2

Version: 2.1  
Last Updated: May 2026  
Status: Backend-facing source of truth for frontend architecture, plan routing, theme layers, Enterprise UI direction, and backend wiring expectations.

## Purpose

This document is the authoritative frontend reference for backend-aware development. It exists so backend, frontend, admin-panel, and AI coding agents can work from the same implementation context and avoid routing mismatch, contract drift, plan-state confusion, or duplicated assumptions. The frontend is an Expo React Native app using route-group based workspaces, REST APIs, shared contracts, and SSE for realtime call/batch visibility. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/84080527/68af49a9-c433-43df-ad5f-7ebfa9753f26/MAXSAS-AI-LIVEKIT-COMPLETE.md)

## Core product model

Maxsas AI is a real-estate AI voice-calling SaaS with three plan tiers:

| Plan Key | Display Name | Frontend Workspace | Notes |
|---|---|---|---|
| `basic` | Lexus | Lexus workspace | Default self-serve plan |
| `pro` | Prestige | Lexus workspace | Same route group as Lexus, elevated UI/features |
| `enterprise` | Enterprise | Enterprise workspace | Separate protected route group, admin-controlled |

The frontend consumes REST APIs with tenant-aware behavior and SSE/realtime streams, while voice orchestration stays outside the frontend in the backend + LiveKit + Python agent stack. The backend ecosystem already exposes admin, tenants, calls, realtime, wallet, campaigns, and health surfaces, and Master Control is served from the backend as a static admin UI entrypoint. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/84080527/2fa59168-f634-43da-9466-6a1e062fc353/NEW_BACKEND_COMPLETE_STATUS.md)

## Architecture summary

The current app is built with Expo Router and uses route-group separation for public/authenticated experiences. Lexus and Prestige stay inside the same workspace family, while Enterprise is intentionally isolated as a separate protected workspace with its own layout and navigation model. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/84080527/68af49a9-c433-43df-ad5f-7ebfa9753f26/MAXSAS-AI-LIVEKIT-COMPLETE.md)

### Stack
- Frontend: Expo / React Native / TypeScript [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/84080527/68af49a9-c433-43df-ad5f-7ebfa9753f26/MAXSAS-AI-LIVEKIT-COMPLETE.md)
- Backend: Node.js / Express / TypeScript [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/84080527/68af49a9-c433-43df-ad5f-7ebfa9753f26/MAXSAS-AI-LIVEKIT-COMPLETE.md)
- Database layer behind backend: Prisma-backed relational storage [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/84080527/68af49a9-c433-43df-ad5f-7ebfa9753f26/MAXSAS-AI-LIVEKIT-COMPLETE.md)
- Voice pipeline: LiveKit + Python agent [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/84080527/68af49a9-c433-43df-ad5f-7ebfa9753f26/MAXSAS-AI-LIVEKIT-COMPLETE.md)
- Realtime: SSE [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/84080527/68af49a9-c433-43df-ad5f-7ebfa9753f26/MAXSAS-AI-LIVEKIT-COMPLETE.md)

### Architectural principles
- Frontend remains thin for AI/voice behavior; do not implement LLM pipelines in frontend. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/84080527/68af49a9-c433-43df-ad5f-7ebfa9753f26/MAXSAS-AI-LIVEKIT-COMPLETE.md)
- Plan-aware UI must be state-driven, not screen-duplication-driven.
- Backend remains the eventual source of truth for user plan, tenant state, feature flags, and subscription status.
- Enterprise may use new UI composition, but should reuse existing APIs, shared hooks, and contracts wherever practical.
- Existing Lexus/Prestige behavior should remain stable unless explicitly changed.

## Routing and folder structure

The app is based on Expo Router with route groups for auth, Lexus/Prestige, Enterprise, and Admin. Current known routing style from the frontend reference uses protected/public segmentation and plan-aware workspace grouping. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/84080527/68af49a9-c433-43df-ad5f-7ebfa9753f26/MAXSAS-AI-LIVEKIT-COMPLETE.md)

### Canonical route structure

```text
app/
├── (auth)/
│   ├── login.tsx
│   └── register.tsx
│
├── (lexus)/
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── calls.tsx
│   ├── upload.tsx
│   ├── wallet.tsx
│   ├── profile.tsx
│   ├── batches/
│   │   ├── index.tsx
│   │   └── [batchId]/
│   │       ├── monitor.tsx
│   │       └── results.tsx
│   └── ...
│
├── (enterprise)/
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── projects/
│   │   ├── index.tsx
│   │   └── [projectId].tsx
│   ├── aiscripts/
│   │   └── index.tsx
│   ├── campaigns/
│   │   ├── index.tsx
│   │   └── [batchId]/
│   │       ├── monitor.tsx
│   │       └── results.tsx
│   ├── liveactivity/
│   │   └── index.tsx
│   ├── wallet/
│   │   └── index.tsx
│   ├── team/
│   │   └── index.tsx
│   └── profile/
│       └── index.tsx
│
└── (admin)/
    └── ...
```

### Supporting frontend folders

```text
components/
├── lexus/
├── enterprise/
└── shared/

themes/
├── lexus.theme.ts
├── prestige.theme.ts        # recommended plan-aware extension if implemented
└── enterprise.theme.ts

context/
hooks/
lib/
constants/
docs/
shared/contracts/
```

## Auth and plan gating

Public auth should not expose Enterprise as a normal self-serve option. Enterprise access is route-guarded and plan-gated, while Lexus is default and Prestige is an upgrade layer on top of Lexus workspace behavior. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/84080527/68af49a9-c433-43df-ad5f-7ebfa9753f26/MAXSAS-AI-LIVEKIT-COMPLETE.md)

### Required auth rules
- New/self-serve user default plan: `basic`.
- `basic` and `pro` both route into Lexus workspace family.
- `enterprise` routes into Enterprise workspace.
- Old dev-only Enterprise shortcut on login/auth UI should be removed or hidden behind explicit dev gating.
- Enterprise route group must protect itself and redirect non-enterprise users back to Lexus workspace.

### Recommended route guard

```tsx
if (user.plan !== 'enterprise') {
  return <Redirect href="/(lexus)/" />;
}
```

### Dev-mode rule
If a dev shortcut still exists internally, it must be hidden by default and only render under an explicit dev flag, not as normal product UI.

## Plan behavior model

### Lexus
- Default self-serve product.
- Existing dark premium SaaS UI remains the baseline.
- Bottom-tab/mobile-first dashboard style.
- Existing screens continue to work unchanged unless explicitly modernized. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/84080527/68af49a9-c433-43df-ad5f-7ebfa9753f26/MAXSAS-AI-LIVEKIT-COMPLETE.md)

### Prestige
- Same Lexus workspace and same underlying screens.
- UI should feel premium and slightly elevated, but not fully redesigned.
- Prestige mode should be theme/state-driven, not separate screen duplication.
- On plan expiry, UI should fall back cleanly to Lexus presentation while preserving data and screen compatibility.

### Enterprise
- Separate protected route group.
- Separate composition, navigation style, visual identity, and information hierarchy.
- Same base APIs and shared hooks where reuse is logical.
- Admin-provisioned plan, not self-serve.

## Existing Lexus / Prestige UI baseline

The current frontend uses a dark premium visual system with navy/deep-blue surfaces, rounded cards, blue CTAs, green live status indicators, simple pills, and compact operational dashboards. This visual baseline is already documented in the frontend system reference and should remain the fallback design language for Lexus and the starting layer for Prestige. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/84080527/68af49a9-c433-43df-ad5f-7ebfa9753f26/MAXSAS-AI-LIVEKIT-COMPLETE.md)

### Lexus / Prestige design characteristics
- Dark background and card system.
- Rounded containers and pills.
- Blue primary buttons, green status accents.
- Bottom nav based workflow for Lexus workspace screens.
- Compact dashboard cards for activity, batches, wallet, and calls.
- Profile includes current plan and upgrade CTA patterns.

### Prestige direction
Prestige should remain inside Lexus workspace and only slightly elevate UI:
- richer accent palette,
- more polished primary buttons,
- stronger plan badge treatment,
- refined card surfaces,
- subtle visual difference, no disruptive IA changes.

## Enterprise UI direction

Enterprise is not only a theme variation; it is a structurally different operator-facing workspace designed for brokers and teams. It must feel more operational, more controlled, and more project-aware than Lexus/Prestige.

### Enterprise product intent
Enterprise exists for brokers/teams who need:
- project-wise inventory management,
- project-linked calling context,
- admin-provisioned AI script/instruction packs,
- future add-on controls and broker operations surfaces.

### Enterprise design philosophy
| Dimension | Lexus / Prestige | Enterprise |
|---|---|---|
| Navigation | Bottom-tab oriented | Left rail / operator console |
| Home | Snapshot + lightweight CTA | Operations console |
| Tone | Consumer/pro-agent SaaS | Broker/team operator |
| Layout | Card-heavy centered | Sectioned, operational, two-column capable |
| Plan posture | Self-serve / upgrade path | Admin-provisioned |

### Enterprise theme recommendation
Use a deeper dark surface stack, restrained steel/royal blue accents, cleaner data hierarchy, and more serious enterprise-console ergonomics than Lexus/Prestige. Suggested token set from the proposed reference direction:

```ts
export const enterpriseTheme = {
  bg: '#08090d',
  surface: '#0f1117',
  card: '#13151e',
  card2: '#181b26',
  border: 'rgba(255,255,255,0.07)',
  border2: 'rgba(255,255,255,0.12)',
  text: '#f0f1f5',
  muted: '#8b90a4',
  accent: '#3a7bd5',
  accent2: '#2563a8',
  green: '#1db87a',
  amber: '#e8a020',
  red: '#e04545',
  teal: '#1a9e8f',
  railWidth: 220,
};
```

### Enterprise navigation model
Recommended primary left-rail sections:
- Home
- Projects
- AI Scripts
- Campaigns
- Live Activity
- Wallet & Billing
- Team
- Profile & Settings

On smaller screens, rail may collapse to icon-only or become drawer/bottom-sheet based.

## Enterprise route-by-route implementation brief

### 1. Home / Operations Console
Route: `/(enterprise)/`

Purpose:
- quick operational visibility,
- agent readiness,
- project and campaign summary,
- live status and quick actions.

Recommended sections:
- agent status strip,
- stat tiles,
- quick launch actions,
- active script pack summary,
- active projects preview,
- recent activity feed.

### 2. Projects / Inventory
Route: `/(enterprise)/projects`

Purpose:
- let brokers manage multiple projects as calling context containers.

Recommended project card fields:
- name,
- location,
- project type,
- active status,
- inventory count,
- starting price,
- linked campaign count,
- qualified leads count,
- notes / AI context.

Suggested future data shape:

```ts
interface EnterpriseProject {
  id: string;
  workspaceId: string;
  name: string;
  location: string;
  type: 'residential' | 'plotted' | 'villas' | 'commercial';
  status: 'active' | 'paused' | 'sold_out' | 'coming_soon';
  inventoryCount: number;
  startingPrice: string;
  notes: string;
  campaignCount: number;
  qualifiedLeads: number;
  createdAt: string;
  updatedAt: string;
}
```

### 3. AI Scripts
Route: `/(enterprise)/aiscripts`

Purpose:
- display admin-provisioned script packs and active voice behavior profile.

Current product expectation:
- read-only for broker side,
- admin-provisioned notice,
- active vs inactive script visibility,
- future request-activation action shell.

### 4. Campaigns / Calling
Route: `/(enterprise)/campaigns`

Purpose:
- project-linked campaign management using existing calling foundations.

Notes:
- reuse current upload/calling flow where possible,
- introduce project selector / project association,
- eventually support project-linked batch creation.

### 5. Live Activity
Route: `/(enterprise)/liveactivity`

Purpose:
- real-time monitor reusing existing SSE and monitor logic.

Notes:
- reuse batch monitor and call log foundations,
- enterprise wrapper can add project column and more spacious operator layout.

### 6. Wallet & Billing
Route: `/(enterprise)/wallet`

Purpose:
- same wallet APIs and data, different premium/operator shell.

Notes:
- reuse wallet data hooks,
- enterprise-specific hero card and billing notice acceptable.

### 7. Team
Route: `/(enterprise)/team`

Current state:
- placeholder screen.

Future intent:
- team members,
- access control,
- agent/operator roles,
- audit visibility.

### 8. Profile & Settings
Route: `/(enterprise)/profile`

Purpose:
- enterprise plan identity, admin-provisioned messaging, settings, integrations.

Key expectations:
- show Enterprise badge,
- no upgrade CTA,
- show admin-provisioned messaging,
- optionally add API keys/integrations placeholder.

## Shared component reuse policy

Enterprise should reuse underlying logic and shared UI primitives when possible, but must maintain its own composition layer.

### Reuse candidates
- Batch monitor wrapper
- Batch results
- Call log table base
- SSE provider
- Wallet data hooks
- Profile data hooks
- Upload CSV logic

### Enterprise-only components
- RailNav
- Enterprise top bar
- Project card
- Script card
- Enterprise campaign row
- Agent status panel
- Wallet hero
- Enterprise stat tile

## Mocking policy for frontend-only phase

Enterprise UI should be buildable without backend changes right now. Any enterprise-only surface not yet wired should use structured mocked data and explicit comments for future backend replacement.

### Mock now
- projects list,
- script packs,
- agent status,
- activity feed,
- campaign project linkage,
- team placeholder.

### Do not fake backend mutation
- no fake persisted enterprise upgrade,
- no permanent account mutation,
- no assumption that backend fields already exist unless documented.

## Backend compatibility expectations

The frontend must remain compatible with the current backend architecture, where admin, tenants, calls, live events, wallet, and realtime surfaces are already exposed, and tenant-aware APIs and plan capability checks already exist. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/84080527/2fa59168-f634-43da-9466-6a1e062fc353/NEW_BACKEND_COMPLETE_STATUS.md)

### Current backend realities relevant to frontend
- backend serves Master Control and admin static surfaces [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/84080527/2fa59168-f634-43da-9466-6a1e062fc353/NEW_BACKEND_COMPLETE_STATUS.md)
- admin APIs exist for tenants and live events [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/84080527/2fa59168-f634-43da-9466-6a1e062fc353/NEW_BACKEND_COMPLETE_STATUS.md)
- calls route requires tenant context and capability checks [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/84080527/2fa59168-f634-43da-9466-6a1e062fc353/NEW_BACKEND_COMPLETE_STATUS.md)
- realtime/admin live event surfaces exist already [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/84080527/2fa59168-f634-43da-9466-6a1e062fc353/NEW_BACKEND_COMPLETE_STATUS.md)
- frontend/backend system already relies on shared contracts and plan-aware routing [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/84080527/2fa59168-f634-43da-9466-6a1e062fc353/NEW_BACKEND_COMPLETE_STATUS.md)

### Future backend support likely needed
- explicit enterprise projects endpoints,
- enterprise script pack endpoints,
- activity endpoints,
- optional `projectId` support in batch/campaign entities,
- auth payload exposing authoritative plan and subscription state.

## Documentation update rule

This markdown must be updated every time any of the following changes:
- route group changes,
- plan-routing logic changes,
- enterprise screen additions/removals,
- feature gating changes,
- theme token changes,
- new shared hooks/components,
- mocked surfaces become wired,
- backend contract assumptions change.

## Implementation rules for AI coding agents

- Treat this markdown as the primary spec.
- Do not redesign Lexus/Prestige unless explicitly requested.
- Do not invent backend dependencies for enterprise surfaces still marked as mocked.
- Do not duplicate the full Lexus app to create Enterprise.
- Reuse shared hooks/components where beneficial.
- Keep Enterprise isolated in its own route/components/theme layer.
- Preserve compatibility with existing REST + SSE patterns. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/84080527/68af49a9-c433-43df-ad5f-7ebfa9753f26/MAXSAS-AI-LIVEKIT-COMPLETE.md)
- Respect plan-aware routing and tenant-aware backend assumptions. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/84080527/2fa59168-f634-43da-9466-6a1e062fc353/NEW_BACKEND_COMPLETE_STATUS.md)

## Recommended add-ons

These are recommended additions to make the file stronger for future backend/frontend sync:

### 1. Add a “Change Log” section
Use this structure:

```md
## Change Log

### 2026-05
- Added Enterprise UI layer
- Removed/hid dev-mode Enterprise login shortcut
- Defined separate Enterprise route group expectations
- Added mocked enterprise projects / AI scripts / activity surfaces
```

### 2. Add a “Backend Impact Notes” section
Use this structure:

```md
## Backend Impact Notes

- Enterprise frontend currently renders with mocked data.
- Backend later needs authoritative `plan`, `subscriptionStatus`, and optional `expiresAt`.
- Batch/campaign records may later require optional `projectId` for enterprise linkage.
- Enterprise script pack and project entities are future backend extensions.
```

### 3. Add an “Update Checklist” section
Use this structure:

```md
## Update Checklist

- Routes still accurate
- Auth gating still accurate
- Theme files still accurate
- Shared components list still accurate
- Mocked vs wired surfaces still accurate
- Backend assumptions still accurate
- Enterprise-only screens documented
```

## Suggested final instruction to paste with the prompt

Add this below your prompt when sending to AI:

```text
Instruction:
The attached markdown is the authoritative frontend reference. Read it fully before writing code. Do not skip it. Preserve existing Lexus/Prestige behavior unless the reference explicitly changes it. Keep Enterprise isolated in its own route group and theme layer. Reuse shared components where the document says reuse is intended. Do not require backend changes yet; mock pending enterprise-only surfaces exactly as documented. Update this markdown after implementation so backend can use it as a source-of-truth reference later.
```




# Maxsas AI — Frontend Reference Document
> **Version:** 2.0 — Enterprise UI layer added  
> **Last updated:** May 2026  
> **Status:** Source-of-truth for frontend state, routing, and backend wiring expectations

---

## 1. Overview

Maxsas AI is an Expo React Native SaaS for real-estate AI voice-agent calling. The frontend is structured into three plan tiers:

| Tier | Route Group | Workspace Pattern | Notes |
|------|-------------|-------------------|-------|
| `basic` | `/(lexus)/` | Lexus workspace | Shared with Prestige |
| `pro` | `/(lexus)/` | Prestige workspace | Same group as Lexus, different UI unlocks |
| `enterprise` | `/(enterprise)/` | Enterprise workspace | Separate protected route group |

The app uses:
- **REST + SSE** for real-time call/batch monitoring (`/api/realtime/calls/stream`)
- **Dark premium** visual language across all tiers, with Enterprise having a distinct layout system
- **Shared data contracts** — Enterprise reuses the same API endpoints as Lexus/Prestige wherever possible

---

## 2. Route / Folder Structure

```
app/
├── (auth)/
│   ├── login.tsx            ← Dev-mode Enterprise shortcut REMOVED (see §3)
│   └── register.tsx
│
├── (lexus)/                 ← Lexus + Prestige shared workspace
│   ├── _layout.tsx
│   ├── index.tsx            ← Dashboard/Home
│   ├── calls.tsx
│   ├── upload.tsx
│   ├── wallet.tsx
│   ├── profile.tsx
│   ├── batches/
│   │   ├── index.tsx
│   │   ├── [batchId]/
│   │   │   ├── monitor.tsx
│   │   │   └── results.tsx
│   └── ...
│
└── (enterprise)/            ← Enterprise workspace (NEW §4)
    ├── _layout.tsx          ← Rail nav layout, distinct from Lexus bottom-tab
    ├── index.tsx            ← Enterprise Home / Operations Console
    ├── projects/
    │   ├── index.tsx        ← Projects & Inventory list
    │   └── [projectId].tsx  ← Project detail (future)
    ├── aiscripts/
    │   └── index.tsx        ← AI Scripts / Voice profiles
    ├── campaigns/
    │   ├── index.tsx        ← Campaigns list + Upload
    │   └── [batchId]/
    │       ├── monitor.tsx  ← Reuses Lexus monitor logic
    │       └── results.tsx  ← Reuses Lexus results logic
    ├── liveactivity/
    │   └── index.tsx        ← Live call monitor
    ├── wallet/
    │   └── index.tsx        ← Wallet (reuses Lexus wallet data)
    ├── team/
    │   └── index.tsx        ← Placeholder (coming soon)
    └── profile/
        └── index.tsx        ← Enterprise profile/settings

components/
├── lexus/                   ← Lexus/Prestige-specific components
├── enterprise/              ← NEW: Enterprise-specific components
│   ├── RailNav.tsx          ← Left-rail navigation (desktop/tablet)
│   ├── ETopBar.tsx          ← Enterprise topbar with live status
│   ├── ProjectCard.tsx      ← Project/inventory card
│   ├── ScriptCard.tsx       ← AI Script pack card
│   ├── CampaignRow.tsx      ← Campaign list row
│   ├── AgentStatusPanel.tsx ← Voice agent status widget
│   ├── StatTile.tsx         ← Metric stat tile
│   └── WalletHero.tsx       ← Enterprise wallet hero card
└── shared/                  ← Components shared across tiers
    ├── BatchMonitor.tsx     ← Reused by both Lexus + Enterprise
    ├── CallLogTable.tsx     ← Reused by both
    └── ...

themes/
├── lexus.theme.ts           ← Dark premium (teal/blue accents)
└── enterprise.theme.ts      ← NEW: deeper dark, monospace numerics, slate tones
```

---

## 3. Login / Auth Changes

### 3.1 Dev-Mode Enterprise Shortcut — REMOVED

**Previous behavior:** A "Go to Enterprise (dev)" or similar button existed on the login/auth screen as a developer shortcut to directly enter the Enterprise route group.

**New behavior:**
- That button/shortcut is **removed from the login UI** (or conditionally rendered only when `__DEV__ && SHOW_DEV_SHORTCUTS` env flag is explicitly set)
- The underlying Enterprise code and route group are **NOT deleted**
- Enterprise access is now gated entirely by `user.plan === 'enterprise'` check in the auth guard at `(enterprise)/_layout.tsx`
- After login, users with an enterprise plan are automatically routed to `/(enterprise)/` by the root navigation guard

```tsx
// app/(enterprise)/_layout.tsx
if (user.plan !== 'enterprise') {
  return <Redirect href="/(lexus)/" />;
}
```

### 3.2 Auth Flow (unchanged)
- Login → JWT token stored
- Token decoded → `user.plan` checked
- Redirect to appropriate workspace
- SSE connection established on workspace entry

---

## 4. Enterprise UI Architecture

### 4.1 Design Philosophy

Enterprise is psychologically distinct from Lexus/Prestige. Key differences:

| Dimension | Lexus / Prestige | Enterprise |
|-----------|-----------------|------------|
| Navigation | Bottom tab bar | Left rail nav (sidebar) |
| Home | Activity snapshot, demo CTA | Operational console with project+agent status |
| Composition | Centered, card-heavy | Two-column layout, sectioned hierarchy |
| Typography | Inter/system, emoji icons | DM Sans + DM Mono for numerics |
| Color accent | Teal/cyan | Steel blue (#3a7bd5) with deep slate background |
| Primary tone | Aspirational SaaS | Serious operator console |
| Target user | Individual agent | Broker/team operator |

### 4.2 Enterprise Theme (`enterprise.theme.ts`)

```ts
export const enterpriseTheme = {
  bg:       '#08090d',
  surface:  '#0f1117',
  card:     '#13151e',
  card2:    '#181b26',
  border:   'rgba(255,255,255,0.07)',
  border2:  'rgba(255,255,255,0.12)',
  text:     '#f0f1f5',
  muted:    '#8b90a4',
  accent:   '#3a7bd5',
  accent2:  '#2563a8',
  green:    '#1db87a',
  amber:    '#e8a020',
  red:      '#e04545',
  teal:     '#1a9e8f',
  fontBody: 'DM Sans',
  fontMono: 'DM Mono',
  railWidth: 220,
};
```

### 4.3 Navigation System

Enterprise uses a **left-rail sidebar** instead of the bottom tab bar used by Lexus/Prestige.

```
Rail sections:
  [Logo + plan badge]
  
  Operations:
    Home
    Projects         (badge: active count)
    AI Scripts       (badge: active packs)
  
  Calling:
    Campaigns
    Live Activity    (live pulse indicator)
  
  Account:
    Wallet & Billing
    Team             (badge: Soon)
    Profile & Settings
  
  [Workspace pill — name + role]
```

On mobile (width < 768px), the rail collapses to icons-only or a bottom drawer (implementation detail for later).

---

## 5. Enterprise Screens

### 5.1 Home — Operations Console

**Route:** `/(enterprise)/`  
**Purpose:** Quick operational visibility for the broker.

**Sections:**
1. **Agent status strip** — SSE connection status, active call count
2. **Stat tiles (4-up)** — Active Projects / Campaigns Ready / Calls Today / Wallet Balance
3. **Quick Launch actions** — Start Campaign, Add Project, View AI Scripts
4. **Agent Config State** — Active script pack, provisioned status, model info
5. **Active Projects mini-list** — Top 2 projects with lead counts
6. **Recent Activity feed** — Last 3 actions (calls, project adds, recharges)

**Backend wiring (future):**
- Stat tiles: aggregate from `/api/calls/summary`, `/api/batches/summary`, `/api/wallet/balance`
- Agent status: `/api/enterprise/agent/status`
- Projects: `/api/enterprise/projects?limit=2&status=active`
- Activity: `/api/enterprise/activity/recent`

### 5.2 Projects & Inventory

**Route:** `/(enterprise)/projects/`  
**Purpose:** Broker manages multiple real-estate projects, each used as AI calling context.

**Features:**
- Grid of `ProjectCard` components (name, location, type, status badge, inventory count, starting price, campaign count, qualified leads count)
- "Add Project" inline form (slides in) with fields:
  - Project Name *
  - Location
  - Type (dropdown: Residential Apartments / Plotted / Villas / Commercial)
  - Total Inventory Count
  - Starting Price
  - Status (Active / Paused / Sold Out / Coming Soon)
  - Notes (used as AI agent context — sent to script provisioning)
- AI context indicator per project (set / not set)

**Data model (proposed):**
```ts
interface EnterpriseProject {
  id: string;
  workspaceId: string;
  name: string;
  location: string;
  type: 'residential' | 'plotted' | 'villas' | 'commercial';
  status: 'active' | 'paused' | 'sold_out' | 'coming_soon';
  inventoryCount: number;
  startingPrice: string;
  notes: string;            // → AI agent context
  campaignCount: number;    // derived
  qualifiedLeads: number;   // derived
  createdAt: string;
  updatedAt: string;
}
```

**Backend wiring (future):**
- `GET /api/enterprise/projects` — list
- `POST /api/enterprise/projects` — create
- `PATCH /api/enterprise/projects/:id` — update
- `DELETE /api/enterprise/projects/:id` — delete

**Current state:** Mocked with 3 sample projects.

### 5.3 AI Scripts

**Route:** `/(enterprise)/aiscripts/`  
**Purpose:** View admin-provisioned voice agent script packs. Read-only for the broker.

**Sections:**
1. **Active Voice Behavior Profile** — script name, language, tone, model, provisioned date, behavior flags (qualification on/off, site visit ask, price disclosure level)
2. **Available Script Packs** — cards for each pack (description, tags, project mapping, activation state)
3. **Project Mapping** — which projects each script covers
4. **Future expansion notice** — custom prompt editing coming later

**UI behavior:**
- All content is read-only
- "Request activation from admin" button on inactive packs
- Clear visual distinction between "Active" and "Inactive" states (opacity + badge)
- Admin-provisioned notice banner at top

**Backend wiring (future):**
- `GET /api/enterprise/scripts` — list provisioned packs for workspace
- `GET /api/enterprise/scripts/active` — currently active profile
- Script activation requests → `POST /api/enterprise/scripts/:id/request-activation`

**Current state:** Mocked with 2 script packs ("Real Estate Pro v2" and "Luxury Villas Edition").

### 5.4 Campaigns & Calling

**Route:** `/(enterprise)/campaigns/`  
**Purpose:** Project-linked call campaign management. Reuses core calling flows from Lexus.

**Sections:**
1. **Tab row** — All Campaigns / Upload / Batch History
2. **Campaign list** — `CampaignRow` with name, linked project, contact count, script, progress bar, status badge
3. **Upload panel** — CSV/XLS drop zone (same logic as Lexus upload screen)
4. **Project linkage** — campaigns are associated with a project entity (new field vs Lexus)

**New vs Lexus:**
- Campaigns now carry a `projectId` field
- Campaign creation UI shows project selector
- Agent uses project `notes` as context during the call

**Backend wiring (future):**
- Reuse existing `/api/batches` endpoints
- Add `projectId` field to batch creation payload
- `GET /api/enterprise/campaigns` — campaign list with project enrichment

**Current state:** Mocked with 3 campaigns (1 running, 1 completed, 1 draft).

### 5.5 Live Activity

**Route:** `/(enterprise)/liveactivity/`  
**Purpose:** Real-time batch and call monitor. Reuses Lexus batch monitor logic.

**Features:**
- Running batch status card (batch name, project, RUNNING/MANUAL badge)
- 3-stat row: Completed / In Progress / Pending
- Progress bar
- Call log table with filter tabs (All / Qualified / Neutral / Retry / Failed)
- SSE-connected (same `/api/realtime/calls/stream` as Lexus)

**Differences from Lexus monitor:**
- Shows project name in each call row
- More spacious data table layout
- Integrated into rail nav (no "Back to Home" button)

### 5.6 Wallet & Billing

**Route:** `/(enterprise)/wallet/`  
**Purpose:** Balance, transactions, recharge. Fully reuses Lexus wallet data.

**Sections:**
1. **Wallet hero card** — gradient card with available balance, total/locked/spent breakdown, Recharge + Pricing buttons
2. **Stat tiles** — Total Recharged / Total Spent / Transactions
3. **Transaction history table**
4. **Enterprise plan notice** — 120,000 min/month, 100 concurrent calls, ₹14/call

**Backend wiring:** Same as Lexus — `/api/wallet/balance`, `/api/wallet/transactions`, `/api/wallet/recharge`

### 5.7 Team & Access (Placeholder)

**Route:** `/(enterprise)/team/`  
**Status:** Coming soon placeholder screen

**Future features:**
- Invite team members (agents, managers)
- Project-level access control
- Calling permissions per role
- Activity audit per agent

### 5.8 Profile & Settings

**Route:** `/(enterprise)/profile/`  
**Purpose:** Account information, appearance settings, quick actions.

**Key differences from Lexus profile:**
- Plan badge shows "Enterprise" (not Lexus/Prestige)
- No "Upgrade" CTA (Enterprise is top tier)
- Note: "Admin-provisioned · not self-serve"
- Extra quick action: "API Keys & Integrations"
- Notice: "Enterprise configuration must be performed by your Maxsas account administrator"

**Backend wiring:** Same as Lexus — `/api/user/profile`, `/api/user/settings`

---

## 6. Shared Component Reuse

These components are shared between Lexus/Prestige and Enterprise:

| Component | Shared | Notes |
|-----------|--------|-------|
| `BatchMonitor` | ✅ | Enterprise wraps it in different layout |
| `CallLogTable` | ✅ | Enterprise adds `project` column |
| `WalletData` (hook) | ✅ | Same API, different UI wrapping |
| `SSEProvider` | ✅ | Same stream endpoint |
| `UploadCSV` | ✅ | Enterprise adds project selector |
| `BatchResults` | ✅ | Reused as-is |
| `ProfileData` (hook) | ✅ | Same API |

Enterprise-only components (not shared back to Lexus):
- `RailNav`, `ETopBar`, `ProjectCard`, `ScriptCard`, `CampaignRow`, `AgentStatusPanel`, `WalletHero`, `StatTile`

---

## 7. Mocked Surfaces (Backend Wiring Pending)

| Surface | Mock Data | Expected Endpoint |
|---------|-----------|------------------|
| Projects list | 3 hardcoded projects | `GET /api/enterprise/projects` |
| AI Script packs | 2 hardcoded packs | `GET /api/enterprise/scripts` |
| Agent status | Always "Provisioned" | `GET /api/enterprise/agent/status` |
| Campaign project linkage | Hardcoded project names | `projectId` field on batch entity |
| Activity feed | 3 hardcoded events | `GET /api/enterprise/activity/recent` |
| Team screen | Full placeholder | (future endpoint) |

---

## 8. Backend Compatibility Notes

- Enterprise does **not** require any new backend endpoints to render (all mocked)
- When wiring backend: add `plan: 'enterprise'` check to auth guard responses
- New DB entities needed later: `enterprise_projects`, `enterprise_script_packs`, `enterprise_activity`
- Existing `batches` entity needs `projectId` (nullable, enterprise-only) field added
- All existing Lexus/Prestige API contracts remain unchanged

---

## 9. Existing Lexus/Prestige Screens (Unchanged)

| Screen | Route | Status |
|--------|-------|--------|
| Dashboard | `/(lexus)/` | ✅ Unchanged |
| Calls log | `/(lexus)/calls` | ✅ Unchanged |
| Upload | `/(lexus)/upload` | ✅ Unchanged |
| Wallet | `/(lexus)/wallet` | ✅ Unchanged |
| Profile | `/(lexus)/profile` | ✅ Unchanged |
| Batch monitor | `/(lexus)/batches/[id]/monitor` | ✅ Unchanged |
| Batch results | `/(lexus)/batches/[id]/results` | ✅ Unchanged |

---

## 10. Dev Notes

- To test Enterprise locally: set `user.plan = 'enterprise'` in dev auth mock
- The old dev shortcut button on login is removed; use auth mock instead
- Enterprise theme is imported from `themes/enterprise.theme.ts`
- Rail nav is implemented as a `View` with fixed width; on mobile it collapses
- All Enterprise screens are in `app/(enterprise)/` — do not modify `(lexus)/` screens for Enterprise work

# Maxsas AI — Frontend Reference Document
> **Version:** 2.0 — Enterprise UI layer added  
> **Last updated:** May 2026  
> **Status:** Source-of-truth for frontend state, routing, and backend wiring expectations

---

## 1. Overview

Maxsas AI is an Expo React Native SaaS for real-estate AI voice-agent calling. The frontend is structured into three plan tiers:

| Tier | Route Group | Workspace Pattern | Notes |
|------|-------------|-------------------|-------|
| `basic` | `/(lexus)/` | Lexus workspace | Shared with Prestige |
| `pro` | `/(lexus)/` | Prestige workspace | Same group as Lexus, different UI unlocks |
| `enterprise` | `/(enterprise)/` | Enterprise workspace | Separate protected route group |

The app uses:
- **REST + SSE** for real-time call/batch monitoring (`/api/realtime/calls/stream`)
- **Dark premium** visual language across all tiers, with Enterprise having a distinct layout system
- **Shared data contracts** — Enterprise reuses the same API endpoints as Lexus/Prestige wherever possible

---

## 2. Route / Folder Structure

```
app/
├── (auth)/
│   ├── login.tsx            ← Dev-mode Enterprise shortcut REMOVED (see §3)
│   └── register.tsx
│
├── (lexus)/                 ← Lexus + Prestige shared workspace
│   ├── _layout.tsx
│   ├── index.tsx            ← Dashboard/Home
│   ├── calls.tsx
│   ├── upload.tsx
│   ├── wallet.tsx
│   ├── profile.tsx
│   ├── batches/
│   │   ├── index.tsx
│   │   ├── [batchId]/
│   │   │   ├── monitor.tsx
│   │   │   └── results.tsx
│   └── ...
│
└── (enterprise)/            ← Enterprise workspace (NEW §4)
    ├── _layout.tsx          ← Rail nav layout, distinct from Lexus bottom-tab
    ├── index.tsx            ← Enterprise Home / Operations Console
    ├── projects/
    │   ├── index.tsx        ← Projects & Inventory list
    │   └── [projectId].tsx  ← Project detail (future)
    ├── aiscripts/
    │   └── index.tsx        ← AI Scripts / Voice profiles
    ├── campaigns/
    │   ├── index.tsx        ← Campaigns list + Upload
    │   └── [batchId]/
    │       ├── monitor.tsx  ← Reuses Lexus monitor logic
    │       └── results.tsx  ← Reuses Lexus results logic
    ├── liveactivity/
    │   └── index.tsx        ← Live call monitor
    ├── wallet/
    │   └── index.tsx        ← Wallet (reuses Lexus wallet data)
    ├── team/
    │   └── index.tsx        ← Placeholder (coming soon)
    └── profile/
        └── index.tsx        ← Enterprise profile/settings

components/
├── lexus/                   ← Lexus/Prestige-specific components
├── enterprise/              ← NEW: Enterprise-specific components
│   ├── RailNav.tsx          ← Left-rail navigation (desktop/tablet)
│   ├── ETopBar.tsx          ← Enterprise topbar with live status
│   ├── ProjectCard.tsx      ← Project/inventory card
│   ├── ScriptCard.tsx       ← AI Script pack card
│   ├── CampaignRow.tsx      ← Campaign list row
│   ├── AgentStatusPanel.tsx ← Voice agent status widget
│   ├── StatTile.tsx         ← Metric stat tile
│   └── WalletHero.tsx       ← Enterprise wallet hero card
└── shared/                  ← Components shared across tiers
    ├── BatchMonitor.tsx     ← Reused by both Lexus + Enterprise
    ├── CallLogTable.tsx     ← Reused by both
    └── ...

themes/
├── lexus.theme.ts           ← Dark premium (teal/blue accents)
└── enterprise.theme.ts      ← NEW: deeper dark, monospace numerics, slate tones
```

---

## 3. Login / Auth Changes

### 3.1 Dev-Mode Enterprise Shortcut — REMOVED

**Previous behavior:** A "Go to Enterprise (dev)" or similar button existed on the login/auth screen as a developer shortcut to directly enter the Enterprise route group.

**New behavior:**
- That button/shortcut is **removed from the login UI** (or conditionally rendered only when `__DEV__ && SHOW_DEV_SHORTCUTS` env flag is explicitly set)
- The underlying Enterprise code and route group are **NOT deleted**
- Enterprise access is now gated entirely by `user.plan === 'enterprise'` check in the auth guard at `(enterprise)/_layout.tsx`
- After login, users with an enterprise plan are automatically routed to `/(enterprise)/` by the root navigation guard

```tsx
// app/(enterprise)/_layout.tsx
if (user.plan !== 'enterprise') {
  return <Redirect href="/(lexus)/" />;
}
```

### 3.2 Auth Flow (unchanged)
- Login → JWT token stored
- Token decoded → `user.plan` checked
- Redirect to appropriate workspace
- SSE connection established on workspace entry

---

## 4. Enterprise UI Architecture

### 4.1 Design Philosophy

Enterprise is psychologically distinct from Lexus/Prestige. Key differences:

| Dimension | Lexus / Prestige | Enterprise |
|-----------|-----------------|------------|
| Navigation | Bottom tab bar | Left rail nav (sidebar) |
| Home | Activity snapshot, demo CTA | Operational console with project+agent status |
| Composition | Centered, card-heavy | Two-column layout, sectioned hierarchy |
| Typography | Inter/system, emoji icons | DM Sans + DM Mono for numerics |
| Color accent | Teal/cyan | Steel blue (#3a7bd5) with deep slate background |
| Primary tone | Aspirational SaaS | Serious operator console |
| Target user | Individual agent | Broker/team operator |

### 4.2 Enterprise Theme (`enterprise.theme.ts`)

```ts
export const enterpriseTheme = {
  bg:       '#08090d',
  surface:  '#0f1117',
  card:     '#13151e',
  card2:    '#181b26',
  border:   'rgba(255,255,255,0.07)',
  border2:  'rgba(255,255,255,0.12)',
  text:     '#f0f1f5',
  muted:    '#8b90a4',
  accent:   '#3a7bd5',
  accent2:  '#2563a8',
  green:    '#1db87a',
  amber:    '#e8a020',
  red:      '#e04545',
  teal:     '#1a9e8f',
  fontBody: 'DM Sans',
  fontMono: 'DM Mono',
  railWidth: 220,
};
```

### 4.3 Navigation System

Enterprise uses a **left-rail sidebar** instead of the bottom tab bar used by Lexus/Prestige.

```
Rail sections:
  [Logo + plan badge]
  
  Operations:
    Home
    Projects         (badge: active count)
    AI Scripts       (badge: active packs)
  
  Calling:
    Campaigns
    Live Activity    (live pulse indicator)
  
  Account:
    Wallet & Billing
    Team             (badge: Soon)
    Profile & Settings
  
  [Workspace pill — name + role]
```

On mobile (width < 768px), the rail collapses to icons-only or a bottom drawer (implementation detail for later).

---

## 5. Enterprise Screens

### 5.1 Home — Operations Console

**Route:** `/(enterprise)/`  
**Purpose:** Quick operational visibility for the broker.

**Sections:**
1. **Agent status strip** — SSE connection status, active call count
2. **Stat tiles (4-up)** — Active Projects / Campaigns Ready / Calls Today / Wallet Balance
3. **Quick Launch actions** — Start Campaign, Add Project, View AI Scripts
4. **Agent Config State** — Active script pack, provisioned status, model info
5. **Active Projects mini-list** — Top 2 projects with lead counts
6. **Recent Activity feed** — Last 3 actions (calls, project adds, recharges)

**Backend wiring (future):**
- Stat tiles: aggregate from `/api/calls/summary`, `/api/batches/summary`, `/api/wallet/balance`
- Agent status: `/api/enterprise/agent/status`
- Projects: `/api/enterprise/projects?limit=2&status=active`
- Activity: `/api/enterprise/activity/recent`

### 5.2 Projects & Inventory

**Route:** `/(enterprise)/projects/`  
**Purpose:** Broker manages multiple real-estate projects, each used as AI calling context.

**Features:**
- Grid of `ProjectCard` components (name, location, type, status badge, inventory count, starting price, campaign count, qualified leads count)
- "Add Project" inline form (slides in) with fields:
  - Project Name *
  - Location
  - Type (dropdown: Residential Apartments / Plotted / Villas / Commercial)
  - Total Inventory Count
  - Starting Price
  - Status (Active / Paused / Sold Out / Coming Soon)
  - Notes (used as AI agent context — sent to script provisioning)
- AI context indicator per project (set / not set)

**Data model (proposed):**
```ts
interface EnterpriseProject {
  id: string;
  workspaceId: string;
  name: string;
  location: string;
  type: 'residential' | 'plotted' | 'villas' | 'commercial';
  status: 'active' | 'paused' | 'sold_out' | 'coming_soon';
  inventoryCount: number;
  startingPrice: string;
  notes: string;            // → AI agent context
  campaignCount: number;    // derived
  qualifiedLeads: number;   // derived
  createdAt: string;
  updatedAt: string;
}
```

**Backend wiring (future):**
- `GET /api/enterprise/projects` — list
- `POST /api/enterprise/projects` — create
- `PATCH /api/enterprise/projects/:id` — update
- `DELETE /api/enterprise/projects/:id` — delete

**Current state:** Mocked with 3 sample projects.

### 5.3 AI Scripts

**Route:** `/(enterprise)/aiscripts/`  
**Purpose:** View admin-provisioned voice agent script packs. Read-only for the broker.

**Sections:**
1. **Active Voice Behavior Profile** — script name, language, tone, model, provisioned date, behavior flags (qualification on/off, site visit ask, price disclosure level)
2. **Available Script Packs** — cards for each pack (description, tags, project mapping, activation state)
3. **Project Mapping** — which projects each script covers
4. **Future expansion notice** — custom prompt editing coming later

**UI behavior:**
- All content is read-only
- "Request activation from admin" button on inactive packs
- Clear visual distinction between "Active" and "Inactive" states (opacity + badge)
- Admin-provisioned notice banner at top

**Backend wiring (future):**
- `GET /api/enterprise/scripts` — list provisioned packs for workspace
- `GET /api/enterprise/scripts/active` — currently active profile
- Script activation requests → `POST /api/enterprise/scripts/:id/request-activation`

**Current state:** Mocked with 2 script packs ("Real Estate Pro v2" and "Luxury Villas Edition").

### 5.4 Campaigns & Calling

**Route:** `/(enterprise)/campaigns/`  
**Purpose:** Project-linked call campaign management. Reuses core calling flows from Lexus.

**Sections:**
1. **Tab row** — All Campaigns / Upload / Batch History
2. **Campaign list** — `CampaignRow` with name, linked project, contact count, script, progress bar, status badge
3. **Upload panel** — CSV/XLS drop zone (same logic as Lexus upload screen)
4. **Project linkage** — campaigns are associated with a project entity (new field vs Lexus)

**New vs Lexus:**
- Campaigns now carry a `projectId` field
- Campaign creation UI shows project selector
- Agent uses project `notes` as context during the call

**Backend wiring (future):**
- Reuse existing `/api/batches` endpoints
- Add `projectId` field to batch creation payload
- `GET /api/enterprise/campaigns` — campaign list with project enrichment

**Current state:** Mocked with 3 campaigns (1 running, 1 completed, 1 draft).

### 5.5 Live Activity

**Route:** `/(enterprise)/liveactivity/`  
**Purpose:** Real-time batch and call monitor. Reuses Lexus batch monitor logic.

**Features:**
- Running batch status card (batch name, project, RUNNING/MANUAL badge)
- 3-stat row: Completed / In Progress / Pending
- Progress bar
- Call log table with filter tabs (All / Qualified / Neutral / Retry / Failed)
- SSE-connected (same `/api/realtime/calls/stream` as Lexus)

**Differences from Lexus monitor:**
- Shows project name in each call row
- More spacious data table layout
- Integrated into rail nav (no "Back to Home" button)

### 5.6 Wallet & Billing

**Route:** `/(enterprise)/wallet/`  
**Purpose:** Balance, transactions, recharge. Fully reuses Lexus wallet data.

**Sections:**
1. **Wallet hero card** — gradient card with available balance, total/locked/spent breakdown, Recharge + Pricing buttons
2. **Stat tiles** — Total Recharged / Total Spent / Transactions
3. **Transaction history table**
4. **Enterprise plan notice** — 120,000 min/month, 100 concurrent calls, ₹14/call

**Backend wiring:** Same as Lexus — `/api/wallet/balance`, `/api/wallet/transactions`, `/api/wallet/recharge`

### 5.7 Team & Access (Placeholder)

**Route:** `/(enterprise)/team/`  
**Status:** Coming soon placeholder screen

**Future features:**
- Invite team members (agents, managers)
- Project-level access control
- Calling permissions per role
- Activity audit per agent

### 5.8 Profile & Settings

**Route:** `/(enterprise)/profile/`  
**Purpose:** Account information, appearance settings, quick actions.

**Key differences from Lexus profile:**
- Plan badge shows "Enterprise" (not Lexus/Prestige)
- No "Upgrade" CTA (Enterprise is top tier)
- Note: "Admin-provisioned · not self-serve"
- Extra quick action: "API Keys & Integrations"
- Notice: "Enterprise configuration must be performed by your Maxsas account administrator"

**Backend wiring:** Same as Lexus — `/api/user/profile`, `/api/user/settings`

---

## 6. Shared Component Reuse

These components are shared between Lexus/Prestige and Enterprise:

| Component | Shared | Notes |
|-----------|--------|-------|
| `BatchMonitor` | ✅ | Enterprise wraps it in different layout |
| `CallLogTable` | ✅ | Enterprise adds `project` column |
| `WalletData` (hook) | ✅ | Same API, different UI wrapping |
| `SSEProvider` | ✅ | Same stream endpoint |
| `UploadCSV` | ✅ | Enterprise adds project selector |
| `BatchResults` | ✅ | Reused as-is |
| `ProfileData` (hook) | ✅ | Same API |

Enterprise-only components (not shared back to Lexus):
- `RailNav`, `ETopBar`, `ProjectCard`, `ScriptCard`, `CampaignRow`, `AgentStatusPanel`, `WalletHero`, `StatTile`

---

## 7. Mocked Surfaces (Backend Wiring Pending)

| Surface | Mock Data | Expected Endpoint |
|---------|-----------|------------------|
| Projects list | 3 hardcoded projects | `GET /api/enterprise/projects` |
| AI Script packs | 2 hardcoded packs | `GET /api/enterprise/scripts` |
| Agent status | Always "Provisioned" | `GET /api/enterprise/agent/status` |
| Campaign project linkage | Hardcoded project names | `projectId` field on batch entity |
| Activity feed | 3 hardcoded events | `GET /api/enterprise/activity/recent` |
| Team screen | Full placeholder | (future endpoint) |

---

## 8. Backend Compatibility Notes

- Enterprise does **not** require any new backend endpoints to render (all mocked)
- When wiring backend: add `plan: 'enterprise'` check to auth guard responses
- New DB entities needed later: `enterprise_projects`, `enterprise_script_packs`, `enterprise_activity`
- Existing `batches` entity needs `projectId` (nullable, enterprise-only) field added
- All existing Lexus/Prestige API contracts remain unchanged

---

## 9. Existing Lexus/Prestige Screens (Unchanged)

| Screen | Route | Status |
|--------|-------|--------|
| Dashboard | `/(lexus)/` | ✅ Unchanged |
| Calls log | `/(lexus)/calls` | ✅ Unchanged |
| Upload | `/(lexus)/upload` | ✅ Unchanged |
| Wallet | `/(lexus)/wallet` | ✅ Unchanged |
| Profile | `/(lexus)/profile` | ✅ Unchanged |
| Batch monitor | `/(lexus)/batches/[id]/monitor` | ✅ Unchanged |
| Batch results | `/(lexus)/batches/[id]/results` | ✅ Unchanged |

---

## 10. Dev Notes

- To test Enterprise locally: set `user.plan = 'enterprise'` in dev auth mock
- The old dev shortcut button on login is removed; use auth mock instead
- Enterprise theme is imported from `themes/enterprise.theme.ts`
- Rail nav is implemented as a `View` with fixed width; on mobile it collapses
- All Enterprise screens are in `app/(enterprise)/` — do not modify `(lexus)/` screens for Enterprise work

## Change Log

### 2026-05
- Added Enterprise UI layer inside app/(protected)/enterprise
- Implemented RailNav, ETopBar, and updated layouts
- Replaced Tabs with left-rail navigation for Enterprise
- Changed nomenclature: Batch -> Campaigns, Leads -> Calls
- Created mocked screens for Operations Console, Projects, AI Scripts, Campaigns, Live Activity, Wallet, Team, and Profile

## Backend Impact Notes
- Enterprise frontend currently renders with mocked data.
- Backend later needs authoritative plan, subscriptionStatus, and optional expiresAt.
- Batch/campaign records may later require optional projectId for enterprise linkage.
- Enterprise script pack and project entities are future backend extensions.

## Update Checklist
- Routes updated to (protected)/enterprise
- Theme files added to themes/enterprise.theme.ts
- Mocked screens completed
