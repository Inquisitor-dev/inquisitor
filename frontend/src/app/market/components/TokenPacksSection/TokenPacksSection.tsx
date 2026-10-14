import React from 'react';
import { Coins, Gem, Lock } from 'lucide-react';
import styles from '../../page.module.scss';
import {
  EARN_WAYS,
  TOKEN_PACKS,
  formatEur,
  type TokenPack,
} from '../../marketItems';

interface TokenPacksSectionProps {
  isProcessing: boolean;
  onTokenPackClick: (pack: TokenPack) => void;
}

export default function TokenPacksSection({
  isProcessing,
  onTokenPackClick,
}: TokenPacksSectionProps) {
  return (
    <section className={styles.section}>
      <header className={styles.sectionHeader}>
        <div>
          <span className={styles.sectionEyebrow}>Hazine Odası</span>
          <h2 className={styles.sectionTitle}>Token Al</h2>
        </div>
      </header>
      <p className={styles.sectionBlurb}>
        Beklemek istemiyorsan hazineyi doldur. Tokenlerin hiçbir zaman sona ermez ve marketteki her
        şeyde kullanılabilir.
      </p>

      <div className={styles.packGrid}>
        {TOKEN_PACKS.map((pack) => (
          <article
            key={pack.id}
            className={`${styles.pack} ${styles[`packTier${pack.tier}`]} ${pack.highlight ? styles.packHighlight : ''}`}
          >
            {pack.highlight && (
              <span className={styles.packRibbon}>
                {pack.highlight === 'popular' ? 'En Popüler' : 'En İyi Değer'}
              </span>
            )}
            <div className={styles.packCoins} aria-hidden>
              {Array.from({ length: pack.tier }).map((_, i) => (
                <span key={i} className={styles.packCoin}>
                  {pack.tier === 4 && i === 3 ? <Gem size={18} /> : <Coins size={18} />}
                </span>
              ))}
            </div>
            <h3 className={styles.packName}>{pack.name}</h3>
            <div className={styles.packAmount}>
              {(pack.tokens + pack.bonus).toLocaleString('tr-TR')}
              <span>token</span>
            </div>
            <span className={styles.packBonus}>
              {pack.bonus > 0
                ? `${pack.tokens.toLocaleString('tr-TR')} + ${pack.bonus.toLocaleString('tr-TR')} bonus`
                : '\u00A0'}
            </span>
            <button
              type="button"
              className={styles.packBtn}
              onClick={() => onTokenPackClick(pack)}
              disabled={isProcessing}
            >
              {formatEur(pack.priceEur)}
            </button>
          </article>
        ))}
      </div>

      <p className={styles.packNote}>
        <Lock size={14} /> Güvenli Stripe test modu ödemesi. Gerçek para hareket etmez; test kartı
        (4242 4242 4242 4242) ile test edebilirsiniz.
      </p>

      <div className={styles.earnPanel}>
        <div className={styles.earnIntro}>
          <span className={styles.sectionEyebrow}>Ücretsiz Yol</span>
          <h3 className={styles.cardTitle}>Oynayarak Kazan</h3>
          <p className={styles.cardDesc}>
            Marketteki her şey oynayarak da açılabilir. Token satın almak sadece yolu kısaltır.
          </p>
        </div>
        <ul className={styles.earnList}>
          {EARN_WAYS.map((way) => (
            <li key={way.id} className={styles.earnItem}>
              <span className={styles.earnReward}>
                <Coins size={14} /> {way.reward}
              </span>
              <div>
                <strong>{way.title}</strong>
                <span>{way.description}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
