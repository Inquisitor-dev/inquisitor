import { ScenarioType } from '@/shared/types/scenario';

// Haritada, envanterde ve evdeki pencerelerde görünen kısa mekân adları (evrene göre tablo).
export const SCENARIO_LOCATION_LABELS: Record<ScenarioType, Record<string, string>> = {
  medieval: {
    tavern: 'Taverna',
    church: 'Kilise',
    graveyard: 'Mezarlık',
    mill: 'Değirmen',
    farm: 'Çiftlik',
    clinic: 'Revir',
    home: 'Evim',
    crime_scene: 'Cinayet Mahalli',
  },
  modern: {
    tavern: 'Karakol',
    farm: 'Petrol İstasyonu',
    clinic: 'Bar',
    home: 'Evim',
    church: 'Hotel',
    graveyard: 'Video Oyuncusu',
    mill: 'Lokanta',
    crime_scene: 'Olay Yeri',
  },
  cyberpunk: {
    tavern: 'Karakol',
    church: 'Lokanta',
    graveyard: 'Klinik',
    mill: 'Tamirhane',
    farm: 'Sokak Pazarı',
    clinic: 'Bar',
    home: 'Evim',
    crime_scene: 'Olay Yeri',
  },
  china: {
    tavern: 'Çay Evi & Han',
    church: 'Muhafız Karargahı',
    graveyard: 'Kadim Tapınak',
    mill: 'Demirci Ocağı',
    farm: 'Balıkçı İskelesi',
    clinic: 'Şifacı & Baharatçı',
    home: 'Evim',
    crime_scene: 'Olay Yeri',
  },
  winter: {
    tavern: 'Kış Hanı',
    church: 'Kutsal Yürek Ağacı',
    graveyard: 'Gözcü Kalesi',
    mill: 'Terk Edilmiş Maden',
    farm: 'Sur',
    clinic: 'İnfaz Meydanı',
    home: 'Evim',
    crime_scene: 'Olay Yeri',
  },
};

export const getLocationLabel = (locationId: string, scenarioType?: string): string => {
  const map =
    SCENARIO_LOCATION_LABELS[(scenarioType as ScenarioType) ?? 'medieval'] ??
    SCENARIO_LOCATION_LABELS.medieval;
  return map[locationId] ?? locationId.toUpperCase();
};
