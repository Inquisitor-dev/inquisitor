'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Bug,
  Check,
  Circle,
  Eye,
  Feather,
  Heart,
  Lightbulb,
  MessageSquare,
  Plus,
  RotateCcw,
  Save,
  Scale,
  ScrollText,
  Skull,
  Sparkles,
  TriangleAlert,
  X,
} from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { getAvatarSrc } from '@/config/avatars';
import styles from './page.module.scss';

interface SuspectEntry {
  id: string;
  name: string;
  role: string;
  isCulprit: boolean;
  motiveOrSecret: string;
  interrogationDemeanor: string;
}

interface ScenarioForm {
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

const SCENARIO_LABELS: Record<ScenarioForm['scenarioType'], string> = {
  medieval: 'Ashenmoor — Karanlık Ortaçağ',
  modern: "Oakhaven — 90'lar Amerikan Kasabası",
  cyberpunk: 'Neon Prime — Distopik Cyberpunk',
  china: 'Jinling — Antik Doğu / Feodal Çin',
  winter: 'Frosthold — Kutup / Kar Fırtınası',
};

const DIFFICULTY_LABELS: Record<ScenarioForm['difficulty'], string> = {
  easy: 'Kolay',
  medium: 'Orta',
  hard: 'Zor',
};

const DEFAULT_SUSPECTS: SuspectEntry[] = [
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

const INITIAL_FORM: ScenarioForm = {
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

const SAMPLE_SCENARIO: ScenarioForm = {
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

export default function CommunityPage() {
  const router = useRouter();
  const { userEmail, username, avatar, isAdmin } = useGameStore();

  const [activeTab, setActiveTab] = useState<'story' | 'feedback' | 'rules'>('story');
  const [form, setForm] = useState<ScenarioForm>(INITIAL_FORM);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Geri bildirim formu
  const [feedbackCategory, setFeedbackCategory] = useState<'bug' | 'feature' | 'balance' | 'complaint' | 'appreciation'>('bug');
  const [feedbackSubject, setFeedbackSubject] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackContact, setFeedbackContact] = useState(userEmail || '');
  const [includeSystemSpecs, setIncludeSystemSpecs] = useState(true);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Giriş yapılmışsa yazar adını kullanıcı adından / e-postadan doldur (ad değişince bir kez)
  const preferredName = username || (userEmail ? userEmail.split('@')[0] : '');
  const [prefilledName, setPrefilledName] = useState('');
  if (preferredName && preferredName !== prefilledName) {
    setPrefilledName(preferredName);
    if (!form.authorName) setForm((prev) => ({ ...prev, authorName: preferredName }));
  }

  // Açılışta tarayıcıdaki taslağı yükle
  useEffect(() => {
    try {
      const saved = localStorage.getItem('inquisitor_community_story_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.title || parsed.prologueHook) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- taslak localStorage'da; sunucu render'ıyla uyuşsun diye mount sonrası okunur
          setForm(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const triggerToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 3500);
  };

  const handleSaveDraft = () => {
    try {
      localStorage.setItem('inquisitor_community_story_draft', JSON.stringify(form));
      triggerToast('Taslağın bu tarayıcıya kaydedildi.');
    } catch {
      triggerToast('Taslak kaydedilirken bir hata oluştu.');
    }
  };

  const handleLoadSample = () => {
    setForm(SAMPLE_SCENARIO);
    triggerToast('Örnek vaka şablonu yüklendi.');
  };

  const handleClearDraft = () => {
    if (confirm('Taslağı sıfırlamak istediğine emin misin? Yazdıkların silinecek.')) {
      setForm(INITIAL_FORM);
      localStorage.removeItem('inquisitor_community_story_draft');
      triggerToast('Taslak sıfırlandı.');
    }
  };

  const handleSuspectChange = (index: number, field: keyof SuspectEntry, value: string | boolean) => {
    const updated = [...form.suspects];
    if (field === 'isCulprit' && value === true) {
      // Sadece 1 suçlu olabilir
      updated.forEach((s, i) => {
        s.isCulprit = i === index;
      });
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setForm((prev) => ({ ...prev, suspects: updated }));
  };

  const addSuspect = () => {
    if (form.suspects.length >= 6) {
      triggerToast('En fazla 6 şüpheli ekleyebilirsin.');
      return;
    }
    const newSuspect: SuspectEntry = {
      id: `suspect-${Date.now()}`,
      name: '',
      role: '',
      isCulprit: false,
      motiveOrSecret: '',
      interrogationDemeanor: '',
    };
    setForm((prev) => ({ ...prev, suspects: [...prev.suspects, newSuspect] }));
  };

  const removeSuspect = (index: number) => {
    if (form.suspects.length <= 3) {
      triggerToast('Vakada en az 3 şüpheli bulunmalı.');
      return;
    }
    const updated = form.suspects.filter((_, i) => i !== index);
    // Eğer silinen şüpheli suçluysa ilk kişiyi suçlu yap
    if (!updated.some((s) => s.isCulprit)) {
      updated[0].isCulprit = true;
    }
    setForm((prev) => ({ ...prev, suspects: updated }));
  };

  const handleStorySubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) {
      triggerToast('Vakana bir başlık ver.');
      return;
    }
    if (!form.prologueHook.trim() || form.prologueHook.length < 30) {
      triggerToast('Giriş anlatısı en az 30 karakter olmalı.');
      return;
    }
    if (!form.truthReveal.trim() || form.truthReveal.length < 40) {
      triggerToast('Hakikat bölümü vakanın çözümünü ayrıntılı anlatmalı (en az 40 karakter).');
      return;
    }
    if (!form.suspects.some((s) => s.isCulprit)) {
      triggerToast('Vakada bir katil seçmelisin.');
      return;
    }

    setIsSubmitting(true);

    // Gönderim şimdilik taklit ediliyor; backend bağlanınca burası API çağrısı olacak
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccessModal(true);
    }, 1200);
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackSubject.trim() || !feedbackMessage.trim()) {
      triggerToast('Konu ve mesaj alanlarını doldur.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setFeedbackSubmitted(true);
      setFeedbackSubject('');
      setFeedbackMessage('');
    }, 1000);
  };

  // Dosya durumu paneli: gönderim kurallarını ve zorunlu alanları gösterir, yeni bir kural eklemez
  const suspectsComplete = form.suspects.every(
    (s) => s.name.trim() && s.role.trim() && s.motiveOrSecret.trim() && s.interrogationDemeanor.trim(),
  );
  const checklist = [
    { label: 'Vaka başlığı', done: !!form.title.trim() },
    { label: 'Giriş anlatısı (30+ karakter)', done: form.prologueHook.trim().length >= 30 },
    { label: 'Olay yeri ve kurban', done: !!form.crimeLocation.trim() && !!form.victimDescription.trim() },
    { label: `Şüpheliler (${form.suspects.length}/6)`, done: suspectsComplete },
    { label: 'Katil seçildi', done: form.suspects.some((s) => s.isCulprit) },
    {
      label: 'Üç ipucu',
      done: !!form.crimeSceneClue.trim() && !!form.redHerringClue.trim() && !!form.hiddenLocationClue.trim(),
    },
    { label: 'Hakikat (40+ karakter)', done: form.truthReveal.trim().length >= 40 },
  ];
  const doneCount = checklist.filter((item) => item.done).length;

  const FEEDBACK_CATEGORIES = [
    { id: 'bug' as const, icon: Bug, title: 'Hata veya Teknik Sorun', desc: 'Arayüz, ses veya sunucu hataları' },
    { id: 'feature' as const, icon: Lightbulb, title: 'Fikir ve Öneri', desc: 'Yeni özellikler ve mekanikler' },
    { id: 'balance' as const, icon: Scale, title: 'Yapay Zekâ Dengesi', desc: 'NPC cevapları ve tutarlılık' },
    { id: 'complaint' as const, icon: TriangleAlert, title: 'Şikâyet ve İtiraz', desc: 'Oynanış, kota veya hesap' },
    { id: 'appreciation' as const, icon: Heart, title: 'Genel Mesaj ve Teşekkür', desc: 'Düşüncelerini yapımcılarla paylaş' },
  ];

  const RULES = [
    {
      title: 'Çözülebilirlik ve Mantık Zinciri',
      text: 'Katil, oyuncunun şans eseri tahmin edeceği biri olmamalı. Olay yeri incelemesi, arama izinleri ve sorgulardaki çelişkiler bir araya geldiğinde tek bir mantıklı sonuca varmalı.',
    },
    {
      title: 'Masumların Sırları',
      text: 'Masum şüpheliler düz ve sıkıcı olmamalı. Her birinin kendi utancı, hırsızlığı ya da sakladığı bir sırrı olmalı ki oyuncu sorgu sırasında onlardan da şüphelensin.',
    },
    {
      title: 'Edebi Dil ve Atmosfer',
      text: 'Oyunun karanlık, gotik ve psikolojik gerilim tonu korunmalı. Kaba mizah, sokak ağzı ya da atmosferi bozan göndermeler içeren vakalar onaylanmaz.',
    },
    {
      title: 'Hakikatin Tutarlılığı',
      text: 'Soruşturmanın sonunda gösterilen hakikat metni, hikâyedeki tüm kanıtları ve karakterlerin neden yalan söylediğini açıkça aydınlatmalı.',
    },
  ];

  return (
    <main className={styles.container}>
      <div className={styles.vignette} />
      <span className={styles.cornerTopLeft} />
      <span className={styles.cornerTopRight} />
      <span className={styles.cornerBotLeft} />
      <span className={styles.cornerBotRight} />

      <div className={styles.inner}>
        <div className={styles.topNav}>
          <button onClick={() => router.push('/menu')} className={styles.backBtn}>
            <ArrowLeft size={16} /> Ana Menüye Dön
          </button>

          <div className={styles.userBadge} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img
              src={getAvatarSrc(avatar)}
              alt="Avatar"
              style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                border: '1px solid #daa520',
                objectFit: 'cover',
              }}
            />
            <span className={styles.userName}>{username || (userEmail ? userEmail.split('@')[0] : 'Misafir')}</span>
            {isAdmin && <span className={styles.adminBadge}>Konsey Yöneticisi</span>}
          </div>
        </div>

        <header className={styles.header}>
          <span className={styles.eyebrow} lang="la">Sanctum Scriptorium</span>
          <h1 className={styles.title}>Topluluk</h1>
          <div className={styles.divider}>
            <span className={styles.dividerLine} />
            <span className={styles.dividerIcon}>✠</span>
            <span className={styles.dividerLine} />
          </div>
          <p className={styles.lead}>
            Kendi cinayet vakanı kaleme al; Engizisyon Konseyi onayladığında herkes onu çözmeye çalışsın.
            Oyunla ilgili düşüncelerini de buradan yapımcılara iletebilirsin.
          </p>
        </header>

        <nav className={styles.tabs} aria-label="Topluluk bölümleri">
          <button
            className={`${styles.tab} ${activeTab === 'story' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('story')}
          >
            <Feather size={16} /> Vaka Yaz
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'feedback' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('feedback')}
          >
            <MessageSquare size={16} /> Geri Bildirim
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'rules' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('rules')}
          >
            <Scale size={16} /> Konsey Kuralları
          </button>
        </nav>

        {/* SEKME 1: VAKA YAZARI */}
        {activeTab === 'story' && (
          <div className={styles.storyLayout}>
            <form onSubmit={handleStorySubmit} className={styles.storyForm}>
              {/* BÖLÜM 1 */}
              <section className={styles.folio}>
                <header className={styles.folioHeader}>
                  <span className={styles.folioNumber}>I</span>
                  <div>
                    <h2 className={styles.folioTitle}>Vakanın Temeli</h2>
                    <p className={styles.folioDesc}>Başlık, evren, zorluk ve cinayetin nasıl işlendiği.</p>
                  </div>
                </header>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>
                    Vaka başlığı <em>*</em>
                    <span className={styles.hint}>Çarpıcı ve gotik</span>
                  </label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="Örn: Manastır Çanlarının Sessizliği"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.grid2}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Evren</label>
                    <select
                      className={styles.select}
                      value={form.scenarioType}
                      onChange={(e) => setForm({ ...form, scenarioType: e.target.value as ScenarioForm['scenarioType'] })}
                    >
                      <option value="medieval">{SCENARIO_LABELS.medieval}</option>
                      <option value="modern">{SCENARIO_LABELS.modern}</option>
                      <option value="cyberpunk">{SCENARIO_LABELS.cyberpunk}</option>
                      <option value="china">{SCENARIO_LABELS.china}</option>
                      <option value="winter">{SCENARIO_LABELS.winter}</option>
                    </select>
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Zorluk</label>
                    <select
                      className={styles.select}
                      value={form.difficulty}
                      onChange={(e) => setForm({ ...form, difficulty: e.target.value as ScenarioForm['difficulty'] })}
                    >
                      <option value="easy">Kolay — 4 şüpheli, sade bir ilişki ağı</option>
                      <option value="medium">Orta — 5 şüpheli, çapraz ittifaklar</option>
                      <option value="hard">Zor — 6 şüpheli, karmaşık bir komplo</option>
                    </select>
                  </div>
                </div>

                <div className={styles.grid2}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Yazar adı</label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="Örn: Engizitör Marcus"
                      value={form.authorName}
                      onChange={(e) => setForm({ ...form, authorName: e.target.value })}
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Cinayetin işleniş biçimi</label>
                    <select
                      className={styles.select}
                      value={form.crimeStyle}
                      onChange={(e) => setForm({ ...form, crimeStyle: e.target.value as ScenarioForm['crimeStyle'] })}
                    >
                      <option value="HURRIED">Telaşlı — boğuşma izleri ve gerçek bir fiziksel kanıt</option>
                      <option value="ORGANIZED">Planlı — temizlenmiş olay yeri ve yanıltıcı bir ipucu</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* BÖLÜM 2 */}
              <section className={styles.folio}>
                <header className={styles.folioHeader}>
                  <span className={styles.folioNumber}>II</span>
                  <div>
                    <h2 className={styles.folioTitle}>Olay Yeri ve Giriş</h2>
                    <p className={styles.folioDesc}>Oyuncunun vakaya ilk adım attığı an.</p>
                  </div>
                </header>

                <div className={styles.grid2}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>
                      Cinayetin işlendiği yer
                      <span className={styles.hint}>Oyunda keşfedilecek nokta</span>
                    </label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="Örn: Eski Manastır Bahçesi, Köy Meydanı, Değirmen..."
                      value={form.crimeLocation}
                      onChange={(e) => setForm({ ...form, crimeLocation: e.target.value })}
                      required
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>
                      Kurban ve cesedin durumu
                      <span className={styles.hint}>Kimliği gizemli kalabilir</span>
                    </label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="Örn: Pahalı bir cübbe giymiş yaşlı bir tüccar, boynunda morluklar var..."
                      value={form.victimDescription}
                      onChange={(e) => setForm({ ...form, victimDescription: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>
                    Giriş anlatısı <em>*</em>
                    <span className={styles.hint}>Oyuncunun vakaya başlarken okuduğu metin</span>
                  </label>
                  <textarea
                    className={`${styles.textarea} ${styles.tall}`}
                    placeholder="Kuzeyin soğuk rüzgârları köyü döverken at arabasından indin. Ashenmoor’un sakinleri seni korku dolu bakışlarla karşılıyor..."
                    value={form.prologueHook}
                    onChange={(e) => setForm({ ...form, prologueHook: e.target.value })}
                    required
                  />
                  <span className={styles.counter}>{form.prologueHook.length} karakter</span>
                </div>
              </section>

              {/* BÖLÜM 3 */}
              <section className={styles.folio}>
                <header className={styles.folioHeader}>
                  <span className={styles.folioNumber}>III</span>
                  <div>
                    <h2 className={styles.folioTitle}>Şüpheliler ({form.suspects.length})</h2>
                    <p className={styles.folioDesc}>
                      Her şüphelinin bir sırrı olsun; masumlar bile başka bir günah yüzünden tedirgin davranmalı.
                      Tam olarak <strong>bir şüpheliyi katil</strong> olarak işaretle.
                    </p>
                  </div>
                  <button type="button" onClick={addSuspect} className={styles.addSuspectBtn}>
                    <Plus size={15} /> Şüpheli Ekle
                  </button>
                </header>

                <div className={styles.suspectList}>
                  {form.suspects.map((suspect, idx) => (
                    <div
                      key={suspect.id}
                      className={`${styles.suspectCard} ${suspect.isCulprit ? styles.culpritCard : ''}`}
                    >
                      <div className={styles.suspectHeader}>
                        <span className={styles.suspectAvatar}>
                          {suspect.isCulprit ? <Skull size={18} /> : (suspect.name.trim()[0] || idx + 1)}
                        </span>
                        <div className={styles.suspectMeta}>
                          <span className={styles.suspectIndex}>Şüpheli {idx + 1}</span>
                          <span className={suspect.isCulprit ? styles.culpritTag : styles.innocentTag}>
                            {suspect.isCulprit ? 'Katil' : 'Masum'}
                          </span>
                        </div>
                        <label className={styles.culpritToggle}>
                          <input
                            type="radio"
                            name="culpritSelection"
                            checked={suspect.isCulprit}
                            onChange={() => handleSuspectChange(idx, 'isCulprit', true)}
                          />
                          <span>Katil bu</span>
                        </label>
                        {form.suspects.length > 3 && (
                          <button
                            type="button"
                            onClick={() => removeSuspect(idx)}
                            className={styles.deleteBtn}
                            title="Şüpheliyi kaldır"
                            aria-label="Şüpheliyi kaldır"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>

                      <div className={styles.grid2}>
                        <div className={styles.fieldGroup}>
                          <label className={styles.label}>Adı</label>
                          <input
                            type="text"
                            className={styles.input}
                            placeholder="Örn: Rahip Paul"
                            value={suspect.name}
                            onChange={(e) => handleSuspectChange(idx, 'name', e.target.value)}
                            required
                          />
                        </div>
                        <div className={styles.fieldGroup}>
                          <label className={styles.label}>Mesleği</label>
                          <input
                            type="text"
                            className={styles.input}
                            placeholder="Örn: Manastır kütüphanecisi"
                            value={suspect.role}
                            onChange={(e) => handleSuspectChange(idx, 'role', e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className={styles.grid2}>
                        <div className={styles.fieldGroup}>
                          <label className={styles.label}>
                            {suspect.isCulprit ? 'Cinayet nedeni' : 'Gizli sırrı'}
                            <span className={styles.hint}>Neden şüpheli görünüyor?</span>
                          </label>
                          <textarea
                            className={styles.textarea}
                            placeholder={suspect.isCulprit ? 'Cinayeti neden ve nasıl işledi?' : 'Cinayet gecesi sakladığı başka bir utanç ya da suç ne?'}
                            value={suspect.motiveOrSecret}
                            onChange={(e) => handleSuspectChange(idx, 'motiveOrSecret', e.target.value)}
                            required
                          />
                        </div>
                        <div className={styles.fieldGroup}>
                          <label className={styles.label}>
                            Sorgudaki tavrı
                            <span className={styles.hint}>Yapay zekânın canlandıracağı kişilik</span>
                          </label>
                          <textarea
                            className={styles.textarea}
                            placeholder="Örn: Alaycı ve kibirli cevaplar verir, Engizisyon’dan korkmadığını ima eder..."
                            value={suspect.interrogationDemeanor}
                            onChange={(e) => handleSuspectChange(idx, 'interrogationDemeanor', e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* BÖLÜM 4 */}
              <section className={styles.folio}>
                <header className={styles.folioHeader}>
                  <span className={styles.folioNumber}>IV</span>
                  <div>
                    <h2 className={styles.folioTitle}>İpuçları ve Kanıtlar</h2>
                    <p className={styles.folioDesc}>Oyuncuyu doğruya ve yanlışa götürecek izler.</p>
                  </div>
                </header>

                <div className={styles.grid3}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>
                      Olay yeri ipucu
                      <span className={styles.hint}>Doğrudan fiziksel iz</span>
                    </label>
                    <textarea
                      className={styles.textarea}
                      placeholder="Örn: Kurbanın tırnaklarının arasına sıkışmış altın bir iplik..."
                      value={form.crimeSceneClue}
                      onChange={(e) => setForm({ ...form, crimeSceneClue: e.target.value })}
                      required
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>
                      Yanıltıcı ipucu
                      <span className={styles.hint}>Masum birini işaret eden tuzak</span>
                    </label>
                    <textarea
                      className={styles.textarea}
                      placeholder="Örn: Çalılıklara atılmış, demircinin mührünü taşıyan bir çekiç..."
                      value={form.redHerringClue}
                      onChange={(e) => setForm({ ...form, redHerringClue: e.target.value })}
                      required
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>
                      Gizli mekân ipucu
                      <span className={styles.hint}>Arama izniyle bulunur</span>
                    </label>
                    <textarea
                      className={styles.textarea}
                      placeholder="Örn: Hanın tavan arasındaki gizli bölmede kurbanın kesesi..."
                      value={form.hiddenLocationClue}
                      onChange={(e) => setForm({ ...form, hiddenLocationClue: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </section>

              {/* BÖLÜM 5 */}
              <section className={styles.folio}>
                <header className={styles.folioHeader}>
                  <span className={styles.folioNumber}>V</span>
                  <div>
                    <h2 className={styles.folioTitle}>Hakikat</h2>
                    <p className={styles.folioDesc}>Vaka kapandığında oyuncuya gerçeği anlatan son perde.</p>
                  </div>
                </header>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>
                    Çözüm metni <em>*</em>
                    <span className={styles.hint}>Kim, neden ve nasıl?</span>
                  </label>
                  <textarea
                    className={`${styles.textarea} ${styles.tall}`}
                    placeholder="Katil gerçekte Peder Thomas’tı. Tefeci tüccarın onu ifşa etmesinden korkarak adamı zehirledi ve cesedi manastıra taşıdı. Demirci ise yalnızca kaçak silah dövdüğü için yalan söylemişti..."
                    value={form.truthReveal}
                    onChange={(e) => setForm({ ...form, truthReveal: e.target.value })}
                    required
                  />
                  <span className={styles.counter}>{form.truthReveal.length} karakter</span>
                </div>
              </section>

              <div className={styles.submitBar}>
                <p className={styles.submitNote}>
                  Gönderilen vakalar, Konsey onayından sonra oyuna eklenir.
                </p>
                <div className={styles.submitActions}>
                  <button type="button" onClick={() => setShowPreviewModal(true)} className={styles.ghostBtn}>
                    <Eye size={15} /> Önizle
                  </button>
                  <button type="submit" disabled={isSubmitting} className={styles.primaryBtn}>
                    {isSubmitting ? (
                      'Mühürleniyor...'
                    ) : (
                      <>
                        Konseye Sun <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>

            {/* DOSYA DURUMU */}
            <aside className={styles.sidebar}>
              <div className={styles.sideCard}>
                <span className={styles.sideEyebrow}>Dosya Durumu</span>
                <div className={styles.progressHead}>
                  <span className={styles.progressCount}>
                    {doneCount}/{checklist.length}
                  </span>
                  <span className={styles.progressLabel}>bölüm tamam</span>
                </div>
                <div className={styles.progressBar}>
                  <span style={{ width: `${(doneCount / checklist.length) * 100}%` }} />
                </div>
                <ul className={styles.checklist}>
                  {checklist.map((item) => (
                    <li key={item.label} className={item.done ? styles.checkDone : ''}>
                      {item.done ? <Check size={14} /> : <Circle size={14} />}
                      {item.label}
                    </li>
                  ))}
                </ul>
              </div>

              <div className={styles.sideCard}>
                <span className={styles.sideEyebrow}>Araçlar</span>
                <div className={styles.toolList}>
                  <button type="button" onClick={handleLoadSample} className={`${styles.toolBtn} ${styles.toolGold}`}>
                    <Sparkles size={15} /> Örnek Vakayı Yükle
                  </button>
                  <button type="button" onClick={handleSaveDraft} className={styles.toolBtn}>
                    <Save size={15} /> Taslağı Kaydet
                  </button>
                  <button type="button" onClick={() => setShowPreviewModal(true)} className={styles.toolBtn}>
                    <Eye size={15} /> Vaka Dosyasını Önizle
                  </button>
                  <button type="button" onClick={handleClearDraft} className={`${styles.toolBtn} ${styles.toolDanger}`}>
                    <RotateCcw size={15} /> Sıfırla
                  </button>
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* SEKME 2: GERİ BİLDİRİM */}
        {activeTab === 'feedback' && (
          <section className={`${styles.folio} ${styles.narrow}`}>
            <header className={styles.folioHeader}>
              <span className={styles.folioIcon}>
                <MessageSquare size={18} />
              </span>
              <div>
                <h2 className={styles.folioTitle}>Konseye Mesaj Gönder</h2>
                <p className={styles.folioDesc}>
                  Teknik aksaklıkları, yapay zekâ tutarsızlıklarını, önerilerini ya da genel düşüncelerini doğrudan
                  yapımcılara ilet.
                </p>
              </div>
            </header>

            {feedbackSubmitted ? (
              <div className={styles.successPanel}>
                <span className={styles.successSeal}>
                  <Check size={22} />
                </span>
                <h3>Mesajın Konsey Arşivine Ulaştı</h3>
                <p>
                  Geri bildirimin için teşekkürler. Yapım ekibi mesajını inceleyecek ve gerekirse e-posta adresin
                  üzerinden seninle iletişime geçecek.
                </p>
                <button onClick={() => setFeedbackSubmitted(false)} className={styles.ghostBtn}>
                  Yeni Bir Mesaj Gönder
                </button>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit}>
                <label className={styles.label}>Mesajının konusu</label>
                <div className={styles.categoryGrid}>
                  {FEEDBACK_CATEGORIES.map((category) => {
                    const Icon = category.icon;
                    return (
                      <button
                        type="button"
                        key={category.id}
                        className={`${styles.categoryBtn} ${feedbackCategory === category.id ? styles.selected : ''}`}
                        onClick={() => setFeedbackCategory(category.id)}
                        aria-pressed={feedbackCategory === category.id}
                      >
                        <Icon size={18} />
                        <span className={styles.catTitle}>{category.title}</span>
                        <span className={styles.catDesc}>{category.desc}</span>
                      </button>
                    );
                  })}
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>
                    Başlık <em>*</em>
                  </label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="Örn: 3. günün sorgusunda NPC cevap vermeyi kesti"
                    value={feedbackSubject}
                    onChange={(e) => setFeedbackSubject(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>
                    Ayrıntılar <em>*</em>
                    <span className={styles.hint}>Ne olduğunu adım adım anlat</span>
                  </label>
                  <textarea
                    className={`${styles.textarea} ${styles.tall}`}
                    placeholder="Sorun nerede yaşandı, hangi adımları izledin ya da neyin daha iyi olmasını istersin?"
                    value={feedbackMessage}
                    onChange={(e) => setFeedbackMessage(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.grid2}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>E-posta adresin (isteğe bağlı)</label>
                    <input
                      type="email"
                      className={styles.input}
                      placeholder="ornek@inquisitor.com"
                      value={feedbackContact}
                      onChange={(e) => setFeedbackContact(e.target.value)}
                    />
                  </div>

                  <label className={styles.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={includeSystemSpecs}
                      onChange={(e) => setIncludeSystemSpecs(e.target.checked)}
                    />
                    <span>
                      Hatayı bulmamıza yardımcı olması için tarayıcı ve oturum bilgilerini ekle
                      <small>Cihaz türü, ekran boyutu ve anonim oturum kimliği eklenir.</small>
                    </span>
                  </label>
                </div>

                <div className={styles.submitBar}>
                  <p className={styles.submitNote}>Yapım ekibi tüm mesajları düzenli olarak okur.</p>
                  <button type="submit" disabled={isSubmitting} className={styles.primaryBtn}>
                    {isSubmitting ? 'Gönderiliyor...' : 'Mesajı Gönder'}
                  </button>
                </div>
              </form>
            )}
          </section>
        )}

        {/* SEKME 3: KONSEY KURALLARI */}
        {activeTab === 'rules' && (
          <section className={`${styles.folio} ${styles.narrow}`}>
            <header className={styles.folioHeader}>
              <span className={styles.folioIcon}>
                <ScrollText size={18} />
              </span>
              <div>
                <h2 className={styles.folioTitle}>Vaka Kabul Kriterleri</h2>
                <p className={styles.folioDesc}>
                  Konsey, topluluğun yazdığı vakaları oyuna eklerken şu dört ölçüte bakar.
                </p>
              </div>
            </header>

            <ol className={styles.ruleList}>
              {RULES.map((rule, i) => (
                <li key={rule.title} className={styles.ruleCard}>
                  <span className={styles.ruleSeal}>{['I', 'II', 'III', 'IV'][i]}</span>
                  <div>
                    <h4>{rule.title}</h4>
                    <p>{rule.text}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className={styles.rulesCta}>
              <button
                onClick={() => {
                  setActiveTab('story');
                  handleLoadSample();
                }}
                className={styles.primaryBtn}
              >
                Örnek Vakayla Başla <ArrowRight size={16} />
              </button>
            </div>
          </section>
        )}

        {/* ÖNİZLEME */}
        {showPreviewModal && (
          <div className={styles.modalOverlay} onClick={() => setShowPreviewModal(false)}>
            <div
              className={styles.dossier}
              role="dialog"
              aria-modal="true"
              aria-label="Vaka dosyası önizlemesi"
              onClick={(e) => e.stopPropagation()}
            >
              <button className={styles.dossierClose} onClick={() => setShowPreviewModal(false)} aria-label="Kapat">
                <X size={18} />
              </button>
              <span className={styles.dossierStamp}>Gizli</span>
              <span className={styles.dossierEyebrow}>Vaka Dosyası</span>
              <h3 className={styles.dossierTitle}>{form.title || 'İsimsiz Vaka'}</h3>
              <div className={styles.dossierMeta}>
                <span>Yazar: {form.authorName || 'Bilinmiyor'}</span>
                <span>{SCENARIO_LABELS[form.scenarioType]}</span>
                <span>{DIFFICULTY_LABELS[form.difficulty]} zorluk</span>
              </div>

              <div className={styles.dossierSection}>
                <h4>Giriş</h4>
                <p className={styles.dossierQuote}>{form.prologueHook || 'Henüz bir giriş anlatısı yazılmadı.'}</p>
              </div>

              <div className={styles.dossierSection}>
                <h4>Olay Yeri</h4>
                <p>
                  <strong>{form.crimeLocation}</strong> —{' '}
                  {form.crimeStyle === 'HURRIED' ? 'telaşla, boğuşarak işlenmiş bir cinayet' : 'planlanmış ve izleri temizlenmiş bir cinayet'}
                </p>
                <p className={styles.dossierMuted}>{form.victimDescription || 'Kurban bilgisi girilmedi.'}</p>
              </div>

              <div className={styles.dossierSection}>
                <h4>Şüpheliler</h4>
                <ul className={styles.dossierSuspects}>
                  {form.suspects.map((s, idx) => (
                    <li key={idx} className={s.isCulprit ? styles.dossierCulprit : ''}>
                      <div>
                        <strong>{s.name || `Şüpheli ${idx + 1}`}</strong>
                        <span> · {s.role || 'Mesleği girilmedi'}</span>
                      </div>
                      {s.isCulprit && <span className={styles.dossierCulpritTag}>Katil</span>}
                      <p>{s.motiveOrSecret || '—'}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={styles.dossierSection}>
                <h4>Hakikat</h4>
                <p>{form.truthReveal || 'Hakikat metni henüz yazılmadı.'}</p>
              </div>

              <div className={styles.dossierFooter}>
                <button onClick={() => setShowPreviewModal(false)} className={styles.dossierBtn}>
                  Dosyayı Kapat
                </button>
              </div>
            </div>
          </div>
        )}

        {/* GÖNDERİM ONAYI */}
        {showSuccessModal && (
          <div className={styles.modalOverlay} onClick={() => setShowSuccessModal(false)}>
            <div
              className={styles.modalBox}
              role="dialog"
              aria-modal="true"
              aria-labelledby="success-title"
              onClick={(e) => e.stopPropagation()}
            >
              <span className={styles.waxSeal}>✠</span>
              <h3 id="success-title" className={styles.modalTitle}>
                Vakan Konseye Ulaştı
              </h3>
              <p className={styles.modalText}>
                <strong>“{form.title}”</strong> başlıklı vakan incelenmek üzere arşive teslim edildi.
              </p>
              <div className={styles.processBox}>
                <h4>Bundan sonra ne olacak?</h4>
                <ol>
                  <li>Vakan, yapay zekânın kullanabileceği biçimde bölümlere ayrıldı.</li>
                  <li>Konsey vakayı mantık tutarlılığı ve anlatım tonu açısından inceleyecek.</li>
                  <li>Onaylanırsa bir sonraki güncellemede vaka havuzuna eklenecek ve tüm oyuncular onu çözebilecek.</li>
                </ol>
              </div>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  setActiveTab('story');
                }}
                className={`${styles.primaryBtn} ${styles.full}`}
              >
                Tamam
              </button>
            </div>
          </div>
        )}

        {saveToast && (
          <div className={styles.toast} role="status">
            <ScrollText size={16} /> {saveToast}
          </div>
        )}
      </div>
    </main>
  );
}
