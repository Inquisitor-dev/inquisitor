# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**The Inquisitor** is an LLM-driven detective/interrogation game. Each game session generates a murder scenario and secretly picks a culprit among the NPCs. The player interrogates AI-driven NPCs across village locations, then condemns one. The product spec (Turkish) is in `proje.md`. Code comments, log messages and user-facing strings are mostly Turkish — keep that convention.

This is a student team project, built to be launch-ready but not actually launched.
- **Premium removed:** All legacy Premium gating was replaced with the Token Economy. Default daily quota is 5 sessions and 100 messages for all users.
- **Token economy & market:** In-game tokens (akçe) stored in backend (`User.tokenBalance`, `UserPurchase`, `TokenTransaction` ledger). Players earn tokens by solving cases (100 base + 50 fast bonus) and can purchase universes, difficulties, ready stories and cosmetics.
- **Payments:** Stripe test mode checkout flow (`/payments/create-checkout-session`, `/payments/webhook`, `/payments/simulate-success`). Accepts test cards (e.g. `4242 4242 4242 4242`). Supports dev simulation fallback when Stripe keys are not set.

The repo is a monorepo with three independent npm projects (no root `package.json`, no workspaces):

- `backend/` — NestJS 11 + Prisma (PostgreSQL) API. Deployed to Render (`render.yaml`, `backend/RENDER.md`).
- `frontend/` — Next.js 16 (App Router) web client, Zustand store, SCSS modules + Tailwind 4.
- `mobile/` — Expo 54 / React Native client with React Navigation, talks to the same backend.

**Where the details are.** Each project has its own CLAUDE.md, loaded only when working in that folder:
- `backend/CLAUDE.md` — module architecture (npcs, board, personas, abilities, notebook, llm, stories, scenarios, verdict), the case plan and solver, fear/confession rules, detailed backend commands (`stories:*`).
- `frontend/CLAUDE.md` (→ `frontend/AGENTS.md`) — web client structure, screens and UI conventions. This Next.js version has breaking changes vs. training data — read `frontend/node_modules/next/dist/docs/` before writing Next.js code.
- `mobile/CLAUDE.md` — the Expo client.
- `docs/` — design documents, trial results and the reasons behind rules (`docs/tasarim-gerekceleri.md`, `docs/v3-persona-tasarimi.md`, `docs/hikaye-hakemi.md`, image prompts in `docs/*-gorselleri.md`).

When a change in one project touches a rule mirrored in another (ids, labels, ability texts, suspect lists), read the other project's CLAUDE.md before editing.

## Commands

Run each in its own directory.

**Local database:** `docker compose up -d` (repo root) starts Postgres 15 at `postgresql://user:password@localhost:5432/inquisitor`.

**Backend** (`backend/`, copy `.env.example` → `.env`; listens on port 3001):
- `npm run start:dev` — watch mode
- `npm run prisma:generate` / `npm run prisma:push` — regenerate client / sync schema (no migrations; schema is pushed with `db push`)
- `npm run seed` — seed base NPCs
- `npm run build`; production build output is `dist/src/main` (`render:start`), not `dist/main`.
- `npm test` — Jest unit tests (`src/**/*.spec.ts`), all suites pass. `npm run test:e2e` — `test/*.e2e-spec.ts`.
- Story pool, usage report and evaluation commands (`stories:generate`, `stories:approve`, `stories:export`/`import`, `stories:review`, `usage:report`, `abilities:scan-eval`): see `backend/CLAUDE.md`.
- After pulling, run `npm install` and `npm run prisma:generate` (and `prisma:push` against the local DB) when `package.json` or `schema.prisma` changed; a missing package shows up as `Cannot find module` build errors.
- **`npm run lint` runs ESLint with `--fix` across the whole backend.** Many files are not Prettier-clean yet, so this reformats unrelated code. To check only your own changes, run `npx eslint <file>` without `--fix`.

**Frontend** (`frontend/`): `npm run dev`, `npm run build` (uses `--webpack`), `npm run lint`. No tests.

**Mobile** (`mobile/`): `npm start` (or `start:lan` / `start:tunnel`), `npm run typecheck`, `npm run build:android:preview` (EAS). The GitHub workflow `.github/workflows/build-apk.yml` builds the APK locally via EAS on manual dispatch.

