import React from 'react';
import Link from 'next/link';
import {
  Check,
  Coins,
  Lock,
  Map as MapIcon,
  Skull,
  Users,
  X,
} from 'lucide-react';
import {
  UNIVERSE_IDS,
  DIFFICULTY_IDS,
  DIFFICULTY_DETAILS,
  STORY_DETAILS,
  getMapImage,
} from './scenarioConfigData';
import styles from '../../page.module.scss';

interface ScenarioConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  tempDifficulty: string;
  setTempDifficulty: (val: string) => void;
  tempStory: string;
  setTempStory: (val: string) => void;
  onSave: () => void;
  ownsUniverse: (id: string) => boolean;
  ownsDifficulty: (id: string) => boolean;
  getUnlockPrice: (itemId: string) => string | number;
}

export default function ScenarioConfigModal({
  isOpen,
  onClose,
  tempDifficulty,
  setTempDifficulty,
  tempStory,
  setTempStory,
  onSave,
  ownsUniverse,
  ownsDifficulty,
  getUnlockPrice,
}: ScenarioConfigModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={`${styles.sheet} ${styles.configSheet}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="config-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button className={styles.sheetClose} onClick={onClose} aria-label="Kapat">
          <X size={18} />
        </button>
        <span className={styles.sheetSeal} aria-hidden><MapIcon size={20} /></span>
        <span className={styles.sheetEyebrow}>Soruşturma Ayarları</span>
        <h2 id="config-title" className={styles.sheetTitle}>Maceranı Şekillendir</h2>
        <p className={styles.sheetLead}>
          Hesabında açık olan evrenlerden ve zorluklardan birini seç. Kilitli olanları markette açabilirsin.
        </p>

        {/* EVRENLER */}
        <section className={styles.configSection}>
          <header className={styles.configHeader}>
            <span className={styles.configNumeral}>I</span>
            <h3>Evren</h3>
            <span className={styles.configCount}>
              {UNIVERSE_IDS.filter(ownsUniverse).length} / {UNIVERSE_IDS.length} açık
            </span>
          </header>

          <div className={styles.universeGrid}>
            {UNIVERSE_IDS.map((id) => {
              const details = STORY_DETAILS[id];
              const owned = ownsUniverse(id);
              const selected = tempStory === id;
              const thumb = (
                <>
                  <span className={styles.universeThumb} style={{ backgroundImage: `url('${getMapImage(id)}')` }} />
                  <span className={styles.universeShade} />
                  <span className={`${styles.cardStatus} ${selected ? styles.statusSelected : owned ? styles.statusOwned : styles.statusLocked}`}>
                    {selected ? <><Check size={12} /> Seçili</> : owned ? 'Açık' : <><Lock size={12} /> Kilitli</>}
                  </span>
                  <span className={styles.universeBody}>
                    <small>{details.era}</small>
                    <strong>{details.title}</strong>
                  </span>
                </>
              );

              return owned ? (
                <button
                  key={id}
                  type="button"
                  className={`${styles.universeCard} ${selected ? styles.cardSelected : ''}`}
                  onClick={() => setTempStory(id)}
                  aria-pressed={selected}
                >
                  {thumb}
                </button>
              ) : (
                <div key={id} className={`${styles.universeCard} ${styles.cardLocked}`}>
                  {thumb}
                  <Link href="/market" className={styles.unlockLink}>
                    <Coins size={13} /> {getUnlockPrice(`universe_${id}`)} · Markette aç
                  </Link>
                </div>
              );
            })}
          </div>
          <p className={styles.configHint}>{STORY_DETAILS[tempStory]?.desc}</p>
        </section>

        {/* ZORLUKLAR */}
        <section className={styles.configSection}>
          <header className={styles.configHeader}>
            <span className={styles.configNumeral}>II</span>
            <h3>Zorluk</h3>
            <span className={styles.configCount}>
              {DIFFICULTY_IDS.filter(ownsDifficulty).length} / {DIFFICULTY_IDS.length} açık
            </span>
          </header>

          <div className={styles.difficultyGrid}>
            {DIFFICULTY_IDS.map((id) => {
              const details = DIFFICULTY_DETAILS[id];
              const owned = ownsDifficulty(id);
              const selected = tempDifficulty === id;
              const content = (
                <>
                  <span className={`${styles.cardStatus} ${selected ? styles.statusSelected : owned ? styles.statusOwned : styles.statusLocked}`}>
                    {selected ? <><Check size={12} /> Seçili</> : owned ? 'Açık' : <><Lock size={12} /> Kilitli</>}
                  </span>
                  <span className={styles.rankSeal}>{['I', 'II', 'III'][details.level - 1]}</span>
                  <strong className={styles.difficultyName}>{details.label}</strong>
                  <span className={styles.skullRow}>
                    {[1, 2, 3].map((lvl) => (
                      <Skull key={lvl} size={14} className={lvl <= details.level ? styles.skullOn : styles.skullOff} />
                    ))}
                  </span>
                  <span className={styles.suspectCount}>
                    <Users size={13} /> {details.suspects} şüpheli
                  </span>
                  <span className={styles.difficultyDesc}>{details.desc}</span>
                </>
              );

              return owned ? (
                <button
                  key={id}
                  type="button"
                  className={`${styles.difficultyCard} ${styles[`level${details.level}`]} ${selected ? styles.cardSelected : ''}`}
                  onClick={() => setTempDifficulty(id)}
                  aria-pressed={selected}
                >
                  {content}
                </button>
              ) : (
                <div key={id} className={`${styles.difficultyCard} ${styles[`level${details.level}`]} ${styles.cardLocked}`}>
                  {content}
                  <Link href="/market" className={styles.unlockLink}>
                    <Coins size={13} /> {getUnlockPrice(`difficulty_${id}`)} · Markette aç
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        <footer className={styles.configFooter}>
          <div className={styles.configSummary}>
            <span>Seçimin</span>
            <strong>
              {STORY_DETAILS[tempStory]?.title} · {DIFFICULTY_DETAILS[tempDifficulty]?.label}
            </strong>
            <small>{DIFFICULTY_DETAILS[tempDifficulty]?.suspects} şüpheli</small>
          </div>
          <div className={styles.configActions}>
            <button className={styles.btnGhost} onClick={onClose}>
              Vazgeç
            </button>
            <button className={styles.sheetPrimary} onClick={onSave}>
              Seçimi Onayla
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
