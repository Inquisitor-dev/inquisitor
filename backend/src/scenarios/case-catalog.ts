import type { ScenarioType } from './universes';

// Vaka Motoru v2: vakanın kodla seçilen, kimlikle (id) tutulan gerçekleri. Oyun sonu raporunda oyuncunun
// cevabı bu kimliklerle karşılaştırılıp puanlanır; o yüzden serbest metin değil, sabit kataloglardan seçilir.

// Yaranın türü: olay yerinde cesedin örtüsü kaldırılınca görülen şey. Silahı bulmanın ilk ipucu.
export type WeaponMethod = 'BLADE' | 'BLUNT' | 'POISON' | 'STRANGLE';

export const WEAPON_METHOD_LABELS: Record<WeaponMethod, string> = {
  BLADE: 'Kesici ya da delici bir aletle',
  BLUNT: 'Ağır, küt bir cisimle',
  POISON: 'Zehirlenerek',
  STRANGLE: 'Boğularak',
};

export interface WeaponDefinition {
  id: string;
  label: string;
  method: WeaponMethod;
  // Panik anında elde bulunabilecek bir şey mi (aceleyle işlenen cinayet), yoksa hazırlık mı ister (zehir gibi)?
  improvised: boolean;
}

export const WEAPONS: Record<ScenarioType, WeaponDefinition[]> = {
  medieval: [
    { id: 'dagger', label: 'Hançer', method: 'BLADE', improvised: true },
    { id: 'sickle', label: 'Orak', method: 'BLADE', improvised: true },
    {
      id: 'candlestick',
      label: 'Pirinç şamdan',
      method: 'BLUNT',
      improvised: true,
    },
    {
      id: 'hammer',
      label: 'Demirci çekici',
      method: 'BLUNT',
      improvised: true,
    },
    {
      id: 'hemlock',
      label: 'Baldıran zehri',
      method: 'POISON',
      improvised: false,
    },
    { id: 'rope', label: 'Kendir urgan', method: 'STRANGLE', improvised: true },
  ],
  modern: [
    {
      id: 'kitchen_knife',
      label: 'Mutfak bıçağı',
      method: 'BLADE',
      improvised: true,
    },
    {
      id: 'baseball_bat',
      label: 'Beyzbol sopası',
      method: 'BLUNT',
      improvised: true,
    },
    {
      id: 'tire_iron',
      label: 'Bijon anahtarı',
      method: 'BLUNT',
      improvised: true,
    },
    {
      id: 'rat_poison',
      label: 'Fare zehri',
      method: 'POISON',
      improvised: false,
    },
    {
      id: 'extension_cord',
      label: 'Uzatma kablosu',
      method: 'STRANGLE',
      improvised: true,
    },
  ],
  cyberpunk: [
    { id: 'monoblade', label: 'Monoblade', method: 'BLADE', improvised: true },
    {
      id: 'torque_wrench',
      label: 'Tork anahtarı',
      method: 'BLUNT',
      improvised: true,
    },
    { id: 'shock_baton', label: 'Şok copu', method: 'BLUNT', improvised: true },
    {
      id: 'neurotoxin',
      label: 'Nörotoksin enjektörü',
      method: 'POISON',
      improvised: false,
    },
    {
      id: 'fiber_cable',
      label: 'Fiber optik kablo',
      method: 'STRANGLE',
      improvised: true,
    },
  ],
  china: [
    {
      id: 'short_sword',
      label: 'Kısa kılıç',
      method: 'BLADE',
      improvised: true,
    },
    {
      id: 'bamboo_staff',
      label: 'Bambu sopa',
      method: 'BLUNT',
      improvised: true,
    },
    {
      id: 'scale_weight',
      label: 'Bronz terazi ağırlığı',
      method: 'BLUNT',
      improvised: true,
    },
    { id: 'arsenic', label: 'Arsenik', method: 'POISON', improvised: false },
    {
      id: 'silk_sash',
      label: 'İpek kuşak',
      method: 'STRANGLE',
      improvised: true,
    },
  ],
  winter: [
    {
      id: 'hunting_knife',
      label: 'Av bıçağı',
      method: 'BLADE',
      improvised: true,
    },
    { id: 'ice_pick', label: 'Buz kazması', method: 'BLADE', improvised: true },
    {
      id: 'axe_handle',
      label: 'Balta sapı',
      method: 'BLUNT',
      improvised: true,
    },
    {
      id: 'wolfsbane',
      label: 'Kurtboğan zehri',
      method: 'POISON',
      improvised: false,
    },
    {
      id: 'leather_strap',
      label: 'Deri kayış',
      method: 'STRANGLE',
      improvised: true,
    },
  ],
};

