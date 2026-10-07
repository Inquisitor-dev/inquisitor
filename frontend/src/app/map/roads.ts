// Haritalardaki yol ağları. Koordinatlar harita genişliği/yüksekliğinin yüzdesidir.
// Karakter yalnızca bu düğümler arasındaki kenarlar boyunca yürür.
// `doors` her mekanın kapısının (karakterin girip çıktığı noktanın) hangi düğüm olduğunu söyler.

export type Point = { x: number; y: number };

// Ara noktalı kenar: [a, b, a'dan b'ye giderken sırayla geçilen noktalar]
export type RoadEdge = [string, string] | [string, string, Point[]];

export type RoadNetwork = {
  nodes: Record<string, Point>;
  edges: RoadEdge[];
  doors: Record<string, string>;
  spawn: string;
  // Verilirse koordinatlar harita görselinin pikselleridir (ekran oranından bağımsız)
  image?: { width: number; height: number };
  // Karakterin bu haritadaki boy çarpanı (köy = 1). Haritadaki insan, kapı ve araç boyutlarına göre seçilir.
  characterScale?: number;
};

// Köy haritası: koordinatlar village_map_*.png'nin 2752x1536 ölçeğindeki toprak yolların ortasından alınmıştır.
// Meydanın doğusundaki geniş toprak alanda kuzeydoğu (mezarlık) ve güneydoğu (değirmen) yolları
// birbirine doğrudan bağlıdır; böylece bu ikisi arasında giderken meydana inip geri dönülmez.
// Yolları görmek ve yeni nokta almak için haritayı `?debugRoads` ile aç.
const village: RoadNetwork = {
  image: { width: 2752, height: 1536 },
  nodes: {
    square: { x: 1285, y: 945 },
    plaza: { x: 1440, y: 930 },
    ne: { x: 1620, y: 835 },
    se: { x: 1585, y: 945 },
    millFork: { x: 1755, y: 1068 },
    forkWest: { x: 1160, y: 990 },
    churchDoor: { x: 800, y: 645 },
    tavernDoor: { x: 1255, y: 840 },
    graveyardDoor: { x: 2030, y: 375 },
    millDoor: { x: 1868, y: 1022 },
    clinicDoor: { x: 1120, y: 1030 },
    farmDoor: { x: 1560, y: 1240 },
    homeDoor: { x: 610, y: 1200 },
  },
  edges: [
    // Meydandan kuzeybatıya, iki taş direğin arasındaki kapıdan kilise avlusuna
    ['square', 'churchDoor', [
      { x: 1200, y: 880 }, { x: 1100, y: 820 }, { x: 1020, y: 775 }, { x: 965, y: 740 },
      { x: 955, y: 690 }, { x: 920, y: 660 }, { x: 870, y: 655 }, { x: 825, y: 650 },
    ]],
    // Tavernaya her zaman meydandan, toprak alandan yaklaşılır (önündeki çimenli şeritten geçmez)
    ['square', 'tavernDoor', [{ x: 1270, y: 885 }]],
    ['square', 'plaza', [{ x: 1360, y: 940 }]],
    ['plaza', 'ne', [{ x: 1580, y: 890 }]],
    ['plaza', 'se', [{ x: 1530, y: 930 }]],
    ['se', 'ne', [{ x: 1600, y: 890 }]],
    // Kıvrılan kuzeydoğu yolu kuyunun batısından geçip çitin bittiği yerden mezarlığa girer
    ['ne', 'graveyardDoor', [
      { x: 1720, y: 815 }, { x: 1790, y: 772 }, { x: 1830, y: 715 }, { x: 1848, y: 662 },
      { x: 1854, y: 618 }, { x: 1866, y: 572 }, { x: 1897, y: 538 }, { x: 1945, y: 508 },
      { x: 1995, y: 488 }, { x: 2045, y: 462 }, { x: 2072, y: 430 }, { x: 2060, y: 395 },
    ]],
    // Güneydoğu yolu tabelanın solundan geçer, değirmen önünde ikiye ayrılır
    ['se', 'millFork', [{ x: 1640, y: 1000 }, { x: 1700, y: 1043 }]],
    ['millFork', 'millDoor', [{ x: 1800, y: 1060 }, { x: 1840, y: 1040 }]],
    // Meydandan batı yol ayrımına
    ['square', 'forkWest', [{ x: 1230, y: 960 }]],
    // Batı yol ayrımından Revir basamakları önüne
    ['forkWest', 'clinicDoor', [{ x: 1140, y: 1010 }]],
    // Revir kapısından açık toprak yol boyunca, iki evin arasından geçip Evim kapısına
    ['clinicDoor', 'homeDoor', [
      { x: 1050, y: 1100 }, { x: 950, y: 1180 }, { x: 830, y: 1240 }, { x: 700, y: 1240 },
    ]],
    // Güneydoğu meydanından açık toprak yolla bostan çitinin yanından Çiftlik kapısına
    ['se', 'farmDoor', [
      { x: 1630, y: 1020 }, { x: 1640, y: 1110 }, { x: 1600, y: 1190 },
    ]],
  ],
  doors: {
    church: 'churchDoor',
    tavern: 'tavernDoor',
    graveyard: 'graveyardDoor',
    mill: 'millDoor',
    clinic: 'clinicDoor',
    farm: 'farmDoor',
    home: 'homeDoor',
  },
  spawn: 'square',
};

