# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**The Inquisitor** is an LLM-driven detective/interrogation game: each game session generates a murder scenario, secretly picks a culprit among the NPCs, and the player interrogates AI-driven NPCs across village locations before condemning one. Product spec (Turkish) is in `proje.md`. Code comments, log messages and user-facing strings are mostly Turkish — keep that convention.

The repo is a monorepo with three independent npm projects (no root `package.json`, no workspaces):

- `backend/` — NestJS 11 + Prisma (PostgreSQL) API. Deployed to Render (`render.yaml`, `backend/RENDER.md`).
- `frontend/` — Next.js 16 (App Router) web client, Zustand store, SCSS modules + Tailwind 4.
- `mobile/` — Expo 54 / React Native client with React Navigation, talks to the same backend.

`frontend/CLAUDE.md` (→ `frontend/AGENTS.md`) applies when working in `frontend/`: this Next.js version has breaking changes vs. training data — read `frontend/node_modules/next/dist/docs/` before writing Next.js code.

## Commands

Run each in its own directory.

**Local database:** `docker compose up -d` (repo root) starts Postgres 15 at `postgresql://user:password@localhost:5432/inquisitor`.

**Backend** (`backend/`, copy `.env.example` → `.env`; listens on port 3001):
- `npm run start:dev` — watch mode
- `npm run prisma:generate` / `npm run prisma:push` — regenerate client / sync schema (no migrations; schema is pushed with `db push`)
- `npm run seed` — seed base NPCs
- `npm run lint`, `npm run build`
- `npm test` — Jest unit tests (`src/**/*.spec.ts`); single file: `npx jest src/npcs/npcs.service.spec.ts`; single test: `npx jest -t "name"`
- `npm run test:e2e` — `test/*.e2e-spec.ts`
- Production build output is `dist/src/main` (`render:start`), not `dist/main`.

**Frontend** (`frontend/`): `npm run dev`, `npm run build` (uses `--webpack`), `npm run lint`. No tests.

**Mobile** (`mobile/`): `npm start` (or `start:lan` / `start:tunnel`), `npm run typecheck`, `npm run build:android:preview` (EAS). The GitHub workflow `.github/workflows/build-apk.yml` builds the APK locally via EAS on manual dispatch.

## Architecture

### Backend modules (`backend/src`)
- `auth/` — email verification-code signup (mails via `MAIL_USER`/`MAIL_PASS`), password login, JWT (`JwtAuthGuard`). Also owns daily quota tracking (`checkAndResetDailyQuota`, session/message counters on `User`), premium activation, and per-user audio settings. Admin user is bootstrapped from `ADMIN_EMAIL`/`ADMIN_PASSWORD` in `onModuleInit`.
- `game-sessions/` — session lifecycle: create, advance time of day / end day, notes, search warrants, condemn, timeout. Quota and premium gating (difficulty ≠ `easy` or scenario ≠ `medieval` requires premium) is enforced in the **controller**.
- `npcs/` — `POST /npcs/interact` (one dialogue turn) and `POST /npcs/history`. Builds the NPC prompt from scenario config + session state and persists `DialogueHistory`.
- `llm/` — single `LlmService` using the **OpenAI SDK pointed at Gemini's OpenAI-compatible endpoint** (`GEMINI_API_KEY`). `createCompletion` walks a model fallback chain (`GEMINI_MODELS` env, comma-separated) with retries on 404/429/5xx/connection errors. Generates both NPC replies and the per-session scenario (story, truth reveal, per-NPC secret prompts, per-location clues), then runs a consistency-reconciliation pass.
- `scenarios/` — static game content: `scenario-config.ts` (three scenario types `medieval|modern|cyberpunk` × difficulty `easy|medium|hard`, NPC personas, localized location labels) and `clues-config.ts` (clues tagged with the NPC ids they implicate).
- A global `ThrottlerGuard` limits every route to 20 req/min.

### Key design points
- **NPC ids double as location ids** (`tavern`, `church`, `graveyard`, `mill`, `farm`, `clinic`, plus `crime_scene`). The same ids are reused across all scenario types; only display labels/personas change per scenario (`getLocalizedLocationLabel`). Keep ids consistent across `scenario-config.ts`, `clues-config.ts`, `prisma/seed.ts`, and the frontend/mobile location configs.
- **Culprit and clue are chosen deterministically in code, not by the LLM** (`GameSessionsService.createSession`): a random culprit, a HURRIED/PLANNED murder style, and a clue that does (hurried) or doesn't (planned) implicate the culprit. The LLM only writes narrative around those facts.
- Per-session state lives on `GameSession` (day, `timeOfDay` 0–4, warrants, `locationClues` JSON, `truthReveal`) and `SessionNpcState` (fear/lie tendency, `dynamicPrompt`). Creating a session marks the user's previous `ACTIVE` sessions as `LOST`.
- **Test mode (no AI):** with `ALLOW_TEST_MODE=true` on the backend, `POST /game-sessions` with `testMode: true` builds a canned scenario and NPCs answer with stock replies — no Gemini quota used, no quota counters touched. Use this for exercising game flow locally. Must stay off in production.

### Clients
- **Frontend** calls the API through `apiUrl()` (`src/config/api.ts`), which defaults to `/api`; `next.config.ts` rewrites `/api/*` → `http://127.0.0.1:3001/*`. Game/auth state is a persisted Zustand store (`src/store/useGameStore.ts`). Pages are under `src/app/` (`menu`, `map`, `interior/[locationId]`, `interact/[npcId]`, `crime-scene`, `result`, …); shared SCSS variables in `src/styles/_variables.scss` (auto-included via `sassOptions.includePaths`).
- **Mobile** resolves the API base URL as: AsyncStorage override → `EXPO_PUBLIC_API_BASE_URL` → the Render URL (`src/config/apiBaseUrl.ts`). Static game content mirrors the backend in `src/data/gameContent.ts`.

### Environment
Backend env vars: `DATABASE_URL`, `GEMINI_API_KEY`, `GEMINI_MODELS` (optional), `JWT_SECRET`, `MAIL_USER`, `MAIL_PASS`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `PORT`, `HOST`, `ALLOW_TEST_MODE`. `.agents/mcp_config.json` configures a Postgres MCP server against the local docker DB.
