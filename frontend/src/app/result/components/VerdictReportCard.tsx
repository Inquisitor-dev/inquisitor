'use client';

import { Check, X } from 'lucide-react';
import type { CaseOutcome, VerdictFieldId } from '@/features/verdict/verdictTypes';
import styles from './VerdictReportCard.module.scss';

const FIELD_LABELS: Record<VerdictFieldId, string> = {
  EVIDENCE: 'Dayanak kanıtlar',
  WEAPON: 'Cinayet aleti',
  MOTIVE: 'Motif',
  TIME_OF_DEATH: 'Ölüm saati',
  INVOLVEMENTS: 'Diğer şüpheliler',
  NARRATIVE: 'Olayın akışı',
};

interface VerdictReportCardProps {
  outcome: CaseOutcome;
  nameOf: (npcId: string) => string;
}

// Hüküm Dosyası'nın sonucu: her alanda oyuncunun cevabı ile gerçek yan yana, damga ve puanla
export default function VerdictReportCard({ outcome, nameOf }: VerdictReportCardProps) {
  const { verdict } = outcome;
  const culpritCorrect = outcome.won;

  return (
    <section className={styles.card} aria-labelledby="verdict-report-title">
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Hüküm Dosyası</p>
          <h2 id="verdict-report-title" className={styles.title}>
            Raporun
          </h2>
        </div>
        {verdict && (
          <div className={styles.score} aria-label={`Rapor puanı: 100 üzerinden ${verdict.total}`}>
            <span className={styles.scoreValue}>{verdict.total}</span>
            <span className={styles.scoreMax}>/100</span>
          </div>
        )}
      </header>

      <div className={styles.row}>
        <div className={styles.rowHead}>
          <span className={styles.fieldName}>Katil</span>
          <Stamp correct={culpritCorrect} />
        </div>
        <div className={styles.compare}>
          <Answer label="Senin hükmün" value={nameOf(outcome.condemnedNpcId)} />
          <Answer label="Gerçek" value={outcome.culpritId ? nameOf(outcome.culpritId) : '—'} truth />
        </div>
      </div>

      {verdict?.fields.map((field) => (
        <div key={field.id} className={styles.row}>
          <div className={styles.rowHead}>
            <span className={styles.fieldName}>{FIELD_LABELS[field.id]}</span>
            <span className={styles.points}>
              {field.points}/{field.max}
            </span>
          </div>
          {field.id === 'NARRATIVE' ? (
            <>
              <p className={styles.narrative}>{field.answer}</p>
              {verdict.judgeComment && (
                <p className={styles.judge}>
                  <span className={styles.judgeLabel}>Hakem:</span> {verdict.judgeComment}
                </p>
              )}
            </>
          ) : (
            <div className={styles.compare}>
              <Answer label="Senin cevabın" value={field.answer} />
              <Answer label="Gerçek" value={field.truth} truth />
            </div>
          )}
          {field.details && field.details.length > 0 && (
            <ul className={styles.details}>
              {field.details.map((d, i) => (
                <li key={i} className={styles.detail}>
                  <Stamp correct={d.correct} small />
                  <span className={styles.detailLabel}>{d.label}</span>
                  {field.id === 'INVOLVEMENTS' && (
                    <span className={styles.detailCompare}>
                      {d.answer}
                      {!d.correct && <span className={styles.detailTruth}> · gerçekte: {d.truth}</span>}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}

      {!verdict && (
        <p className={styles.empty}>Bu vaka için rapor puanlanmadı; yalnızca hükmün değerlendirildi.</p>
      )}
    </section>
  );
}

function Answer({ label, value, truth = false }: { label: string; value: string; truth?: boolean }) {
  return (
    <div className={`${styles.answer} ${truth ? styles.answerTruth : ''}`}>
      <span className={styles.answerLabel}>{label}</span>
      <span className={styles.answerValue}>{value}</span>
    </div>
  );
}

function Stamp({ correct, small = false }: { correct: boolean; small?: boolean }) {
  const Icon = correct ? Check : X;
  return (
    <span
      className={`${styles.stamp} ${correct ? styles.stampOk : styles.stampBad} ${small ? styles.stampSmall : ''}`}
      aria-label={correct ? 'Doğru' : 'Yanlış'}
    >
      <Icon size={small ? 12 : 14} />
      {!small && <span>{correct ? 'Doğru' : 'Yanlış'}</span>}
    </span>
  );
}
