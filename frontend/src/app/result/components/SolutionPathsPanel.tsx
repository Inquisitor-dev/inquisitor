'use client';

import { useEffect, useState } from 'react';
import { Check, Circle } from 'lucide-react';
import { api } from '@/shared/api/client';
import { logger } from '@/shared/lib/logger';
import type { SolutionPath, SolutionReport } from '@/features/verdict/verdictTypes';
import styles from './SolutionPathsPanel.module.scss';

interface SolutionPathsPanelProps {
  sessionId: string | null;
}

// Vakayı çözen kanıt zincirleri; sunucu vaka bitmeden göndermez. Oyuncunun bulduğu kanıtlar işaretli.
export default function SolutionPathsPanel({ sessionId }: SolutionPathsPanelProps) {
  const [paths, setPaths] = useState<SolutionPath[]>([]);

  useEffect(() => {
    if (!sessionId) return;
    api
      .get<SolutionReport>(`/game-sessions/${sessionId}/solution`)
      .then((report) => setPaths(report.paths ?? []))
      .catch((err) => logger.error('Failed to load solution paths', err));
  }, [sessionId]);

  if (paths.length === 0) return null;

  return (
    <section className={styles.panel} aria-labelledby="solution-paths-title">
      <h2 id="solution-paths-title" className={styles.title}>
        Çözüm Yolları
      </h2>
      <p className={styles.intro}>
        Bu vaka şu yollardan çözülebilirdi. Bulduğun kanıtlar işaretli.
      </p>
      <div className={styles.paths}>
        {paths.map((path, i) => (
          <article key={i} className={`${styles.path} ${path.completed ? styles.completed : ''}`}>
            <header className={styles.pathHead}>
              <span className={styles.pathName}>{i + 1}. yol</span>
              <span className={styles.pathMeta}>
                {path.steps.length} kanıt
                {path.warrants > 0 && ` · ${path.warrants} arama izni`}
              </span>
              <span className={styles.progress}>
                {path.completed ? 'Tamamladın' : `${path.found}/${path.steps.length} bulundu`}
              </span>
            </header>
            <ol className={styles.steps}>
              {path.steps.map((step) => (
                <li key={step.clueId} className={`${styles.step} ${step.found ? styles.found : ''}`}>
                  <span className={styles.mark} aria-label={step.found ? 'Buldun' : 'Bulmadın'}>
                    {step.found ? <Check size={14} strokeWidth={3} /> : <Circle size={12} />}
                  </span>
                  <span className={styles.stepBody}>
                    <span className={styles.stepLabel}>{step.label}</span>
                    <span className={styles.stepHow}>{step.how}</span>
                    {step.clears.length > 0 && (
                      <span className={styles.stepClears}>Aklar: {step.clears.join(', ')}</span>
                    )}
                  </span>
                </li>
              ))}
            </ol>
            {path.conclusions.map((text, j) => (
              <p key={j} className={styles.conclusion}>
                {text}
              </p>
            ))}
            <p className={styles.finale}>{path.finale}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
