import type { SearchSceneDef } from '../search-scene';

// Ashenmoor Kilisesi'nin arama alanları (görseller: docs/nesne-arama-gorselleri.md istemleri).
// Sahnede birden çok kopyası olan eşyalar listeye alınmadı; iki tane olanlar yerleriyle ayrıldı.
export const MEDIEVAL_CHURCH_SCENES: SearchSceneDef[] = [
  {
    universe: 'medieval',
    locationId: 'church',
    areaId: 'altar',
    clueSpot: 'sunağın üstünde, adakların arasında',
    image: '/search-scenes/medieval/church/altar.webp',
    status: 'DRAFT',
    objects: [
      {
        id: 'meryem_heykeli',
        label: 'Meryem heykeli',
        box: [60.5, 29.5, 5, 21],
      },
      { id: 'tahta_bebek', label: 'Tahta bebek', box: [55, 34.5, 5.8, 13] },
      { id: 'yuksuk', label: 'Yüksük', box: [51.5, 34.5, 3.2, 6.5] },
      { id: 'kus_yuvasi', label: 'Kuş yuvası', box: [86.5, 32.5, 9.5, 13.5] },
      { id: 'tespih', label: 'Tespih', box: [29.5, 19, 12.5, 33] },
      {
        id: 'islemeli_kese',
        label: 'İşlemeli kese',
        box: [20.3, 19.5, 11, 14],
      },
      { id: 'bakir_huni', label: 'Bakır huni', box: [66.5, 54, 6.8, 13.5] },
      { id: 'makas', label: 'Makas', box: [43.5, 77.5, 8.5, 14] },
      { id: 'toprak_testi', label: 'Toprak testi', box: [10.5, 79.5, 6.5, 11] },
      { id: 'yun_eldiven', label: 'Yün eldiven', box: [35.3, 61.5, 7, 17] },
      {
        id: 'islemeli_kumas',
        label: 'İşlemeli mavi kumaş',
        box: [4.5, 74, 16.5, 24],
      },
      {
        id: 'altin_heykelcik',
        label: 'Altın heykelcik',
        box: [14.8, 74.5, 4.5, 7],
      },
      { id: 'zincir', label: 'Zincir', box: [86.8, 65.5, 8.8, 7] },
      {
        id: 'iplik_makarasi',
        label: 'İplik makarası',
        box: [76.5, 69.5, 3.5, 9.5],
      },
      { id: 'icki_boynuzu', label: 'İçki boynuzu', box: [59.3, 68.5, 9, 7.5] },
    ],
    finalSpots: [
      {
        id: 'orta_kese',
        box: [44, 42, 5, 8],
        prompt: 'Kanıt sunağın ortasındaki küçük deri kesede olabilir.',
      },
      {
        id: 'alt_kese',
        box: [59.5, 82.5, 7, 9.5],
        prompt:
          'Kanıt sunağın alt kısmındaki çıngıraklı kahverengi kesede olabilir.',
      },
      {
        id: 'kitap_yigini',
        box: [84.5, 73.5, 12, 20.5],
        prompt: 'Kanıt sunağın sağ alt köşesindeki kitap yığınında olabilir.',
      },
    ],
  },
  {
    universe: 'medieval',
    locationId: 'church',
    areaId: 'pulpit',
    clueSpot: 'vaaz kürsüsünün basamaklarının altındaki yığında',
    image: '/search-scenes/medieval/church/pulpit.webp',
    status: 'DRAFT',
    objects: [
      {
        id: 'pirinc_samdan',
        label: 'Pirinç şamdan',
        box: [15.3, 26.5, 4.2, 15.5],
      },
      { id: 'rahip_cuppesi', label: 'Rahip cüppesi', box: [65, 32.5, 17, 31] },
      {
        id: 'bakir_testi',
        label: 'Kabartmalı bakır testi',
        box: [54, 52, 7, 16],
      },
      { id: 'cikrik', label: 'Küçük çıkrık', box: [20, 66.5, 10, 17.5] },
      { id: 'demir_halka', label: 'Demir halka', box: [70, 88.5, 4.5, 10] },
      { id: 'fici', label: 'Fıçı', box: [94.5, 87.5, 5.5, 12.5] },
      { id: 'kurk', label: 'Kürk parçası', box: [71.5, 63.5, 9, 14] },
      { id: 'sol_sepet', label: 'Soldaki sepet', box: [5.5, 59.5, 13.5, 20.5] },
      {
        id: 'kucuk_can',
        label: 'Merdivendeki küçük çan',
        box: [81.5, 20.5, 3, 11],
      },
      { id: 'buyuk_can', label: 'Büyük pirinç çan', box: [65, 74.5, 7, 13.5] },
      {
        id: 'gumus_surahi',
        label: 'Ortadaki gümüş sürahi',
        box: [30, 44.5, 8, 16],
      },
      { id: 'kehribar_sise', label: 'Kehribar şişe', box: [90, 39.5, 5, 12] },
      { id: 'cam_sise', label: 'Cam şişe', box: [74, 86.5, 7, 13.5] },
    ],
    finalSpots: [
      {
        id: 'acik_sandik',
        box: [10.5, 49.5, 19.5, 14.5],
        prompt: 'Kanıt solda, kürsünün dibindeki açık sandıkta olabilir.',
      },
      {
        id: 'orta_kutu',
        box: [50.5, 39.5, 9, 12.5],
        prompt: 'Kanıt ortadaki ahşap kutuda olabilir.',
      },
      {
        id: 'sag_sandik',
        box: [80.5, 81.5, 10.5, 14],
        prompt: 'Kanıt sağ alttaki sandıkta olabilir.',
      },
    ],
  },
  {
    universe: 'medieval',
    locationId: 'church',
    areaId: 'tapestry',
    clueSpot: 'duvar halısının arkasındaki taş nişin raflarında',
    image: '/search-scenes/medieval/church/tapestry.webp',
    status: 'DRAFT',
    objects: [
      {
        id: 'asili_anahtarlar',
        label: 'Üstte asılı anahtarlar',
        box: [27.5, 6.5, 4, 12.5],
      },
      {
        id: 'sol_anahtar',
        label: 'Soldaki anahtar halkası',
        box: [19.5, 29, 5, 17],
      },
      { id: 'el_cani', label: 'Pirinç el çanı', box: [30.8, 9, 5.2, 19.5] },
      { id: 'gumus_kadeh', label: 'Gümüş kadeh', box: [43.3, 11.5, 5.5, 17] },
      {
        id: 'zincir_zirh',
        label: 'Zincir zırh parçası',
        box: [55.5, 22, 14.5, 15],
      },
      { id: 'kum_saati', label: 'Kum saati', box: [82.2, 33.8, 6.7, 17] },
      { id: 'bakir_tabak', label: 'Bakır tabak', box: [67.8, 32.8, 10.5, 17] },
      {
        id: 'catlak_testi',
        label: 'Çatlak testi',
        box: [60.5, 36.3, 6.2, 13.5],
      },
      { id: 'boynuz', label: 'Orta raftaki boynuz', box: [52.2, 37.8, 8, 12] },
      {
        id: 'kordonlu_kitap',
        label: 'Kordonlu kitap',
        box: [28.3, 40, 16, 12],
      },
      { id: 'gumus_kupa', label: 'Gümüş kupa', box: [29, 59.8, 6.7, 10] },
      { id: 'kemik_duduk', label: 'Oyma kemik düdük', box: [31, 65.5, 9, 9] },
      { id: 'tuy_kalem', label: 'Tüy kalem', box: [49, 59.8, 6.5, 12] },
      {
        id: 'katlanir_cerceve',
        label: 'Gümüş katlanır çerçeve',
        box: [80, 55.8, 10, 19],
      },
      {
        id: 'dokuma_mekigi',
        label: 'Dokuma mekiği',
        box: [72.2, 64.7, 14.5, 11],
      },
      {
        id: 'islemeli_serit',
        label: 'İşlemeli şerit',
        box: [22.8, 73.7, 5, 15],
      },
      {
        id: 'altin_kenarli_kumas',
        label: 'Altın kenarlı kumaş',
        box: [44, 73.7, 13.3, 15],
      },
    ],
    finalSpots: [
      {
        id: 'ahsap_kutu',
        box: [50, 14, 12.8, 15],
        prompt: 'Kanıt üst raftaki küçük ahşap kutuda olabilir.',
      },
      {
        id: 'ust_kitap',
        box: [84.4, 9.5, 7, 18],
        prompt: 'Kanıt üst rafın sağ ucundaki kitapta olabilir.',
      },
      {
        id: 'alt_kitap',
        box: [16.5, 56.8, 6, 17],
        prompt:
          'Kanıt sol alt rafın kıyısındaki kalın ciltli kitapta olabilir.',
      },
    ],
  },
  {
    universe: 'medieval',
    locationId: 'church',
    areaId: 'candelabra',
    clueSpot: 'şamdanların önündeki adak masasında',
    image: '/search-scenes/medieval/church/candelabra.webp',
    status: 'DRAFT',
    objects: [
      { id: 'boynuz', label: 'Boynuz', box: [22, 24.5, 6, 6.5] },
      { id: 'sag_bebek', label: 'Sağdaki bez bebek', box: [76, 26, 8, 11] },
      { id: 'alt_bebek', label: 'Alttaki bez bebek', box: [14, 70, 13, 20] },
      { id: 'matara', label: 'Gümüş matara', box: [53, 42.5, 7, 14.5] },
      { id: 'madalyon', label: 'Altın madalyon', box: [41.5, 50.5, 4.8, 7] },
      { id: 'ahsap_hac', label: 'Ahşap haç', box: [59, 35.5, 7, 14.5] },
      { id: 'tuy_demeti', label: 'Tüy demeti', box: [61, 24.5, 10, 11.5] },
      { id: 'gri_atki', label: 'Gri atkı', box: [22.5, 55, 8.5, 25] },
      {
        id: 'hasir_gunes',
        label: 'Hasır güneş haçı',
        box: [53, 72.5, 7.5, 15.5],
      },
      { id: 'kitap', label: 'Kahverengi kitap', box: [60.5, 78.5, 11, 12] },
      { id: 'eldiven', label: 'Deri eldiven', box: [80, 87.5, 8.5, 8] },
      { id: 'buyuk_anahtar', label: 'Büyük anahtar', box: [5, 50.5, 5.5, 6.5] },
      { id: 'cam_sise', label: 'Cam şişe', box: [50.5, 82.5, 6.5, 8.5] },
      { id: 'murekkep', label: 'Mürekkep hokkası', box: [61, 70.5, 4, 8] },
    ],
    finalSpots: [
      {
        id: 'deri_kese',
        box: [32.5, 40.5, 7, 12.5],
        prompt: 'Kanıt masanın ortasındaki deri kesede olabilir.',
      },
      {
        id: 'mum_kalintisi',
        box: [87, 22, 8.5, 12],
        prompt:
          'Kanıt masanın sağ ucundaki mum kalıntılarının altında olabilir.',
      },
      {
        id: 'alt_sepet',
        box: [79.5, 72, 10.5, 18],
        prompt: 'Kanıt alt rafın sağındaki sepette olabilir.',
      },
    ],
  },
];
