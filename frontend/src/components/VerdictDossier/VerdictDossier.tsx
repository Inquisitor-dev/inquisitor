'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Gavel, X } from 'lucide-react';
import { api } from '@/shared/api/client';
import { logger } from '@/shared/lib/logger';
import { useGameStore } from '@/store/useGameStore';
import { getNpcDialoguePortrait } from '@/config/dialogueConfig';
import { getSuspectsForScenario } from '@/config/npcProfiles';
import { evidenceTitle } from '@/components/InvestigationBoard/boardModel';
import type { VerdictOption, VerdictOptions, VerdictReportInput } from '@/features/verdict/verdictTypes';
import styles from './VerdictDossier.module.scss';

type StepId = 'culprit' | 'evidence' | 'details' | 'innocents' | 'narrative' | 'seal';

const STEP_TITLES: Record<StepId, string> = {
  culprit: 'Katil',
  evidence: 'Dayanaklar',
  details: 'Cinayetin Ayrıntıları',
  innocents: 'Diğer Şüpheliler',
  narrative: 'Olayın Akışı',
  seal: 'Mühür',
};

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'];

interface VerdictDossierProps {
  isOpen: boolean;
  onClose: () => void;
  // Diyalog ekranından açılınca konuşulan şüpheli önceden seçili gelir
  initialCulpritId?: string | null;
  // İkinci Nefes ile masum olduğu açıklananlar katil olarak seçilemez
  excludeIds?: string[];
  onSubmit: (npcId: string, report: VerdictReportInput) => Promise<void>;
}