// Kasaba haritası (town_map_*.png, 2752x1536): koordinatlar asfalt yol, kaldırım ve kapı önlerindedir.
// Kapılar mekanların tıklama alanlarının içindedir. İnsan ve araç boyları karakterle uyumlu, ölçek köyle aynı.
const town: RoadNetwork = {
  image: { width: 2752, height: 1536 },
  nodes: {
    crossing: { x: 1290, y: 800 },
    northRoad: { x: 1700, y: 620 },
    hotelCorner: { x: 1900, y: 520 },
    policeDoor: { x: 800, y: 860 },
    gasDoor: { x: 500, y: 1040 },
    barDoor: { x: 1380, y: 565 },
    arcadeDoor: { x: 1850, y: 1080 },
    dinerDoor: { x: 1490, y: 1350 },
    hotelDoor: { x: 2140, y: 690 },
    homeDoor: { x: 1925, y: 330 },
  },
  edges: [
    // Maple Ave boyunca batıya, polis arabasının üstünden şerif binasının merdivenine
    ['crossing', 'policeDoor', [{ x: 1100, y: 820 }, { x: 950, y: 790 }]],
    // Main St'den aşağı, polis arabasının altından dolanıp benzin pompalarının önüne
    ['crossing', 'gasDoor', [
      { x: 1150, y: 900 }, { x: 1000, y: 1030 }, { x: 820, y: 1060 }, { x: 650, y: 1055 },
    ]],
    // Elektrik direğinin üstünden geçen yaya geçidiyle barın önündeki kaldırıma
    ['crossing', 'barDoor', [{ x: 1340, y: 700 }, { x: 1380, y: 610 }]],
    ['crossing', 'northRoad', [{ x: 1450, y: 740 }, { x: 1580, y: 680 }]],
    // Ağacın ve çalıların altından arnavut kaldırımlı meydana
    ['crossing', 'arcadeDoor', [{ x: 1430, y: 900 }, { x: 1450, y: 1050 }, { x: 1600, y: 1080 }]],
    // Lokantanın doğu cephesindeki girişe
    ['arcadeDoor', 'dinerDoor', [{ x: 1640, y: 1150 }, { x: 1600, y: 1300 }]],
    ['northRoad', 'hotelCorner'],
    ['hotelCorner', 'hotelDoor', [{ x: 2000, y: 600 }]],
    // Yolu karşıya geçip terk edilmiş evin basamaklarına
    ['hotelCorner', 'homeDoor', [{ x: 1890, y: 420 }]],
  ],
  doors: {
    tavern: 'policeDoor',
    clinic: 'barDoor',
    church: 'hotelDoor',
    farm: 'gasDoor',
    graveyard: 'arcadeDoor',
    mill: 'dinerDoor',
    home: 'homeDoor',
  },
  spawn: 'crossing',
};

