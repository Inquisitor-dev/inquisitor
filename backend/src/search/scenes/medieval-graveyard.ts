import type { SearchSceneDef } from '../search-scene';

// Ashenmoor Mezarlığı'nın arama alanları. Sahnede birden çok kopyası olan eşyalar listeye alınmadı;
// iki tane olanlar yerleriyle ayrıldı.
export const MEDIEVAL_GRAVEYARD_SCENES: SearchSceneDef[] = [
  {
    universe: 'medieval',
    locationId: 'graveyard',
    areaId: 'lantern',
    clueSpot: 'mezar başındaki adakların arasında',
    image: '/search-scenes/medieval/graveyard/lantern.webp',
    status: 'DRAFT',
    objects: [
      {
        id: 'alt_fener',
        label: 'Devrik paslı fener',
        box: [17, 60, 15.5, 25.5],
      },
      {
        id: 'yanan_fener',
        label: 'Yanan yağ feneri',
        box: [70.5, 17.5, 9.5, 33],
      },
      { id: 'deri_cantasi', label: 'Deri çanta', box: [29, 51, 10, 18] },
      { id: 'buyuk_anahtar', label: 'Büyük anahtar', box: [35.5, 44, 7.5, 12] },
      { id: 'cift_makas', label: 'Makas', box: [20.5, 48, 9, 9] },
      { id: 'bakir_sikke', label: 'Bakır sikke', box: [40, 57.8, 4.5, 8] },
      { id: 'at_nali', label: 'At nalı', box: [33.5, 70.5, 6, 9.5] },
      { id: 'boynuz', label: 'Boynuz', box: [64.5, 49.5, 14, 17] },
      { id: 'kitap_para', label: 'Sikkeli deri kitap', box: [58, 51.5, 8, 15] },
      { id: 'tuy', label: 'Büyük tüy', box: [32, 71, 8.5, 22] },
      { id: 'ip_yumagi', label: 'İp yumağı', box: [43.8, 85, 6.5, 12] },
      { id: 'sepet', label: 'Hasır sepet', box: [85, 47, 14, 25] },
      { id: 'hac', label: 'İsa figürlü haç', box: [72, 73, 11.5, 22] },
      { id: 'kurk_tuyu', label: 'Kahverengi kürk', box: [67, 78.5, 8.5, 14] },
      { id: 'eski_kupa', label: 'Kalay kadeh', box: [60.7, 58.5, 5.5, 20] },
    ],
    finalSpots: [
      {
        id: 'kese_alt',
        box: [5, 80.5, 15, 19],
        prompt: 'Kanıt sol alttaki deri kesede olabilir.',
      },
      {
        id: 'tahta_levha',
        box: [14, 39.5, 5.5, 17.5],
        prompt: 'Kanıt soldaki ahşap mezar levhasının arkasında olabilir.',
      },
      {
        id: 'yazili_levha',
        box: [82, 64.5, 6.5, 13],
        prompt: 'Kanıt sağdaki eski parşömenin altında olabilir.',
      },
    ],
  },
  {
    universe: 'medieval',
    locationId: 'graveyard',
    areaId: 'mausoleum',
    clueSpot: 'türbenin ortasındaki taş adak levhasında, adakların arasında',
    image: '/search-scenes/medieval/graveyard/mausoleum.webp',
    status: 'DRAFT',
    objects: [
      {
        id: 'iplik_makarasi',
        label: 'İplik makarası',
        box: [4.5, 38.5, 8, 12],
      },
      { id: 'tomar', label: 'Rulo tomar', box: [20, 32.5, 12, 21] },
      { id: 'boynuz', label: 'Boynuz', box: [9.5, 60, 12, 10] },
      {
        id: 'toprak_kupa',
        label: 'Küçük toprak kap',
        box: [30.5, 27.5, 5.5, 8],
      },
      { id: 'gunes_saati', label: 'Güneş saati', box: [36, 50.5, 9.8, 19] },
      { id: 'hancer', label: 'Hançer', box: [45, 41, 10, 23] },
      { id: 'lavanta', label: 'Lavanta demeti', box: [43.5, 24.5, 11.5, 22] },
      { id: 'cingirak', label: 'Pirinç çıngırak', box: [51.5, 23.5, 7, 15] },
      { id: 'kadeh', label: 'Gümüş kadeh', box: [55.5, 55.5, 7, 15] },
      { id: 'tabak', label: 'Büyük kalay tabak', box: [57.5, 36, 11, 21] },
      { id: 'fener', label: 'Fener', box: [66, 16, 9, 18] },
      { id: 'tilki_kurku', label: 'Yüzlü tilki kürkü', box: [78, 15, 10, 22] },
      { id: 'kirik_ayna', label: 'Kırık el aynası', box: [78, 56, 10, 28] },
      { id: 'sandik', label: 'Küçük kilitli sandık', box: [66, 70, 9.5, 14] },
      { id: 'sol_kese', label: 'Soldaki deri kese', box: [10.5, 14, 11.5, 20] },
    ],
    finalSpots: [
      {
        id: 'alt_kese',
        box: [10.5, 69.5, 10.5, 16],
        prompt: 'Kanıt sol alttaki deri kesede olabilir.',
      },
      {
        id: 'ahsap_kutu',
        box: [20.5, 66, 8, 17],
        prompt: 'Kanıt soldaki ahşap kutuda olabilir.',
      },
      {
        id: 'sag_cantalar',
        box: [86, 77, 11, 14],
        prompt: 'Kanıt sağ alttaki deri eşyaların arasında olabilir.',
      },
    ],
  },
  {
    universe: 'medieval',
    locationId: 'graveyard',
    areaId: 'open_grave',
    clueSpot: 'devrik kapaklı lahdin içinde',
    image: '/search-scenes/medieval/graveyard/open_grave.webp',
    status: 'DRAFT',
    objects: [
      { id: 'terazi', label: 'Pirinç terazi', box: [10, 14, 15, 27] },
      { id: 'kalin_kitap', label: 'Kalın deri kitap', box: [46.5, 15, 11, 25] },
      { id: 'parsomen', label: 'Buruşuk parşömen', box: [71.5, 39, 10.5, 16] },
      {
        id: 'oymali_kabza',
        label: 'Oymalı kabzalı hançer',
        box: [60, 33.5, 8, 22],
      },
      { id: 'catlak_comlek', label: 'Çatlak çömlek', box: [79, 11.5, 11, 22] },
      { id: 'ozel_kupa', label: 'Altın kadeh', box: [68, 76, 7, 17] },
      {
        id: 'sag_kutu',
        label: 'Çerçeveli sandık kutusu',
        box: [74, 63, 11.5, 26],
      },
      {
        id: 'zincir_zirh',
        label: 'Zincir zırh parçası',
        box: [60.5, 64, 9.5, 18],
      },
      { id: 'kilic', label: 'Kılıç', box: [55.5, 62, 10, 20] },
      { id: 'tarak', label: 'Tarak', box: [29, 78, 5.5, 9] },
      { id: 'boynuz', label: 'Boynuz', box: [63, 51, 11, 10] },
      {
        id: 'kuru_dal_demeti',
        label: 'Kuru dal demeti',
        box: [66.5, 27, 12, 25],
      },
      { id: 'kemer_tokasi', label: 'Kemer tokası', box: [47.7, 69, 4.3, 7.5] },
      { id: 'tas_figur', label: 'Taş figür', box: [39, 53, 6.5, 14] },
      {
        id: 'sag_figur',
        label: 'Ahşap küçük heykel',
        box: [90.5, 73, 3.5, 14],
      },
    ],
    finalSpots: [
      {
        id: 'mavi_kese',
        box: [74, 70, 6, 12],
        prompt:
          'Kanıt sağdaki sandığın içinde, sikkelerle boncukların arasında olabilir.',
      },
      {
        id: 'sol_ust_sepet',
        box: [46, 61.5, 8, 14],
        prompt: 'Kanıt ortadaki kırık çömleğin içinde olabilir.',
      },
      {
        id: 'sag_ust_sandik',
        box: [85, 43, 7, 12],
        prompt: 'Kanıt sağ üstteki kürkle tüylerin altında olabilir.',
      },
    ],
  },
];
