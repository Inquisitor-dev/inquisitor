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

`frontend/CLAUDE.md` (→ `frontend/AGENTS.md`) applies when working in `frontend/`: this Next.js version has breaking changes vs. training data — read `frontend/node_modules/next/dist/docs/` before writing Next.js code.

## Commands

Run each in its own directory.

**Local database:** `docker compose up -d` (repo root) starts Postgres 15 at `postgresql://user:password@localhost:5432/inquisitor`.

**Backend** (`backend/`, copy `.env.example` → `.env`; listens on port 3001):
- `npm run start:dev` — watch mode
- `npm run prisma:generate` / `npm run prisma:push` — regenerate client / sync schema (no migrations; schema is pushed with `db push`)
- `npm run seed` — seed base NPCs
- `npm run build`
- After pulling, run `npm install` and `npm run prisma:generate` (and `prisma:push` against the local DB) when `package.json` or `schema.prisma` changed; a missing package shows up as `Cannot find module` build errors.
- `npm run lint` runs ESLint with `--fix` across the whole backend. Many files are not Prettier-clean yet, so this reformats unrelated code. To check only your own changes, run `npx eslint <file>` without `--fix`.
- `npm test` — Jest unit tests (`src/**/*.spec.ts`). All test suites pass.
  - Service specs build services with mocked Prisma/LLM objects; see `game-sessions.service.spec.ts`.
- `npm run test:e2e` — `test/*.e2e-spec.ts`
- Production build output is `dist/src/main` (`render:start`), not `dist/main`.

**Frontend** (`frontend/`): `npm run dev`, `npm run build` (uses `--webpack`), `npm run lint`. No tests.

**Mobile** (`mobile/`): `npm start` (or `start:lan` / `start:tunnel`), `npm run typecheck`, `npm run build:android:preview` (EAS). The GitHub workflow `.github/workflows/build-apk.yml` builds the APK locally via EAS on manual dispatch.

**CI** (`.github/workflows/ci.yml`) runs on PRs to `main` and pushes to `main`: backend build + unit tests, frontend lint, frontend build, and mobile typecheck. Frontend lint must stay at zero problems. Deploys are done by Render and Vercel, not by CI.

## Architecture

### Backend modules (`backend/src`)
- **Request validation:** a global `ValidationPipe` (`main.ts`, `whitelist: true`, `transform: true`) validates bodies against the `class-validator` DTOs in each module's `dto/` folder (`*/dto/*.dto.ts`) and silently drops undeclared fields. A new body field must be declared in its DTO, or it never reaches the controller; new endpoints should take a DTO instead of an inline body type. Board and notebook routes read `@Body('board')` / `@Body('notebook')` directly. `auth/current-user.decorator.ts` provides the authenticated user.
- `auth/` — email verification-code signup (mails via `MAIL_USER`/`MAIL_PASS`), password login and JWT (`JwtAuthGuard`).
  - Also owns daily quota tracking (`checkAndResetDailyQuota`, session/message counters on `User`), premium activation and per-user audio settings.
  - The admin user is bootstrapped from `ADMIN_EMAIL`/`ADMIN_PASSWORD` in `onModuleInit`.
  - `JWT_SECRET` is mandatory (`jwt-secret.ts`, no fallback); the server refuses to start without it.
  - `send-code` rejects every already-verified account, including the admin.
  - The verification code is never returned in the API response. Only when `ALLOW_TEST_MODE=true` and the email fails is it included in the message, so local signup works without SMTP.
- `game-sessions/` — session lifecycle: create, advance time of day / end day, notes, search warrants, condemn, timeout, and `GET /game-sessions/:id/evidence` (the evidence log).
  - The daily session quota is enforced in the **controller**. Universe and difficulty are not gated server-side yet (they will be tied to market purchases).
  - Every route resolves the session with `findOwnedSession` (`session-access.ts`); other users' sessions return 404.
