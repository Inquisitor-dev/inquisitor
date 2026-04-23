import Link from 'next/link';
import styles from './map.module.scss';

const locations = [
  {
    id: 'tavern',
    name: 'The Tavern',
    subtitle: 'Where secrets are drowned in wine.',
    icon: '🍺',
    description:
      'Locals gather here at dusk. Loosened tongues and shadowed corners — the perfect hunting ground for contradictions.',
    available: true,
  },
  {
    id: 'church',
    name: 'The Church',
    subtitle: 'God watches, but so do you.',
    icon: '⛪',
    description:
      "The priest holds the village's conscience. But who confesses to the Inquisitor?",
    available: true,
  },
  {
    id: 'graveyard',
    name: 'The Graveyard',
    subtitle: 'The dead do not lie. The living do.',
    icon: '🪦',
    description:
      'Strange rites were reported at midnight. The gravedigger knows what he buried — and what walked away.',
    available: true,
  },
  {
    id: 'mill',
    name: 'The Mill',
    subtitle: 'Industry masks iniquity.',
    icon: '⚙️',
    description:
      'The miller deals in grain — and rumour. Follow the flour, follow the conspiracy.',
    available: false,
  },
];

export default function MapPage() {
  return (
    <main className={styles.main}>
      <div className={styles.vignette} />

      {/* Header */}
      <header className={styles.header}>
        <Link href="/" className={styles.back}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M13 8H3M7 4L3 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Retreat
        </Link>
        <div className={styles.headerCenter}>
          <h1 className={styles.pageTitle}>Village of Ashenmoor</h1>
          <p className={styles.pageSub}>Choose your location — Choose your prey.</p>
        </div>
        <div className={styles.sessionInfo}>
          <span className={styles.sessionDot} />
          <span>Session Active</span>
        </div>
      </header>

      {/* Map grid */}
      <div className={styles.mapWrapper}>
        <div className={styles.mapDecor}>
          <div className={styles.mapDecorLine} />
          <div className={styles.mapDecorText}>ANNO DOMINI MCCXII</div>
          <div className={styles.mapDecorLine} />
        </div>

        <div className={styles.locations}>
          {locations.map((loc) => {
            // Tüm kart tek bir Link — available ise navigate eder
            const CardWrapper = loc.available
              ? ({ children }: { children: React.ReactNode }) => (
                  <Link href={`/interact/${loc.id}`} className={`${styles.locationCard}`}>
                    {children}
                  </Link>
                )
              : ({ children }: { children: React.ReactNode }) => (
                  <div className={`${styles.locationCard} ${styles.locked}`}>
                    {children}
                  </div>
                );

            return (
              <CardWrapper key={loc.id}>
                <div className={styles.locIcon}>{loc.icon}</div>
                <div className={styles.locContent}>
                  <h2 className={styles.locName}>{loc.name}</h2>
                  <p className={styles.locSubtitle}>{loc.subtitle}</p>
                  <p className={styles.locDesc}>{loc.description}</p>
                </div>
                <div className={styles.locFooter}>
                  {loc.available ? (
                    <span className={styles.enterBtn}>
                      Enter &amp; Interrogate
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  ) : (
                    <span className={styles.comingSoon}>Coming Soon</span>
                  )}
                </div>
                {/* Corner accents */}
                <div className={styles.cardCornerTL} />
                <div className={styles.cardCornerBR} />
              </CardWrapper>
            );
          })}
        </div>
      </div>
    </main>
  );
}
