import type { CaseFacts } from '../scenarios/case-setup';
import type { StoryIssueCategory, StoryReviewInput } from './story-review';

// Hikâye hakeminin deneme seti: kurallara uyan temiz bir vaka ve ondan tek bir hatayla bozulmuş
// kopyalar. Hatalar ekip testlerinde görülen gerçek kaymaların aynısı. Birim testleri kod
// kontrolünü, hakem denemesi (stories:review) yapay zekâ hakemini bu setle ölçer: temiz vakada
// bulgu olmamalı, her bozuk vakada beklenen kategoride bir bulgu çıkmalı.

const facts: CaseFacts = {
  version: 1,
  culpritId: 'mill',
  innocentIds: ['tavern', 'church', 'graveyard'],
  murderStyle: 'HURRIED',
  sceneState: 'MESSY',
  crimeSceneId: 'bridge',
  crimeSceneClue: {
    authentic: true,
    poolClueId: 'camurlu_cizme_izi',
    poolClueText: 'Yerde çamurlu, şekli bozulmuş kaba bir çizme izi.',
    implicatedNpcIds: ['tavern', 'graveyard', 'mill'],
    eliminatedNpcIds: ['church'],
  },
  verification: {
    kind: 'CORROBORATION',
    placement: { type: 'TESTIMONY', npcId: 'church' },
    witnessDescriptionFits: ['mill', 'graveyard'],
  },
  weaponId: 'sickle',
  motive: 'DEBT',
  timeOfDeath: 'MIDNIGHT',
  involvements: [
    { npcId: 'tavern', kind: 'UNWITTING_HELP', aboutNpcId: 'mill' },
    { npcId: 'church', kind: 'LAST_CONVERSATION', aboutNpcId: 'mill' },
    { npcId: 'graveyard', kind: 'NONE', aboutNpcId: 'church' },
  ],
  fearThresholds: { tavern: 7, church: 8, graveyard: 6, mill: 7 },
  crimeSceneClueText:
    'Taş Köprü’nün korkuluğunun dibindeki çamurda şekli bozulmuş kaba bir çizme izi var.',
  verificationText:
    'Peder Malachar gece yarısı çan kulesinin penceresinden, Taş Köprü’nün üstünde sırtında çuval taşıyan iri yarı birini gördü; yüzünü seçemedi.',
  victim: { name: 'Marta Vell', profession: 'Tefeci' },
  alibis: {
    tavern:
      'Kardeş Aldric gece yarısı hanın kilerinde, sakladığı kaçak şarap fıçılarını sayıyordu.',
    church:
      'Peder Malachar gece yarısı kilisede İhtiyar Silas’la birlikte ölüler için mum yakıyordu.',
    graveyard:
      'İhtiyar Silas gece yarısı kilisede Peder Malachar’la birlikte ölüler için mum yakıyordu.',
  },
  witnessDescription: 'sırtında çuval taşıyan iri yarı biri',
};

