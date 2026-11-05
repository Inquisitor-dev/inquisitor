import type { SearchSceneDef } from '../../search-scene';

// Görsel Gemini'nin tek parça çizimi; kutular elle, maske SAM ile (tools/arama-sahne/maske.py, otel_servis.json); elle düzenleme
export const SCENE: SearchSceneDef = {
  universe: "modern",
  locationId: "church",
  areaId: "service_door",
  variant: "t1",
  clueSpot: "servis kapısının önündeki yığında, eşyaların arasında",
  image: "/search-scenes/modern/church/service_door/t1.webp",
  status: 'READY',
  objects: [
    { id: "telefon", label: "Çevirmeli telefon", box: [56, 17, 7.8, 10.8] },
    { id: "vantilator", label: "Vantilatör", box: [65, 9.4, 10.6, 20] },
    { id: "sandalye", label: "Ahşap sandalye", box: [15.7, 30.3, 24.3, 48] },
    { id: "turuncu_kova", label: "Turuncu kova", box: [77.7, 32.5, 9.3, 14.6] },
    { id: "yesil_kova", label: "Yeşil kova", box: [53.2, 14.8, 5.9, 6.7] },
    { id: "aski", label: "Tel askı", box: [44.7, 17, 8.6, 13.5] },
    { id: "cekic", label: "Çekiç", box: [43, 65, 13, 10.3] },
    { id: "bot", label: "Deri bot", box: [62.2, 65, 8.2, 10.3] },
    { id: "spor_ayakkabi", label: "Spor ayakkabı", box: [60.6, 65, 6.2, 5.8] },
    { id: "raket", label: "Tenis raketi", box: [58.7, 78.5, 21.5, 18.4] },
    { id: "ingiliz_anahtari", label: "İngiliz anahtarı", box: [39.5, 85, 7, 4.7] },
    { id: "mavi_kasa", label: "Mavi kasa", box: [37.1, 85.7, 11.7, 14.3] },
    { id: "sise", label: "Kahverengi şişe", box: [72.4, 89.3, 3.4, 9.4] },
    { id: "altin_biblo", label: "Altın biblo", box: [71.2, 48, 2.4, 6.3] },
  ],
  finalSpots: [
    { id: "kahve_valiz", box: [43, 33.6, 12.8, 18], prompt: "Kanıt ortadaki kahverengi valizde olabilir." },
    { id: "acik_koli", box: [84.5, 70.4, 15.5, 29.6], prompt: "Kanıt sağ alttaki açık kolide olabilir." },
    { id: "eski_cekmece", box: [3.7, 64, 8.8, 10], prompt: "Kanıt sol alttaki eski çekmecede olabilir." },
  ],
  mask: {
    width: 688,
    height: 384,
    ids: ["telefon", "vantilator", "sandalye", "turuncu_kova", "yesil_kova", "aski", "cekic", "bot", "spor_ayakkabi", "raket", "ingiliz_anahtari", "mavi_kasa", "sise", "altin_biblo", "kahve_valiz", "acik_koli", "eski_cekmece"],
    data: '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',
  },
};