**CI** (`.github/workflows/ci.yml`) runs on PRs to `main` and pushes to `main`: backend build + unit tests, frontend lint, frontend build, and mobile typecheck. Frontend lint must stay at zero problems. Deploys are done by Render and Vercel, not by CI.

## Rules that hold everywhere

- **The case answer must never reach the client while a session is `ACTIVE`.**
  - Every response containing a session goes through `toPublicSession`, which strips `culpritId`, `truthReveal`, `locationClues` and `caseFacts` until the session is `WON`/`LOST`. Any new endpoint returning a session must do the same.
  - Only the culprit's prompt contains the full truth. Innocent NPCs get only their own secret and alibi, and the testimony witness gets the verifying evidence text.
  - Nothing the player sees (board judgments, fear indicator, abilities, ability texts in the client) may name the culprit or reveal the answer.
- **The case is planned in code, not by the LLM** (`planCase`, stored as `GameSession.caseFacts`); the LLM only writes narrative around it. **Evidence text always comes from code** (stored case facts / `locationClues`), never from a live LLM reply. Confessions are recorded only by code. Details in `backend/CLAUDE.md`.
- **NPC ids double as location ids** (`tavern`, `church`, `graveyard`, `mill`, `farm`, `clinic`, plus `crime_scene`). The same ids are reused across all scenario types; only display labels/personas change per scenario (`getLocalizedLocationLabel`). Keep ids consistent across `backend/src/scenarios/universes/*.ts`, `clues-config.ts`, `prisma/seed.ts`, and the frontend/mobile location configs.
- **Location display names** come from each universe's `locationLabels` in `backend/src/scenarios/universes/`. The frontend keeps its own copies (`config/locationLabels.ts`, `components/TruthRevealPanel.tsx`) and crime scene labels (`config/crimeScenes.ts`) that must stay identical; mobile mirrors static content in `src/data/gameContent.ts`.
- **A new universe** needs an entry in `UNIVERSE_REGISTRY` (backend), in each frontend per-universe registry plus `config/scenarioRegistry.ts` / `shared/types/scenario.ts`, and in mobile's `gameContent.ts`.
- **Copy:** user-facing text uses the informal "sen" form and TDK spelling with diacritics (hikâye, mekân, mahkûm, dükkân). Never write Turkish without its special characters.
- **Uppercase text:** `<html lang="tr">` makes CSS `text-transform: uppercase` follow Turkish rules (i → İ). Mark uppercased English or Latin text with `lang="en"` (e.g. "The Inquisitor"). In JS, use `toLocaleUpperCase('tr-TR')`.
- **Test mode (no AI):** with `ALLOW_TEST_MODE=true` on the backend, `POST /game-sessions` with `testMode: true` builds a canned scenario and NPCs answer with stock replies — no Gemini quota used, no quota counters touched. The inventory starts with a search warrant for every place of the scenario, so the search scenes can be tried at once. Use this for exercising game flow locally. Must stay off in production.
- **LLM usage:** every LLM call goes through `LlmService.complete` with a usage context (kind, `sessionId`), so token usage is logged (`backend/CLAUDE.md`, `llm/`).
- **Request bodies:** a new backend body field must be declared in its `class-validator` DTO or the global `ValidationPipe` drops it (`backend/CLAUDE.md`).

## Environment

Backend env vars (values live only in `.env` / Render, never in docs or code):
- `DATABASE_URL`, `GEMINI_API_KEY`, `GEMINI_MODELS` (optional, comma-separated model fallback chain)
- `JWT_SECRET` (required; the server refuses to start without it)
- `MAIL_USER`, `MAIL_PASS`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `PORT`, `HOST`
- `ALLOW_TEST_MODE` — local only. It enables AI-free test sessions and shows the verification code when the email fails.
- `STORY_POOL_ENABLED`, `STORY_REVIEWER` — story pool (`backend/CLAUDE.md`).

`.agents/mcp_config.json` configures a Postgres MCP server against the local docker DB.

Production signup depends on SMTP. If Render blocks outbound SMTP, signup fails, because codes are no longer returned in the response. Switching to an HTTP email API (e.g. Resend) would fix it.

Mobile reads `EXPO_PUBLIC_API_BASE_URL` (`mobile/CLAUDE.md`).
