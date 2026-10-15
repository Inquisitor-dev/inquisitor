/**
 * Not Defteri'nde sayfa çevirme hışırtısı. Ses dosyası yerine Web Audio ile üretilir:
 * kısa bir gürültü patlaması, kâğıt sesine benzesin diye bant geçiren filtreden geçirilir.
 * Ayrı bir ses ayarı yok; oyuncu etkileşim seslerini kapı sesi ayarından yönettiği için
 * onun ses seviyesini ve sessize alma tercihini izler.
 */

import { getAudioSettings } from './audioSettings';

let context: AudioContext | null = null;

function audioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  context ??= new Ctor();
  return context;
}

export function playPageTurnSound(): void {
  try {
    const settings = getAudioSettings();
    if (settings.doorMuted || settings.doorVolume <= 0) return;
    const ctx = audioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') void ctx.resume();

    const duration = 0.38;
    const length = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      // Kâğıdın tırtıklı sesi: rastgele gürültü, aralarda hafif kesintilerle
      const crackle = Math.random() < 0.08 ? 1.6 : 1;
      data[i] = (Math.random() * 2 - 1) * crackle;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 0.8;
    const now = ctx.currentTime;
    filter.frequency.setValueAtTime(1800, now);
    filter.frequency.exponentialRampToValueAtTime(4200, now + duration * 0.6);

    const gain = ctx.createGain();
    const peak = 0.22 * settings.doorVolume;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start(now);
    source.stop(now + duration);
  } catch {
    // Ses çalınamazsa defter sessizce çalışmaya devam eder
  }
}