- `npcs/` — `POST /npcs/interact` (one dialogue turn), `POST /npcs/confront` (show an evidence item to an NPC, optionally with a spoken remark in `message`) and `POST /npcs/history`. `npcs.service.ts` orchestrates a turn and persists `DialogueHistory`; the LLM receives the conversation's **last** 10 messages. The pieces live in their own files:
  - `prompt-builder.ts` (`buildNpcPrompt`): the NPC/narrator system prompt from scenario config + session state, including the confession rules, fear state and the evidence being shown.
    - Every character also gets **what everyone in town knows** (`publicCaseFacts`: the victim and that the body was found at the crime scene), so a bluff such as "the murder happened at your place" is not believed.
    - A shown evidence item comes with its origin (`describeEvidenceOrigin`: found at the crime scene / at another place / at your own place, or whose statement it is) and the player's remark, so the character does not tie it to the wrong place.
  - `warrant.ts`: **search warrants are decided by code** (`decideWarrants`). A grant needs an explicit request (`isExplicitWarrantRequest`) that names a place, by its label or its owner's name (`findRequestedLocations`, titles like "Brother" ignored); at most `MAX_WARRANTS` (2) per case. The issuer's prompt only receives the decision (granted / ask which place / already held / limit reached) to voice in character; any `[GRANT_WARRANT]` tag the LLM writes is stripped and ignored.
  - `evidence-recorder.ts` writes `Evidence` rows; `test-reply.builder.ts` builds test-mode replies.
  - All routes check session ownership. `interact` and `confront` also require an `ACTIVE` session and spend the daily message quota; `interact` messages and confront remarks are at most 500 characters.
  - An evidence item can be shown to the same character only once: `assertConfrontable` runs before the quota is spent and rejects a repeat with 400 ("Bu kanıtı ona zaten gösterdin."). The dialogue screen disables already shown items.
  - Replies return `newEvidence`, `fear` (`{ level, band }`, null for narrators) and, when a statement was added, the updated `notes`.
  - `evidence.ts`: the **evidence log**. The LLM appends hidden tags (`[CLUE_FOUND]` from narrators, `[EVIDENCE_REVEALED]` from the testimony witness), which are stripped server-side and turned into `Evidence` rows. Confessions (`CONFESSION`) are recorded only by code at the fear threshold; a `[CONFESSED]` tag written in conversation is ignored. Evidence text always comes from the stored case facts / `locationClues`, never from the live reply. `sharesTestimony` also catches a witness who tells the testimony without the tag.
  - `fear.ts`: **fear is driven by code**. Showing evidence raises `SessionNpcState.currentFear` (own location clue +7, so it always breaks an innocent; implicating evidence +3, irrelevant or repeated 0, max 10, −1 each night). At the threshold (7) an innocent is forced to confess and the confession is recorded by code (it appears in the notebook). This is the **only** way an innocent confesses: in conversation they deny or deflect, however accurate the accusation. The culprit only panics and never confesses. Starting fear is `startingFear(baseFear)` (0–4).
  - `prompt-guard.ts` answers prompt-injection attempts in character without calling the LLM, and replaces replies that leak prompt section headers.
  - Its `foldTurkish` makes text matching diacritic-insensitive (used for warrant requests).
- `board/` — the **investigation board** (`GET`/`PUT /game-sessions/:id/board`, `POST /game-sessions/:id/board/think`). The pure logic is in `board/domain/` (`board-judge.ts`, `board-sanitizer.ts`, `board-thought.ts`, `board.types.ts`); `board.ts` only re-exports it.
  - The board (cards, positions, strings) is stored on `GameSession.boardState`. `sanitizeBoard` drops cards for evidence the player has not found or suspects not in the case, and clients can never write a string's verdict.
  - String types depend on the two ends: suspect–evidence `CLEARS`/`IMPLICATES`, evidence–evidence `SUPPORTS`/`CONTRADICTS`, anything else `LINK` (not judged).
  - "Düşün" (think) judges strings in code against `caseFacts` (`judgeBoard`). A string only confirms what its two cards themselves say; for example, a planted crime-scene clue is exposed only when it is linked to the verifying evidence. The judgments never name the culprit.
  - The verdicts are then turned into the detective's inner monologue: Gemini writes it (`generateBoardThought`, which receives only the verdicts), test mode returns a `[Test Düşüncesi]` template.
  - Thinking is allowed once per in-game day (`boardThoughtDay`); if there is nothing to judge, the day's use is not spent.
