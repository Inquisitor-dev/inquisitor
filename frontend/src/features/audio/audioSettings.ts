import { api } from '@/shared/api/client';
import { useGameStore } from '@/store/useGameStore';

export interface AudioSettings {
  musicVolume: number;
  musicMuted: boolean;
  footstepVolume: number;
  footstepMuted: boolean;
  doorVolume: number;
  doorMuted: boolean;
}

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = Object.freeze({
  musicVolume: 0.4,
  musicMuted: false,
  footstepVolume: 0.45,
  footstepMuted: false,
  doorVolume: 0.55,
  doorMuted: false,
});

const STORAGE_KEY = 'inquisitor_audio_settings';
const SAVE_DEBOUNCE_MS = 400;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

function sanitize(raw: unknown, fallback: AudioSettings): AudioSettings {
  if (!raw || typeof raw !== 'object') return fallback;
  const r = raw as Record<string, unknown>;

  const num = (key: keyof AudioSettings) =>
    typeof r[key] === 'number' && Number.isFinite(r[key])
      ? clamp01(r[key] as number)
      : (fallback[key] as number);

  const bool = (key: keyof AudioSettings) =>
    typeof r[key] === 'boolean' ? (r[key] as boolean) : (fallback[key] as boolean);

  return {
    musicVolume: num('musicVolume'),
    musicMuted: bool('musicMuted'),
    footstepVolume: num('footstepVolume'),
    footstepMuted: bool('footstepMuted'),
    doorVolume: num('doorVolume'),
    doorMuted: bool('doorMuted'),
  };
}

let currentSettings: AudioSettings = DEFAULT_AUDIO_SETTINGS;
let loadedFromStorage = false;
const listeners = new Set<() => void>();

function loadFromStorage(): void {
  loadedFromStorage = true;
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) currentSettings = sanitize(JSON.parse(raw), DEFAULT_AUDIO_SETTINGS);
  } catch {
    // Bozuk veri varsa varsayılanlar kullanılır
  }
}

export function getAudioSettings(): AudioSettings {
  if (!loadedFromStorage) loadFromStorage();
  return currentSettings;
}

export function subscribeAudioSettings(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function setLocalSettings(next: AudioSettings): void {
  currentSettings = next;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage hatası yoksayılır
    }
  }
  listeners.forEach((fn) => fn());
}

let pendingRemote: Partial<AudioSettings> = {};
let saveTimer: ReturnType<typeof setTimeout> | null = null;

export function updateAudioSettings(partial: Partial<AudioSettings>): AudioSettings {
  const next = sanitize({ ...getAudioSettings(), ...partial }, getAudioSettings());
  setLocalSettings(next);

  // Oturum açılmamışsa sunucuya istek atılmaz
  const token = typeof window !== 'undefined' ? useGameStore.getState().authToken : null;
  if (!token) return next;

  pendingRemote = { ...pendingRemote, ...partial };
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const body = pendingRemote;
    pendingRemote = {};
    api.patch('/auth/audio-settings', body).catch((err) => {
      console.warn('Ses ayarları sunucuya kaydedilemedi:', err);
    });
  }, SAVE_DEBOUNCE_MS);

  return next;
}

let lastSyncedToken: string | null = null;

export async function syncAudioSettingsFromServer(token: string): Promise<AudioSettings> {
  if (lastSyncedToken === token) return getAudioSettings();
  lastSyncedToken = token;

  try {
    const data = await api.get<unknown>('/auth/audio-settings', { token });
    const merged = sanitize(data, getAudioSettings());
    setLocalSettings(merged);
    return merged;
  } catch (err) {
    lastSyncedToken = null;
    console.warn('Ses ayarları sunucudan alınamadı:', err);
    return getAudioSettings();
  }
}