export type MotiveId =
  | 'DEBT'
  | 'JEALOUSY'
  | 'REVENGE'
  | 'SILENCE'
  | 'GREED'
  | 'FEAR';

export const MOTIVE_LABELS: Record<MotiveId, string> = {
  DEBT: 'Borç',
  JEALOUSY: 'Kıskançlık',
  REVENGE: 'İntikam',
  SILENCE: 'Susturmak: kurban onun bir sırrını biliyordu',
  GREED: 'Açgözlülük: kurbanın malı ya da mirası',
  FEAR: 'Korku: kurban onu tehdit ediyordu',
};

export const MOTIVES = Object.keys(MOTIVE_LABELS) as MotiveId[];

// Ölüm saati: masumların mazeretleri bu zaman dilimini kapsamalıdır
export type TimeOfDeath = 'EVENING' | 'MIDNIGHT' | 'BEFORE_DAWN';

export const TIME_OF_DEATH_LABELS: Record<TimeOfDeath, string> = {
  EVENING: 'Akşam, hava karardıktan sonra',
  MIDNIGHT: 'Gece yarısı civarı',
  BEFORE_DAWN: 'Şafaktan önce',
};

export const TIMES_OF_DEATH = Object.keys(
  TIME_OF_DEATH_LABELS,
) as TimeOfDeath[];

// Masumun cinayetle bağı. Sırlar artık cinayetten kopuk değil: her biri soruşturmaya bir parça ekler.
// NONE: tamamen masum; cinayetle hiçbir bağı yok, yalnızca sıradan bir mazereti var.
export type InvolvementKind =
  | 'WITNESS' // tanık: cinayet gecesi bir şey gördü
  | 'SHARED_MOTIVE' // motif: kurbanın ölmesini isteyecek bir nedeni vardı, mazereti onu kurtarır
  | 'UNWITTING_HELP' // bilmeden yardım: katile silahı ya da kurbanın yerini farkında olmadan verdi
  | 'SCAVENGER' // leş kargası: cesedi bulup üzerinden bir şey aldı ve sustu
  | 'LAST_CONVERSATION' // son konuşma: kurbanla son konuşan oydu, kurbanın korktuğu şeyi biliyor
  | 'NONE';

export const INVOLVEMENT_LABELS: Record<InvolvementKind, string> = {
  WITNESS: 'Tanık',
  SHARED_MOTIVE: 'Kendi motifi var',
  UNWITTING_HELP: 'Bilmeden yardım etti',
  SCAVENGER: 'Cesetten bir şey aldı',
  LAST_CONVERSATION: 'Kurbanla son konuşan',
  NONE: 'Tamamen masum',
};

// Kişiliğe göre korku eşiği: soğukkanlı biri daha geç, kırılgan biri daha erken çözülür
export type Temperament = 'STEADY' | 'NORMAL' | 'FRAGILE';

export const TEMPERAMENT_THRESHOLD: Record<Temperament, number> = {
  STEADY: 8,
  NORMAL: 7,
  FRAGILE: 6,
};

export const DEFAULT_FEAR_THRESHOLD = TEMPERAMENT_THRESHOLD.NORMAL;