- `abilities/` — **player character abilities** (`GET /game-sessions/:id/abilities`, `POST /game-sessions/:id/abilities/use`).
  - The worn character is sent as `characterId` when a session is created, checked against `outfit_<id>` ownership (403 otherwise; default `engizitor`) and locked on `GameSession.characterId` for the whole case.
  - `abilities.ts` holds the 12 definitions (11 characters; Mavi Rozet has two) and `availability` (daily / per-case / passive limits, night rules). `ability-effects.ts` holds the pure effect math. Uses and lasting effects live in `GameSession.abilityState`.
  - Effects hook into existing systems: fear (Tehdit, Vizör Kilidi in `endDay`), warrants (İz Sürme, not counted toward the 2-warrant limit), the quick notes (`GameSession.notes`, via `appendToNotes`: Arşiv Özeti, Muhbir, Çelişki Taraması), the NPC prompt (Sessiz Oda), the message quota (Sabır, in `NpcsController`), time (Kulis skips `advance-time`; Çatı Geçişi enters at night and the next day starts at `timeOfDay` 1) and the board (Veri Sızdırma, `BoardService.leakString`, spends the day's think).
  - Aşama 4 yetenekleri (16 karakter, 17 yetenek): İkinci Nefes (Yeşim Hekim; `condemnNpc`'ta ilk yanlış hüküm vakayı bitirmez, kişiyi aklar ve günü kapatır, son günde vakayı uzatır, ödül/puan yarı, cevapta `culpritId` yok), Derin Tefekkür (Ak Turna; panoda günde 2 "Düşün", `abilityState.thoughts`), Rüya Tabiri (Kar Kâhini; o gün tanık sorulmasa da anlatır, `dreamDay`), Keskin Göz (Ayaz İzcisi; arama izni olan mekânın ipucu hemen deftere, izni harcar), Teyit (Gece Muhabiri; `POST /npcs/quotes` + `/npcs/verify-quote`, bir şüphelinin gerçek sözü başkasına okunur, LLM kaydı `VERIFY_QUOTE`).
  - **Vaka uzunluğu sunucuda:** `lastDayOf(abilityState)` (4, İkinci Nefes son günde kullanıldıysa 5); `toPublicSession` her cevaba `lastDay` ekler, `endDay` son günden sonrasını reddeder. Web istemci `lastDay`'i store'dan okur (harita, ev, defter); mobil karakter göndermediği için hep 4.
  - Çelişki Taraması sends only the replies the player has heard to Gemini (`llm/prompts/contradiction-prompt.builder.ts`) and drops items whose quotes are not in those replies. A failed scan does not spend the use; its token usage is logged as `CONTRADICTION_SCAN`.
- `notebook/` — the **notebook** (`GET`/`PUT /game-sessions/:id/notebook`), stored on `GameSession.notebookState`.
  - One page spread per in-game day. Items are the player's text boxes, taped evidence photos (with a caption and a slight tilt), pen strokes and the positions of record cards, in percent of the page (`notebook.ts`).
  - A pen stroke stores its color (`ink`/`red`/`blue`), size (1 thin, 2 thick) and flattened points `[x1, y1, x2, y2, ...]`. Strokes have their own limit (`MAX_STROKES` 300, `MAX_STROKE_POINTS` 120 per stroke) and do not count toward the 150-item limit.
  - The notebook PUT route allows 120 requests per minute (`@Throttle`), because it autosaves while the player writes and draws. `main.ts` raises the JSON body limit to 1 MB for drawings.
  - Record cards are the session's `STATEMENT` evidence (confessions, testimony); their text is never stored in the notebook, it comes from `Evidence` on every load. A card stays on the day its evidence was obtained.
  - `sanitizeNotebook` drops unknown items, cards for evidence the player does not own, photos of anything but the player's own `ITEM` evidence, duplicates and empty text, and clamps positions, days, tilt and text length (600; captions 160).
- `llm/` — single `LlmService` using the **OpenAI SDK pointed at Gemini's OpenAI-compatible endpoint** (`GEMINI_API_KEY`).
  - The HTTP client lives in `llm/client/gemini-client.ts`; the prompts for scenarios, NPC replies and board thoughts are in `llm/prompts/*.builder.ts`.
  - **Token usage logging:** every successful call goes through `LlmService.complete`, which logs and stores one `LlmUsage` row (`llm/usage/llm-usage.recorder.ts`: kind `SCENARIO`/`SCENARIO_REVIEW`/`NPC_REPLY`/`CONFRONT`/`NARRATOR`/`BOARD_THOUGHT`, model, prompt/completion tokens, duration, `sessionId`). A failed write only logs a warning. `createSession` pre-generates the session id so scenario calls are tied to the case. `npm run usage:report [days]` prints averages per kind and totals per case. New LLM calls must pass a usage context.
  - `GeminiClient.createCompletion` walks a model fallback chain (`GEMINI_MODELS` env, comma-separated), with retries on 404/429/5xx/connection errors. If `GEMINI_MODELS` is unset, the hard-coded `DEFAULT_MODELS` list is used (`gemini-3.5-flash-lite`, `gemini-3.1-flash-lite`, `gemini-flash-latest`); Render and local `.env` set the same chain. Google retires models regularly (`gemini-1.5-*`, `gemini-pro` and `gemini-2.5-flash` already return 404), so recheck the list with `GET /v1beta/models` when replies start failing.
  - Generates both NPC replies and the per-session scenario (story, truth reveal, per-NPC secret prompts, per-location clues), then runs a consistency-reconciliation pass.
  - The NPC system prompt ends with SECURITY RULES that treat player messages as in-world speech, never as instructions.
- `scenarios/` — static game content.
  - Each universe (`medieval`, `modern`, `cyberpunk`, `china`, `winter`) is one file in `scenarios/universes/` holding its NPC personas, locations, localized location labels and its 5 crime scenes (`crimeScenes`, plus `crimeSceneBody`, the cover over the body), registered in `UNIVERSE_REGISTRY`.
  - `getScenarioConfig(type, difficulty, crimeSceneId)`: with the case's crime scene id (`crimeSceneIdOf(caseFacts)`), the `crime_scene` location is described to the LLM as that place, with the covered body. Pass it wherever NPC or narrator prompts are built.
  - `scenario-config.ts` is the facade (`getScenarioConfig`, `getLocalizedLocationLabel`, `normalizeScenarioType`). Difficulty `easy|medium|hard` picks the first 4/5/6 NPCs of the universe.
  - `clues-config.ts` holds clues tagged with the NPC ids they implicate.
- A global `ThrottlerGuard` limits every route to 20 req/min.

### Key design points
- **NPC ids double as location ids** (`tavern`, `church`, `graveyard`, `mill`, `farm`, `clinic`, plus `crime_scene`). The same ids are reused across all scenario types; only display labels/personas change per scenario (`getLocalizedLocationLabel`). Keep ids consistent across `scenarios/universes/*.ts`, `clues-config.ts`, `prisma/seed.ts`, and the frontend/mobile location configs.
- **Location display names** come from each universe's `locationLabels` in `scenarios/universes/`. The frontend keeps its own copies (`config/locationLabels.ts`, `components/TruthRevealPanel.tsx`) that must stay identical.
- **The case is planned in code, not by the LLM** (`planCase` in `scenarios/case-setup.ts`, called from `GameSessionsService.createSession`). The plan is stored as `GameSession.caseFacts`; the LLM only writes narrative around it.
  - A random culprit and a HURRIED (genuine clue) / PLANNED (planted clue) murder style.
  - The crime scene (`crimeSceneId`): one of the universe's 5 places, picked last so earlier random choices keep their order. It is nobody's home or workplace and does not appear on the map. The story is written around it, and every character knows where the body was found (`publicCaseFacts`). The crime scene narrator gets the scene's appearance (`sceneState`) straight from `caseFacts`, so it matches the picture even when the generated clue leaves it out.
  - An information budget: the crime-scene clue eliminates exactly `ELIMINATION_TARGET[difficulty]` suspects.
  - A MESSY/TIDY scene appearance that is independent of the clue (deliberately hidden from players).
  - A verifying evidence item (CORROBORATION or FLAW) placed at a location or in one NPC's testimony, an alibi for each innocent, and the victim's name and profession.
- **Per-session state** lives on `GameSession` (day, `timeOfDay` 0–4, warrants, `locationClues` JSON, `truthReveal`, `caseFacts`, `notes`), `SessionNpcState` (`currentFear`, lie tendency, `dynamicPrompt`, `shownEvidenceIds`) and `Evidence` (`kind` CLUE/VERIFICATION/CONFESSION, `category` ITEM/STATEMENT, unique per session+kind+source). A case lasts 4 days. Creating a session marks the user's previous `ACTIVE` sessions as `LOST`.
- **Evidence split:** `ITEM` evidence (physical objects found at locations) is shown in the inventory (dialogue screen, map and home) as polaroid photos (`components/EvidencePolaroid`; the photo is the image of the place where it was found, `evidencePhoto` in `InvestigationBoard/boardModel.ts`). `STATEMENT` evidence (confessions, testimony) appears in the notebook as a stamped record card on the page of the day it was obtained; it is no longer appended to `GameSession.notes`.
- **`GameSession.notes`** is the free-text "quick notes" (Hızlı Notlar). The crime-scene page sidebar and interior clue snippets still write to it, and the notebook shows it on its first spread.
- **The case answer must never reach the client while a session is `ACTIVE`.**
  - Every response containing a session goes through `toPublicSession`, which strips `culpritId`, `truthReveal`, `locationClues` and `caseFacts` until the session is `WON`/`LOST`. Any new endpoint returning a session must do the same.
  - It adds `crimeScene: { id, appearance }` (`MESSY`/`TIDY`, null for older cases), so the client can pick the scene's picture. The player sees both at the crime scene anyway.
  - Only the culprit's prompt contains the full truth. Innocent NPCs get only their own secret and alibi, and the testimony witness gets the verifying evidence text.
- **Test mode (no AI):** with `ALLOW_TEST_MODE=true` on the backend, `POST /game-sessions` with `testMode: true` builds a canned scenario and NPCs answer with stock replies — no Gemini quota used, no quota counters touched. Use this for exercising game flow locally. Must stay off in production.

### Clients
- **Frontend** calls the API through the typed client `api` in `src/shared/api/client.ts` (`api.get/post/put/patch/delete`). It adds the store's auth token, parses JSON and throws `ApiError` on failure. URLs go through `apiUrl()` (`src/config/api.ts`), which defaults to `/api`; `next.config.ts` rewrites `/api/*` → `http://127.0.0.1:3001/*`. Use `logger` (`src/shared/lib/logger.ts`) instead of `console`.
  - **Folder layout:** pages in `src/app/` keep their page-only parts in `components/` next to the page (e.g. `app/map/components/`, `app/menu/components/`); shared UI is in `src/components/`; per-universe static data is split by universe under `src/config/` (`interiors/`, `dialogue/`, `locations/`, plus `scenarioRegistry.ts`); audio settings are in `src/features/audio/`.
  - Game/auth state is a persisted Zustand store (`src/store/useGameStore.ts`) composed of slices in `src/store/slices/` (auth, session, evidence, inventory; shared types in `slices/types.ts`), including the session's `evidence` list.
  - Per-universe frontend config folders each have an `index.ts` registry; `interiorConfig.ts` / `dialogueConfig.ts` only re-export them. `config/scenarioRegistry.ts` + `shared/types/scenario.ts` hold the universe list (names, map backgrounds, footsteps). A new universe needs an entry in each.
  - **Character stories and abilities:** `config/outfits.ts` holds each character's short `lore` and `quote`; `config/outfitStories.ts` holds the long story (paragraphs) and the abilities (name, summary, usage, rules). `components/character/OutfitStory.tsx` renders the ability cards and the "Detaylı Bak" modal in the market (cards and preview), wardrobe and lobby. Ability texts must never reveal the case answer and must match the server rules in `backend/src/abilities/`.
  - **Abilities in play** (`features/abilities/`): `useAbilities` reads the session's abilities; `AbilityControls` renders the ability chips, the target picker and the result sheet. The map shows most abilities (Kulis and Çatı Geçişi are armed, then used when entering a location), the dialogue screen shows the ones aimed at that suspect, and the board has Veri Sızdırma (click a string's knot).
  - **Crime scene:** the bottom bar's "Olay Yeri" button opens `/interact/crime_scene`, the narrator in the dialogue screen. Its name and background come from the session's `crimeScene` (store, `config/crimeScenes.ts`): `public/crime-scenes/<universe>/<id>_tidy.webp` or `_messy.webp`, following the scene's appearance. A picture that does not exist yet falls back to the old background. The picture is shifted up so the body stays above the dialogue card; for pictures whose body sits low, `CRIME_SCENE_FOCUS` in `config/crimeScenes.ts` holds the body's height and gives a bigger shift. The body is always covered so the picture fits every victim and way of death; the image prompts are in `docs/olay-yeri-gorselleri.md`. The labels in `config/crimeScenes.ts` must match the backend.
  - The dialogue screen (`interact/[npcId]`, `components/DialogueScreen`) has the "Kanıt Göster" picker (`components/ConfrontModal`, calls `/npcs/confront`) and a fear indicator under the NPC name.
    - "Hazır Sorular" toggles a row of preset questions (`config/quickQuestions.ts`, `getQuickQuestions`) that are sent with one click; the introduction uses the player's username and the town name. Sending one keeps the player's half-typed draft. Hidden while searching a location and at the crime scene.
  - **Interiors** (`interior/[locationId]`, `InteriorViewer`, `config/interiors/<universe>.ts`, looked up with `getInterior`) are defined per universe; `medieval`, `cyberpunk`, `china`, `winter` and `modern` have them; other universes show a "henüz hazır değil" screen.
    - Entering a location from the map opens its interior first when one exists, otherwise the dialogue screen.
    - Hotspot positions are percentages of the image.
    - A `clue` hotspot without `clueSnippet` is a search spot: it checks the warrant and links to `/interact/<id>?ara=1`, which opens investigation mode.
  - **Player home** (`/home`, `components/PlayerHome`, `config/homeConfig.ts`) replaces the map's "Evim" popup in universes that have a home image (all five so far; a universe without one keeps the popup).
    - Objects in the room open the old popup's actions: bed (end day; on the last day it opens the verdict picker via `/map?hukum=1`), desk (the notebook), chest (inventory), board (opens the investigation board) and door (back to the map).
    - The equipped wardrobe character stands in the room, drawn from one frame of its 360° turntable sheet.
    - It shares the drag/pan and particle hooks with interiors (`InteriorViewer/useScenePan.ts`, `useAmbientParticles.ts`).
  - **Notebook** (`components/Notebook`, opened through `CaseModals/NotebookModal` from the home desk, the map and the dialogue screen) is an open book with two pages and a 3D page-turn.
    - The first spread is the case file (scenario text) and the quick notes (`notes`); then one spread per in-game day, with ribbon tabs to jump between them. It opens on the current day.
    - Double-click on an empty spot (or use "Yazı ekle") to place a handwritten text box; text boxes, photos and record cards are dragged by their handle, also across the two pages. Changes autosave.
    - "Kanıt yapıştır" opens a drawer of the found evidence as polaroids; pick one, then click on the page to tape its photo there and write a caption under it.
    - "Kalem" opens the pen bar: three colors, thin/thick, an eraser that removes whole strokes and undo (also Ctrl+Z). Strokes are simplified before saving (`simplifyStroke`, Ramer–Douglas–Peucker) and drawn as an SVG layer over the page. On phones the tool buttons show icons only.
    - Cover and paper follow the universe (`data-theme`). On narrow screens one page is shown at a time and a horizontal swipe turns the page. The handwriting font is Caveat (`--font-hand`, loaded in `app/layout.tsx`).
    - Turning a page plays a paper rustle synthesized with Web Audio (`features/audio/pageSound.ts`); it follows the door-sound volume and mute setting. A short help card opens on the first visit (remembered in `localStorage` under `inquisitor-notebook-help-seen`) and from the "?" button.
  - **Investigation board** (`/board`, `components/InvestigationBoard`) opens from the home's board.
    - The player pins suspects, found evidence and their own notes from the drawer, then drags from a pin to another card to stretch a string and chooses its meaning.
    - The board autosaves. "Düşün" shows the inner monologue, seals correct strings and stamps AKLANDI on a suspect cleared by a correct `CLEARS` string.
    - The board's material follows the universe (`data-theme`). On phones it is wider than the screen and scrolls sideways.
  - Pages are under `src/app/` (`menu`, `map`, `interior/[locationId]`, `interact/[npcId]`, `crime-scene`, `result`, `market`, `community`, …).
  - Shared SCSS variables are in `src/styles/_variables.scss`; import them with `@use '../../styles/variables' as *;`.
  - The **market** catalog is in `market/marketItems.ts`. `useMarketStore` (persisted) syncs the token balance, owned items and ledger with the backend `market/` module (`GET /market/catalog`, `GET /market/me`, `POST /market/purchase`, `GET /market/leaderboard`). The EUR token packs go through the Stripe test-mode flow in `payments/`.
  - **Community** story and feedback submissions are mocked (`app/community/data/communityData.ts`); there is no backend for them.
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
