# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**The Inquisitor** is an LLM-driven detective/interrogation game. Each game session generates a murder scenario and secretly picks a culprit among the NPCs. The player interrogates AI-driven NPCs across village locations, then condemns one. The product spec (Turkish) is in `proje.md`. Code comments, log messages and user-facing strings are mostly Turkish — keep that convention.

This is a student team project, built to be launch-ready but not actually launched.
- **Premium is legacy.** The Premium subscription in `proje.md` and in the code is no longer the plan; do not add new Premium gating.
- **Planned revenue model:** an in-game token market (tokens earned by playing or bought with EUR) plus selling community editor access.
- **No real payments:** any payment work uses the provider's test/sandbox mode.

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
- `npm run build`
- `npm run lint` runs ESLint with `--fix` across the whole backend. Many files are not Prettier-clean yet, so this reformats unrelated code. To check only your own changes, run `npx eslint <file>` without `--fix`.
- `npm test` — Jest unit tests (`src/**/*.spec.ts`). Single file: `npx jest src/npcs/npcs.service.spec.ts`; single test: `npx jest -t "name"`.
  - The three `*.controller.spec.ts` files are untouched NestJS stubs that fail on dependency injection; expect those failures.
  - Service specs build services by hand with mocked Prisma/LLM objects; see `game-sessions.service.spec.ts`.
- `npm run test:e2e` — `test/*.e2e-spec.ts`
- Production build output is `dist/src/main` (`render:start`), not `dist/main`.

**Frontend** (`frontend/`): `npm run dev`, `npm run build` (uses `--webpack`), `npm run lint`. No tests.

**Mobile** (`mobile/`): `npm start` (or `start:lan` / `start:tunnel`), `npm run typecheck`, `npm run build:android:preview` (EAS). The GitHub workflow `.github/workflows/build-apk.yml` builds the APK locally via EAS on manual dispatch.

## Architecture

### Backend modules (`backend/src`)
- `auth/` — email verification-code signup (mails via `MAIL_USER`/`MAIL_PASS`), password login and JWT (`JwtAuthGuard`).
  - Also owns daily quota tracking (`checkAndResetDailyQuota`, session/message counters on `User`), premium activation and per-user audio settings.
  - The admin user is bootstrapped from `ADMIN_EMAIL`/`ADMIN_PASSWORD` in `onModuleInit`.
  - `JWT_SECRET` is mandatory (`jwt-secret.ts`, no fallback); the server refuses to start without it.
  - `send-code` rejects every already-verified account, including the admin.
  - The verification code is never returned in the API response. Only when `ALLOW_TEST_MODE=true` and the email fails is it included in the message, so local signup works without SMTP.
- `game-sessions/` — session lifecycle: create, advance time of day / end day, notes, search warrants, condemn, timeout, and `GET /game-sessions/:id/evidence` (the evidence log).
  - The daily session quota is enforced in the **controller**. Universe and difficulty are not gated server-side yet (they will be tied to market purchases).
  - Every route resolves the session with `findOwnedSession` (`session-access.ts`); other users' sessions return 404.
- `npcs/` — `POST /npcs/interact` (one dialogue turn), `POST /npcs/confront` (show an evidence item to an NPC) and `POST /npcs/history`. Builds the NPC prompt from scenario config + session state and persists `DialogueHistory`.
  - All routes check session ownership. `interact` and `confront` also require an `ACTIVE` session and spend the daily message quota; `interact` messages are at most 500 characters.
  - Replies return `newEvidence`, `fear` (`{ level, band }`, null for narrators) and, when a statement was added, the updated `notes`.
  - `evidence.ts`: the **evidence log**. The LLM appends hidden tags (`[CLUE_FOUND]` from narrators, `[CONFESSED]` from innocents, `[EVIDENCE_REVEALED]` from the testimony witness), which are stripped server-side and turned into `Evidence` rows. Evidence text always comes from the stored case facts / `locationClues`, never from the live reply. `sharesTestimony` also catches a witness who tells the testimony without the tag.
  - `fear.ts`: **fear is driven by code**. Showing evidence raises `SessionNpcState.currentFear` (own location clue +7, so it always breaks an innocent; implicating evidence +3, irrelevant or repeated 0, max 10, −1 each night). At the threshold (7) an innocent is forced to confess and the confession is recorded by code; the culprit only panics and never confesses. Starting fear is `startingFear(baseFear)` (0–4).
  - `prompt-guard.ts` answers prompt-injection attempts in character without calling the LLM, and replaces replies that leak prompt section headers.
  - Its `foldTurkish` makes text matching diacritic-insensitive (used for warrant requests).
- `llm/` — single `LlmService` using the **OpenAI SDK pointed at Gemini's OpenAI-compatible endpoint** (`GEMINI_API_KEY`).
  - `createCompletion` walks a model fallback chain (`GEMINI_MODELS` env, comma-separated), with retries on 404/429/5xx/connection errors.
  - Generates both NPC replies and the per-session scenario (story, truth reveal, per-NPC secret prompts, per-location clues), then runs a consistency-reconciliation pass.
  - The NPC system prompt ends with SECURITY RULES that treat player messages as in-world speech, never as instructions.
- `scenarios/` — static game content: `scenario-config.ts` (three scenario types `medieval|modern|cyberpunk` × difficulty `easy|medium|hard`, NPC personas, localized location labels) and `clues-config.ts` (clues tagged with the NPC ids they implicate).
- A global `ThrottlerGuard` limits every route to 20 req/min.

