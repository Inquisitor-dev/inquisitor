import styles from './TruthRevealPanel.module.scss';

type TruthRevealPanelProps = {
  truthReveal: string | null;
  locationClues: Record<string, string> | null;
  scenarioType?: string | null;
};

// Mekân adları oyunun geri kalanıyla aynı (backend: scenario-config.ts LOCALIZED_LOCATION_LABELS)
const locationNamesByScenario: Record<string, Record<string, string>> = {
  medieval: {
    crime_scene: 'Cinayet Mahalli',
    tavern: 'Taverna',
    church: 'Kilise',
    graveyard: 'Mezarlık',
    mill: 'Değirmen',
    farm: 'Çiftlik',
    clinic: 'Revir',
  },
  modern: {
    crime_scene: 'Olay Yeri',
    tavern: 'Karakol',
    farm: 'Petrol İstasyonu',
    clinic: 'Bar',
    church: 'Hotel',
    graveyard: 'Video Oyuncusu',
    mill: 'Lokanta',
  },
  cyberpunk: {
    crime_scene: 'Olay Yeri',
    tavern: 'Karakol',
    church: 'Lokanta',
    graveyard: 'Klinik',
    mill: 'Tamirhane',
    farm: 'Sokak Pazarı',
    clinic: 'Bar',
  },
  china: {
    crime_scene: 'Pazar Meydanı',
    tavern: 'Çay Evi & Han',
    church: 'Muhafız Karargahı',
    graveyard: 'Kadim Tapınak',
    mill: 'Demirci Ocağı',
    farm: 'Balıkçı İskelesi',
    clinic: 'Şifacı & Baharatçı',
  },
  winter: {
    crime_scene: 'Buzlu Geçit',
    tavern: 'Kış Hanı',
    church: 'Kutsal Yürek Ağacı',
    graveyard: 'Gözcü Kalesi',
    mill: 'Terk Edilmiş Maden',
    farm: 'Sur',
    clinic: 'İnfaz Meydanı',
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
          <h2 className={styles.title}>Gerçeğin Ardında</h2>
          <p className={styles.truthText}>{truthReveal}</p>
        </div>
      )}

      {locationClues && Object.keys(locationClues).length > 0 && (
        <div className={styles.cluesPanel}>
          <h2 className={styles.cluesTitle}>Gizli İpuçları</h2>
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
