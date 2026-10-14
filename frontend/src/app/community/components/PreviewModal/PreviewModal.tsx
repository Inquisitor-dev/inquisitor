import React from 'react';
import { X } from 'lucide-react';
import {
  ScenarioForm,
  SCENARIO_LABELS,
  DIFFICULTY_LABELS,
} from '../../data/communityData';
import styles from '../../page.module.scss';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: ScenarioForm;
}

export default function PreviewModal({ isOpen, onClose, form }: PreviewModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.dossier}
        role="dialog"
        aria-modal="true"
        aria-label="Vaka dosyası önizlemesi"
        onClick={(e) => e.stopPropagation()}
      >
        <button className={styles.dossierClose} onClick={onClose} aria-label="Kapat">
          <X size={18} />
        </button>
        <span className={styles.dossierStamp}>Gizli</span>
        <span className={styles.dossierEyebrow}>Vaka Dosyası</span>
        <h3 className={styles.dossierTitle}>{form.title || 'İsimsiz Vaka'}</h3>
        <div className={styles.dossierMeta}>
          <span>Yazar: {form.authorName || 'Bilinmiyor'}</span>
          <span>{SCENARIO_LABELS[form.scenarioType]}</span>
          <span>{DIFFICULTY_LABELS[form.difficulty]} zorluk</span>
        </div>

        <div className={styles.dossierSection}>
          <h4>Giriş</h4>
          <p className={styles.dossierQuote}>{form.prologueHook || 'Henüz bir giriş anlatısı yazılmadı.'}</p>
        </div>

        <div className={styles.dossierSection}>
          <h4>Olay Yeri</h4>
          <p>
            <strong>{form.crimeLocation}</strong> —{' '}
            {form.crimeStyle === 'HURRIED'
              ? 'telaşla, boğuşarak işlenmiş bir cinayet'
              : 'planlanmış ve izleri temizlenmiş bir cinayet'}
          </p>
          <p className={styles.dossierMuted}>{form.victimDescription || 'Kurban bilgisi girilmedi.'}</p>
        </div>

        <div className={styles.dossierSection}>
          <h4>Şüpheliler</h4>
          <ul className={styles.dossierSuspects}>
            {form.suspects.map((s, idx) => (
              <li key={idx} className={s.isCulprit ? styles.dossierCulprit : ''}>
                <div>
                  <strong>{s.name || `Şüpheli ${idx + 1}`}</strong>
                  <span> · {s.role || 'Mesleği girilmedi'}</span>
                </div>
                {s.isCulprit && <span className={styles.dossierCulpritTag}>Katil</span>}
                <p>{s.motiveOrSecret || '—'}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.dossierSection}>
          <h4>Hakikat</h4>
          <p>{form.truthReveal || 'Hakikat metni henüz yazılmadı.'}</p>
        </div>

        <div className={styles.dossierFooter}>
          <button onClick={onClose} className={styles.dossierBtn}>
            Dosyayı Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
