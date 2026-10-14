import { apiUrl } from '@/config/api';

export interface AudioSettings {
  musicVolume: number;
  musicMuted: boolean;
  footstepVolume: number;
  footstepMuted: boolean;
  doorVolume: number;
  doorMuted: boolean;
}

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  musicVolume: 0.4,
  musicMuted: false,
  footstepVolume: 0.45,
  footstepMuted: false,
  doorVolume: 0.55,
  doorMuted: false,
};

const STORAGE_KEY = 'inquisitor_audio_settings';
const EVENT_NAME = 'inquisitor_audio_settings_changed';

let cachedSettings: AudioSettings = { ...DEFAULT_AUDIO_SETTINGS };
let hasInitialized = false;

function initFromStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      cachedSettings = {
        musicVolume:
          typeof parsed.musicVolume === 'number'
            ? Math.max(0, Math.min(1, parsed.musicVolume))
            : DEFAULT_AUDIO_SETTINGS.musicVolume,
        musicMuted:
          typeof parsed.musicMuted === 'boolean'
            ? parsed.musicMuted
            : DEFAULT_AUDIO_SETTINGS.musicMuted,
        footstepVolume:
          typeof parsed.footstepVolume === 'number'
            ? Math.max(0, Math.min(1, parsed.footstepVolume))
            : DEFAULT_AUDIO_SETTINGS.footstepVolume,
        footstepMuted:
          typeof parsed.footstepMuted === 'boolean'
            ? parsed.footstepMuted
            : DEFAULT_AUDIO_SETTINGS.footstepMuted,
        doorVolume:
          typeof parsed.doorVolume === 'number'
            ? Math.max(0, Math.min(1, parsed.doorVolume))
            : DEFAULT_AUDIO_SETTINGS.doorVolume,
        doorMuted:
          typeof parsed.doorMuted === 'boolean'
            ? parsed.doorMuted
            : DEFAULT_AUDIO_SETTINGS.doorMuted,
      };
    }
  } catch {
    // ignore parse errors
  }
  hasInitialized = true;
}

export function getAudioSettings(): AudioSettings {
  if (!hasInitialized) {
    initFromStorage();
  }
  return cachedSettings;
}

export function updateAudioSettingsLocally(partial: Partial<AudioSettings>): AudioSettings {
  if (!hasInitialized) {
    initFromStorage();
  }

  const updated: AudioSettings = {
    ...cachedSettings,
    ...partial,
  };

  if (typeof updated.musicVolume === 'number') {
    updated.musicVolume = Math.max(0, Math.min(1, updated.musicVolume));
  }
  if (typeof updated.footstepVolume === 'number') {
    updated.footstepVolume = Math.max(0, Math.min(1, updated.footstepVolume));
  }
  if (typeof updated.doorVolume === 'number') {
    updated.doorVolume = Math.max(0, Math.min(1, updated.doorVolume));
  }

  cachedSettings = updated;

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: updated }));
    } catch {
      // ignore storage write errors
    }
  }

  return updated;
}

export function subscribeAudioSettings(callback: (settings: AudioSettings) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = (e: Event) => {
    const custom = e as CustomEvent<AudioSettings>;
    callback(custom.detail || getAudioSettings());
  };

  window.addEventListener(EVENT_NAME, handler);
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
  };
}

let saveRemoteTimer: ReturnType<typeof setTimeout> | null = null;

export function saveAudioSettingsRemote(
  settings: Partial<AudioSettings>,
  authToken?: string | null,
): void {
  if (!authToken || typeof window === 'undefined') return;

  if (saveRemoteTimer) clearTimeout(saveRemoteTimer);
  saveRemoteTimer = setTimeout(() => {
    fetch(apiUrl('/auth/audio-settings'), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(settings),
    }).catch((err) => {
      console.warn('Ses ayarları sunucuya kaydedilemedi:', err);
    });
  }, 400);
}

export async function fetchAndSyncAudioSettings(authToken?: string | null): Promise<AudioSettings> {
  const local = getAudioSettings();
  if (!authToken) return local;

  try {
    const res = await fetch(apiUrl('/auth/audio-settings'), {
      headers: { Authorization: `Bearer ${authToken}` },
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      const merged = updateAudioSettingsLocally({
        musicVolume: typeof data.musicVolume === 'number' ? data.musicVolume : local.musicVolume,
        musicMuted: typeof data.musicMuted === 'boolean' ? data.musicMuted : local.musicMuted,
        footstepVolume:
          typeof data.footstepVolume === 'number' ? data.footstepVolume : local.footstepVolume,
        footstepMuted:
          typeof data.footstepMuted === 'boolean' ? data.footstepMuted : local.footstepMuted,
        doorVolume: typeof data.doorVolume === 'number' ? data.doorVolume : local.doorVolume,
        doorMuted: typeof data.doorMuted === 'boolean' ? data.doorMuted : local.doorMuted,
      });
      return merged;
    }
  } catch (err) {
    console.warn('Ses ayarları sunucudan alınamadı:', err);
  }

  return local;
}
