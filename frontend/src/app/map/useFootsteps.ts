import { useEffect, useRef } from 'react';
import { getAudioSettings } from '@/features/audio/audioSettings';

import { getScenarioDefinition } from '@/config/scenarioRegistry';
// Adımın düştüğü an döngünün başına denk gelmiyorsa buradan kaydırılır (0–1, döngü kesri)
const FOOTSTEP_PHASE_OFFSET = 0;
// İki adım sesi arasındaki asgari süre (ms). Karakter hızlı yürüse veya kare atlasa bile
// seslerin arka arkaya komik şekilde üst üste binmesini engeller. Yürüme hızlandığı için
// (useMapWalking) adımlar sıklaştı; eşik gerçek adım aralığının altında tutulur ki adım atlanmasın.
const MIN_STEP_INTERVAL_MS = 160;

/**
 * Bir önceki çalınan sesle AYNI OLMAYACAK şekilde rastgele bir sonraki sesi seçer.
 * Bu sayede ne sıralı bir döngü mekanikliği (1,2,3,4,5 tekrarı) oluşur
 * ne de aynı ses üst üste çalarak yapaylaşır (anti-repetition shuffle).
 */
function pickNextNoRepeat(total: number, prev: number | null): number {
  if (total <= 1) return 0;
  if (prev === null) return Math.floor(Math.random() * total);

  // prev haricindeki diğer seçenekler arasından rastgele birini seç
  let next = Math.floor(Math.random() * (total - 1));
  if (next >= prev) {
    next += 1;
  }
  return next;
}

export function useFootsteps(walking: boolean, walkPhase: number, scenarioType?: string | null) {
  const sources = getScenarioDefinition(scenarioType).footsteps;
  const sourcesKey = sources.join('|');

  const ctxRef = useRef<AudioContext | null>(null);
  const buffersRef = useRef<(AudioBuffer | null)[]>([]);
  const lastStepRef = useRef<number | null>(null);
  const lastSoundIndexRef = useRef<number | null>(null);
  const lastStepTimeRef = useRef<number>(0);

  // AudioContext bir kez açılır; Web Audio API ile minimum gecikmeli oynatılır
  useEffect(() => {
    const AudioCtx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    ctxRef.current = ctx;

    return () => {
      ctxRef.current = null;
      ctx.close().catch(() => {});
    };
  }, []);

  // Haritanın sesleri Web Audio buffer'ına çözülür; harita değiştiğinde yeniden yüklenir
  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const list = sourcesKey.split('|');
    const buffers: (AudioBuffer | null)[] = list.map(() => null);
    buffersRef.current = buffers;
    lastSoundIndexRef.current = null;
    let cancelled = false;

    list.forEach((src, i) => {
      fetch(src)
        .then((res) => res.arrayBuffer())
        .then((data) => ctx.decodeAudioData(data))
        .then((buffer) => {
          if (!cancelled) buffers[i] = buffer;
        })
        .catch((err) => console.warn('Ayak sesi yüklenemedi:', src, err));
    });

    return () => {
      cancelled = true;
    };
  }, [sourcesKey]);

  useEffect(() => {
    if (!walking) {
      lastStepRef.current = null;
      lastSoundIndexRef.current = null;
      lastStepTimeRef.current = 0;
      return;
    }

    // Bir yürüme döngüsünde 2 adım atılır (faz 0.5 aralıklarla tetiklenir)
    const step = Math.floor(walkPhase * 2 + FOOTSTEP_PHASE_OFFSET * 2);
    if (lastStepRef.current === step) return;

    // Minimum adım aralığı koruması: hızlı yürüyüşte veya ani faz atlamalarında
    // seslerin üst üste binip makinalı tüfek gibi komik duyulmasını engeller
    const now = performance.now();
    if (now - lastStepTimeRef.current < MIN_STEP_INTERVAL_MS) {
      return;
    }

    lastStepRef.current = step;
    lastStepTimeRef.current = now;

    const audioSettings = getAudioSettings();
    if (audioSettings.footstepMuted || audioSettings.footstepVolume <= 0) return;

    const ctx = ctxRef.current;
    const buffers = buffersRef.current;
    if (!ctx || buffers.length === 0) return;

    // Tarayıcı kısıtlaması varsa ilk tıklamayla etkinleştir
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    // Akıllı rastgele (üst üste aynı ses çalmayacak organik seçim)
    const soundIndex = pickNextNoRepeat(buffers.length, lastSoundIndexRef.current);
    lastSoundIndexRef.current = soundIndex;

    const buffer = buffers[soundIndex];
    if (!buffer) return;

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    // Doğal insan adımı hissi için hafif organik perde (pitch) ve ses seviyesi (gain) modülasyonu
    source.playbackRate.value = 0.96 + Math.random() * 0.08;

    const gain = ctx.createGain();
    const dynamicVolume = audioSettings.footstepVolume;
    gain.gain.value = Math.max(0, Math.min(1, dynamicVolume * (0.88 + Math.random() * 0.18)));

    source.connect(gain).connect(ctx.destination);
    source.start();
  }, [walking, walkPhase]);
}
