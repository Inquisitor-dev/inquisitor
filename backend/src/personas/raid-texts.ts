// Gece baskınının hazır metinleri: her evrende aynı iskelet, yalnızca eşya ve oda adları değişir.
// Gemini yok: hem maliyet sıfır hem de sert anlarda modelin güvenlik filtresine takılma riski yok.
import type { RaidAction, RaidEvent, RaidRoom } from './raid-engine';

// Türkçe ekler tek kalıpla doğru üretilemiyor ("mutfaka", "kapsülüna", "kandilı"): ekli biçimler açıkça yazılır
interface RaidNouns {
  rooms: Record<RaidRoom, string>;
  // "…na geç" biçimleri (yönelme hâli)
  toRoom: Record<RaidRoom, string>;
  lamp: string;
  lampAcc: string;
  knife: string;
  knifeAcc: string;
  windowFrom: string;
}

const NOUNS: Record<string, RaidNouns> = {
  medieval: {
    rooms: {
      BEDROOM: 'yatak odası',
      KITCHEN: 'mutfak',
      HALLWAY: 'dar geçit',
      DOORSTEP: 'avlu',
    },
    toRoom: {
      BEDROOM: 'Yatak odasına',
      KITCHEN: 'Mutfağa',
      HALLWAY: 'Dar geçide',
      DOORSTEP: 'Avluya',
    },
    lamp: 'kandil',
    lampAcc: 'kandili',
    knife: 'ekmek bıçağı',
    knifeAcc: 'ekmek bıçağını',
    windowFrom: 'kepenkli pencereden',
  },
  modern: {
    rooms: {
      BEDROOM: 'yatak odası',
      KITCHEN: 'mutfak',
      HALLWAY: 'koridor',
      DOORSTEP: 'veranda',
    },
    toRoom: {
      BEDROOM: 'Yatak odasına',
      KITCHEN: 'Mutfağa',
      HALLWAY: 'Koridora',
      DOORSTEP: 'Verandaya',
    },
    lamp: 'masa lambası',
    lampAcc: 'masa lambasını',
    knife: 'mutfak bıçağı',
    knifeAcc: 'mutfak bıçağını',
    windowFrom: 'storlu pencereden',
  },
  cyberpunk: {
    rooms: {
      BEDROOM: 'uyku kapsülü',
      KITCHEN: 'mutfak nişi',
      HALLWAY: 'metal koridor',
      DOORSTEP: 'arka sokak',
    },
    toRoom: {
      BEDROOM: 'Uyku kapsülüne',
      KITCHEN: 'Mutfak nişine',
      HALLWAY: 'Metal koridora',
      DOORSTEP: 'Arka sokağa',
    },
    lamp: 'LED panel',
    lampAcc: 'LED paneli',
    knife: 'mutfak bıçağı',
    knifeAcc: 'mutfak bıçağını',
    windowFrom: 'yağmurlu camdan',
  },
  china: {
    rooms: {
      BEDROOM: 'yatak odası',
      KITCHEN: 'mutfak',
      HALLWAY: 'veranda geçidi',
      DOORSTEP: 'avlu kapısı',
    },
    toRoom: {
      BEDROOM: 'Yatak odasına',
      KITCHEN: 'Mutfağa',
      HALLWAY: 'Veranda geçidine',
      DOORSTEP: 'Avlu kapısına',
    },
    lamp: 'kâğıt fener',
    lampAcc: 'kâğıt feneri',
    knife: 'satır',
    knifeAcc: 'satırı',
    windowFrom: 'kafesli pencereden',
  },
  winter: {
    rooms: {
      BEDROOM: 'yatak odası',
      KITCHEN: 'mutfak',
      HALLWAY: 'dar geçit',
      DOORSTEP: 'karlı kapı önü',
    },
    toRoom: {
      BEDROOM: 'Yatak odasına',
      KITCHEN: 'Mutfağa',
      HALLWAY: 'Dar geçide',
      DOORSTEP: 'Karlı kapı önüne',
    },
    lamp: 'yağ lambası',
    lampAcc: 'yağ lambasını',
    knife: 'av bıçağı',
    knifeAcc: 'av bıçağını',
    windowFrom: 'buzlu pencereden',
  },
};

const nounsFor = (scenarioType: string) =>
  NOUNS[scenarioType] ?? NOUNS.medieval;

export const raidRoomName = (scenarioType: string, room: RaidRoom) =>
  nounsFor(scenarioType).rooms[room];

