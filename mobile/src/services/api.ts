import { env } from "@/config/env";
import type {
  Difficulty,
  NpcMessage,
  ScenarioType,
  SessionSnapshot,
} from "@/types/game";

type RequestOptions = {
  method?: "GET" | "POST";
  token?: string | null;
  body?: unknown;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    const message =
      data?.message || data?.error || "The request failed. Please try again.";
    throw new Error(Array.isArray(message) ? message.join(", ") : message);
  }

  return data as T;
}

export const api = {
  sendCode(email: string, password?: string) {
    return request<{ success?: boolean; message?: string; error?: string }>(
      "/auth/send-code",
      {
        method: "POST",
        body: { email, password },
      },
    );
  },

  verify(email: string, code: string) {
    return request<{
      token: string;
      email: string;
      userId: string;
      isAdmin?: boolean;
      isPremium?: boolean;
    }>("/auth/verify", {
      method: "POST",
      body: { email, code },
    });
  },

  login(email: string, password: string) {
    return request<{
      token: string;
      email: string;
      userId: string;
      isAdmin?: boolean;
      isPremium?: boolean;
    }>("/auth/login", {
      method: "POST",
      body: { email, password },
    });
  },

  getActiveSession(token: string) {
    return request<{ session: unknown | null }>("/game-sessions/active", {
      token,
    });
  },

  createSession(token: string, difficulty: Difficulty, scenarioType: ScenarioType) {
    return request("/game-sessions", {
      method: "POST",
      token,
      body: { difficulty, scenarioType },
    });
  },

  getSession(token: string, sessionId: string) {
    return request<SessionSnapshot & {
      activeWarrants?: string[];
      usedWarrants?: string[];
      truthReveal?: string | null;
      locationClues?: Record<string, string> | null;
      scenarioType?: ScenarioType;
      difficulty?: Difficulty;
    }>(`/game-sessions/${sessionId}`, {
      token,
    });
  },

  updateNotes(token: string, sessionId: string, notes: string) {
    return request(`/game-sessions/${sessionId}/notes`, {
      method: "POST",
      token,
      body: { notes },
    });
  },

  advanceTime(token: string, sessionId: string) {
    return request(`/game-sessions/${sessionId}/advance-time`, {
      method: "POST",
      token,
    });
  },

  endDay(token: string, sessionId: string) {
    return request(`/game-sessions/${sessionId}/end-day`, {
      method: "POST",
      token,
    });
  },

  condemn(token: string, sessionId: string, npcId: string) {
    return request<{
      won?: boolean;
      message?: string;
      session?: SessionSnapshot;
    }>(`/game-sessions/${sessionId}/condemn`, {
      method: "POST",
      token,
      body: { npcId },
    });
  },

  getHistory(token: string, sessionId: string, npcId: string) {
    return request<{
      history?: Array<{ role: "player" | "npc"; text: string; timestamp?: string }>;
      dialoguesUsed?: number;
      currentDay?: number;
    }>("/npcs/history", {
      method: "POST",
      token,
      body: { sessionId, npcId },
    });
  },

  interact(token: string, sessionId: string, npcId: string, message: string) {
    return request<{
      reply?: string;
      message?: string;
      dialoguesUsed?: number;
      history?: NpcMessage[];
      grantedWarrants?: string[];
    }>("/npcs/interact", {
      method: "POST",
      token,
      body: { sessionId, npcId, message },
    });
  },

  consumeWarrant(token: string, sessionId: string, location: string) {
    return request(`/game-sessions/${sessionId}/consume-warrant`, {
      method: "POST",
      token,
      body: { location },
    });
  },
};
