import styles from './TruthRevealPanel.module.scss';

type TruthRevealPanelProps = {
  truthReveal: string | null;
  locationClues: Record<string, string> | null;
  scenarioType?: string | null;
};

const locationNamesByScenario: Record<string, Record<string, string>> = {
  medieval: {
    crime_scene: 'Cinayet Mahalli',
    tavern: 'Taverna (Meyhane)',
    church: 'Kilise',
    graveyard: 'Mezarlik',
    mill: 'Degirmen',
  },
  modern: {
    crime_scene: 'Olay Yeri',
    tavern: 'Diner',
    church: 'Karakol',
    graveyard: 'Mezarlik',
    mill: 'Gazete Binasi',
  },
  cyberpunk: {
    crime_scene: 'Olay Yeri',
    tavern: 'Afterglow Club',
    church: 'Helix Kulesi',
    graveyard: 'Veri Mezarligi',
    mill: 'Kara Pazar',
  },
};

function getLocationName(locationId: string, scenarioType?: string | null) {
  const labels = locationNamesByScenario[scenarioType || 'medieval'] || locationNamesByScenario.medieval;
  return labels[locationId] || locationId;
}

export function TruthRevealPanel({
  truthReveal,
  locationClues,
  scenarioType,
}: TruthRevealPanelProps) {
  if (!truthReveal && (!locationClues || Object.keys(locationClues).length === 0)) {
    return null;
  }

  return (
    <div>
      {truthReveal && (
        <div className={styles.panel}>
          <h2 className={styles.title}>Gerceklerin Ardindan</h2>
          <p className={styles.truthText}>{truthReveal}</p>
        </div>
      )}

      {locationClues && Object.keys(locationClues).length > 0 && (
        <div className={styles.cluesPanel}>
          <h2 className={styles.cluesTitle}>Gizli Ipuclari</h2>
          <div className={styles.cluesList}>
            {Object.entries(locationClues).map(([locationId, clue]) => (
              <div key={locationId} className={styles.clueRow}>
                <span className={styles.clueLocation}>
                  {getLocationName(locationId, scenarioType)}
                </span>
                <span className={styles.clueText}>{String(clue)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
