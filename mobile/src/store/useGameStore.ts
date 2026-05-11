import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type {
  AuthPayload,
  Difficulty,
  InventoryState,
  ScenarioType,
  SessionSnapshot,
} from "@/types/game";

type GameState = {
  userEmail: string | null;
  userId: string | null;
  authToken: string | null;
  isAdmin: boolean;
  isPremium: boolean;
  sessionId: string | null;
  difficulty: Difficulty;
  scenarioType: ScenarioType;
  selectedNpcId: string | null;
  dialoguesUsedToday: number;
  maxDailyDialogues: number;
  currentDay: number;
  timeOfDay: number;
  notes: string;
  scenario: string | null;
  inventory: InventoryState;
  truthReveal: string | null;
  locationClues: Record<string, string> | null;
  hasHydrated: boolean;
  setUser: (payload: AuthPayload) => void;
  setAccountIdentity: (payload: {
    email?: string | null;
    isAdmin?: boolean;
    isPremium?: boolean;
  }) => void;
  setHasHydrated: (value: boolean) => void;
  setSessionId: (sessionId: string | null) => void;
  setDifficulty: (difficulty: Difficulty) => void;
  setScenarioType: (scenarioType: ScenarioType) => void;
  setSelectedNpc: (npcId: string | null) => void;
  setDialoguesUsed: (count: number) => void;
  setCurrentDay: (day: number) => void;
  setTimeOfDay: (time: number) => void;
  setNotes: (notes: string) => void;
  setScenario: (scenario: string | null) => void;
  setWarrants: (active: string[], used: string[]) => void;
  addWarrant: (location: string) => void;
  consumeWarrant: (location: string) => void;
  setTruthReveal: (truth: string | null) => void;
  setLocationClues: (clues: Record<string, string> | null) => void;
  hydrateSession: (session: SessionSnapshot) => void;
  clearSession: () => void;
  logout: () => void;
};

const defaultInventory: InventoryState = {
  activeWarrants: [],
  usedWarrants: [],
};

const defaultSessionState = {
  sessionId: null,
  difficulty: "easy" as Difficulty,
  scenarioType: "medieval" as ScenarioType,
  selectedNpcId: null,
  dialoguesUsedToday: 0,
  currentDay: 1,
  timeOfDay: 0,
  notes: "",
  scenario: null,
  inventory: defaultInventory,
  truthReveal: null,
  locationClues: null,
};

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      userEmail: null,
      userId: null,
      authToken: null,
      isAdmin: false,
      isPremium: false,
      maxDailyDialogues: 30,
      hasHydrated: false,
      ...defaultSessionState,

      setUser: ({ email, userId, token, isAdmin = false, isPremium = false }) =>
        set({
          userEmail: email,
          userId,
          authToken: token,
          isAdmin,
          isPremium,
          maxDailyDialogues: isPremium ? 100 : 30,
        }),

      setAccountIdentity: ({ email, isAdmin, isPremium }) =>
        set((state) => ({
          userEmail: email ?? state.userEmail,
          isAdmin: isAdmin ?? state.isAdmin,
          isPremium: isPremium ?? state.isPremium,
          maxDailyDialogues:
            (isPremium ?? state.isPremium) ? 100 : 30,
        })),

      setHasHydrated: (value) => set({ hasHydrated: value }),
      setSessionId: (sessionId) => set({ sessionId }),
      setDifficulty: (difficulty) => set({ difficulty }),
      setScenarioType: (scenarioType) => set({ scenarioType }),
      setSelectedNpc: (npcId) => set({ selectedNpcId: npcId }),
      setDialoguesUsed: (count) => set({ dialoguesUsedToday: count }),
      setCurrentDay: (day) => set({ currentDay: day }),
      setTimeOfDay: (time) => set({ timeOfDay: time }),
      setNotes: (notes) => set({ notes }),
      setScenario: (scenario) => set({ scenario }),
      setWarrants: (active, used) =>
        set({
          inventory: {
            activeWarrants: active,
            usedWarrants: used,
          },
        }),
      addWarrant: (location) =>
        set((state) => ({
          inventory: {
            ...state.inventory,
            activeWarrants: state.inventory.activeWarrants.includes(location)
              ? state.inventory.activeWarrants
              : [...state.inventory.activeWarrants, location],
          },
        })),
      consumeWarrant: (location) =>
        set((state) => ({
          inventory: {
            activeWarrants: state.inventory.activeWarrants.filter(
              (item) => item !== location,
            ),
            usedWarrants: [...state.inventory.usedWarrants, location],
          },
        })),
      setTruthReveal: (truth) => set({ truthReveal: truth }),
      setLocationClues: (clues) => set({ locationClues: clues }),

      hydrateSession: (session) =>
        set({
          sessionId: session.id,
          currentDay: session.currentDay ?? session.day ?? 1,
          timeOfDay: session.timeOfDay ?? 0,
          dialoguesUsedToday: session.dialoguesUsedToday ?? 0,
          notes: session.notes ?? "",
          scenario: session.scenario ?? null,
          difficulty: session.difficulty ?? "easy",
          scenarioType: session.scenarioType ?? "medieval",
          inventory: {
            activeWarrants: session.activeWarrants ?? [],
            usedWarrants: session.usedWarrants ?? [],
          },
          truthReveal: session.truthReveal ?? null,
          locationClues: session.locationClues ?? null,
        }),

      clearSession: () =>
        set({
          ...defaultSessionState,
        }),

      logout: () =>
        set((state) => ({
          userEmail: null,
          userId: null,
          authToken: null,
          isAdmin: false,
          isPremium: false,
          maxDailyDialogues: 30,
          hasHydrated: state.hasHydrated,
          ...defaultSessionState,
        })),
    }),
    {
      name: "inquisitor-mobile-storage",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
