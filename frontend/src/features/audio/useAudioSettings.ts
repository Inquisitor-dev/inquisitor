import { useEffect, useSyncExternalStore } from 'react';
import { useGameStore } from '@/store/useGameStore';
import {
  DEFAULT_AUDIO_SETTINGS,
  getAudioSettings,
  subscribeAudioSettings,
  syncAudioSettingsFromServer,
  updateAudioSettings,
  type AudioSettings,
} from './audioSettings';

/**
 * Ses ayarlarını harici store'dan reaktif okuyan ve güncelleyen hook.
 * useSyncExternalStore sayesinde React effect içinde doğrudan setState çağrısı yapılmaz,
 * render döngüleri engellenir ve tüm bileşenler aynı anda güncellenir.
 */
export function useAudioSettings(): [AudioSettings, (partial: Partial<AudioSettings>) => void] {
  const settings = useSyncExternalStore(
    subscribeAudioSettings,
    getAudioSettings,
    () => DEFAULT_AUDIO_SETTINGS,
  );

  const authToken = useGameStore((s) => s.authToken);

  useEffect(() => {
    if (authToken) {
      void syncAudioSettingsFromServer(authToken);
    }
  }, [authToken]);

  return [settings, updateAudioSettings];
}
