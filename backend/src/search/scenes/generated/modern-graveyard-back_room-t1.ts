import type { SearchSceneDef } from '../../search-scene';

// Görsel Gemini'nin tek parça çizimi; kutular elle, maske SAM ile (tools/arama-sahne/maske.py, arcade_depo.json); elle düzenleme
export const SCENE: SearchSceneDef = {
  universe: "modern",
  locationId: "graveyard",
  areaId: "back_room",
  variant: "t1",
  clueSpot: "arka odadaki yığında, eşyaların arasında",
  image: "/search-scenes/modern/graveyard/back_room/t1.webp",
  status: 'READY',
  objects: [
    { id: "sari_fener", label: "Sarı el feneri", box: [43.3, 32, 9, 11.2] },
    { id: "dinozor", label: "Oyuncak dinozor", box: [51.5, 30.5, 7.8, 13.5] },
    { id: "radyo", label: "Radyo", box: [78.2, 38, 15.8, 25] },
    { id: "mavi_kasa", label: "Mavi kasa", box: [64.7, 17.5, 17.6, 34] },
    { id: "jeton_kapagi", label: "Jeton kapağı", box: [22.2, 44, 11.8, 35] },
    { id: "yoyo", label: "Kırmızı yo-yo", box: [57.5, 65, 3.9, 7.3] },
    { id: "kova", label: "Paslı kova", box: [87.7, 79, 12.3, 21] },
    { id: "semsiye", label: "Şemsiye", box: [79.5, 2.7, 11.8, 40] },
    { id: "cips", label: "Cips paketi", box: [61, 40, 6.5, 13] },
    { id: "disli", label: "Dişli", box: [33, 73.5, 4, 7.2] },
    { id: "sari_dugme", label: "Sarı düğme", box: [32.5, 49, 2.3, 4] },
    { id: "mavi_dugme", label: "Mavi düğme", box: [35, 53, 2.3, 3.6] },
    { id: "metal_panel", label: "Metal panel", box: [2.7, 6.7, 5.7, 17] },
  ],
  finalSpots: [
    { id: "parca_kolisi", box: [67, 53.8, 23.7, 35.4], prompt: "Kanıt sağ alttaki parça dolu kolide olabilir." },
    { id: "bez_torba", box: [1.5, 76.7, 10.5, 23.3], prompt: "Kanıt sol alttaki bez torbada olabilir." },
    { id: "sirt_cantasi", box: [89, 6.5, 10, 19], prompt: "Kanıt sağ üstteki sırt çantasında olabilir." },
  ],
  mask: {
    width: 688,
    height: 384,
    ids: ["sari_fener", "dinozor", "radyo", "mavi_kasa", "jeton_kapagi", "yoyo", "kova", "semsiye", "cips", "disli", "sari_dugme", "mavi_dugme", "metal_panel", "parca_kolisi", "bez_torba", "sirt_cantasi"],
    data: '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',
  },
};