export function raidActionLabel(
  scenarioType: string,
  action: RaidAction,
): string {
  const n = nounsFor(scenarioType);
  switch (action) {
    case 'GO_BEDROOM':
      return `${n.toRoom.BEDROOM} geç`;
    case 'GO_KITCHEN':
      return `${n.toRoom.KITCHEN} geç`;
    case 'GO_HALLWAY':
      return `${n.toRoom.HALLWAY} çık`;
    case 'GO_DOORSTEP':
      return `${n.toRoom.DOORSTEP} çık`;
    case 'LISTEN':
      return 'Kulak kesil';
    case 'CALL_OUT':
      return 'Seslen';
    case 'HIDE':
      return 'Saklan';
    case 'LIGHT_LAMP':
      return `${cap(n.lampAcc)} yak`;
    case 'LOOK_WINDOW':
      return `${cap(n.windowFrom)} bak`;
    case 'TAKE_KNIFE':
      return `${cap(n.knifeAcc)} al`;
    case 'LOCK_BACKDOOR':
      return 'Kapıyı içeriden kilitle';
    case 'LOOK_DARK':
      return 'Karanlığa bak';
    case 'DRAW_GUN':
      return 'Tabancanı çek';
  }
}

export function raidEventText(scenarioType: string, e: RaidEvent): string {
  const n = nounsFor(scenarioType);
  const room = (r: RaidRoom) => n.rooms[r];
  switch (e.kind) {
    case 'ENTERED':
      return `Usulca ${n.toRoom[e.room].toLocaleLowerCase('tr-TR')} geçiyorsun.`;
    case 'HEARD':
      return `Nefesini tutup dinliyorsun: ${room(e.room)} tarafından boğuk bir hışırtı geliyor.`;
    case 'HEARD_NOTHING':
      return 'Dinliyorsun. Yalnızca kendi kalbinin sesi.';
    case 'WARNING':
      return `${cap(room(e.room))} tarafından bir nefes sesi geliyor… Orada biri var.`;
    case 'LAMP_LIT':
      return `${cap(n.lampAcc)} yakıyorsun; titrek ışık odayı dolduruyor.`;
    case 'KNIFE_TAKEN':
      return `Çekmeceyi aralayıp ${n.knifeAcc} alıyorsun. Metal elinde soğuk.`;
    case 'GUN_DRAWN':
      return 'Tabancanı çekip horozunu kaldırıyorsun.';
    case 'BACKDOOR_LOCKED':
      return 'Kapıyı içeriden kilitliyorsun. Sürgü gıcırdıyor.';
    case 'WINDOW':
      return e.seen
        ? `${cap(n.windowFrom)} bakıyorsun: ${room('DOORSTEP')} tarafında bir gölge kıpırdıyor.`
        : `${cap(n.windowFrom)} bakıyorsun: dışarıda kimse yok.`;
    case 'DARK':
      return e.heard
        ? 'Karanlığa bakıyorsun; içeriden, arkandan bir tahta gıcırdıyor.'
        : 'Karanlığa bakıyorsun. Gece sessiz.';
    case 'CALLED_OUT':
      return '"Kim var orada?" diye sesleniyorsun.';
    case 'APPROACHES':
      return 'Ayak sesleri sana doğru yaklaşıyor.';
    case 'STRUGGLE':
      return 'Biri üstüne atılıyor! Boğuşuyorsunuz; omzuna sert bir darbe yiyorsun ve saldırgan geri çekiliyor.';
    case 'FLED':
      return 'Gölge hazır olduğunu fark edince irkiliyor, kapıya atılıp karanlığa kaçıyor. Kapı önünde bir şey düşürdü.';
    case 'FAINTED':
      return 'Arkandan bir el ağzını kapatıyor, başına bir darbe iniyor… Her şey kararıyor.';
    case 'DIED':
      return 'Bu kez darbe çok sert. Yere yığılıyorsun ve bir daha kalkamıyorsun.';
    case 'HID':
      return 'Nefesini tutup saklanıyorsun. Bir süre sonra ayak sesleri uzaklaşıyor.';
    case 'LEFT_QUIETLY':
      return 'Uzun bir sessizlik. Biri arka kapıdan usulca çıkıp gidiyor.';
  }
}

const cap = (s: string) => s.charAt(0).toLocaleUpperCase('tr-TR') + s.slice(1);