export const CLEAN_REVIEW_CASE: StoryReviewInput = {
  scenarioType: 'medieval',
  facts,
  scenario:
    'Ashenmoor’u sis yuttuğu gece, köyün borç defterini tutan kadın evine dönmedi. Sabah Taş Köprü’nün üstünde, örtülmüş bir bedenin başında toplanan köylüler birbirinin yüzüne bakamıyor.',
  truthReveal:
    'Değirmenci Giles, tefeci Marta Vell’e olan borcunu ödeyemeyeceğini anlayınca onu gece yarısı Taş Köprü’de buldu. Tartışma büyüdü; Giles, o akşam Kardeş Aldric’ten ödünç aldığı orakla Marta’nın boğazını kesti. Boğuşmada eşyalar dağıldı, Giles korkuluğun dibindeki çamura bastı ve kaba çizmesinin izi orada kaldı. Aldric orağın ne için istendiğini hiç sormamıştı; o saatte hanın kilerinde kaçak şarap fıçılarını sayıyordu. Peder Malachar ile İhtiyar Silas kilisede ölüler için mum yakıyordu; Malachar çan kulesinin penceresinden köprüde çuval taşıyan iri bir gölge gördü ama yüzünü seçemedi. Giles, ödenmemiş senedi un çuvallarının arasına sakladı.',
  npcPrompts: {
    mill: 'Sen Değirmenci Giles’sın. Marta Vell’e borcun vardı; onu gece yarısı Taş Köprü’de, Kardeş Aldric’ten ödünç aldığın orakla öldürdün. Gece değirmende un çuvallarını istiflediğini söylersin. Borcunu inkâr edersin.',
    tavern:
      'Sen Kardeş Aldric’sin, hancısın. O akşam Değirmenci Giles orağını ödünç istedi, sen de ne için istediğini sormadan verdin. Kilerdeki kaçak şarap işin ortaya çıkmasın diye bunu saklıyorsun. Gece yarısı kilerde kaçak fıçıları sayıyordun.',
    church:
      'Sen Peder Malachar’sın. Gece yarısı İhtiyar Silas’la kilisede ölüler için mum yakıyordun. Çan kulesinin penceresinden köprünün üstünde sırtında çuval taşıyan iri yarı birini gördün ama yüzünü seçemedin. Olay yerindeki iz ya da o gece sorulursa bunu anlatırsın. Marta seninle son konuştuğunda ödenmeyen bir borçtan ve borçlusunun ona öfkelenmesinden endişeliydi.',
    graveyard:
      'Sen İhtiyar Silas’sın. Saklayacak bir şeyin yok. Gece yarısı Peder Malachar’la kilisede ölüler için mum yakıyordun ve bunu açıkça söylersin.',
  },
  locationClues: {
    crime_scene:
      'Taş Köprü’nün korkuluğu boyunca devrilmiş bir fener ve dağılmış eşyalar var; korkuluğun dibindeki çamurda şekli bozulmuş kaba bir çizme izi duruyor.',
    tavern:
      'Hanın kilerinde, duvardaki kancada bir orağın asılı durduğu yer boş; yanında “ödünç verildi” diye karalanmış bir not var.',
    church:
      'Kilisenin mihrabında gece yarısı yakılmış mumların eriyen izleri ve yan yana iki minder duruyor.',
    graveyard:
      'Mezarcı kulübesindeki deftere “Gece yarısı, Peder’le kilisede mum” diye bir not düşülmüş.',
    mill: 'Değirmenin un ambarında, çuvalların arasına saklanmış, Marta Vell’in mührünü taşıyan ödenmemiş bir borç senedi duruyor.',
  },
};

export interface ReviewFixture {
  id: string;
  description: string;
  // Kabul edilen bulgu kategorileri (biri yeter); temiz vakada boş: hiç bulgu çıkmamalı
  expect: StoryIssueCategory[];
  // Bulgunun hangi alanda çıkması beklenir
  field?: string;
  // Hatayı kod kontrolü de yakalar (yapay zekâ gerekmez)
  codeOnly?: boolean;
  input: StoryReviewInput;
}

// Vakanın (varsayılan: temiz vaka) bir metninde tek bir yeri değiştirir; aranan metin yoksa hata
// verir (set bozulmasın)
function mutate(
  field: string,
  from: string,
  to: string,
  base: StoryReviewInput = CLEAN_REVIEW_CASE,
): StoryReviewInput {
  const [group, id] = field.split('.');
  const copy: StoryReviewInput = JSON.parse(
    JSON.stringify(base),
  ) as StoryReviewInput;
  const replace = (text: string) => {
    if (!text.includes(from))
      throw new Error(`review-fixtures: "${from}" ${field} içinde yok`);
    return text.replace(from, to);
  };
  if (group === 'npcPrompts')
    copy.npcPrompts[id] = replace(copy.npcPrompts[id]);
  else if (group === 'locationClues')
    copy.locationClues[id] = replace(copy.locationClues[id]);
  else if (group === 'alibis')
    copy.facts.alibis[id] = replace(copy.facts.alibis[id]);
  else if (group === 'truthReveal')
    copy.truthReveal = replace(copy.truthReveal);
  else throw new Error(`review-fixtures: bilinmeyen alan ${field}`);
  return copy;
}