// Seçilebilir düğme dizisi: aynı seçeneğe tekrar basmak seçimi kaldırır
function ChoiceRow({
  options,
  value,
  onChange,
}: {
  options: VerdictOption[];
  value?: string;
  onChange: (id: string | undefined) => void;
}) {
  return (
    <div className={styles.choices}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          className={`${styles.choice} ${value === o.id ? styles.choiceActive : ''}`}
          aria-pressed={value === o.id}
          onClick={() => onChange(value === o.id ? undefined : o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// Dosya yalnızca açıkken mount edilir: her açılışta form baştan başlar
export default function VerdictDossier({ isOpen, ...props }: VerdictDossierProps) {
  return isOpen ? <DossierForm {...props} /> : null;
}

function DossierForm({
  onClose,
  initialCulpritId = null,
  excludeIds = [],
  onSubmit,
}: Omit<VerdictDossierProps, 'isOpen'>) {
  const { sessionId, scenarioType, difficulty, evidence } = useGameStore();
  const [options, setOptions] = useState<VerdictOptions | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [culpritId, setCulpritId] = useState<string | null>(initialCulpritId);
  const [report, setReport] = useState<VerdictReportInput>({
    evidenceIds: [],
    involvements: {},
    narrative: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Seçenekler sunucudan gelir (silahlar, motifler, saatler, bağ türleri)
  useEffect(() => {
    if (!sessionId) return;
    api
      .get<VerdictOptions>(`/game-sessions/${sessionId}/verdict-options`)
      .then(setOptions)
      .catch((err) => {
        logger.error('Failed to load verdict options', err);
        setLoadError(true);
      });
  }, [sessionId]);

  const handleClose = useCallback(() => {
    if (!submitting) onClose();
  }, [onClose, submitting]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleClose]);

  const suspects = useMemo(
    () => getSuspectsForScenario(scenarioType, difficulty),
    [scenarioType, difficulty],
  );

  // Eski vakalarda olmayan alanların adımı atlanır
  const steps = useMemo<StepId[]>(() => {
    const list: StepId[] = ['culprit', 'evidence'];
    if (options && (options.weapons.length || options.motives.length || options.timesOfDeath.length)) {
      list.push('details');
    }
    if (options?.involvementKinds.length) list.push('innocents');
    list.push('narrative', 'seal');
    return list;
  }, [options]);

  const step = steps[Math.min(stepIndex, steps.length - 1)];
  const maxEvidence = options?.limits.evidence ?? 5;
  const maxNarrative = options?.limits.narrative ?? 1500;
  const others = suspects.filter((s) => s.id !== culpritId);
  const nameOf = (id: string) => suspects.find((s) => s.id === id)?.name ?? id;
  const labelOf = (list: VerdictOption[] | undefined, id?: string) =>
    list?.find((o) => o.id === id)?.label ?? 'Boş';

  const toggleEvidence = (id: string) =>
    setReport((r) => {
      if (r.evidenceIds.includes(id)) {
        return { ...r, evidenceIds: r.evidenceIds.filter((e) => e !== id) };
      }
      if (r.evidenceIds.length >= maxEvidence) return r;
      return { ...r, evidenceIds: [...r.evidenceIds, id] };
    });

  const canAdvance = step !== 'culprit' || !!culpritId;

  const handleSeal = async () => {
    if (!culpritId || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      // Katil kendisi için "bağ" seçilmiş olsa bile gönderilmez
      const involvements = Object.fromEntries(
        Object.entries(report.involvements).filter(([id]) => id !== culpritId),
      );
      await onSubmit(culpritId, { ...report, involvements, narrative: report.narrative.trim() });
    } catch (err) {
      logger.error('Failed to submit verdict', err);
      setSubmitError('Hüküm gönderilemedi. Bir daha dene.');
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div
        className={styles.dossier}
        role="dialog"
        aria-modal="true"
        aria-labelledby="verdict-dossier-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className={styles.closeBtn} onClick={handleClose} aria-label="Kapat">
          <X size={20} />
        </button>

        <header className={styles.header}>
          <p className={styles.kicker}>Hüküm Dosyası</p>
          <h2 id="verdict-dossier-title" className={styles.title}>
            {STEP_TITLES[step]}
          </h2>
          <ol className={styles.steps}>
            {steps.map((s, i) => (
              <li
                key={s}
                className={`${styles.stepDot} ${i === stepIndex ? styles.stepCurrent : ''} ${i < stepIndex ? styles.stepDone : ''}`}
                title={STEP_TITLES[s]}
              >
                {ROMAN[i]}
              </li>
            ))}
          </ol>
        </header>

        <div className={styles.body}>
          {loadError && (
            <p className={styles.error}>Dosyanın seçenekleri yüklenemedi. Kapatıp yeniden açmayı dene.</p>
          )}

          {step === 'culprit' && (
            <>
              <p className={styles.hint}>Kim yaptı? Bu seçim vakayı kazanıp kazanmayacağını belirler.</p>
              <div className={styles.suspectGrid}>
                {suspects
                  .filter((s) => !excludeIds.includes(s.id))
                  .map((s) => {
                    const portrait = getNpcDialoguePortrait(scenarioType, s.id);
                    const active = culpritId === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        className={`${styles.suspect} ${active ? styles.suspectActive : ''}`}
                        aria-pressed={active}
                        onClick={() => setCulpritId(s.id)}
                      >
                        {portrait ? (
                          <img src={portrait} alt="" className={styles.portrait} />
                        ) : (
                          <span className={styles.portraitIcon}>{s.icon}</span>
                        )}
                        <span className={styles.suspectText}>
                          <span className={styles.suspectName}>{s.name}</span>
                          <span className={styles.suspectRole}>{s.role}</span>
                        </span>
                      </button>
                    );
                  })}
              </div>
            </>
          )}

          {step === 'evidence' && (
            <>
              <p className={styles.hint}>
                Hükmünü hangi kanıtlara dayandırıyorsun? Katili gösteren ya da bir masumu aklayan kanıtları seç.
                İlgisiz kanıt puan götürür. ({report.evidenceIds.length}/{maxEvidence})
              </p>
              {evidence.length === 0 ? (
                <p className={styles.empty}>Bu vakada hiç kanıt bulmadın.</p>
              ) : (
                <ul className={styles.evidenceList}>
                  {evidence.map((item) => {
                    const active = report.evidenceIds.includes(item.id);
                    const full = !active && report.evidenceIds.length >= maxEvidence;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          className={`${styles.evidence} ${active ? styles.evidenceActive : ''}`}
                          aria-pressed={active}
                          disabled={full}
                          onClick={() => toggleEvidence(item.id)}
                        >
                          <span className={styles.checkbox}>{active && <Check size={14} />}</span>
                          <span className={styles.evidenceText}>
                            <span className={styles.evidenceTitle}>{evidenceTitle(scenarioType, item)}</span>
                            <span className={styles.evidenceBody}>{item.text}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}

          {step === 'details' && options && (
            <>
              {options.weapons.length > 0 && (
                <section className={styles.group}>
                  <h3 className={styles.groupTitle}>Cinayet aleti</h3>
                  <ChoiceRow
                    options={options.weapons}
                    value={report.weaponId}
                    onChange={(weaponId) => setReport((r) => ({ ...r, weaponId }))}
                  />
                </section>
              )}
              {options.motives.length > 0 && (
                <section className={styles.group}>
                  <h3 className={styles.groupTitle}>Motif</h3>
                  <ChoiceRow
                    options={options.motives}
                    value={report.motive}
                    onChange={(motive) => setReport((r) => ({ ...r, motive }))}
                  />
                </section>
              )}
              {options.timesOfDeath.length > 0 && (
                <section className={styles.group}>
                  <h3 className={styles.groupTitle}>Ölüm saati</h3>
                  <ChoiceRow
                    options={options.timesOfDeath}
                    value={report.timeOfDeath}
                    onChange={(timeOfDeath) => setReport((r) => ({ ...r, timeOfDeath }))}
                  />
                </section>
              )}
            </>
          )}

          {step === 'innocents' && options && (
            <>
              <p className={styles.hint}>Katil değilse her birinin cinayetle bağı neydi?</p>
              {others.map((s) => (
                <section key={s.id} className={styles.group}>
                  <h3 className={styles.groupTitle}>{s.name}</h3>
                  <ChoiceRow
                    options={options.involvementKinds}
                    value={report.involvements[s.id]}
                    onChange={(kind) =>
                      setReport((r) => {
                        const involvements = { ...r.involvements };
                        if (kind) involvements[s.id] = kind;
                        else delete involvements[s.id];
                        return { ...r, involvements };
                      })
                    }
                  />
                </section>
              ))}
            </>
          )}

          {step === 'narrative' && (
            <>
              <p className={styles.hint}>
                Olay nasıl gerçekleşti? Kim, neyle, neden ve ne zaman öldürdü; diğerleri ne yaptı? Bir hakem bunu
                gerçekle karşılaştırıp puanlayacak.
              </p>
              <textarea
                className={styles.narrative}
                value={report.narrative}
                maxLength={maxNarrative}
                rows={8}
                placeholder="Gece yarısı…"
                onChange={(e) => setReport((r) => ({ ...r, narrative: e.target.value }))}
              />
              <p className={styles.counter}>
                {report.narrative.length}/{maxNarrative}
              </p>
            </>
          )}

          {step === 'seal' && (
            <>
              <dl className={styles.summary}>
                <dt>Katil</dt>
                <dd className={styles.summaryCulprit}>{culpritId ? nameOf(culpritId) : 'Seçilmedi'}</dd>
                <dt>Dayanak kanıtlar</dt>
                <dd>{report.evidenceIds.length} kanıt</dd>
                {options && options.weapons.length > 0 && (
                  <>
                    <dt>Cinayet aleti</dt>
                    <dd>{labelOf(options.weapons, report.weaponId)}</dd>
                  </>
                )}
                {options && options.motives.length > 0 && (
                  <>
                    <dt>Motif</dt>
                    <dd>{labelOf(options.motives, report.motive)}</dd>
                  </>
                )}
                {options && options.timesOfDeath.length > 0 && (
                  <>
                    <dt>Ölüm saati</dt>
                    <dd>{labelOf(options.timesOfDeath, report.timeOfDeath)}</dd>
                  </>
                )}
                {options && options.involvementKinds.length > 0 && (
                  <>
                    <dt>Diğer şüpheliler</dt>
                    <dd>
                      {others.filter((s) => report.involvements[s.id]).length}/{others.length} kişi için bağ seçtin
                    </dd>
                  </>
                )}
                <dt>Olayın akışı</dt>
                <dd>{report.narrative.trim() ? `${report.narrative.trim().length} karakter` : 'Boş'}</dd>
              </dl>
              <p className={styles.warning}>
                Mühürlenen hüküm geri alınamaz. Boş bıraktığın alanlar puan getirmez ama hükmü engellemez.
              </p>
              {submitError && <p className={styles.error}>{submitError}</p>}
            </>
          )}
        </div>

        <footer className={styles.footer}>
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => (stepIndex === 0 ? handleClose() : setStepIndex((i) => i - 1))}
            disabled={submitting}
          >
            <ChevronLeft size={16} />
            <span>{stepIndex === 0 ? 'Vazgeç' : 'Geri'}</span>
          </button>
          {step === 'seal' ? (
            <button
              type="button"
              className={styles.sealBtn}
              onClick={handleSeal}
              disabled={!culpritId || submitting}
            >
              <Gavel size={16} />
              <span>{submitting ? 'Mühürleniyor…' : 'Mühürle ve Hükmü Ver'}</span>
            </button>
          ) : (
            <button
              type="button"
              className={styles.navBtn}
              onClick={() => setStepIndex((i) => i + 1)}
              disabled={!canAdvance}
            >
              <span>İleri</span>
              <ChevronRight size={16} />
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
