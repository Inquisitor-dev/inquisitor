import { ScenarioType } from './scenario-config';

export interface ClueDefinition {
  id: string;
  clueText: string;
  associatedNpcIds: string[];
}

export const SCENARIO_CLUES: Record<ScenarioType, ClueDefinition[]> = {
  medieval: [
    {
      id: 'camurlu_cizme_izi',
      clueText: 'Yerde çamurlu, şekli bozulmuş kaba bir çizme izi.',
      associatedNpcIds: ['graveyard', 'mill', 'farm', 'tavern'],
    },
    {
      id: 'murekkep_lekesi',
      clueText: 'Yerde kurumuş birkaç damla siyah mürekkep lekesi.',
      associatedNpcIds: ['church', 'clinic', 'mill'],
    },
    {
      id: 'kuvvetli_bitki_kokusu',
      clueText: 'Olay yerinde burna çalınan kuvvetli, ezilmiş yaban otları ve keskin bir bitki kokusu.',
      associatedNpcIds: ['tavern', 'church', 'graveyard', 'clinic'],
    },
    {
      id: 'kalin_is_eldiveni_yirtigi',
      clueText: 'Kurbana yakın bir yerde, kalın deriden kopmuş, yağ bağlamış ufak bir parça.',
      associatedNpcIds: ['graveyard', 'mill', 'farm', 'tavern'],
    },
    {
      id: 'kan_veya_hayvan_lekesi',
      clueText: 'Yerdeki cinayet kanına karışmış, çok daha önceden kurumuş hayvan veya et lekesi taşıyan ufak bir çaput.',
      associatedNpcIds: ['graveyard', 'farm', 'clinic', 'tavern'],
    },
    {
      id: 'pazarlik_sikkesi',
      clueText: 'Cesedin altında yuvarlanmış, üstünde tuhaf diş izleri olan aşınmış bir bakır sikke.',
      associatedNpcIds: ['tavern', 'mill', 'clinic'],
    },
    {
      id: 'mum_lekesi',
      clueText: 'Yere damlamış, karanlıkta çalışan birine ait olduğu belli olan eritilmiş sarı mum damlaları.',
      associatedNpcIds: ['church', 'clinic', 'graveyard'],
    },
    {
      // Bilgi bütçesi: Orta zorlukta suçlu kilise olduğunda da 4 kişiyi gösteren bir iz olsun
      id: 'ic_yagi_mesale',
      clueText: 'Taşların üzerinde sönmüş bir meşale sapı ve etrafa damlamış, donmuş iç yağı kalıntısı.',
      associatedNpcIds: ['church', 'tavern', 'graveyard', 'farm'],
    },
  ],
  modern: [
    {
      id: 'sigara_izmariti',
      clueText: 'Yerde ezilmiş, yarısına kadar içilmiş ucuz marka bir sigara izmariti.',
      associatedNpcIds: ['tavern', 'graveyard', 'farm', 'clinic'],
    },
    {
      id: 'kahve_lekesi',
      clueText: 'Yerdeki tozun üzerine sıçramış, karton bardaktan döküldüğü anlaşılan kurumuş kahve lekeleri.',
      associatedNpcIds: ['tavern', 'church', 'mill', 'farm'],
    },
    {
      id: 'motor_yagi_lekesi',
      clueText: 'Kurbanın ceketine sürtülmüş, zift gibi koyu ve ağır kokan bir motor yağı lekesi.',
      associatedNpcIds: ['graveyard', 'mill', 'farm', 'clinic'],
    },
    {
      id: 'seker_ambalaji',
      clueText: 'Yerde buruşturulup atılmış, kasaba bakkalında satılan ucuz bir şekerleme ambalajı.',
      associatedNpcIds: ['graveyard', 'mill', 'farm'],
    },
    {
      id: 'kedi_kopek_tuyu',
      clueText: 'Kurbanın parmaklarına takılmış, kısa ve sert hayvan tüyleri.',
      associatedNpcIds: ['tavern', 'graveyard', 'clinic'],
    },
    {
      id: 'ucuz_parfum',
      clueText: 'Odaya sinmiş, ter kokusunu bastırmak için bolca sıkılmış ucuz, geniz yakan bir kolonya/parfüm kokusu.',
      associatedNpcIds: ['church', 'mill', 'clinic'],
    },
    {
      // Bilgi bütçesi: Kolay ve Orta zorlukta suçlu kaset dükkânı olduğunda da hedefe uyan bir iz olsun
      id: 'kaset_seridi',
      clueText: 'Kurbanın ayakkabısına dolanmış, kopmuş parlak siyah bir kaset şeridi parçası.',
      associatedNpcIds: ['graveyard', 'tavern', 'mill', 'farm'],
    },
  ],
  cyberpunk: [
    {
      id: 'yanik_kablo',
      clueText: 'Yerde parçalanmış, ucu kararmış ufak bir bakır kablo yığını.',
      associatedNpcIds: ['church', 'graveyard', 'mill', 'farm'],
    },
    {
      id: 'ucuz_neon_tozu',
      clueText: 'Kurbanın kıyafetine bulaşmış, alt sokaklarda satılan parlamaya devam eden sentetik neon tozu.',
      associatedNpcIds: ['tavern', 'church', 'graveyard', 'clinic'],
    },
    {
      id: 'sentetik_yag',
      clueText: 'Yere damlamış, mavi renkte parlayan birkaç damla sentetik eklem yağı.',
      associatedNpcIds: ['tavern', 'graveyard', 'mill', 'clinic'],
    },
    {
      id: 'enerji_icecegi_kapagi',
      clueText: 'Köşede yuvarlanmış, şehirde çok tüketilen bir uyarıcı sıvının paslı metal kapağı.',
      associatedNpcIds: ['tavern', 'church', 'farm', 'clinic'],
    },
    {
      id: 'kimyasal_yanik_izi',
      clueText: 'Olay yerinde bırakılmış ayak izinin kenarında asidik, yeri eritmiş küçük bir kimyasal kalıntısı.',
      associatedNpcIds: ['tavern', 'church', 'graveyard', 'clinic'],
    },
    {
      id: 'kacak_veri_cipi',
      clueText: 'Yerde ezilmiş, içindeki hafıza birimi çoktan yanmış isimsiz bir veri diski parçası.',
      associatedNpcIds: ['church', 'graveyard', 'mill', 'farm'],
    },
    {
      // Bilgi bütçesi: Orta zorlukta suçlu karakol olduğunda da 4 kişiyi gösteren bir iz olsun
      id: 'muhur_bandi',
      clueText: 'Olay yerinin kenarına sürüklenmiş, üzerinde yarım kalmış bir barkod olan parlak bir mühür bandı parçası.',
      associatedNpcIds: ['tavern', 'graveyard', 'mill', 'farm'],
    },
  ],
};
