'use client';

import type { CSSProperties } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useAudioSettings } from './useAudioSettings';
import type { AudioSettings } from './audioSettings';
import styles from './AudioSettingsPanel.module.scss';

type VolumeKey = 'musicVolume' | 'footstepVolume' | 'doorVolume';
type MuteKey = 'musicMuted' | 'footstepMuted' | 'doorMuted';

interface Channel {
  label: string;
  noun: string;
  volumeKey: VolumeKey;
  muteKey: MuteKey;
}

const CHANNELS: Channel[] = [
  { label: 'Ana Menü Müziği', noun: 'Müzik', volumeKey: 'musicVolume', muteKey: 'musicMuted' },
  { label: 'Yürüme / Adım Sesi', noun: 'Yürüme sesi', volumeKey: 'footstepVolume', muteKey: 'footstepMuted' },
  { label: 'Kapı Sesi (Giriş & Çıkış)', noun: 'Kapı sesi', volumeKey: 'doorVolume', muteKey: 'doorMuted' },
];

interface ChannelRowProps {
  channel: Channel;
  settings: AudioSettings;
  onChange: (partial: Partial<AudioSettings>) => void;
}

function ChannelRow({ channel, settings, onChange }: ChannelRowProps) {
  const volume = settings[channel.volumeKey];
  const muted = settings[channel.muteKey];
  const silent = muted || volume === 0;
  const toggleLabel = `${channel.noun} ${muted ? 'aç' : 'kapat'}`;
  const id = `audio-${channel.volumeKey}`;

  return (
    <div className={styles.channel}>
      <div className={styles.header}>
        <label htmlFor={id} className={styles.label}>
          {channel.label}
        </label>
        <span className={styles.value}>{muted ? 'Kapalı' : `%${Math.round(volume * 100)}`}</span>
      </div>
      <div className={styles.row}>
        <button
          type="button"
          className={styles.muteToggle}
          onClick={() => onChange({ [channel.muteKey]: !muted })}
          title={toggleLabel}
          aria-label={toggleLabel}
          aria-pressed={muted}
        >
          {silent ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
        <input
          id={id}
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => onChange({ [channel.volumeKey]: parseFloat(e.target.value) })}
          className={styles.slider}
          style={{ '--fill': `${(muted ? 0 : volume) * 100}%` } as CSSProperties}
        />
      </div>
    </div>
  );
}

/**
 * Hem Ana Menü hem de Oyun İçi (Harita / Evim) pencerelerinde ortak kullanılan ses paneli.
 */
export default function AudioSettingsPanel() {
  const [settings, update] = useAudioSettings();

  return (
    <div className={styles.panel}>
      {CHANNELS.map((channel) => (
        <ChannelRow
          key={channel.volumeKey}
          channel={channel}
          settings={settings}
          onChange={update}
        />
      ))}
    </div>
  );
}
