/**
 * Oyuncunun kendi evine giriş ve çıkış kapı sesleri (wood1, wood2, wood3).
 * Her giriş ve çıkışta 1, 2 veya 3 seslerinden biri rastgele seçilerek çalınır.
 * Aynı sesin ardışık iki kez çalmaması için anti-repetition mekanizması bulunur.
 */

import { getAudioSettings } from './audioSettings';

const DOOR_SOUNDS = [
  '/sounds/door/wood1.wav',
  '/sounds/door/wood2.wav',
  '/sounds/door/wood3.wav',
];

let lastDoorIndex: number | null = null;

export function playDoorSound(customVolume?: number): void {
  if (typeof window === 'undefined') return;

  try {
    const settings = getAudioSettings();
    if (settings.doorMuted) return;

    // Özel ses seviyesi verilmişse oranlayarak uygula; verilmemişse doğrudan ayardaki kapı sesini kullan
    const effectiveVolume =
      customVolume !== undefined
        ? Math.max(0, Math.min(1, customVolume * (settings.doorVolume / 0.55)))
        : settings.doorVolume;

    if (effectiveVolume <= 0) return;

    const total = DOOR_SOUNDS.length;
    let nextIndex: number;

    if (total <= 1 || lastDoorIndex === null) {
      nextIndex = Math.floor(Math.random() * total);
    } else {
      // Bir önceki çalınan ses haricindekilerden rastgele seç
      let offset = Math.floor(Math.random() * (total - 1));
      if (offset >= lastDoorIndex) {
        offset += 1;
      }
      nextIndex = offset;
    }

    lastDoorIndex = nextIndex;

    const audio = new Audio(DOOR_SOUNDS[nextIndex]);
    audio.volume = Math.max(0, Math.min(1, effectiveVolume));
    audio.play().catch((err) => {
      console.warn('Kapı sesi oynatılamadı:', err);
    });
  } catch (err) {
    console.warn('Kapı sesi hatası:', err);
  }
}
