// Mekân araması (tıkla-bul): mekânın içindeki her arama alanının (tezgâh arkası, ocak başı…) yakından
// dağınık görseli ve görseldeki nesnelerin yerleri.
// Sahne vakadan bağımsızdır: aynı mekân her vakada aynı görünür, katilin mekânı farklı olmaz.
// Konumlar görselin yüzdesidir ve istemciye hiç gitmez; tıklamayı sunucu denetler.

// [x, y, genişlik, yükseklik], görselin yüzdesi olarak (sol üst köşeden)
export type SceneBox = [number, number, number, number];

export interface SceneObject {
  id: string;
  // Listede görünen ad ("Kalay kupa")
  label: string;
  box: SceneBox;
}

// Liste bitince aranan asıl yer (gizli bölme, gevşek tahta); kanıt buradan çıkar
export interface SceneFinalSpot {
  id: string;
  box: SceneBox;
  // Oyuncuya söylenen yönlendirme ("Tezgâhın önündeki tahtalardan biri yerinden oynamış.")
  prompt: string;
}

export interface SearchSceneDef {
  universe: string;
  locationId: string;
  // İç mekândaki tıklama noktasının id'si (frontend config/interiors/<evren>.ts hotspot id)
  areaId: string;
  // Kanıtın bu alanda nerede durduğunu söyleyen Türkçe yer ifadesi; hikâye istemi kanıtı buraya yazdırır
  // ("tezgâh arkasındaki raflarda")
  clueSpot: string;
  // frontend/public altındaki görselin yolu
  image: string;
  // DRAFT: yalnızca test modundaki oturumlarda kullanılır (görseli ya da işaretlemesi hazır değil)
  status: 'DRAFT' | 'READY';
  objects: SceneObject[];
  finalSpots: SceneFinalSpot[];
}
