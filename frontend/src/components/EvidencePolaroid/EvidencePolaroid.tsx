import { Search } from 'lucide-react';
import styles from './EvidencePolaroid.module.scss';

interface EvidencePolaroidProps {
  // Fotoğraf: kanıtın bulunduğu mekânın görseli; yoksa büyüteçli boş kare gösterilir
  photo: string | null;
  title: string;
  text?: string;
  meta?: string;
  selected?: boolean;
  onClick?: () => void;
  compact?: boolean;
  // Gece baskınında çalındı: fotoğrafın üstüne damga basılır
  stolen?: boolean;
}

// Kanıtın polaroid fotoğrafı: envanterde ve Not Defteri'nin kanıt çekmecesinde kullanılır
export default function EvidencePolaroid({
  photo,
  title,
  text,
  meta,
  selected = false,
  onClick,
  compact = false,
  stolen = false,
}: EvidencePolaroidProps) {
  const className = `${styles.polaroid} ${compact ? styles.compact : ''} ${
    selected ? styles.selected : ''
  } ${onClick ? styles.clickable : ''} ${stolen ? styles.stolen : ''}`;
  const content = (
    <>
      <div
        className={styles.photo}
        style={photo ? { backgroundImage: `url(${photo})` } : undefined}
        aria-hidden
      >
        {!photo && <Search size={compact ? 18 : 26} />}
        {stolen && <span className={styles.stolenStamp}>Çalındı</span>}
      </div>
      <div className={styles.caption}>
        <span className={styles.title}>{title}</span>
        {text && <span className={styles.text}>{text}</span>}
        {meta && <span className={styles.meta}>{meta}</span>}
      </div>
    </>
  );

  return onClick ? (
    <button type="button" className={className} onClick={onClick} aria-pressed={selected} title={text}>
      {content}
    </button>
  ) : (
    <div className={className}>{content}</div>
  );
}
