'use client';

import { useState } from 'react';
import {
  Activity,
  BookOpen,
  Compass,
  DoorClosed,
  Ear,
  Footprints,
  Gavel,
  Hourglass,
  Lock,
  MoonStar,
  Network,
  ScanSearch,
  X,
  type LucideIcon,
} from 'lucide-react';
import { ApiError } from '@/shared/api/client';
import { getOutfitStory } from '@/config/outfitStories';
import type { useAbilities } from './useAbilities';
import { LIMIT_LABELS, type AbilityId, type AbilityInfo, type AbilityResult } from './abilityTypes';
import styles from './Abilities.module.scss';

const ICONS: Record<AbilityId, LucideIcon> = {
  patience: Hourglass,
  archive_summary: BookOpen,
  backstage: Footprints,
  contradiction_scan: ScanSearch,
  informant: Ear,
  quiet_room: DoorClosed,
  threat: Gavel,
  tracking: Compass,
  data_leak: Network,
  pulse: Activity,
  visor_lock: Lock,
  rooftop: MoonStar,
};

export interface AbilityOption {
  id: string;
  label: string;
}

interface AbilityControlsProps {
  abilities: ReturnType<typeof useAbilities>;
  // Yalnızca bu yetenekler gösterilir (ör. diyalogda şüpheli hedefliler)
  only?: AbilityId[];
  // Hedef sabitse (diyalogdaki şüpheli) seçim sorulmaz
  npcId?: string;
  npcName?: string;
  // Hedef seçimi için şüpheliler ve mekânlar
  suspects?: AbilityOption[];
  locations?: AbilityOption[];
  // Oyun içinde bir seçim isteyen yetenekler (Kulis, Çatı Geçişi, Veri Sızdırma) "kurulur";
  // asıl kullanım bir mekâna ya da ipe tıklanınca sahibinde olur
  armedId?: AbilityId | null;
  onArm?: (ability: AbilityInfo | null) => void;
  onResult?: (ability: AbilityInfo, result: AbilityResult) => void;
  variant?: 'dock' | 'inline';
  className?: string;
}

const needsArming = (ability: AbilityInfo) =>
  ability.id === 'backstage' || ability.id === 'rooftop' || ability.target === 'string';

