# Copilot Workspace Instructions

## Overview
This workspace is an Expo React Native project with a backend (Node.js/TypeScript) and a file-based routing structure. The main directories are:
- `app/`: Frontend (Expo, React Native)
- `backend/`: Backend (Node.js, Express, TypeScript)
- `components/`, `constants/`, `context/`, `hooks/`, `lib/`: Shared frontend logic
- `docs/`: Documentation (SETUP.md, ARCHITECTURE.md)

## Build & Run
- **Frontend:**
  - Install dependencies: `npm install`
  - Start Expo: `npx expo start`
  - For a fresh project: `npm run reset-project`
- **Backend:**
  - Navigate to `backend/`
  - Install dependencies: `npm install`
  - Start server: `npm run dev` (if available)

## Key Conventions
- **File-based routing** in `app/` (see [Expo docs](https://docs.expo.dev/router/introduction))
- Use TypeScript for both frontend and backend
- Keep business logic in `services/` and models in `models/` (backend)
- Use context providers for global state (frontend)

## Documentation
- See `README.md` for getting started
- See `docs/SETUP.md` and `docs/ARCHITECTURE.md` for project details (currently empty, update as needed)

## Agent Guidance
- **Link, don't embed:** Reference documentation files instead of duplicating content
- **ApplyTo:** For future customizations, consider using `applyTo` for specific instructions (e.g., only for `backend/` or `app/`)
- **Pitfalls:**
  - Ensure correct working directory when running backend commands
  - Keep dependencies in sync between frontend and backend

## Example Prompts
- "How do I add a new screen to the app?"
- "How do I add a new API route to the backend?"
- "How do I reset the project to a blank state?"

---

For more advanced agent customization, see the [agent-customization skill documentation](https://github.com/github/copilot-docs/blob/main/docs/agent-customization.md).
