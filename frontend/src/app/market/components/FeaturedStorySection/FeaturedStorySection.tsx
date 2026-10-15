import React from 'react';
import { BookOpen, Clock, Map as MapIcon, Sparkles } from 'lucide-react';
import styles from '../../page.module.scss';
import type { MarketItem } from '../../marketItems';

interface FeaturedStorySectionProps {
  featured: MarketItem;
  isOwned: boolean;
  priceElement: React.ReactNode;
  actionElement: React.ReactNode;
}

export default function FeaturedStorySection({
  featured,
  isOwned,
  priceElement,
  actionElement,
}: FeaturedStorySectionProps) {
  return (
    <section className={styles.featured}>
      <div
        className={styles.featuredImage}
        style={{ backgroundImage: `url('${featured.image}')` }}
      />
      <div className={styles.featuredShade} />
      <div className={styles.featuredBody}>
        <span className={styles.featuredBadge}>
          <Sparkles size={14} /> Haftanın Dosyası
        </span>
        <h2 className={styles.featuredTitle}>{featured.title}</h2>
        <p className={styles.featuredSubtitle}>{featured.subtitle}</p>
        <p className={styles.featuredDesc}>{featured.description}</p>
        <div className={styles.featuredMeta}>
          <span className={styles.metaInline}>
            <BookOpen size={14} /> Hazır Hikâye
          </span>
          <span className={styles.metaInline}>
            <MapIcon size={14} /> {featured.universe}
          </span>
          <span className={styles.metaInline}>
            <Clock size={14} /> {featured.length}
          </span>
        </div>
        <div className={styles.featuredActions}>
          {!isOwned && priceElement}
          {actionElement}
        </div>
      </div>
    </section>
  );
}
