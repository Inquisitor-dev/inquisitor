import type { AuthSlice, GameSliceCreator } from './types';

export const createAuthSlice: GameSliceCreator<AuthSlice> = (set) => ({
  userEmail: null,
  userId: null,
  authToken: null,
  username: null,
  avatar: 'avatar_1',
  isAdmin: false,
  isPremium: false,
  hasHydrated: false,

  setUser: (email, userId, token, isAdmin, isPremium = false, username?: string | null, avatar?: string) =>
    set({
      userEmail: email,
      userId,
      authToken: token,
      isAdmin,
      isPremium,
      username: username ?? null,
      avatar: avatar || 'avatar_1',
      maxDailyDialogues: 100,
    }),

  setProfile: (username, avatar) => set({ username, avatar }),
  setIsPremium: (val) => set({ isPremium: val, maxDailyDialogues: 100 }),
  setHasHydrated: (val) => set({ hasHydrated: val }),

  logout: () =>
    set({
      userEmail: null,
      userId: null,
      authToken: null,
      username: null,
      avatar: 'avatar_1',
      isAdmin: false,
      isPremium: false,
      sessionId: null,
      difficulty: 'easy',
      scenarioType: 'medieval',
      selectedNpcId: null,
      npcStates: {},
      dialoguesUsedToday: 0,
      currentDay: 1,
      timeOfDay: 0,
      notes: '',
      scenario: null,
      inventory: { activeWarrants: [], usedWarrants: [] },
      evidence: [],
      truthReveal: null,
      locationClues: null,
      lastLocationId: null,
    }),
});