// Kısmi tanıklı temiz vaka: İhtiyar Silas cinayet saatinde Aldric'i mazeretindeki yerde (hanın
// kilerinde) görür. Gördüğü yerin mazeretle uyuşması bu vakayla ölçülür.
const partialWitnessCase = (() => {
  const copy = mutate(
    'npcPrompts.graveyard',
    've bunu açıkça söylersin.',
    've bunu açıkça söylersin. Mum yakarken kilisenin penceresinden, hanın kiler kapısında fenerle fıçı taşıyan Kardeş Aldric’i gördün.',
  );
  copy.facts.involvements = copy.facts.involvements?.map((inv) =>
    inv.npcId === 'graveyard'
      ? { ...inv, kind: 'WITNESS' as const, aboutNpcId: 'tavern' }
      : inv,
  );
  return copy;
})();

export const REVIEW_FIXTURES: ReviewFixture[] = [
  {
    id: 'clean',
    description: 'Temiz vaka: hiçbir bulgu çıkmamalı',
    expect: [],
    input: CLEAN_REVIEW_CASE,
  },
  {
    id: 'clean-cover-weapon',
    description:
      'Gerçek metni cesedin örtüsünü anıyor, silah hiçbir ipucunda geçmiyor: bulgu çıkmamalı (pilot: modern-zor, cyberpunk-orta)',
    expect: [],
    input: mutate(
      'locationClues.tavern',
      'bir orağın asılı durduğu yer boş',
      'bir aletin asılı durduğu yer boş',
      mutate(
        'truthReveal',
        'Giles, ödenmemiş senedi',
        'Sabah köylüler bedeni kaba bir keten örtüyle örttü. Giles, ödenmemiş senedi',
      ),
    ),
  },
  {
    id: 'clean-future-plan',
    description:
      'Mazerette sabah yapılacak bir iş geçiyor (ölüm saati değil): bulgu çıkmamalı (pilot: Çin-zor)',
    expect: [],
    input: mutate(
      'alibis.tavern',
      'sakladığı kaçak şarap fıçılarını',
      'sabah pazara götürülecek kaçak şarap fıçılarını',
    ),
  },
  {
    id: 'clean-partial-witness',
    description:
      'Kısmi tanık şüpheliyi mazeretindeki yerde görüyor: bulgu çıkmamalı',
    expect: [],
    input: partialWitnessCase,
  },
  {
    id: 'truth-partial-witness-place',
    description:
      'Kısmi tanık şüpheliyi mazeretindekinden başka bir yerde görüyor (pilot: cyberpunk-orta)',
    expect: ['TRUTH', 'LOGIC'],
    field: 'npcPrompts.graveyard',
    input: mutate(
      'npcPrompts.graveyard',
      'hanın kiler kapısında fenerle fıçı taşıyan',
      'mezarlığın arkasındaki patikada fenerle yürüyen',
      partialWitnessCase,
    ),
  },
  {
    id: 'truth-alibi-place',
    description:
      'Gerçek metni Aldric’i mazeretindeki yerden başka yere koyuyor',
    expect: ['TRUTH', 'LOGIC'],
    field: 'truthReveal',
    input: mutate(
      'truthReveal',
      'o saatte hanın kilerinde kaçak şarap fıçılarını sayıyordu',
      'o saatte ahırda hasta atına bakıyordu',
    ),
  },
  {
    id: 'truth-extra-item',
    description: 'Gerçek metni hiçbir ipucunda olmayan bir kanıt ekliyor',
    expect: ['TRUTH'],
    field: 'truthReveal',
    input: mutate(
      'truthReveal',
      'Giles, ödenmemiş senedi un çuvallarının arasına sakladı.',
      'Giles, kanlı eldivenlerini değirmen çarkının altına gömdü ve ödenmemiş senedi un çuvallarının arasına sakladı.',
    ),
  },
  {
    id: 'role-confess-instruction',
    description: 'Rol metni sıkıştırılınca itiraf etmesini söylüyor',
    expect: ['ROLE'],
    field: 'npcPrompts.graveyard',
    codeOnly: true,
    input: mutate(
      'npcPrompts.graveyard',
      've bunu açıkça söylersin.',
      've bunu açıkça söylersin. Sıkıştırılırsan ya da sana kanıt gösterilirse her şeyi itiraf edersin.',
    ),
  },
  {
    id: 'role-helper-unknown-buyer',
    description: 'Silahı bilmeden veren, kime verdiğini bilmiyor',
    expect: ['ROLE'],
    field: 'npcPrompts.tavern',
    input: mutate(
      'npcPrompts.tavern',
      'O akşam Değirmenci Giles orağını ödünç istedi, sen de ne için istediğini sormadan verdin.',
      'O akşam karanlıkta biri orağını ödünç istedi; yüzünü görmedin, kim olduğunu bilmiyorsun.',
    ),
  },
  {
    id: 'implicit-leak-witness',
    description: 'Tanığın tarifi yalnızca değirmenciye uyuyor',
    expect: ['IMPLICIT_LEAK'],
    field: 'npcPrompts.church',
    input: mutate(
      'npcPrompts.church',
      'sırtında çuval taşıyan iri yarı birini',
      'üstü başı un tozuna bulanmış, değirmenci önlüklü birini',
    ),
  },
  {
    id: 'language-english-word',
    description: 'Türkçe metinde İngilizce kelime',
    expect: ['LANGUAGE'],
    field: 'locationClues.crime_scene',
    input: mutate(
      'locationClues.crime_scene',
      'şekli bozulmuş kaba bir çizme izi',
      'planted gibi duran kaba bir çizme izi',
    ),
  },
  {
    id: 'language-internal-id',
    description: 'Metinde iç kimlik',
    expect: ['LANGUAGE'],
    field: 'npcPrompts.mill',
    codeOnly: true,
    input: mutate(
      'npcPrompts.mill',
      'Gece değirmende',
      'Gece ‘mill’ kimliğiyle bilinen değirmende',
    ),
  },
  {
    id: 'language-missing-diacritics',
    description: 'Türkçe karakterleri olmayan metin',
    expect: ['LANGUAGE'],
    field: 'npcPrompts.graveyard',
    codeOnly: true,
    input: mutate(
      'npcPrompts.graveyard',
      'Saklayacak bir şeyin yok.',
      'Saklayacak bir seyin yok, cunku hicbir sucun yok.',
    ),
  },
  {
    id: 'logic-wound-weapon',
    description: 'Gerçek metnindeki ölüm şekli silahla uyuşmuyor',
    expect: ['LOGIC', 'TRUTH'],
    field: 'truthReveal',
    input: mutate(
      'truthReveal',
      'orakla Marta’nın boğazını kesti',
      'orağı bir kenara atıp Marta’yı çıplak elleriyle boğdu',
    ),
  },
  {
    id: 'logic-time-of-death',
    description: 'Bir mazeret ölüm saatini kapsamıyor',
    expect: ['LOGIC', 'TRUTH'],
    field: 'alibis.tavern',
    input: mutate(
      'alibis.tavern',
      'Kardeş Aldric gece yarısı',
      'Kardeş Aldric öğle vakti',
    ),
  },
  {
    id: 'logic-alibi-other-night-time',
    description:
      'Bir mazeret gecenin başka bir saatini veriyor (pilot: Çin-zor, “gece yarısı tütsüleri”, ölüm akşam)',
    expect: ['LOGIC', 'TRUTH'],
    field: 'alibis.tavern',
    codeOnly: true,
    input: mutate(
      'alibis.tavern',
      'Kardeş Aldric gece yarısı',
      'Kardeş Aldric akşam yemeğinden hemen sonra, hava yeni kararmışken',
    ),
  },
];
