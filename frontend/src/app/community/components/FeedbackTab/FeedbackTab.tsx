import React from 'react';
import {
  Bug,
  Check,
  Heart,
  Lightbulb,
  MessageSquare,
  Scale,
  TriangleAlert,
} from 'lucide-react';
import styles from '../../page.module.scss';

export type FeedbackCategoryType = 'bug' | 'feature' | 'balance' | 'complaint' | 'appreciation';

export const FEEDBACK_CATEGORIES = [
  { id: 'bug' as const, icon: Bug, title: 'Hata veya Teknik Sorun', desc: 'Arayüz, ses veya sunucu hataları' },
  { id: 'feature' as const, icon: Lightbulb, title: 'Fikir ve Öneri', desc: 'Yeni özellikler ve mekanikler' },
  { id: 'balance' as const, icon: Scale, title: 'Yapay Zekâ Dengesi', desc: 'NPC cevapları ve tutarlılık' },
  { id: 'complaint' as const, icon: TriangleAlert, title: 'Şikâyet ve İtiraz', desc: 'Oynanış, kota veya hesap' },
  { id: 'appreciation' as const, icon: Heart, title: 'Genel Mesaj ve Teşekkür', desc: 'Düşüncelerini yapımcılarla paylaş' },
];

interface FeedbackTabProps {
  feedbackCategory: FeedbackCategoryType;
  setFeedbackCategory: (cat: FeedbackCategoryType) => void;
  feedbackSubject: string;
  setFeedbackSubject: (val: string) => void;
  feedbackMessage: string;
  setFeedbackMessage: (val: string) => void;
  feedbackContact: string;
  setFeedbackContact: (val: string) => void;
  includeSystemSpecs: boolean;
  setIncludeSystemSpecs: (val: boolean) => void;
  feedbackSubmitted: boolean;
  setFeedbackSubmitted: (val: boolean) => void;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export default function FeedbackTab({
  feedbackCategory,
  setFeedbackCategory,
  feedbackSubject,
  setFeedbackSubject,
  feedbackMessage,
  setFeedbackMessage,
  feedbackContact,
  setFeedbackContact,
  includeSystemSpecs,
  setIncludeSystemSpecs,
  feedbackSubmitted,
  setFeedbackSubmitted,
  isSubmitting,
  onSubmit,
}: FeedbackTabProps) {
  return (
    <section className={`${styles.folio} ${styles.narrow}`}>
      <header className={styles.folioHeader}>
        <span className={styles.folioIcon}>
          <MessageSquare size={18} />
        </span>
        <div>
          <h2 className={styles.folioTitle}>Konseye Mesaj Gönder</h2>
          <p className={styles.folioDesc}>
            Teknik aksaklıkları, yapay zekâ tutarsızlıklarını, önerilerini ya da genel düşüncelerini doğrudan
            yapımcılara ilet.
          </p>
        </div>
      </header>

      {feedbackSubmitted ? (
        <div className={styles.successPanel}>
          <span className={styles.successSeal}>
            <Check size={22} />
          </span>
          <h3>Mesajın Konsey Arşivine Ulaştı</h3>
          <p>
            Geri bildirimin için teşekkürler. Yapım ekibi mesajını inceleyecek ve gerekirse e-posta adresin
            üzerinden seninle iletişime geçecek.
          </p>
          <button onClick={() => setFeedbackSubmitted(false)} className={styles.ghostBtn}>
            Yeni Bir Mesaj Gönder
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit}>
          <label className={styles.label}>Mesajının konusu</label>
          <div className={styles.categoryGrid}>
            {FEEDBACK_CATEGORIES.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  type="button"
                  key={category.id}
                  className={`${styles.categoryBtn} ${feedbackCategory === category.id ? styles.selected : ''}`}
                  onClick={() => setFeedbackCategory(category.id)}
                  aria-pressed={feedbackCategory === category.id}
                >
                  <Icon size={18} />
                  <span className={styles.catTitle}>{category.title}</span>
                  <span className={styles.catDesc}>{category.desc}</span>
                </button>
              );
            })}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Başlık <em>*</em>
            </label>
            <input
              type="text"
              className={styles.input}
              placeholder="Örn: 3. günün sorgusunda NPC cevap vermeyi kesti"
              value={feedbackSubject}
              onChange={(e) => setFeedbackSubject(e.target.value)}
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Ayrıntılar <em>*</em>
              <span className={styles.hint}>Ne olduğunu adım adım anlat</span>
            </label>
            <textarea
              className={`${styles.textarea} ${styles.tall}`}
              placeholder="Sorun nerede yaşandı, hangi adımları izledin ya da neyin daha iyi olmasını istersin?"
              value={feedbackMessage}
              onChange={(e) => setFeedbackMessage(e.target.value)}
              required
            />
          </div>

          <div className={styles.grid2}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>E-posta adresin (isteğe bağlı)</label>
              <input
                type="email"
                className={styles.input}
                placeholder="ornek@inquisitor.com"
                value={feedbackContact}
                onChange={(e) => setFeedbackContact(e.target.value)}
              />
            </div>

            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={includeSystemSpecs}
                onChange={(e) => setIncludeSystemSpecs(e.target.checked)}
              />
              <span>
                Hatayı bulmamıza yardımcı olması için tarayıcı ve oturum bilgilerini ekle
                <small>Cihaz türü, ekran boyutu ve anonim oturum kimliği eklenir.</small>
              </span>
            </label>
          </div>

          <div className={styles.submitBar}>
            <p className={styles.submitNote}>Yapım ekibi tüm mesajları düzenli olarak okur.</p>
            <button type="submit" disabled={isSubmitting} className={styles.primaryBtn}>
              {isSubmitting ? 'Gönderiliyor...' : 'Mesajı Gönder'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
