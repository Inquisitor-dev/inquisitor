'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Feather,
  MessageSquare,
  Scale,
  ScrollText,
} from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { getAvatarSrc } from '@/config/avatars';
import {
  ScenarioForm,
  SuspectEntry,
  INITIAL_FORM,
  SAMPLE_SCENARIO,
} from './data/communityData';
import StoryTab from './components/StoryTab/StoryTab';
import FeedbackTab, { FeedbackCategoryType } from './components/FeedbackTab/FeedbackTab';
import RulesTab from './components/RulesTab/RulesTab';
import PreviewModal from './components/PreviewModal/PreviewModal';
import SuccessModal from './components/SuccessModal/SuccessModal';
import styles from './page.module.scss';

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
  const [feedbackCategory, setFeedbackCategory] = useState<FeedbackCategoryType>('bug');
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
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleSaveDraft = () => {
    try {
      localStorage.setItem('inquisitor_community_story_draft', JSON.stringify(form));
      triggerToast('Taslak tarayıcına kaydedildi.');
    } catch {
      triggerToast('Taslak kaydedilemedi.');
    }
  };

  const handleLoadSample = () => {
    setForm(SAMPLE_SCENARIO);
    triggerToast('Örnek vaka yüklendi. İstediğin gibi düzenleyebilirsin.');
  };

  const handleClearDraft = () => {
    if (window.confirm('Tüm alanları sıfırlamak istediğine emin misin?')) {
      setForm(INITIAL_FORM);
      localStorage.removeItem('inquisitor_community_story_draft');
      triggerToast('Taslak sıfırlandı.');
    }
  };

  const handleSuspectChange = (index: number, field: keyof SuspectEntry, value: string | boolean) => {
    const updated = [...form.suspects];
    if (field === 'isCulprit' && value === true) {
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

        {/* Sekmeler */}
        <nav className={styles.tabs} role="tablist" aria-label="Topluluk bölümleri">
          <button
            type="button"
            role="tab"
            onClick={() => setActiveTab('story')}
            className={`${styles.tab} ${activeTab === 'story' ? styles.tabActive : ''}`}
            aria-selected={activeTab === 'story'}
          >
            <Feather size={16} /> Vaka Kaleme Al
          </button>
          <button
            type="button"
            role="tab"
            onClick={() => setActiveTab('feedback')}
            className={`${styles.tab} ${activeTab === 'feedback' ? styles.tabActive : ''}`}
            aria-selected={activeTab === 'feedback'}
          >
            <MessageSquare size={16} /> Geri Bildirim ve İletişim
          </button>
          <button
            type="button"
            role="tab"
            onClick={() => setActiveTab('rules')}
            className={`${styles.tab} ${activeTab === 'rules' ? styles.tabActive : ''}`}
            aria-selected={activeTab === 'rules'}
          >
            <Scale size={16} /> Konsey Kuralları
          </button>
        </nav>

        {/* SEKME 1: VAKA YAZARI */}
        {activeTab === 'story' && (
          <StoryTab
            form={form}
            setForm={setForm}
            isSubmitting={isSubmitting}
            onSubmit={handleStorySubmit}
            onPreview={() => setShowPreviewModal(true)}
            onLoadSample={handleLoadSample}
            onSaveDraft={handleSaveDraft}
            onClearDraft={handleClearDraft}
            checklist={checklist}
            doneCount={doneCount}
            handleSuspectChange={handleSuspectChange}
            addSuspect={addSuspect}
            removeSuspect={removeSuspect}
          />
        )}

        {/* SEKME 2: GERİ BİLDİRİM */}
        {activeTab === 'feedback' && (
          <FeedbackTab
            feedbackCategory={feedbackCategory}
            setFeedbackCategory={setFeedbackCategory}
            feedbackSubject={feedbackSubject}
            setFeedbackSubject={setFeedbackSubject}
            feedbackMessage={feedbackMessage}
            setFeedbackMessage={setFeedbackMessage}
            feedbackContact={feedbackContact}
            setFeedbackContact={setFeedbackContact}
            includeSystemSpecs={includeSystemSpecs}
            setIncludeSystemSpecs={setIncludeSystemSpecs}
            feedbackSubmitted={feedbackSubmitted}
            setFeedbackSubmitted={setFeedbackSubmitted}
            isSubmitting={isSubmitting}
            onSubmit={handleFeedbackSubmit}
          />
        )}

        {/* SEKME 3: KONSEY KURALLARI */}
        {activeTab === 'rules' && (
          <RulesTab
            onLoadSample={handleLoadSample}
            onGoToStory={() => setActiveTab('story')}
          />
        )}

        {/* ÖNİZLEME MODALI */}
        <PreviewModal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          form={form}
        />

        {/* GÖNDERİM ONAYI MODALI */}
        <SuccessModal
          isOpen={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false);
            setActiveTab('story');
          }}
          title={form.title}
        />

        {saveToast && (
          <div className={styles.toast} role="status">
            <ScrollText size={16} /> {saveToast}
          </div>
        )}
      </div>
    </main>
  );
}
