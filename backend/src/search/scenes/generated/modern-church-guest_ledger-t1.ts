import type { SearchSceneDef } from '../../search-scene';

// Görsel Gemini'nin tek parça çizimi; kutular elle, maske SAM ile (tools/arama-sahne/maske.py, otel_tezgah.json); elle düzenleme
export const SCENE: SearchSceneDef = {
  universe: "modern",
  locationId: "church",
  areaId: "guest_ledger",
  variant: "t1",
  clueSpot: "resepsiyon tezgâhında, eşyaların arasında",
  image: "/search-scenes/modern/church/guest_ledger/t1.webp",
  status: 'READY',
  objects: [
    { id: "semsiye", label: "Şemsiye", box: [6, 0, 28.5, 43] },
    { id: "hasir_sepet", label: "Hasır sepet", box: [65.2, 3.4, 17.5, 32] },
    { id: "termos", label: "Ekose termos", box: [62.9, 26.5, 11.1, 22.4] },
    { id: "konserve", label: "Konserve kutusu", box: [42.2, 21.3, 4.6, 8.7] },
    { id: "kasket", label: "Kasket", box: [26.5, 9.4, 11.3, 12.1] },
    { id: "oyuncak_araba", label: "Oyuncak araba", box: [86.7, 25.3, 6.2, 5.6] },
    { id: "calar_saat", label: "Çalar saat", box: [87.1, 37.5, 5.4, 13.6] },
    { id: "biblo", label: "Biblo", box: [83.5, 39.5, 3.3, 12.5] },
    { id: "deri_ayakkabi", label: "Deri ayakkabı", box: [41.9, 38.6, 11.1, 17.9] },
    { id: "gozluk", label: "Gözlük", box: [46, 57, 7, 4.5] },
    { id: "durbun", label: "Dürbün", box: [74.1, 52.9, 9.1, 11.6] },
    { id: "resepsiyon_zili", label: "Resepsiyon zili", box: [60.2, 66.4, 7.7, 12.6] },
    { id: "altin_kase", label: "Altın kâse", box: [68.7, 62.3, 6.3, 8.1] },
    { id: "fener", label: "El feneri", box: [56.2, 66.8, 5, 10.8] },
    { id: "buyutec", label: "Büyüteç", box: [43.5, 67.7, 10.2, 10.3] },
    { id: "altin_kalip", label: "Altın kutu", box: [41.7, 84.3, 6.3, 8.5] },
  ],
  finalSpots: [
    { id: "el_cantasi", box: [73.5, 33.2, 9.3, 18], prompt: "Kanıt sağdaki deri el çantasında olabilir." },
    { id: "sirt_cantasi", box: [56.5, 43.9, 12, 24.2], prompt: "Kanıt ortadaki sırt çantasında olabilir." },
    { id: "bez_kese", box: [30.2, 78.9, 9.5, 21.1], prompt: "Kanıt önde duran bez kesede olabilir." },
  ],
  mask: {
    width: 688,
    height: 384,
    ids: ["semsiye", "hasir_sepet", "termos", "konserve", "kasket", "oyuncak_araba", "calar_saat", "biblo", "deri_ayakkabi", "gozluk", "durbun", "resepsiyon_zili", "altin_kase", "fener", "buyutec", "altin_kalip", "el_cantasi", "sirt_cantasi", "bez_kese"],
    data: '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',
  },
};
