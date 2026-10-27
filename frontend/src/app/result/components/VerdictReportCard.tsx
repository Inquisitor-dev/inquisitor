'use client';

import { Check, X } from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import { getDossierTheme, shortLabel } from '@/components/VerdictDossier/dossierTheme';
import type { CaseOutcome, VerdictFieldId, VerdictFieldResult } from '@/features/verdict/verdictTypes';
import styles from './VerdictReportCard.module.scss';

const FIELD_LABELS: Record<VerdictFieldId, string> = {
  EVIDENCE: 'Dayanak kanıtlar',
  WEAPON: 'Cinayet aleti',
  MOTIVE: 'Motif',
  TIME_OF_DEATH: 'Ölüm saati',
  INVOLVEMENTS: 'Diğer şüpheliler',
  NARRATIVE: 'Olayın akışı',
};

// Sunucunun boş alan için yazdığı cevap (verdict-report.ts NOT_ANSWERED)
const NOT_ANSWERED = 'Boş bıraktın';

type Mark = 'ok' | 'partial' | 'bad';

const markOf = (field: VerdictFieldResult): Mark =>
  field.points >= field.max ? 'ok' : field.points > 0 ? 'partial' : 'bad';

interface VerdictReportCardProps {
  outcome: CaseOutcome;
  nameOf: (npcId: string) => string;
}

// Hüküm Dosyası'nın sonucu: oyuncunun mühürlediği dosya, hâkimin kırmızı kalemiyle düzeltilmiş hâliyle.
// Doğru cevaplar tikli, yanlışların üstü çizili ve gerçeği yanına yazılı; puanlar kenar boşluğunda.
export default function VerdictReportCard({ outcome, nameOf }: VerdictReportCardProps) {
  const { scenarioType, sessionId } = useGameStore();
  const { verdict } = outcome;
  const theme = scenarioType || 'medieval';
  const copy = getDossierTheme(theme);
  const caseNo = (sessionId ?? '').replace(/-/g, '').slice(0, 6).toLocaleUpperCase('tr-TR');
  const culprit = outcome.culpritId ? nameOf(outcome.culpritId) : '—';

  return (
    <section className={styles.card} data-theme={theme} aria-labelledby="verdict-report-title">
      <header className={styles.header}>
        <p className={styles.office}>{copy.office}</p>
        <div className={styles.headerRow}>
          <div>
            <p className={styles.kicker}>
              Hüküm Dosyası{caseNo && <span className={styles.caseNo}> · No. {caseNo}</span>}
            </p>
            <h2 id="verdict-report-title" className={styles.title}>
              Raporun
            </h2>
          </div>
          {verdict && (
            <div className={styles.grade} aria-label={`Rapor puanı: 100 üzerinden ${verdict.total}`}>
              <span className={styles.gradeValue}>{verdict.total}</span>
              <span className={styles.gradeMax}>/100</span>
            </div>
          )}
        </div>
      </header>

      <div className={styles.body}>
        <Line
          label="Katil"
          mark={outcome.won ? 'ok' : 'bad'}
          answer={nameOf(outcome.condemnedNpcId)}
          truth={culprit}
          emphasis
        />

        {verdict?.fields.map((field) =>
          field.id === 'NARRATIVE' ? (
            <div key={field.id} className={styles.narrativeBlock}>
              <div className={styles.lineHead}>
                <span className={styles.label}>{FIELD_LABELS[field.id]}</span>
                <span className={styles.points}>
                  {field.points}/{field.max}
                </span>
              </div>
              {field.answer === NOT_ANSWERED ? (
                <p className={styles.blankNote}>{NOT_ANSWERED}</p>
              ) : (
                <p className={styles.narrative}>{field.answer}</p>
              )}
              {verdict.judgeComment && (
                <p className={styles.judge}>
                  <span className={styles.judgeLabel}>Hakem:</span> {verdict.judgeComment}
                </p>
              )}
            </div>
          ) : (
            <div key={field.id}>
              <Line
                label={FIELD_LABELS[field.id]}
                mark={markOf(field)}
                answer={field.id === 'MOTIVE' ? shortLabel(field.answer) : field.answer}
                truth={field.id === 'MOTIVE' ? shortLabel(field.truth) : field.truth}
                points={`${field.points}/${field.max}`}
                // Bağlarda düzeltmeler kişi kişi aşağıda; özet satırına gerçek yazılmaz
                showTruth={field.id !== 'INVOLVEMENTS'}
              />
              {field.details && field.details.length > 0 && (
                <ul className={styles.details}>
                  {field.details.map((d, i) => (
                    <li key={i} className={styles.detail}>
                      <span className={d.correct ? styles.tickSmall : styles.crossSmall} aria-label={d.correct ? 'Doğru' : 'Yanlış'}>
                        {d.correct ? <Check size={14} strokeWidth={3} /> : <X size={14} strokeWidth={3} />}
                      </span>
                      <span className={styles.detailLabel}>{d.label}</span>
                      {field.id === 'INVOLVEMENTS' && (
                        <span className={styles.detailAnswer}>
                          <span className={d.correct ? styles.hand : styles.struck}>{d.answer}</span>
                          {!d.correct && <span className={styles.correction}>{d.truth}</span>}
                        </span>
                      )}
                      {field.id === 'EVIDENCE' && !d.correct && (
                        <span className={styles.detailAnswer}>
                          <span className={styles.correction}>{d.truth}</span>
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ),
        )}

        {!verdict && (
          <p className={styles.empty}>Bu vaka için rapor puanlanmadı; yalnızca hükmün değerlendirildi.</p>
        )}
      </div>

      <div className={`${styles.verdictStamp} ${outcome.won ? styles.verdictWon : ''}`} aria-hidden>
        {outcome.won ? 'Doğru Hüküm' : 'Yanlış Hüküm'}
      </div>
    </section>
  );
}

// Bir satır: "Cinayet aleti: <cevap>". Doğruysa tik, yanlışsa üstü çizilir ve gerçek kırmızıyla yazılır.
function Line({
  label,
  mark,
  answer,
  truth,
  points,
  emphasis = false,
  showTruth = true,
}: {
  label: string;
  mark: Mark;
  answer: string;
  truth: string;
  points?: string;
  emphasis?: boolean;
  showTruth?: boolean;
}) {
  const empty = answer === NOT_ANSWERED;
  return (
    <div className={styles.line}>
      <div className={styles.lineHead}>
        <span className={styles.label}>{label}:</span>
        <span className={styles.lineAnswer}>
          {empty ? (
            <span className={styles.blankNote}>boş</span>
          ) : (
            <span
              className={`${mark === 'bad' && showTruth ? styles.struck : styles.hand} ${emphasis ? styles.handLarge : ''}`}
            >
              {answer}
            </span>
          )}
          {mark === 'ok' ? (
            <span className={styles.tick} aria-label="Doğru">
              <Check size={20} strokeWidth={3} />
            </span>
          ) : (
            showTruth && (
              <span className={styles.correction}>
                {mark === 'partial' ? `Gerçek: ${truth}` : truth}
              </span>
            )
          )}
        </span>
        {points && <span className={styles.points}>{points}</span>}
      </div>
    </div>
  );
}
