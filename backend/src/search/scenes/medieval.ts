import type { SearchSceneDef } from '../search-scene';

// Taslak: dağınık sahne görselleri üretilene kadar altyapıyı denemek için iç mekân görseli kullanılır
export const MEDIEVAL_SEARCH_SCENES: SearchSceneDef[] = [
  {
    universe: 'medieval',
    locationId: 'tavern',
    image: '/backgrounds/interior_medieval_tavern.webp',
    status: 'DRAFT',
    objects: [
      { id: 'chandelier', label: 'Büyük avize', box: [45, 1, 10, 16] },
      { id: 'small_chandelier', label: 'Küçük avize', box: [47, 21, 7, 8] },
      { id: 'stairs', label: 'Ahşap merdiven', box: [47, 34, 6, 27] },
      { id: 'shield', label: 'Duvardaki kalkan', box: [80, 24, 4, 10] },
      { id: 'fire', label: 'Şömine ateşi', box: [82, 52, 7, 18] },
      { id: 'bar_barrel', label: 'Tezgâhtaki fıçı', box: [25, 49, 5, 10] },
      { id: 'tankard', label: 'Kalay kupa', box: [18, 61, 3, 8] },
      { id: 'banner', label: 'Kırmızı sancak', box: [14, 26, 4, 20] },
      { id: 'candle', label: 'Tezgâhtaki mum', box: [29.5, 52, 2.5, 7] },
      { id: 'floor_barrel', label: 'Köşedeki fıçı', box: [12, 77, 6, 22] },
      { id: 'bucket', label: 'Odun kovası', box: [84, 69, 4, 18] },
    ],
    finalSpots: [
      {
        id: 'loose_plank',
        box: [22, 72, 8, 15],
        prompt: 'Tezgâhın önündeki tahtalardan biri yerinden oynamış.',
      },
      {
        id: 'under_stairs',
        box: [48.5, 55, 4, 6],
        prompt: 'Merdivenin dibinde bir şey sıkıştırılmış gibi.',
      },
      {
        id: 'hearth_stone',
        box: [76, 40, 5, 10],
        prompt: 'Şöminenin taşlarından biri ötekilerden daha yeni.',
      },
    ],
  },
];
