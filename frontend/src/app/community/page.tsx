'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '../../store/useGameStore';
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
  scenarioType: 'medieval' | 'modern' | 'cyberpunk';
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

const DEFAULT_SUSPECTS: SuspectEntry[] = [
  {
    id: 'suspect-1',
    name: 'Peder Thomas',
    role: 'Köy Rahibi',
    isCulprit: true,
    motiveOrSecret: 'Kilisenin kutsal emanetlerini kaçakçılara satarken kurban bunu fark etti ve şantaj yapmaya çalıştı.',
    interrogationDemeanor: 'Aşırı dindar konuşmaların ardına gizlenir, suçlamalarda Tanrı gazabını öne sürer.',
  },
  {
    id: 'suspect-2',
    name: 'Demirci Roderick',
    role: 'Demir Ustası',
    isCulprit: false,
    motiveOrSecret: 'Cinayet gecesi yasak ve kaçak silah dövüyordu, bu yüzden o gece dışarıda görüldü ama cinayetle ilgisi yok.',
    interrogationDemeanor: 'Öfkeli ve gergin, engizisyondan nefret ettiğini gizlemez.',
  },
  {
    id: 'suspect-3',
    name: 'Ebe Maeve',
    role: 'Şifacı & Otacı',
    isCulprit: false,
    motiveOrSecret: 'Kurbana gizlice zehirli uyku otları satmıştı ama öldürme niyetinde değildi, cadılıkla suçlanmaktan korkuyor.',
    interrogationDemeanor: 'Titrek, tedirgin ve sürekli ellerini ovuşturur.',
  },
  {
    id: 'suspect-4',
    name: 'Meyhaneci Barnaby',
    role: 'Han Sahibi',
    isCulprit: false,
    motiveOrSecret: 'Kurbandan yüklü miktarda kumar alacağı vardı, cinayet saatinde sarhoş bir müşteriyi soyuyordu.',
    interrogationDemeanor: 'Sürekli konuyu değiştirmeye ve başkalarını karalamaya çalışır.',
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
  prologueHook: 'Kuzeyin soğuk sisleri Ashenmoor köyünün üzerine çöktüğünde, manastır çanları zamansız bir matem havasıyla çaldı. Eski kilise avlusunda, göğsüne antik bir haç saplanmış ceset karların üzerinde yatıyordu.',
  crimeLocation: 'Eski Manastır Bahçesi',
  crimeStyle: 'HURRIED',
  victimDescription: 'Köyün eski muhafızı ve tefecisi olan adam. Üzerinde boğuşma izleri ve yırtık siyah bir cübbe parçası var.',
  crimeSceneClue: 'Kurbanın tırnakları arasına sıkışmış kırmızı mum damlaları ve altın yaldızlı bir cübbe ipliği.',
  redHerringClue: 'Demirci Roderick\'in damgasını taşıyan paslı bir hançer kılıfı çalılıklara fırlatılmış.',
  hiddenLocationClue: 'Şifacının kulübesindeki rafta yarı yarıya boşaltılmış baldıran zehri şişesi.',
  truthReveal: 'Cinayeti Peder Thomas işlemiştir. Kutsal emanetleri satıp elde ettiği parayı kurbana borç faizi olarak kaptırmış, tehdit edilince panikle manastır bahçesinde kurbanı öldürmüştür. Demirci masumdur; atölyesinden çalınan kılıf şüpheyi dağıtmak için bilerek bırakılmıştır.',
  suspects: DEFAULT_SUSPECTS,
};

export default function CommunityPage() {
  const router = useRouter();
  const { userEmail, isAdmin } = useGameStore();

  const [activeTab, setActiveTab] = useState<'story' | 'feedback' | 'rules'>('story');
  const [form, setForm] = useState<ScenarioForm>(INITIAL_FORM);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Feedback form state
  const [feedbackCategory, setFeedbackCategory] = useState<'bug' | 'feature' | 'balance' | 'complaint' | 'appreciation'>('bug');
  const [feedbackSubject, setFeedbackSubject] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackContact, setFeedbackContact] = useState(userEmail || '');
  const [includeSystemSpecs, setIncludeSystemSpecs] = useState(true);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Auto-fill author name if userEmail available
  useEffect(() => {
    if (userEmail && !form.authorName) {
      setForm((prev) => ({ ...prev, authorName: userEmail.split('@')[0] }));
    }
  }, [userEmail]);

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('inquisitor_community_story_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.title || parsed.prologueHook) {
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
      triggerToast('Mühürlü taslak tarayıcınıza kaydedildi.');
    } catch {
      triggerToast('Taslak kaydedilirken bir hata oluştu.');
    }
  };

  const handleLoadSample = () => {
    setForm(SAMPLE_SCENARIO);
    triggerToast('Örnek gotik senaryo şablonu yüklendi.');
  };

  const handleClearDraft = () => {
    if (confirm('Taslağı sıfırlamak istediğinize emin misiniz?')) {
      setForm(INITIAL_FORM);
      localStorage.removeItem('inquisitor_community_story_draft');
      triggerToast('Taslak sıfırlandı.');
    }
  };

  const handleSuspectChange = (index: number, field: keyof SuspectEntry, value: any) => {
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
      triggerToast('En fazla 6 şüpheli eklenebilir (Zor mod kuralı).');
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
      triggerToast('En az 3 şüpheli bulunmalıdır.');
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
      triggerToast('Lütfen hikaye için bir başlık belirleyin.');
      return;
    }
    if (!form.prologueHook.trim() || form.prologueHook.length < 30) {
      triggerToast('Giriş anlatısı en az 30 karakter olmalıdır.');
      return;
    }
    if (!form.truthReveal.trim() || form.truthReveal.length < 40) {
      triggerToast('Hakikat (Truth Reveal) bölümü soruşturmanın çözümünü detaylı açıklamalıdır.');
      return;
    }
    if (!form.suspects.some((s) => s.isCulprit)) {
      triggerToast('Vakada en az bir asıl suçlu (Katil) belirlenmelidir.');
      return;
    }

    setIsSubmitting(true);

    // Mock API / Local submission simulation
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccessModal(true);
      // Kaydedilen taslağı koru veya temizle
    }, 1200);
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackSubject.trim() || !feedbackMessage.trim()) {
      triggerToast('Lütfen konu ve mesaj alanlarını doldurun.');
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

  return (
    <main className={styles.container}>
      <div className={styles.inner}>
        {/* Top Bar Navigation */}
        <div className={styles.topNav}>
          <button onClick={() => router.push('/')} className={styles.backBtn}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>Ana Menüye Dön</span>
          </button>

          <div className={styles.userBadge}>
            <span>Engizitör:</span>
            <span className={styles.role}>{userEmail ? userEmail.split('@')[0] : 'Misafir Müşahit'}</span>
            {isAdmin && <span style={{ color: '#ff6666', border: '1px solid #8A0303', padding: '1px 6px', fontSize: '0.7rem' }}>KONSEY YÖNETİCİSİ</span>}
          </div>
        </div>

        {/* Header */}
        <header className={styles.header}>
          <div className={styles.emblemWrapper}>
            <svg width="68" height="68" viewBox="0 0 120 120" fill="none">
              <polygon points="60,10 105,35 105,85 60,110 15,85 15,35" stroke="#8A0303" strokeWidth="1.5" fill="none" opacity="0.6" />
              <polygon points="60,20 95,40 95,80 60,100 25,80 25,40" stroke="#DAA520" strokeWidth="1" fill="none" opacity="0.4" />
              <circle cx="60" cy="60" r="30" stroke="#8A0303" strokeWidth="1" fill="rgba(138,3,3,0.1)" />
              <line x1="60" y1="35" x2="60" y2="85" stroke="#DAA520" strokeWidth="2" />
              <line x1="40" y1="50" x2="80" y2="50" stroke="#DAA520" strokeWidth="2" />
              <circle cx="60" cy="60" r="4" fill="#8A0303" />
            </svg>
          </div>
          <div className={styles.subtitle}>- SANCTUM SCRIPTORIUM -</div>
          <h1 className={styles.title}>Topluluk ve Vaka Arşivi</h1>
          <p className={styles.description}>
            Kendi cinayet ve gizem vakalarını kaleme al, Engizisyon Konseyi onayından sonra oyun evrenine kat.
            Geliştiricilere geri bildirim ileterek soruşturma mekaniklerini güçlendir.
          </p>
        </header>

        {/* Global Toast Message */}
        {saveToast && (
          <div className={styles.noticeBox} style={{ borderColor: '#DAA520', background: 'rgba(218, 165, 32, 0.1)', color: '#DAA520' }}>
            <span className={styles.noticeIcon}>📜</span>
            <div>{saveToast}</div>
          </div>
        )}

        {/* Tab Switcher */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'story' ? styles.active : ''}`}
            onClick={() => setActiveTab('story')}
          >
            <span>📜</span>
            <span>Vaka & Hikaye Yazarı</span>
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'feedback' ? styles.active : ''}`}
            onClick={() => setActiveTab('feedback')}
          >
            <span>✉️</span>
            <span>Geri Bildirim & Mesaj</span>
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'rules' ? styles.active : ''}`}
            onClick={() => setActiveTab('rules')}
          >
            <span>⚖️</span>
            <span>Konsey Kuralları & Rehber</span>
          </button>
        </div>

        {/* TAB 1: STORY BUILDER */}
        {activeTab === 'story' && (
          <div>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h2 className={styles.cardTitle}>
                    <span>🗡️</span>
                    <span>Yeni Bir Soruşturma Kurgula</span>
                  </h2>
                  <p className={styles.cardDesc}>
                    Burada oluşturduğun vaka formu parçalanarak veritabanına ve yapay zeka istemlerine işlenecek formattadır.
                    Gönderdiğin hikayeler admin onayından geçtikten sonra herkes için oynanabilir kılınacaktır.
                  </p>
                </div>
                <div className={styles.actionRow}>
                  <button type="button" onClick={handleLoadSample} className={`${styles.actionButton} ${styles.gold}`}>
                    <span>⚡</span>
                    <span>Örnek Şablon Doldur</span>
                  </button>
                  <button type="button" onClick={handleSaveDraft} className={styles.actionButton}>
                    <span>💾</span>
                    <span>Taslağı Kaydet</span>
                  </button>
                  <button type="button" onClick={() => setShowPreviewModal(true)} className={styles.actionButton}>
                    <span>👁️</span>
                    <span>Vaka Önizlemesi</span>
                  </button>
                  <button type="button" onClick={handleClearDraft} className={styles.actionButton} style={{ color: '#e07070' }}>
                    <span>🗑️</span>
                    <span>Sıfırla</span>
                  </button>
                </div>
              </div>

              <form onSubmit={handleStorySubmit}>
                {/* BÖLÜM 1: TEMEL BİLGİLER */}
                <div className={styles.formSection}>
                  <h3 className={styles.sectionHeading}>
                    <span>1.</span>
                    <span>Vaka Temeli & Atmosfer</span>
                  </h3>
                  <div className={styles.grid3}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>
                        Vaka Başlığı *
                        <span className={styles.hint}>Çarpıcı & Gotik</span>
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

                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Evren / Çağ</label>
                      <select
                        className={styles.select}
                        value={form.scenarioType}
                        onChange={(e) => setForm({ ...form, scenarioType: e.target.value as any })}
                      >
                        <option value="medieval">Ortaçağ (Medieval - Ashenmoor Köyü)</option>
                        <option value="modern">Modern Dedektif (Karanlık Şehir)</option>
                        <option value="cyberpunk">Cyberpunk (Neo-Inquisition)</option>
                      </select>
                    </div>

                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Zorluk & Şüpheli Sayısı</label>
                      <select
                        className={styles.select}
                        value={form.difficulty}
                        onChange={(e) => setForm({ ...form, difficulty: e.target.value as any })}
                      >
                        <option value="easy">Kolay (4 Şüpheli - Temel İlişki Ağı)</option>
                        <option value="medium">Orta (5 Şüpheli - Çapraz İttifaklar)</option>
                        <option value="hard">Zor (6 Şüpheli - Karmaşık Komplo)</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.grid2}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>
                        Yazar Takma Adı / Engizitör Kimliği
                      </label>
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="Örn: Engizitör Marcus"
                        value={form.authorName}
                        onChange={(e) => setForm({ ...form, authorName: e.target.value })}
                      />
                    </div>

                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Cinayet / Olay Tarzı</label>
                      <select
                        className={styles.select}
                        value={form.crimeStyle}
                        onChange={(e) => setForm({ ...form, crimeStyle: e.target.value as any })}
                      >
                        <option value="HURRIED">Telaşlı / Panik (Olay yerinde boğuşma izleri ve gerçek fiziksel kanıt)</option>
                        <option value="ORGANIZED">Planlı / Tertipli (Olay yeri temizlenmiş, yanıltıcı sahte ipucu bırakılmış)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* BÖLÜM 2: GİRİŞ ANLATISI VE MEKAN */}
                <div className={styles.formSection}>
                  <h3 className={styles.sectionHeading}>
                    <span>2.</span>
                    <span>Olay Yeri & Giriş Anlatısı</span>
                  </h3>
                  <div className={styles.grid2}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>
                        Cinayetin İşlendiği Mekan
                        <span className={styles.hint}>Oyundaki keşif noktası</span>
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
                        Kurban Tanımı & Cesedin Durumu
                        <span className={styles.hint}>Kimliği gizemli kalabilir</span>
                      </label>
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="Örn: Üzerinde lüks cübbe olan yaşlı bir tüccar, boğazında morluklar var..."
                        value={form.victimDescription}
                        onChange={(e) => setForm({ ...form, victimDescription: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>
                      Engizitörün Giriş Anlatısı (Prologue Hook) *
                      <span className={styles.hint}>Oyuncunun köye ilk vardığında okuduğu gotik atmosferik metin</span>
                    </label>
                    <textarea
                      className={styles.textarea}
                      style={{ minHeight: '110px' }}
                      placeholder="Kuzeyin soğuk rüzgarları köyü döverken at arabasından indiniz. Ashenmoor'un sakinleri sizi korku dolu bakışlarla karşılıyor..."
                      value={form.prologueHook}
                      onChange={(e) => setForm({ ...form, prologueHook: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* BÖLÜM 3: ŞÜPHELİLER VE ROL DAĞILIMI */}
                <div className={styles.formSection}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 className={styles.sectionHeading} style={{ margin: 0 }}>
                      <span>3.</span>
                      <span>Şüpheliler ve Karakter İstemleri ({form.suspects.length})</span>
                    </h3>
                    <button
                      type="button"
                      onClick={addSuspect}
                      className={styles.actionButton}
                      style={{ borderColor: '#8A0303', color: '#ff8888' }}
                    >
                      + Yeni Şüpheli Ekle
                    </button>
                  </div>

                  <p className={styles.cardDesc} style={{ marginBottom: '16px' }}>
                    Her şüphelinin kendine has bir sırrı olmalıdır. Masum olanlar bile başka bir suç veya ahlaksızlık nedeniyle tedirgin davranmalıdır ki oyuncu şüphe duysun.
                    Tam olarak <strong>1 şüpheliyi ASIL SUÇLU</strong> olarak işaretleyin.
                  </p>

                  {form.suspects.map((suspect, idx) => (
                    <div
                      key={suspect.id}
                      className={`${styles.suspectCard} ${suspect.isCulprit ? styles.culpritCard : ''}`}
                    >
                      <div className={styles.suspectHeader}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 600, color: '#DAA520' }}>
                            #{idx + 1}
                          </span>
                          <span
                            className={`${styles.suspectRoleBadge} ${
                              suspect.isCulprit ? styles.culprit : styles.innocent
                            }`}
                          >
                            {suspect.isCulprit ? '★ ASIL SUÇLU (KATİL)' : 'MASUM ŞÜPHELİ'}
                          </span>
                          <label style={{ fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                            <input
                              type="radio"
                              name="culpritSelection"
                              checked={suspect.isCulprit}
                              onChange={() => handleSuspectChange(idx, 'isCulprit', true)}
                            />
                            <span>Suçlu Yap</span>
                          </label>
                        </div>
                        {form.suspects.length > 3 && (
                          <button
                            type="button"
                            onClick={() => removeSuspect(idx)}
                            className={styles.deleteBtn}
                            title="Şüpheliyi Kaldır"
                          >
                            Kaldır ✕
                          </button>
                        )}
                      </div>

                      <div className={styles.grid2} style={{ marginBottom: '12px' }}>
                        <div>
                          <label className={styles.label}>Şüpheli Adı</label>
                          <input
                            type="text"
                            className={styles.input}
                            placeholder="Örn: Rahip Paul"
                            value={suspect.name}
                            onChange={(e) => handleSuspectChange(idx, 'name', e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <label className={styles.label}>Köydeki Rolü / Mesleği</label>
                          <input
                            type="text"
                            className={styles.input}
                            placeholder="Örn: Manastır Kütüphanecisi"
                            value={suspect.role}
                            onChange={(e) => handleSuspectChange(idx, 'role', e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className={styles.grid2}>
                        <div>
                          <label className={styles.label}>
                            Gizli Sırrı / Cinayet Motivasyonu
                            <span className={styles.hint}>Neden şüpheli görünüyor?</span>
                          </label>
                          <textarea
                            className={styles.textarea}
                            style={{ minHeight: '70px' }}
                            placeholder={suspect.isCulprit ? 'Cinayeti neden ve nasıl işledi?' : 'Cinayet gecesi sakladığı başka bir utanç veya suç nedir?'}
                            value={suspect.motiveOrSecret}
                            onChange={(e) => handleSuspectChange(idx, 'motiveOrSecret', e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <label className={styles.label}>
                            Sorgudaki Karakter Tutumu
                            <span className={styles.hint}>Yapay zekanın takınacağı tavır</span>
                          </label>
                          <textarea
                            className={styles.textarea}
                            style={{ minHeight: '70px' }}
                            placeholder="Örn: Alaycı ve kibirli cevaplar verir, engizisyondan korkmadığını ima eder..."
                            value={suspect.interrogationDemeanor}
                            onChange={(e) => handleSuspectChange(idx, 'interrogationDemeanor', e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* BÖLÜM 4: İPUÇLARI VE KANITLAR */}
                <div className={styles.formSection}>
                  <h3 className={styles.sectionHeading}>
                    <span>4.</span>
                    <span>İpuçları & Kanıt Ağı</span>
                  </h3>
                  <div className={styles.grid3}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>
                        Olay Yeri İpucu
                        <span className={styles.hint}>Fiziksel doğrudan iz</span>
                      </label>
                      <textarea
                        className={styles.textarea}
                        placeholder="Örn: Kurbanın tırnakları arasına sıkışmış altın iplik..."
                        value={form.crimeSceneClue}
                        onChange={(e) => setForm({ ...form, crimeSceneClue: e.target.value })}
                        required
                      />
                    </div>

                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>
                        Yanıltıcı İpucu (Red Herring)
                        <span className={styles.hint}>Masumu işaret eden tuzak</span>
                      </label>
                      <textarea
                        className={styles.textarea}
                        placeholder="Örn: Çalılıklara atılmış demircinin mührünü taşıyan çekiç..."
                        value={form.redHerringClue}
                        onChange={(e) => setForm({ ...form, redHerringClue: e.target.value })}
                        required
                      />
                    </div>

                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>
                        Mekan Gizli İpucu
                        <span className={styles.hint}>Arama izniyle bulunan iz</span>
                      </label>
                      <textarea
                        className={styles.textarea}
                        placeholder="Örn: Hanın tavan arasındaki gizli bölmede kurbanın cüzdanı..."
                        value={form.hiddenLocationClue}
                        onChange={(e) => setForm({ ...form, hiddenLocationClue: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* BÖLÜM 5: TRUTH REVEAL (HAKİKAT) */}
                <div className={styles.formSection}>
                  <h3 className={styles.sectionHeading}>
                    <span>5.</span>
                    <span>Hakikat (Truth Reveal - Son Perde)</span>
                  </h3>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>
                      Tüm Sırrı Aydınlatan Edebi Çözüm Metni *
                      <span className={styles.hint}>Dava sonuçlandığında oyuncuya gerçeği izah eden paragraf</span>
                    </label>
                    <textarea
                      className={styles.textarea}
                      style={{ minHeight: '120px' }}
                      placeholder="Katil gerçekte Peder Thomas'tı. Tefeci tüccarın kendisini ifşa edeceğinden korkarak zehirlemiş ve cesedi manastıra taşımıştır. Demirci sadece yasak demir dövdüğü için yalan söylemiş..."
                      value={form.truthReveal}
                      onChange={(e) => setForm({ ...form, truthReveal: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* SUBMIT BUTTON BAR */}
                <div className={styles.submitBar}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted, #8a7f72)' }}>
                    * Gönderilen senaryolar moderatör onayından sonra veritabanına aktarılır.
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      type="button"
                      onClick={() => setShowPreviewModal(true)}
                      className={styles.actionButton}
                    >
                      Dossier Önizle
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={styles.submitPrimary}
                    >
                      {isSubmitting ? (
                        <span>Mühürleniyor...</span>
                      ) : (
                        <>
                          <span>Engizisyon Konseyine Sun</span>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: FEEDBACK & COMPLAINTS */}
        {activeTab === 'feedback' && (
          <div>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h2 className={styles.cardTitle}>
                    <span>🕊️</span>
                    <span>Konseye Mesaj & Geri Bildirim İlet</span>
                  </h2>
                  <p className={styles.cardDesc}>
                    Oyun sırasında karşılaştığın teknik aksaklıkları, yapay zeka tutarsızlıklarını, mekanik önerilerini veya genel düşüncelerini doğrudan yapımcılara ilet.
                  </p>
                </div>
              </div>

              {feedbackSubmitted ? (
                <div className={styles.successBanner} style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem', fontWeight: 600 }}>
                    <span>✓</span>
                    <span>Mesajınız Konsey Arşivine Kaydedildi</span>
                  </div>
                  <p style={{ marginTop: '8px', color: '#c4eec4', lineHeight: 1.6 }}>
                    Geri bildiriminiz için teşekkür ederiz. Yapım ekibi bildiriminizi inceleyip gerekirse kayıtlı e-postanız üzerinden sizinle irtibata geçecektir.
                  </p>
                  <button
                    onClick={() => setFeedbackSubmitted(false)}
                    className={styles.actionButton}
                    style={{ marginTop: '16px', background: 'rgba(255,255,255,0.1)' }}
                  >
                    Yeni Bir Mesaj Gönder
                  </button>
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit}>
                  <label className={styles.label} style={{ marginBottom: '10px' }}>
                    Bildirim Türünü Seçin
                  </label>
                  <div className={styles.categoryGrid}>
                    <div
                      className={`${styles.categoryBtn} ${feedbackCategory === 'bug' ? styles.selected : ''}`}
                      onClick={() => setFeedbackCategory('bug')}
                    >
                      <span className={styles.catTitle}>🐛 Hata & Teknik Sorun</span>
                      <span className={styles.catDesc}>Arayüz, ses veya sunucu hataları</span>
                    </div>

                    <div
                      className={`${styles.categoryBtn} ${feedbackCategory === 'feature' ? styles.selected : ''}`}
                      onClick={() => setFeedbackCategory('feature')}
                    >
                      <span className={styles.catTitle}>💡 Fikir & Öneri</span>
                      <span className={styles.catDesc}>Yeni özellikler, mekanikler</span>
                    </div>

                    <div
                      className={`${styles.categoryBtn} ${feedbackCategory === 'balance' ? styles.selected : ''}`}
                      onClick={() => setFeedbackCategory('balance')}
                    >
                      <span className={styles.catTitle}>⚖️ Yapay Zeka Dengesi</span>
                      <span className={styles.catDesc}>NPC cevapları, tutarlılık</span>
                    </div>

                    <div
                      className={`${styles.categoryBtn} ${feedbackCategory === 'complaint' ? styles.selected : ''}`}
                      onClick={() => setFeedbackCategory('complaint')}
                    >
                      <span className={styles.catTitle}>⚠️ Şikayet & İtiraz</span>
                      <span className={styles.catDesc}>Oynanış, kota veya hesap</span>
                    </div>

                    <div
                      className={`${styles.categoryBtn} ${feedbackCategory === 'appreciation' ? styles.selected : ''}`}
                      onClick={() => setFeedbackCategory('appreciation')}
                    >
                      <span className={styles.catTitle}>🕊️ Genel Mesaj & Teşekkür</span>
                      <span className={styles.catDesc}>Yapımcılara düşüncelerini ilet</span>
                    </div>
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>
                      Konu Başlığı *
                    </label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="Örn: 3. Gün sorgusunda NPC yanıt vermeyi kesti"
                      value={feedbackSubject}
                      onChange={(e) => setFeedbackSubject(e.target.value)}
                      required
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>
                      Detaylı Açıklama *
                      <span className={styles.hint}>Adım adım ne olduğunu aktarın</span>
                    </label>
                    <textarea
                      className={styles.textarea}
                      style={{ minHeight: '140px' }}
                      placeholder="Sorun nerede gerçekleşti, hangi adımları izlediniz veya neyin iyileştirilmesini istersiniz?"
                      value={feedbackMessage}
                      onChange={(e) => setFeedbackMessage(e.target.value)}
                      required
                    />
                  </div>

                  <div className={styles.grid2}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>İletişim E-Postası (Opsiyonel)</label>
                      <input
                        type="email"
                        className={styles.input}
                        placeholder="ornek@inquisitor.com"
                        value={feedbackContact}
                        onChange={(e) => setFeedbackContact(e.target.value)}
                      />
                    </div>

                    <div className={styles.fieldGroup} style={{ justifyContent: 'center' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                        <input
                          type="checkbox"
                          checked={includeSystemSpecs}
                          onChange={(e) => setIncludeSystemSpecs(e.target.checked)}
                        />
                        <span>Hata tespiti için tarayıcı ve oturum bilgilerini rapora iliştir</span>
                      </label>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #8a7f72)', marginLeft: '24px' }}>
                        (Cihaz türü, ekran boyutu ve anonim oturum kimliği eklenir)
                      </span>
                    </div>
                  </div>

                  <div className={styles.submitBar}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted, #8a7f72)' }}>
                      Engizisyon yapımcıları tüm bildirimleri periyodik olarak değerlendirir.
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={styles.submitPrimary}
                    >
                      {isSubmitting ? 'Gönderiliyor...' : 'Geri Bildirimi İlet'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: GUIDELINES & CRITERIA */}
        {activeTab === 'rules' && (
          <div>
            <div className={styles.card}>
              <h2 className={styles.cardTitle} style={{ marginBottom: '16px' }}>
                <span>📜</span>
                <span>Engizisyon Vaka Kabul Kriterleri</span>
              </h2>
              <p className={styles.cardDesc} style={{ marginBottom: '24px' }}>
                Topluluk tarafından gönderilen hikayelerin ana oyuna eklenmesi için Konsey Moderatörlerinin gözettiği temel standartlar aşağıdadır:
              </p>

              <div className={styles.ruleCard}>
                <h4>1. Çözülebilirlik ve Mantık Zinciri</h4>
                <p>
                  Vakada katil oyuncunun tamamen şans eseri tahmin edeceği biri olmamalıdır.
                  Olay yeri incelemesi, arama izinleri ve diyalog çelişkileri birleştiğinde tek bir mantıksal sonuca işaret etmelidir.
                </p>
              </div>

              <div className={styles.ruleCard}>
                <h4>2. Masumların Sırları (Red Herrings)</h4>
                <p>
                  Masum şüpheliler düz ve sıkıcı olmamalıdır. Her birinin kendi utancı, hırsızlığı veya sakladığı bir sırrı bulunmalı, böylece oyuncu sorgu esnasında onları da şüpheli görmelidir.
                </p>
              </div>

              <div className={styles.ruleCard}>
                <h4>3. Edebi Dil ve Atmosfer</h4>
                <p>
                  Oyunun karanlık, gotik ve psikolojik gerilim tonu korunmalıdır. Kaba mizah, modern sokak ağzı veya atmosferi bozan referanslar içeren vakalar onaylanmaz.
                </p>
              </div>

              <div className={styles.ruleCard}>
                <h4>4. Hakikat (Truth Reveal) Tutarlılığı</h4>
                <p>
                  Soruşturma sonunda gösterilen hakikat paragrafı, hikayedeki tüm kanıtları ve karakterlerin neden yalan söylediğini açıkça aydınlatmalıdır.
                </p>
              </div>

              <div style={{ marginTop: '24px', textAlign: 'center' }}>
                <button
                  onClick={() => {
                    setActiveTab('story');
                    handleLoadSample();
                  }}
                  className={styles.actionButton}
                  style={{ borderColor: '#DAA520', color: '#DAA520', padding: '10px 20px' }}
                >
                  Örnek Vaka Şablonunu İnceleyerek Başla →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PREVIEW MODAL */}
        {showPreviewModal && (
          <div className={styles.modalOverlay} onClick={() => setShowPreviewModal(false)}>
            <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
              <button className={styles.modalClose} onClick={() => setShowPreviewModal(false)}>✕</button>
              <div style={{ borderBottom: '1px solid rgba(138,3,3,0.4)', paddingBottom: '16px', marginBottom: '20px' }}>
                <span style={{ fontSize: '0.75rem', letterSpacing: '2px', color: '#8A0303', textTransform: 'uppercase' }}>
                  - VAKA DOSYASI (DOSSIER ÖNİZLEME) -
                </span>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.6rem', color: '#E8DCC4', marginTop: '4px' }}>
                  {form.title || 'İsimsiz Vaka'}
                </h3>
                <div style={{ fontSize: '0.85rem', color: '#DAA520', marginTop: '4px' }}>
                  Yazar: {form.authorName || 'Bilinmiyor'} | Çağ: {form.scenarioType} | Zorluk: {form.difficulty}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '0.8rem', color: '#8a7f72', textTransform: 'uppercase', marginBottom: '4px' }}>Giriş Anlatısı:</div>
                <p style={{ fontStyle: 'italic', fontSize: '0.9rem', lineHeight: 1.6, color: '#e8dcc4', background: 'rgba(0,0,0,0.4)', padding: '12px', borderLeft: '2px solid #8A0303' }}>
                  {form.prologueHook || 'Henüz giriş anlatısı yazılmadı.'}
                </p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '0.8rem', color: '#8a7f72', textTransform: 'uppercase', marginBottom: '4px' }}>Mekan & Olay Yeri:</div>
                <div style={{ fontSize: '0.9rem', color: '#e8dcc4' }}>
                  <strong>{form.crimeLocation}</strong> ({form.crimeStyle === 'HURRIED' ? 'Telaşlı / Boğuşmalı cinayet' : 'Planlı / Düzenli cinayet'})
                </div>
                <div style={{ fontSize: '0.85rem', color: '#a09585', marginTop: '4px' }}>
                  {form.victimDescription || 'Kurban bilgisi girilmedi.'}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '0.8rem', color: '#8a7f72', textTransform: 'uppercase', marginBottom: '4px' }}>Şüpheliler:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {form.suspects.map((s, idx) => (
                    <div key={idx} style={{ background: s.isCulprit ? 'rgba(138,3,3,0.2)' : 'rgba(255,255,255,0.03)', padding: '8px 12px', border: '1px solid rgba(232,220,196,0.1)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <strong>{s.name || `Şüpheli #${idx + 1}`} ({s.role || 'Rol yok'})</strong>
                        <span style={{ color: s.isCulprit ? '#ff6666' : '#8a7f72' }}>
                          {s.isCulprit ? '★ KATİL' : 'Masum'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#8a7f72', marginTop: '2px' }}>
                        Sır: {s.motiveOrSecret || '-'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.8rem', color: '#8a7f72', textTransform: 'uppercase', marginBottom: '4px' }}>Hakikat (Truth Reveal):</div>
                <div style={{ fontSize: '0.85rem', color: '#c5b8a5', lineHeight: 1.5, background: 'rgba(0,0,0,0.5)', padding: '12px' }}>
                  {form.truthReveal || 'Hakikat metni henüz doldurulmadı.'}
                </div>
              </div>

              <div style={{ marginTop: '24px', textAlign: 'right' }}>
                <button onClick={() => setShowPreviewModal(false)} className={styles.actionButton}>
                  Kapat
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUCCESS CONFIRMATION MODAL */}
        {showSuccessModal && (
          <div className={styles.modalOverlay} onClick={() => setShowSuccessModal(false)}>
            <div className={styles.modalBox} style={{ textAlign: 'center', borderColor: '#DAA520' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📜</div>
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem', color: '#DAA520', marginBottom: '8px' }}>
                Vakanız Konseye Ulaştı!
              </h3>
              <p style={{ color: '#E8DCC4', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '20px' }}>
                <strong>"{form.title}"</strong> başlıklı vakanız başarıyla taslak arşivine teslim edildi.
              </p>
              <div style={{ background: 'rgba(138,3,3,0.15)', border: '1px solid rgba(138,3,3,0.4)', padding: '16px', textAlign: 'left', fontSize: '0.85rem', lineHeight: 1.6, color: '#e8dcc4', marginBottom: '24px' }}>
                <div style={{ fontWeight: 600, color: '#ff9999', marginBottom: '4px' }}>Onay Süreci Hakkında:</div>
                • Vaka formu, yapay zeka istem formatına ve veritabanı şemasına uygun olarak bölümlenmiştir.<br/>
                • Engizisyon Konseyi (Admin yetkilileri) senaryoyu mantık tutarlılığı ve edebi ton açısından inceleyecektir.<br/>
                • Onaylandığı takdirde bir sonraki oyun güncellemesinde vaka havuzuna dahil edilecek ve tüm oyuncular tarafından çözülebilecektir.
              </div>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  setActiveTab('story');
                }}
                className={styles.submitPrimary}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Tamamla ve Arşive Dön
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