export default function AbilityControls({
  abilities,
  only,
  npcId,
  npcName,
  suspects = [],
  locations = [],
  armedId = null,
  onArm,
  onResult,
  variant = 'dock',
  className = '',
}: AbilityControlsProps) {
  const [pending, setPending] = useState<AbilityInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<{
    ability: AbilityInfo;
    result?: AbilityResult;
    error?: string;
  } | null>(null);

  const shown = only ? abilities.abilities.filter((a) => only.includes(a.id)) : abilities.abilities;
  if (shown.length === 0 && !outcome) return null;

  const story = abilities.characterId ? getOutfitStory(abilities.characterId) : undefined;
  const textOf = (ability: AbilityInfo) => story?.abilities.find((a) => a.name === ability.name);

  const run = async (ability: AbilityInfo, target: { npcId?: string; locationId?: string } = {}) => {
    setBusy(true);
    try {
      const { result } = await abilities.activate({ abilityId: ability.id, ...target });
      setOutcome({ ability, result });
      onResult?.(ability, result);
    } catch (err) {
      setOutcome({ ability, error: abilityErrorMessage(err) });
    } finally {
      setBusy(false);
      setPending(null);
    }
  };

  const select = (ability: AbilityInfo) => {
    if (ability.limit === 'PASSIVE') return;
    if (needsArming(ability)) {
      onArm?.(armedId === ability.id ? null : ability);
      return;
    }
    setPending(ability);
  };

  // Seçim penceresindeki hedefler; hedefsiz yetenekte tek bir "Kullan" düğmesi
  const targets: { label: string; target: { npcId?: string; locationId?: string } }[] = !pending
    ? []
    : pending.target === 'npc'
      ? npcId
        ? [{ label: `${npcName ?? 'Bu kişi'} üzerinde kullan`, target: { npcId } }]
        : suspects.map((s) => ({ label: s.label, target: { npcId: s.id } }))
      : pending.target === 'location'
        ? locations.map((l) => ({ label: l.label, target: { locationId: l.id } }))
        : [{ label: 'Kullan', target: {} }];

  return (
    <>
      <div
        className={`${variant === 'dock' ? styles.dock : styles.inline} ${className}`}
        role="toolbar"
        aria-label="Karakter yetenekleri"
      >
        {shown.map((ability) => {
          const Icon = ICONS[ability.id];
          const passive = ability.limit === 'PASSIVE';
          const armed = armedId === ability.id;
          const text = textOf(ability);
          const status = armed
            ? 'Hazır'
            : passive
              ? 'Pasif'
              : ability.available
                ? LIMIT_LABELS[ability.limit]
                : 'Kullanılamaz';
          return (
            <button
              key={ability.id}
              type="button"
              className={`${styles.chip} ${armed ? styles.chipArmed : ''} ${passive ? styles.chipPassive : ''}`}
              disabled={busy || passive || (!ability.available && !armed)}
              aria-pressed={needsArming(ability) ? armed : undefined}
              title={[text?.summary, !passive && !ability.available ? ability.reason : null]
                .filter(Boolean)
                .join(' — ')}
              onClick={() => select(ability)}
            >
              <Icon size={15} aria-hidden />
              <span className={styles.chipName}>{ability.name}</span>
              <span className={styles.chipStatus}>{status}</span>
            </button>
          );
        })}
      </div>

      {pending && (
        <div className={styles.overlay} onClick={() => !busy && setPending(null)}>
          <div className={styles.sheet} role="dialog" aria-modal="true" aria-label={pending.name} onClick={(e) => e.stopPropagation()}>
            <button type="button" className={styles.close} onClick={() => setPending(null)} disabled={busy} aria-label="Kapat">
              <X size={18} />
            </button>
            <p className={styles.kicker}>{LIMIT_LABELS[pending.limit]}</p>
            <h2 className={styles.title}>{pending.name}</h2>
            {textOf(pending)?.summary && <p className={styles.summary}>{textOf(pending)?.summary}</p>}
            {targets.length === 0 ? (
              <p className={styles.empty}>Bu yeteneği kullanabileceğin bir hedef yok.</p>
            ) : (
              <div className={styles.targets}>
                {targets.map((t) => (
                  <button
                    key={t.label}
                    type="button"
                    className={styles.target}
                    disabled={busy}
                    onClick={() => void run(pending, t.target)}
                  >
                    {busy ? 'Kullanılıyor…' : t.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {outcome && <AbilityOutcome {...outcome} onClose={() => setOutcome(null)} />}
    </>
  );
}

export interface AbilityOutcomeProps {
  ability: { name: string };
  result?: AbilityResult;
  error?: string;
  onClose: () => void;
}

// Yeteneğin sonucu ya da neden kullanılamadığı
export function AbilityOutcome({ ability, result, error, onClose }: AbilityOutcomeProps) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} role="dialog" aria-modal="true" aria-label={ability.name} onClick={(e) => e.stopPropagation()}>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Kapat">
          <X size={18} />
        </button>
        <p className={styles.kicker}>Yetenek</p>
        <h2 className={styles.title}>{ability.name}</h2>
        {error ? (
          <p className={styles.error} role="alert">{error}</p>
        ) : (
          <>
            <p className={styles.summary}>{result?.message}</p>
            {result?.pulse && (
              <ul className={styles.pulse}>
                {result.pulse.map((row) => (
                  <li key={row.npcId} className={styles.pulseRow}>
                    <span className={styles.pulseName}>{row.name}</span>
                    <span className={styles.pulseBar} aria-hidden>
                      <span style={{ width: `${row.level * 10}%` }} />
                    </span>
                    <span className={styles.pulseValue}>
                      {row.level}/10 · {row.toThreshold === 0 ? 'eşikte' : `eşiğe ${row.toThreshold}`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {result?.notes && <p className={styles.hint}>Sonuç not defterine eklendi.</p>}
          </>
        )}
        <button type="button" className={styles.target} onClick={onClose}>
          Tamam
        </button>
      </div>
    </div>
  );
}

export const abilityErrorMessage = (err: unknown) =>
  err instanceof ApiError ? err.message : 'Yetenek şu an kullanılamadı. Biraz sonra yeniden dene.';
