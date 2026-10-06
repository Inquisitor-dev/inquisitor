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
    churchDoor: { x: 800, y: 645 },
    tavernDoor: { x: 1255, y: 840 },
    graveyardDoor: { x: 2030, y: 375 },
    millDoor: { x: 1868, y: 1022 },
    clinicDoor: { x: 2155, y: 1295 },
    farmDoor: { x: 710, y: 1215 },
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
    ['millFork', 'clinicDoor', [
      { x: 1810, y: 1110 }, { x: 1860, y: 1160 }, { x: 1930, y: 1200 }, { x: 2010, y: 1240 },
      { x: 2070, y: 1280 }, { x: 2120, y: 1298 },
    ]],
    // Güneybatı yolu tabelanın sağından inip ahırın önüne gider
    ['square', 'farmDoor', [
      { x: 1250, y: 985 }, { x: 1222, y: 1022 }, { x: 1160, y: 1062 }, { x: 1075, y: 1120 },
      { x: 990, y: 1160 }, { x: 920, y: 1182 }, { x: 840, y: 1207 }, { x: 760, y: 1220 },
    ]],
  ],
  doors: {
    church: 'churchDoor',
    tavern: 'tavernDoor',
    graveyard: 'graveyardDoor',
    mill: 'millDoor',
    clinic: 'clinicDoor',
    farm: 'farmDoor',
  },
  spawn: 'square',
};

// Kasaba haritası (town_map_*.png, 2750x1536): koordinatlar asfalt yolların ve otoparkların üzerindedir.
// Karakola polis arabalarının arasından değil, soldaki boş otopark şeridinden dolanarak yaklaşılır.
const town: RoadNetwork = {
  image: { width: 2750, height: 1536 },
  nodes: {
    junction: { x: 1520, y: 930 },
    westJunction: { x: 1290, y: 860 },
    policeDoor: { x: 738, y: 606 },
    videoDoor: { x: 1415, y: 705 },
    gasDoor: { x: 778, y: 988 },
    driveInDoor: { x: 1598, y: 1182 },
    northBend: { x: 2135, y: 428 },
    trailerDoor: { x: 2120, y: 455 },
    churchDoor: { x: 2300, y: 382 },
  },
  edges: [
    ['junction', 'westJunction', [{ x: 1400, y: 905 }]],
    ['westJunction', 'videoDoor', [{ x: 1290, y: 800 }, { x: 1335, y: 735 }]],
    ['westJunction', 'policeDoor', [
      { x: 1170, y: 800 }, { x: 1000, y: 742 }, { x: 900, y: 716 }, { x: 780, y: 713 },
      { x: 660, y: 712 }, { x: 592, y: 700 }, { x: 588, y: 650 }, { x: 640, y: 616 },
      { x: 695, y: 608 },
    ]],
    ['junction', 'gasDoor', [
      { x: 1400, y: 962 }, { x: 1262, y: 1006 }, { x: 1130, y: 1046 }, { x: 1000, y: 1035 },
      { x: 895, y: 995 },
    ]],
    ['junction', 'driveInDoor', [{ x: 1560, y: 1030 }, { x: 1572, y: 1100 }]],
    ['junction', 'northBend', [
      { x: 1600, y: 860 }, { x: 1700, y: 780 }, { x: 1800, y: 700 }, { x: 1850, y: 600 },
      { x: 1905, y: 520 }, { x: 1990, y: 470 }, { x: 2080, y: 440 },
    ]],
    ['northBend', 'trailerDoor'],
    ['northBend', 'churchDoor', [{ x: 2210, y: 402 }, { x: 2262, y: 388 }]],
  ],
  doors: {
    tavern: 'policeDoor',
    graveyard: 'videoDoor',
    church: 'churchDoor',
    farm: 'gasDoor',
    clinic: 'trailerDoor',
    mill: 'driveInDoor',
  },
  spawn: 'junction',
};


// Cyberpunk haritası (cyberpunk_map_*.png, 2750x1536): koordinatlar kaldırım, meydan ve yaya geçitleri üzerindedir;
// park etmiş araçların, motosikletin ve seyyar tezgahların etrafından dolanılır.
const cyberpunk: RoadNetwork = {
  image: { width: 2750, height: 1536 },
  nodes: {
    crossing: { x: 1360, y: 925 },
    plaza: { x: 1080, y: 1045 },
    policeDoor: { x: 650, y: 912 },
    barDoor: { x: 1240, y: 805 },
    ramenDoor: { x: 1440, y: 812 },
    eastCorner: { x: 1600, y: 880 },
    robotDoor: { x: 1720, y: 728 },
    bridgeDoor: { x: 2055, y: 648 },
    junkyardDoor: { x: 2225, y: 1192 },
  },
  edges: [
    ['plaza', 'policeDoor', [
      { x: 940, y: 1070 }, { x: 830, y: 1075 }, { x: 730, y: 1010 }, { x: 680, y: 955 },
    ]],
    ['plaza', 'crossing', [{ x: 1150, y: 1000 }, { x: 1235, y: 972 }]],
    ['crossing', 'barDoor', [{ x: 1330, y: 895 }, { x: 1270, y: 845 }]],
    ['crossing', 'ramenDoor', [{ x: 1410, y: 870 }]],
    ['crossing', 'eastCorner', [{ x: 1500, y: 910 }]],
    ['eastCorner', 'robotDoor', [{ x: 1660, y: 790 }]],
    ['eastCorner', 'bridgeDoor', [{ x: 1800, y: 832 }, { x: 1985, y: 765 }, { x: 2040, y: 695 }]],
    ['crossing', 'junkyardDoor', [
      { x: 1470, y: 1060 }, { x: 1560, y: 1150 }, { x: 1700, y: 1152 }, { x: 1850, y: 1147 },
      { x: 2050, y: 1150 }, { x: 2160, y: 1175 },
    ]],
  ],
  doors: {
    tavern: 'policeDoor',
    clinic: 'barDoor',
    church: 'ramenDoor',
    mill: 'robotDoor',
    farm: 'bridgeDoor',
    graveyard: 'junkyardDoor',
  },
  spawn: 'crossing',
};


export const getRoadNetwork = (scenarioType: string): RoadNetwork =>
  scenarioType === 'modern' ? town : scenarioType === 'cyberpunk' ? cyberpunk : village;

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