// Cyberpunk haritası (cyberpunk_map_*.webp, 2752x1536): gökdelenlerle çevrili meydan.
// Mekânlar meydanın arka iki kenarında, ortada dört bloklu gece pazarı var. Yollar pazar bloklarının ve
// karakolun önündeki bariyerlerin çevresinden dolaşır; kapı noktaları dükkânların önündeki karolardadır.
// Tezgâhtaki satıcılar ~85 px boyunda; karakter onlarla aynı boya ölçeklenir.
const cyberpunk: RoadNetwork = {
  image: { width: 2752, height: 1536 },
  characterScale: 0.8,
  nodes: {
    plaza: { x: 1390, y: 1345 },
    sw: { x: 965, y: 1210 },
    south: { x: 1720, y: 1240 },
    west: { x: 520, y: 950 },
    north: { x: 1100, y: 715 },
    top: { x: 1380, y: 640 },
    ne: { x: 1790, y: 770 },
    east: { x: 2170, y: 960 },
    homeDoor: { x: 360, y: 960 },
    ramenDoor: { x: 930, y: 790 },
    workshopDoor: { x: 1240, y: 600 },
    clinicDoor: { x: 1690, y: 700 },
    policeDoor: { x: 2010, y: 795 },
    barDoor: { x: 2440, y: 880 },
    marketDoor: { x: 1120, y: 1110 },
  },
  edges: [
    // Alt meydandan pazarın iki yanına; alttaki bloğun altından, sol alttaki kulübenin üstünden geçer
    ['plaza', 'sw', [{ x: 1180, y: 1250 }]],
    ['plaza', 'south'],
    // Pazara sol ve alt bloklar arasındaki boşluktan girilir
    ['sw', 'marketDoor'],
    ['sw', 'west'],
    ['west', 'homeDoor'],
    // Sol bloğun üst köşesindeki tentelerin solundan kuzey sokağına
    ['west', 'north', [{ x: 770, y: 800 }, { x: 963, y: 743 }]],
    ['north', 'ramenDoor'],
    ['north', 'workshopDoor'],
    ['north', 'top'],
    // Üst bloğun tentelerinin üstünden, kliniğin saksılarının önünden
    ['top', 'ne', [{ x: 1514, y: 626 }, { x: 1651, y: 688 }]],
    ['ne', 'clinicDoor'],
    // Sağ bloğun tentesiyle karakolun bariyeri arasından
    ['ne', 'east', [{ x: 1995, y: 846 }]],
    ['ne', 'policeDoor', [{ x: 1995, y: 846 }]],
    ['east', 'policeDoor'],
    // Kadife ipin sol ucundan dolanıp kuyruğun içinden kapıya
    ['east', 'barDoor', [{ x: 2235, y: 885 }]],
    // Sağ bloğun tabureleri dolanılır
    ['east', 'south', [{ x: 2064, y: 1128 }]],
  ],
  doors: {
    home: 'homeDoor',
    tavern: 'policeDoor',
    clinic: 'barDoor',
    graveyard: 'clinicDoor',
    mill: 'workshopDoor',
    church: 'ramenDoor',
    farm: 'marketDoor',
  },
  spawn: 'plaza',
};