### Key design points
- **NPC ids double as location ids** (`tavern`, `church`, `graveyard`, `mill`, `farm`, `clinic`, plus `crime_scene`). The same ids are reused across all scenario types; only display labels/personas change per scenario (`getLocalizedLocationLabel`). Keep ids consistent across `scenario-config.ts`, `clues-config.ts`, `prisma/seed.ts`, and the frontend/mobile location configs.
- **Location display names** come from `LOCALIZED_LOCATION_LABELS` in `scenario-config.ts`. The frontend keeps its own copies (`interact/[npcId]/page.tsx`, `components/TruthRevealPanel.tsx`) that must stay identical.
- **The case is planned in code, not by the LLM** (`planCase` in `scenarios/case-setup.ts`, called from `GameSessionsService.createSession`). The plan is stored as `GameSession.caseFacts`; the LLM only writes narrative around it.
  - A random culprit and a HURRIED (genuine clue) / PLANNED (planted clue) murder style.
  - An information budget: the crime-scene clue eliminates exactly `ELIMINATION_TARGET[difficulty]` suspects.
  - A MESSY/TIDY scene appearance that is independent of the clue (deliberately hidden from players).
  - A verifying evidence item (CORROBORATION or FLAW) placed at a location or in one NPC's testimony, an alibi for each innocent, and the victim's name and profession.
- **Per-session state** lives on `GameSession` (day, `timeOfDay` 0–4, warrants, `locationClues` JSON, `truthReveal`, `caseFacts`, `notes`), `SessionNpcState` (`currentFear`, lie tendency, `dynamicPrompt`, `shownEvidenceIds`) and `Evidence` (`kind` CLUE/VERIFICATION/CONFESSION, `category` ITEM/STATEMENT, unique per session+kind+source). A case lasts 4 days. Creating a session marks the user's previous `ACTIVE` sessions as `LOST`.
- **Evidence split:** `ITEM` evidence (physical objects found at locations) is shown in the inventory (dialogue screen and map). `STATEMENT` evidence (confessions, testimony) is appended to the session notes automatically.
- **The case answer must never reach the client while a session is `ACTIVE`.**
  - Every response containing a session goes through `toPublicSession`, which strips `culpritId`, `truthReveal`, `locationClues` and `caseFacts` until the session is `WON`/`LOST`. Any new endpoint returning a session must do the same.
  - Only the culprit's prompt contains the full truth. Innocent NPCs get only their own secret and alibi, and the testimony witness gets the verifying evidence text.
- **Test mode (no AI):** with `ALLOW_TEST_MODE=true` on the backend, `POST /game-sessions` with `testMode: true` builds a canned scenario and NPCs answer with stock replies — no Gemini quota used, no quota counters touched. Use this for exercising game flow locally. Must stay off in production.

### Clients
- **Frontend** calls the API through `apiUrl()` (`src/config/api.ts`), which defaults to `/api`; `next.config.ts` rewrites `/api/*` → `http://127.0.0.1:3001/*`.
  - Game/auth state is a persisted Zustand store (`src/store/useGameStore.ts`), including the session's `evidence` list.
  - The dialogue screen (`interact/[npcId]`) has the "Kanıt Göster" picker (calls `/npcs/confront`) and a fear indicator under the NPC name.
  - Pages are under `src/app/` (`menu`, `map`, `interior/[locationId]`, `interact/[npcId]`, `crime-scene`, `result`, `market`, `community`, …).
  - Shared SCSS variables are in `src/styles/_variables.scss`; import them with `@use '../../styles/variables' as *;`.
  - The **market** is client-only for now. Its catalog is in `market/marketItems.ts`, and the token balance and owned items are in `useMarketStore` (localStorage). The EUR token packs are visual only.
  - **Community** story and feedback submissions are mocked; there is no backend for them.
- **Mobile** resolves the API base URL as: AsyncStorage override → `EXPO_PUBLIC_API_BASE_URL` → the Render URL (`src/config/apiBaseUrl.ts`). Static game content mirrors the backend in `src/data/gameContent.ts`.

### UI conventions (frontend)
- **Visual language** (shared by menu, market and community): near-black background, blood red `#8A0303`, gold `#e0bb5e` for tokens and highlights, Playfair Display headings, wax-seal and roman-numeral motifs, and `lucide-react` icons instead of emoji.
- **Uppercase text:** `<html lang="tr">` makes CSS `text-transform: uppercase` follow Turkish rules (i → İ). Mark uppercased English or Latin text with `lang="en"` (e.g. "The Inquisitor"). In JS, use `toLocaleUpperCase('tr-TR')`.
- **Copy:** user-facing text uses the informal "sen" form and TDK spelling with diacritics (hikâye, mekân, mahkûm, dükkân). Never write Turkish without its special characters.

### Environment
Backend env vars:
- `DATABASE_URL`, `GEMINI_API_KEY`, `GEMINI_MODELS` (optional)
- `JWT_SECRET` (required)
- `MAIL_USER`, `MAIL_PASS`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `PORT`, `HOST`
- `ALLOW_TEST_MODE` — local only. It enables AI-free test sessions and shows the verification code when the email fails.

`.agents/mcp_config.json` configures a Postgres MCP server against the local docker DB.

Production signup depends on SMTP. If Render blocks outbound SMTP, signup fails, because codes are no longer returned in the response. Switching to an HTTP email API (e.g. Resend) would fix it.
