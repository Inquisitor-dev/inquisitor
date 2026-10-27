'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Check, ChevronLeft, ChevronRight, Gavel, Search, UserRound, X } from 'lucide-react';
import { api } from '@/shared/api/client';
import { logger } from '@/shared/lib/logger';
import { useGameStore } from '@/store/useGameStore';
import { getNpcDialoguePortrait } from '@/config/dialogueConfig';
import { getSuspectsForScenario } from '@/config/npcProfiles';
import { evidencePhoto, evidenceTitle } from '@/components/InvestigationBoard/boardModel';
import type { VerdictOption, VerdictOptions, VerdictReportInput } from '@/features/verdict/verdictTypes';
import BlankField from './components/BlankField';
import { getDossierTheme, shortLabel } from './dossierTheme';
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

// Mühür basılınca hüküm gönderilmeden önce damganın görünmesi için beklenen süre (ms)
const SEAL_DELAY = 650;

interface VerdictDossierProps {
  isOpen: boolean;
  onClose: () => void;
  // Diyalog ekranından açılınca konuşulan şüpheli önceden seçili gelir
  initialCulpritId?: string | null;
  // İkinci Nefes ile masum olduğu açıklananlar katil olarak seçilemez
  excludeIds?: string[];
  onSubmit: (npcId: string, report: VerdictReportInput) => Promise<void>;
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
  const { sessionId, scenarioType, difficulty, evidence, crimeScene } = useGameStore();
  const [options, setOptions] = useState<VerdictOptions | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [culpritId, setCulpritId] = useState<string | null>(initialCulpritId);
  const [report, setReport] = useState<VerdictReportInput>({
    evidenceIds: [],
    involvements: {},
    narrative: '',
  });
  // Aynı anda yalnızca bir boşluğun seçenekleri açık
  const [openField, setOpenField] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sealed, setSealed] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const tabsRef = useRef<HTMLElement>(null);
  const theme = scenarioType || 'medieval';
  const copy = getDossierTheme(theme);
  const caseNo = (sessionId ?? '').replace(/-/g, '').slice(0, 6).toLocaleUpperCase('tr-TR');

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
      if (e.key !== 'Escape') return;
      // Önce açık seçim listesi kapanır, sonra dosya
      if (openField) setOpenField(null);
      else handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleClose, openField]);

  // Dar ekranda sekmeler yana kayar; geçerli bölümün sekmesi görünür kalsın
  useEffect(() => {
    const current = tabsRef.current?.querySelector('[aria-current="step"]');
    current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [stepIndex]);

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
  const labelOf = (list: VerdictOption[] | undefined, id?: string) => {
    const label = list?.find((o) => o.id === id)?.label;
    return label ? shortLabel(label) : null;
  };

  const goTo = (index: number) => {
    setOpenField(null);
    setStepIndex(index);
  };

  const toggleField = (id: string) => setOpenField((f) => (f === id ? null : id));
  const pick =
    <K extends 'weaponId' | 'motive' | 'timeOfDeath'>(key: K) =>
    (value: string | undefined) => {
      setReport((r) => ({ ...r, [key]: value }));
      setOpenField(null);
    };

  const setInvolvement = (npcId: string, kind: string | undefined) => {
    setReport((r) => {
      const involvements = { ...r.involvements };
      if (kind) involvements[npcId] = kind;
      else delete involvements[npcId];
      return { ...r, involvements };
    });
    setOpenField(null);
  };

  const toggleEvidence = (id: string) =>
    setReport((r) => {
      if (r.evidenceIds.includes(id)) {
        return { ...r, evidenceIds: r.evidenceIds.filter((e) => e !== id) };
      }
      if (r.evidenceIds.length >= maxEvidence) return r;
      return { ...r, evidenceIds: [...r.evidenceIds, id] };
    });

  // Katil seçilmeden ilk adımdan öteye geçilmez
  const canAdvance = step !== 'culprit' || !!culpritId;

  const handleSeal = async () => {
    if (!culpritId || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    setSealed(true);
    try {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!reduced) await new Promise((resolve) => setTimeout(resolve, SEAL_DELAY));
      // Katil kendisi için "bağ" seçilmiş olsa bile gönderilmez
      const involvements = Object.fromEntries(
        Object.entries(report.involvements).filter(([id]) => id !== culpritId),
      );
      await onSubmit(culpritId, { ...report, involvements, narrative: report.narrative.trim() });
    } catch (err) {
      logger.error('Failed to submit verdict', err);
      setSubmitError('Hüküm gönderilemedi. Bir daha dene.');
      setSealed(false);
      setSubmitting(false);
    }
  };

  const answered = others.filter((s) => report.involvements[s.id]).length;

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div
        className={styles.folder}
        data-theme={theme}
        role="dialog"
        aria-modal="true"
        aria-labelledby="verdict-dossier-title"
        onClick={(e) => e.stopPropagation()}
      >
        <nav ref={tabsRef} className={styles.tabs} aria-label="Dosyanın bölümleri">
          {steps.map((s, i) => (
            <button
              key={s}
              type="button"
              className={`${styles.tab} ${i === stepIndex ? styles.tabCurrent : ''} ${i < stepIndex ? styles.tabDone : ''}`}
              aria-current={i === stepIndex ? 'step' : undefined}
              title={STEP_TITLES[s]}
              disabled={submitting || (i > 0 && !culpritId)}
              onClick={() => goTo(i)}
            >
              <span className={styles.tabNumber}>{ROMAN[i]}</span>
              <span className={styles.tabLabel}>{STEP_TITLES[s]}</span>
            </button>
          ))}
        </nav>

        <div className={styles.sheet}>
          <button type="button" className={styles.closeBtn} onClick={handleClose} aria-label="Kapat">
            <X size={20} />
          </button>

          <header className={styles.header}>
            <p className={styles.office}>{copy.office}</p>
            <div className={styles.headerRow}>
              <p className={styles.kicker}>
                Hüküm Dosyası{caseNo && <span className={styles.caseNo}> · No. {caseNo}</span>}
              </p>
              <span className={styles.classification}>{copy.classification}</span>
            </div>
            <h2 id="verdict-dossier-title" className={styles.title}>
              <span className={styles.titleNumber}>{ROMAN[stepIndex]}.</span> {STEP_TITLES[step]}
            </h2>
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
                    .map((s, i) => {
                      const portrait = getNpcDialoguePortrait(scenarioType, s.id);
                      const active = culpritId === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          className={`${styles.suspect} ${active ? styles.suspectActive : ''}`}
                          style={{ '--tilt': `${(i % 3) - 1}deg` } as CSSProperties}
                          aria-pressed={active}
                          onClick={() => setCulpritId(s.id)}
                        >
                          <span className={styles.suspectPhoto}>
                            {portrait ? (
                              <img src={portrait} alt="" className={styles.portrait} />
                            ) : (
                              <span className={styles.portraitIcon}>
                                <UserRound size={28} aria-hidden />
                              </span>
                            )}
                          </span>
                          <span className={styles.suspectName}>{s.name}</span>
                          <span className={styles.suspectRole}>{s.role}</span>
                          {active && <span className={styles.inkCircle} aria-hidden />}
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
                  İlgisiz kanıt puan götürür.
                  <span className={styles.hintCount}>
                    {report.evidenceIds.length}/{maxEvidence}
                  </span>
                </p>
                {evidence.length === 0 ? (
                  <p className={styles.empty}>Bu vakada hiç kanıt bulmadın.</p>
                ) : (
                  <ul className={styles.evidenceList}>
                    {evidence.map((item) => {
                      const active = report.evidenceIds.includes(item.id);
                      const full = !active && report.evidenceIds.length >= maxEvidence;
                      const photo =
                        item.category === 'STATEMENT' ? null : evidencePhoto(scenarioType, item, crimeScene);
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            className={`${styles.evidence} ${active ? styles.evidenceActive : ''}`}
                            aria-pressed={active}
                            disabled={full}
                            onClick={() => toggleEvidence(item.id)}
                          >
                            <span className={styles.checkbox}>{active && <Check size={16} strokeWidth={3} />}</span>
                            <span
                              className={styles.evidenceThumb}
                              style={photo ? { backgroundImage: `url(${photo})` } : undefined}
                              aria-hidden
                            >
                              {!photo && <Search size={16} />}
                            </span>
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
              <div className={styles.form}>
                <p className={styles.hint}>Boşlukları doldur; emin olmadığını boş bırakabilirsin.</p>
                {options.weapons.length > 0 && (
                  <BlankField
                    label="Cinayet aleti"
                    options={options.weapons}
                    value={report.weaponId}
                    onChange={pick('weaponId')}
                    open={openField === 'weapon'}
                    onToggle={() => toggleField('weapon')}
                  />
                )}
                {options.motives.length > 0 && (
                  <BlankField
                    label="Motif"
                    options={options.motives}
                    value={report.motive}
                    onChange={pick('motive')}
                    open={openField === 'motive'}
                    onToggle={() => toggleField('motive')}
                  />
                )}
                {options.timesOfDeath.length > 0 && (
                  <BlankField
                    label="Ölüm saati"
                    options={options.timesOfDeath}
                    value={report.timeOfDeath}
                    onChange={pick('timeOfDeath')}
                    open={openField === 'time'}
                    onToggle={() => toggleField('time')}
                  />
                )}
              </div>
            )}

            {step === 'innocents' && options && (
              <>
                <p className={styles.hint}>
                  Katil değilse her birinin cinayetle bağı neydi?
                  <span className={styles.hintCount}>
                    {answered}/{others.length}
                  </span>
                </p>
                <ul className={styles.innocentList}>
                  {others.map((s) => {
                    const portrait = getNpcDialoguePortrait(scenarioType, s.id);
                    return (
                      <li key={s.id} className={styles.innocent}>
                        <span className={styles.innocentPhoto}>
                          {portrait ? (
                            <img src={portrait} alt="" className={styles.portrait} />
                          ) : (
                            <span className={styles.portraitIcon}>
                              <UserRound size={22} aria-hidden />
                            </span>
                          )}
                        </span>
                        <span className={styles.innocentText}>
                          <span className={styles.innocentName}>{s.name}</span>
                          <span className={styles.suspectRole}>{s.role}</span>
                        </span>
                        <BlankField
                          label="Bağı"
                          variant="stamp"
                          options={options.involvementKinds}
                          value={report.involvements[s.id]}
                          onChange={(kind) => setInvolvement(s.id, kind)}
                          open={openField === `inv-${s.id}`}
                          onToggle={() => toggleField(`inv-${s.id}`)}
                        />
                      </li>
                    );
                  })}
                </ul>
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
                  rows={9}
                  placeholder="Gece yarısı…"
                  aria-label="Olayın akışı"
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
                  <div className={styles.summaryRow}>
                    <dt>Katil</dt>
                    <dd className={styles.summaryCulprit}>{culpritId ? nameOf(culpritId) : '—'}</dd>
                  </div>
                  <div className={styles.summaryRow}>
                    <dt>Dayanak kanıtlar</dt>
                    <dd>{report.evidenceIds.length ? `${report.evidenceIds.length} kanıt` : '—'}</dd>
                  </div>
                  {options && options.weapons.length > 0 && (
                    <div className={styles.summaryRow}>
                      <dt>Cinayet aleti</dt>
                      <dd>{labelOf(options.weapons, report.weaponId) ?? '—'}</dd>
                    </div>
                  )}
                  {options && options.motives.length > 0 && (
                    <div className={styles.summaryRow}>
                      <dt>Motif</dt>
                      <dd>{labelOf(options.motives, report.motive) ?? '—'}</dd>
                    </div>
                  )}
                  {options && options.timesOfDeath.length > 0 && (
                    <div className={styles.summaryRow}>
                      <dt>Ölüm saati</dt>
                      <dd>{labelOf(options.timesOfDeath, report.timeOfDeath) ?? '—'}</dd>
                    </div>
                  )}
                  {options && options.involvementKinds.length > 0 && (
                    <div className={styles.summaryRow}>
                      <dt>Diğer şüpheliler</dt>
                      <dd>
                        {answered}/{others.length} kişi
                      </dd>
                    </div>
                  )}
                  <div className={styles.summaryRow}>
                    <dt>Olayın akışı</dt>
                    <dd>{report.narrative.trim() ? `${report.narrative.trim().length} karakter` : '—'}</dd>
                  </div>
                </dl>
                <p className={styles.warning}>
                  Mühürlenen hüküm geri alınamaz. Boş bıraktığın alanlar puan getirmez ama hükmü engellemez.
                </p>
                {submitError && <p className={styles.error}>{submitError}</p>}
                <div className={styles.sealArea}>
                  <button
                    type="button"
                    className={styles.sealBtn}
                    onClick={handleSeal}
                    disabled={!culpritId || submitting}
                  >
                    <Gavel size={26} aria-hidden />
                    <span>{submitting ? 'Mühürleniyor…' : 'Mühürle'}</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {sealed && (
            <div className={styles.sealStamp} aria-hidden>
              {copy.sealText}
            </div>
          )}

          <footer className={styles.footer}>
            <button
              type="button"
              className={styles.navBtn}
              onClick={() => (stepIndex === 0 ? handleClose() : goTo(stepIndex - 1))}
              disabled={submitting}
            >
              <ChevronLeft size={16} />
              <span>{stepIndex === 0 ? 'Vazgeç' : 'Geri'}</span>
            </button>
            <span className={styles.pageNo}>
              {stepIndex + 1} / {steps.length}
            </span>
            {step === 'seal' ? (
              <span className={styles.navSpacer} />
            ) : (
              <button
                type="button"
                className={styles.navBtn}
                onClick={() => goTo(stepIndex + 1)}
                disabled={!canAdvance}
              >
                <span>İleri</span>
                <ChevronRight size={16} />
              </button>
            )}
          </footer>
        </div>
      </div>
    </div>
  );
}
