// Haritada, envanterde ve evdeki pencerelerde görünen kısa mekân adları (evrene göre).
export const getLocationLabel = (locationId: string, scenarioType: string) => {
  if (scenarioType === 'modern') {
    const labels: Record<string, string> = {
      tavern: 'Karakol',
      farm: 'Petrol İstasyonu',
      clinic: 'Bar',
      home: 'Evim',
      church: 'Hotel',
      graveyard: 'Video Oyuncusu',
      mill: 'Lokanta',
      crime_scene: 'Olay Yeri',
    };
    return labels[locationId] ?? locationId.toUpperCase();
  }

  if (scenarioType === 'cyberpunk') {
    const labels: Record<string, string> = {
      tavern: 'Karakol',
      church: 'Lokanta',
      graveyard: 'Klinik',
      mill: 'Tamirhane',
      farm: 'Sokak Pazarı',
      clinic: 'Bar',
      home: 'Evim',
      crime_scene: 'Olay Yeri',
    };
    return labels[locationId] ?? locationId.toUpperCase();
  }

  if (scenarioType === 'china') {
    const labels: Record<string, string> = {
      tavern: 'Çay Evi & Han',
      church: 'Muhafız Karargahı',
      graveyard: 'Kadim Tapınak',
      mill: 'Demirci Ocağı',
      farm: 'Balıkçı İskelesi',
      clinic: 'Şifacı & Baharatçı',
      home: 'Evim',
      crime_scene: 'Pazar Meydanı',
    };
    return labels[locationId] ?? locationId.toUpperCase();
  }

  if (scenarioType === 'winter') {
    const labels: Record<string, string> = {
      tavern: 'Kış Hanı',
      church: 'Kutsal Yürek Ağacı',
      graveyard: 'Gözcü Kalesi',
      mill: 'Terk Edilmiş Maden',
      farm: 'Sur',
      clinic: 'İnfaz Meydanı',
      home: 'Evim',
      crime_scene: 'Buzlu Geçit',
    };
    return labels[locationId] ?? locationId.toUpperCase();
  }

  const labels: Record<string, string> = {
    tavern: 'Taverna',
    church: 'Kilise',
    graveyard: 'Mezarlık',
    mill: 'Değirmen',
    farm: 'Çiftlik',
    clinic: 'Revir',
    home: 'Evim',
    crime_scene: 'Cinayet Mahalli',
  };
  return labels[locationId] ?? locationId.toUpperCase();
};
