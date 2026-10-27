# mobile/CLAUDE.md

Expo 54 / React Native client (React Navigation) that talks to the same backend. Commands are in the root `CLAUDE.md`; device setup is in `mobile/README.md`. CI runs `npm run typecheck`, so keep it clean.

- **API base URL** is resolved as: AsyncStorage override → `EXPO_PUBLIC_API_BASE_URL` (`mobile/.env`, see `.env.example`) → the Render URL (`src/config/apiBaseUrl.ts`). On a physical device use the machine's LAN IP, not `localhost`.
- **Static game content** mirrors the backend in `src/data/gameContent.ts` (location ids, labels, suspects). Keep it in step with `backend/src/scenarios/universes/` when ids or labels change.
- Screens are in `src/screens/` (Login, Home, Map, Interact, Result). The mobile client covers only the basic flow: it has no notebook, board, raid or abilities, and condemns with the culprit only (no verdict `report`, so the reward multiplier stays 1).
- It does not send `characterId` when creating a session, so mobile cases always use the default character and last 4 days.
