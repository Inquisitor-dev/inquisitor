import React from 'react';
import {
  ArrowRight,
  Check,
  Circle,
  Eye,
  Plus,
  RotateCcw,
  Save,
  Skull,
  Sparkles,
  X,
} from 'lucide-react';
import {
  ScenarioForm,
  SuspectEntry,
  SCENARIO_LABELS,
} from '../../data/communityData';
import styles from '../../page.module.scss';

interface StoryTabProps {
  form: ScenarioForm;
  setForm: React.Dispatch<React.SetStateAction<ScenarioForm>>;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onPreview: () => void;
  onLoadSample: () => void;
  onSaveDraft: () => void;
  onClearDraft: () => void;
  checklist: { label: string; done: boolean }[];
  doneCount: number;
  handleSuspectChange: (index: number, field: keyof SuspectEntry, value: string | boolean) => void;
  addSuspect: () => void;
  removeSuspect: (index: number) => void;
}

export default function StoryTab({
  form,
  setForm,
  isSubmitting,
  onSubmit,
  onPreview,
  onLoadSample,
  onSaveDraft,
  onClearDraft,
  checklist,
  doneCount,
  handleSuspectChange,
  addSuspect,
  removeSuspect,
}: StoryTabProps) {
  return (
    <div className={styles.storyLayout}>
      <form onSubmit={onSubmit} className={styles.storyForm}>
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
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          <div className={styles.grid2}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Evren</label>
              <select
                className={styles.select}
                value={form.scenarioType}
                onChange={(e) => setForm((prev) => ({ ...prev, scenarioType: e.target.value as ScenarioForm['scenarioType'] }))}
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
                onChange={(e) => setForm((prev) => ({ ...prev, difficulty: e.target.value as ScenarioForm['difficulty'] }))}
              >
                <option value="easy">Kolay — 5 şüpheli, sade bir ilişki ağı</option>
                <option value="medium">Orta — 6 şüpheli, çapraz ittifaklar</option>
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
                onChange={(e) => setForm((prev) => ({ ...prev, authorName: e.target.value }))}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Cinayetin işleniş biçimi</label>
              <select
                className={styles.select}
                value={form.crimeStyle}
                onChange={(e) => setForm((prev) => ({ ...prev, crimeStyle: e.target.value as ScenarioForm['crimeStyle'] }))}
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
                onChange={(e) => setForm((prev) => ({ ...prev, crimeLocation: e.target.value }))}
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
                onChange={(e) => setForm((prev) => ({ ...prev, victimDescription: e.target.value }))}
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
              onChange={(e) => setForm((prev) => ({ ...prev, prologueHook: e.target.value }))}
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
                onChange={(e) => setForm((prev) => ({ ...prev, crimeSceneClue: e.target.value }))}
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
                onChange={(e) => setForm((prev) => ({ ...prev, redHerringClue: e.target.value }))}
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
                onChange={(e) => setForm((prev) => ({ ...prev, hiddenLocationClue: e.target.value }))}
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
              onChange={(e) => setForm((prev) => ({ ...prev, truthReveal: e.target.value }))}
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
            <button type="button" onClick={onPreview} className={styles.ghostBtn}>
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

      {/* DOSYA DURUMU SIDEBAR */}
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
            <button type="button" onClick={onLoadSample} className={`${styles.toolBtn} ${styles.toolGold}`}>
              <Sparkles size={15} /> Örnek Vakayı Yükle
            </button>
            <button type="button" onClick={onSaveDraft} className={styles.toolBtn}>
              <Save size={15} /> Taslağı Kaydet
            </button>
            <button type="button" onClick={onPreview} className={styles.toolBtn}>
              <Eye size={15} /> Vaka Dosyasını Önizle
            </button>
            <button type="button" onClick={onClearDraft} className={`${styles.toolBtn} ${styles.toolDanger}`}>
              <RotateCcw size={15} /> Sıfırla
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