// Çin haritası (china_*.png, 2730x1536): koordinatlar taş döşeli meydanın açık karoları üzerindedir.
// Ortadaki pazar tezgâhları ve çadırlar dolanılır: merkez, tezgâhların arasındaki desenli taş levhadır.
// Kapı yükseklikleri köydekinden küçük, karakter biraz küçültülür.
const chinaRoads: RoadNetwork = {
  image: { width: 2730, height: 1536 },
  characterScale: 0.85,
  nodes: {
    square: { x: 1320, y: 790 },
    north: { x: 1480, y: 665 },
    west: { x: 950, y: 655 },
    east: { x: 1800, y: 675 },
    forge: { x: 1960, y: 950 },
    southGap: { x: 1240, y: 1040 },
    churchDoor: { x: 700, y: 485 },
    clinicDoor: { x: 800, y: 730 },
    tavernDoor: { x: 1540, y: 545 },
    graveyardDoor: { x: 2180, y: 470 },
    millDoor: { x: 2180, y: 885 },
    homeDoor: { x: 2120, y: 1075 },
    pierDoor: { x: 660, y: 1160 },
  },
  edges: [
    // Orta tezgâhın çatısıyla üst çadırın arasındaki dar şeritten kuzeye
    ['square', 'north', [{ x: 1420, y: 770 }, { x: 1460, y: 745 }, { x: 1480, y: 700 }]],
    // Sol tezgâhla üst çadırın arasından batıdaki açık alana
    ['square', 'west', [{ x: 1255, y: 762 }, { x: 1150, y: 650 }, { x: 1040, y: 660 }]],
    ['west', 'churchDoor', [{ x: 800, y: 560 }]],
    ['west', 'clinicDoor', [{ x: 870, y: 700 }]],
    ['north', 'tavernDoor', [{ x: 1510, y: 600 }]],
    // Saksıların altıyla kırmızı çadırın üstündeki şeritten doğuya
    ['north', 'east', [{ x: 1640, y: 670 }]],
    // Taş fenerin sağından aslan heykellerinin arasındaki merdivene
    ['east', 'graveyardDoor', [{ x: 1900, y: 630 }, { x: 2000, y: 560 }, { x: 2120, y: 510 }]],
    ['east', 'forge', [{ x: 1800, y: 900 }]],
    // Masayla örsün arasından ocağın önüne
    ['forge', 'millDoor', [{ x: 2140, y: 930 }]],
    ['forge', 'homeDoor', [{ x: 2060, y: 1010 }]],
    // İki alt tezgâhın arasındaki boşluktan desenli taş levhaya, oradan fenerlerin üstünden iskeleye
    ['square', 'southGap', [{ x: 1250, y: 900 }]],
    ['southGap', 'pierDoor', [{ x: 1100, y: 1010 }, { x: 900, y: 1010 }, { x: 760, y: 1060 }]],
  ],
  doors: {
    church: 'churchDoor',
    tavern: 'tavernDoor',
    graveyard: 'graveyardDoor',
    clinic: 'clinicDoor',
    mill: 'millDoor',
    home: 'homeDoor',
    farm: 'pierDoor',
  },
  spawn: 'square',
};

// Kış haritası (winter_*.jpg, 2730x1536): koordinatlar karla kaplı toprak yolların üzerindedir.
// Kaya, dikili taş ve ateşlerin etrafından dolanılır. Haritadaki insanlar ~90 px; karakter küçültülür.
const winterRoads: RoadNetwork = {
  image: { width: 2730, height: 1536 },
  characterScale: 0.82,
  nodes: {
    square: { x: 1460, y: 910 },
    northwest: { x: 1280, y: 740 },
    castleRoad: { x: 1645, y: 620 },
    eastFork: { x: 1720, y: 985 },
    southwest: { x: 1400, y: 1000 },
    churchDoor: { x: 560, y: 470 },
    castleDoor: { x: 1625, y: 545 },
    gateDoor: { x: 2225, y: 390 },
    tavernDoor: { x: 1835, y: 990 },
    clinicDoor: { x: 2125, y: 1045 },
    homeDoor: { x: 1160, y: 1005 },
    mineDoor: { x: 470, y: 1310 },
  },
  edges: [
    // Et kurutma iskelesinin üstünden kuzeybatı yoluna
    ['square', 'northwest', [{ x: 1380, y: 820 }]],
    // Taşlı patika boyunca, iki dikili taşın arasından kutsal ağacın köklerine
    ['northwest', 'churchDoor', [
      { x: 1150, y: 680 }, { x: 1000, y: 620 }, { x: 840, y: 575 }, { x: 790, y: 520 }, { x: 690, y: 480 },
    ]],
    // Meşalenin solundan kale yoluna
    ['square', 'castleRoad', [{ x: 1560, y: 800 }, { x: 1640, y: 690 }]],
    ['castleRoad', 'castleDoor'],
    // Meşalenin önünden, kulübe çatısının arkasındaki toprak yolla surun kapısına
    ['castleRoad', 'gateDoor', [
      { x: 1760, y: 630 }, { x: 1900, y: 590 }, { x: 2010, y: 510 }, { x: 2120, y: 440 },
    ]],
    ['square', 'eastFork', [{ x: 1600, y: 950 }]],
    // Atın ve hancının altından ateşin yanına
    ['eastFork', 'tavernDoor'],
    // Gözcü kulesinin üstünden infaz platformunun sağına
    ['eastFork', 'clinicDoor', [{ x: 1850, y: 1015 }, { x: 1960, y: 1022 }]],
    ['square', 'southwest'],
    // Ateş çukurunun altından avcı kulübesinin kapısına
    ['southwest', 'homeDoor', [{ x: 1230, y: 1060 }]],
    // Kömür yığınıyla vincin arasından madenin girişine
    ['southwest', 'mineDoor', [
      { x: 1300, y: 1090 }, { x: 1100, y: 1150 }, { x: 830, y: 1220 }, { x: 680, y: 1310 },
    ]],
  ],
  doors: {
    church: 'churchDoor',
    graveyard: 'castleDoor',
    tavern: 'tavernDoor',
    home: 'homeDoor',
    farm: 'gateDoor',
    mill: 'mineDoor',
    clinic: 'clinicDoor',
  },
  spawn: 'square',
};

