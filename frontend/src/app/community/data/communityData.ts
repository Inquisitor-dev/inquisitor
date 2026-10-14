export interface SuspectEntry {
  id: string;
  name: string;
  role: string;
  isCulprit: boolean;
  motiveOrSecret: string;
  interrogationDemeanor: string;
}

export interface ScenarioForm {
  title: string;
  scenarioType: 'medieval' | 'modern' | 'cyberpunk' | 'china' | 'winter';
  difficulty: 'easy' | 'medium' | 'hard';
  authorName: string;
  prologueHook: string;
  crimeLocation: string;
  crimeStyle: 'HURRIED' | 'ORGANIZED';
  victimDescription: string;
  crimeSceneClue: string;
  redHerringClue: string;
  hiddenLocationClue: string;
  truthReveal: string;
  suspects: SuspectEntry[];
}

export const SCENARIO_LABELS: Record<ScenarioForm['scenarioType'], string> = {
  medieval: 'Ashenmoor — Karanlık Ortaçağ',
  modern: "Oakhaven — 90'lar Amerikan Kasabası",
  cyberpunk: 'Neon Prime — Distopik Cyberpunk',
  china: 'Jinling — Antik Doğu / Feodal Çin',
  winter: 'Frosthold — Kutup / Kar Fırtınası',
};

export const DIFFICULTY_LABELS: Record<ScenarioForm['difficulty'], string> = {
  easy: 'Kolay',
  medium: 'Orta',
  hard: 'Zor',
};

export const DEFAULT_SUSPECTS: SuspectEntry[] = [
  {
    id: 'suspect-1',
    name: 'Peder Thomas',
    role: 'Köy Rahibi',
    isCulprit: true,
    motiveOrSecret: 'Kilisenin kutsal emanetlerini kaçakçılara satıyordu. Kurban bunu fark edip ona şantaj yapmaya kalkıştı.',
    interrogationDemeanor: 'Aşırı dindar konuşmaların ardına saklanır, suçlandığında Tanrı’nın gazabını hatırlatır.',
  },
  {
    id: 'suspect-2',
    name: 'Demirci Roderick',
    role: 'Demir Ustası',
    isCulprit: false,
    motiveOrSecret: 'Cinayet gecesi gizlice kaçak silah dövüyordu. Bu yüzden o gece dışarıda görüldü, ama cinayetle bir ilgisi yok.',
    interrogationDemeanor: 'Öfkeli ve gergindir, Engizisyon’dan nefret ettiğini saklamaz.',
  },
  {
    id: 'suspect-3',
    name: 'Ebe Maeve',
    role: 'Şifacı ve Otacı',
    isCulprit: false,
    motiveOrSecret: 'Kurbana gizlice uyku getiren zehirli otlar satmıştı ama onu öldürmek gibi bir niyeti yoktu. Cadılıkla suçlanmaktan korkuyor.',
    interrogationDemeanor: 'Titrek ve tedirgindir, sürekli ellerini ovuşturur.',
  },
  {
    id: 'suspect-4',
    name: 'Meyhaneci Barnaby',
    role: 'Han Sahibi',
    isCulprit: false,
    motiveOrSecret: 'Kurbandan yüklü bir kumar alacağı vardı. Cinayet saatinde sarhoş bir müşterisini soyuyordu.',
    interrogationDemeanor: 'Sürekli konuyu değiştirir ve başkalarını kötülemeye çalışır.',
  },
];

export const INITIAL_FORM: ScenarioForm = {
  title: '',
  scenarioType: 'medieval',
  difficulty: 'easy',
  authorName: '',
  prologueHook: '',
  crimeLocation: 'Eski Manastır Bahçesi',
  crimeStyle: 'HURRIED',
  victimDescription: '',
  crimeSceneClue: '',
  redHerringClue: '',
  hiddenLocationClue: '',
  truthReveal: '',
  suspects: DEFAULT_SUSPECTS,
};

export const SAMPLE_SCENARIO: ScenarioForm = {
  title: 'Kutsal Emanetin Laneti',
  scenarioType: 'medieval',
  difficulty: 'easy',
  authorName: 'Engizitör Julian',
  prologueHook: 'Kuzeyin soğuk sisi Ashenmoor’un üzerine çöktüğünde manastırın çanları vakitsiz bir matemle çaldı. Eski kilise avlusunda, göğsüne antik bir haç saplanmış bir ceset karların üzerinde yatıyordu.',
  crimeLocation: 'Eski Manastır Bahçesi',
  crimeStyle: 'HURRIED',
  victimDescription: 'Köyün eski muhafızı ve tefecisi. Üzerinde boğuşma izleri ve yırtık, siyah bir cübbe parçası var.',
  crimeSceneClue: 'Kurbanın tırnaklarının arasına sıkışmış kırmızı mum damlaları ve altın yaldızlı bir cübbe ipliği.',
  redHerringClue: 'Çalılıklara fırlatılmış, Demirci Roderick’in damgasını taşıyan paslı bir hançer kını.',
  hiddenLocationClue: 'Şifacının kulübesindeki rafta, yarısı boşaltılmış bir baldıran zehri şişesi.',
  truthReveal: 'Cinayeti Peder Thomas işledi. Kutsal emanetleri satarak kazandığı parayı kurbana borç faizi olarak kaptırmıştı; tehdit edilince paniğe kapıldı ve kurbanı manastır bahçesinde öldürdü. Demirci masumdur: atölyesinden çalınan kın, şüpheyi ona çekmek için olay yerine bilerek bırakıldı.',
  suspects: DEFAULT_SUSPECTS,
};