export const getRoadNetwork = (scenarioType: string): RoadNetwork => {
  if (scenarioType === 'modern') return town;
  if (scenarioType === 'cyberpunk') return cyberpunk;
  if (scenarioType === 'china') return chinaRoads;
  if (scenarioType === 'winter') return winterRoads;
  return village;
};

// Harita ekran oranında yatay ve dikey yüzdeler aynı uzunlukta değil
export const MAP_ASPECT = 16 / 9;

export const distance = (a: Point, b: Point) =>
  Math.hypot(b.x - a.x, (b.y - a.y) / MAP_ASPECT);

const pixelDistance = (a: Point, b: Point) => Math.hypot(b.x - a.x, b.y - a.y);

const measure = (network: RoadNetwork) => (network.image ? pixelDistance : distance);

const edgeBetween = (network: RoadNetwork, a: string, b: string) =>
  network.edges.find(([x, y]) => (x === a && y === b) || (x === b && y === a));

// Kenar uzunluğu ara noktalar boyunca ölçülür
const edgeLength = (network: RoadNetwork, a: string, b: string) => {
  const points = expandPath(network, [a, b]);
  const dist = measure(network);
  return points.slice(1).reduce((sum, p, i) => sum + dist(points[i], p), 0);
};

// Düğüm listesini, kenarların ara noktaları dahil yürünecek nokta listesine çevirir
export const expandPath = (network: RoadNetwork, path: string[]): Point[] => {
  const points: Point[] = [network.nodes[path[0]]];
  for (let i = 1; i < path.length; i++) {
    const edge = edgeBetween(network, path[i - 1], path[i]);
    const via = edge?.[2] ?? [];
    points.push(...(edge?.[0] === path[i - 1] ? via : [...via].reverse()), network.nodes[path[i]]);
  }
  return points;
};

// İki düğüm arasındaki en kısa yolu (Dijkstra) düğüm listesi olarak döndürür
export const findPath = (network: RoadNetwork, from: string, to: string): string[] => {
  const dist: Record<string, number> = {};
  const prev: Record<string, string | undefined> = {};
  const unvisited = new Set(Object.keys(network.nodes));
  for (const id of unvisited) dist[id] = Infinity;
  dist[from] = 0;

  const neighbors = (id: string) =>
    network.edges.flatMap(([a, b]) => (a === id ? [b] : b === id ? [a] : []));

  while (unvisited.size > 0) {
    let current: string | null = null;
    for (const id of unvisited) {
      if (current === null || dist[id] < dist[current]) current = id;
    }
    if (current === null || dist[current] === Infinity || current === to) break;
    unvisited.delete(current);

    for (const next of neighbors(current)) {
      if (!unvisited.has(next)) continue;
      const alt = dist[current] + edgeLength(network, current, next);
      if (alt < dist[next]) {
        dist[next] = alt;
        prev[next] = current;
      }
    }
  }

  if (from !== to && prev[to] === undefined) return [from, to];
  const path = [to];
  while (path[0] !== from) path.unshift(prev[path[0]]!);
  return path;
};
