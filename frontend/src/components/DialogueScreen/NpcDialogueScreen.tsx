'use client';

import { useState, useEffect, useLayoutEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getInterior } from '@/config/interiorConfig';
import { revealScene, showScene } from '@/components/SceneTransition/sceneStore';
import { interiorScene, mapScene } from '@/components/SceneTransition/scenes';
import {
  getNpcDialoguePortrait,
  getNpcDialogueGreeting,
} from '@/config/dialogueConfig';
import { getNpcProfile } from '@/config/npcProfiles';
import { getCrimeSceneImage, getCrimeSceneLabel } from '@/config/crimeScenes';
import { getLocationLabel } from '@/config/locationLabels';
import { getQuickQuestions } from '@/config/quickQuestions';
import NotebookModal from '@/components/CaseModals/NotebookModal';
import InventoryModal from '@/components/CaseModals/InventoryModal';
import { api, ApiError } from '@/shared/api/client';
import { logger } from '@/shared/lib/logger';
import {
  HeartPulse,
  Hand,
  Search,
  MessageSquare,
  Compass,
  ArrowLeft,
  Send,
  BookOpen,
  Briefcase,
  Scale,
  ListChecks,
  Quote,
} from 'lucide-react';
import { useGameStore, type EvidenceItem } from '@/store/useGameStore';
import { resolveNpcAlias } from './npcAliases';
import DialogueHistoryDrawer, { type DialogueMessage } from './components/DialogueHistoryDrawer/DialogueHistoryDrawer';
import ConfrontModal from './components/ConfrontModal/ConfrontModal';
import QuoteModal, { type QuoteOption } from './components/QuoteModal/QuoteModal';
import DialogueConfirmModal from './components/DialogueConfirmModal/DialogueConfirmModal';
import styles from './NpcDialogueScreen.module.scss';
import { useAbilities } from '@/features/abilities/useAbilities';
import AbilityControls from '@/features/abilities/AbilityControls';
import type { AbilityId } from '@/features/abilities/abilityTypes';

type FearBand = 'CALM' | 'UNEASY' | 'NERVOUS' | 'PANIC';

// Sorgudaki şüpheliye doğrudan uygulanan yetenekler
const DIALOGUE_ABILITIES: AbilityId[] = [
  'threat',
  'quiet_room',
  'archive_summary',
  'contradiction_scan',
  'visor_lock',
];

const FEAR_LABELS: Record<FearBand, string> = {
  CALM: 'Sakin',
  UNEASY: 'Tedirgin',
  NERVOUS: 'Terliyor, elleri titriyor',
  PANIC: 'Paniğe kapıldı',
};

type Message = DialogueMessage;

export interface NpcDialogueScreenProps {
  npcKey: string;
  onClose?: () => void;
}

export default function NpcDialogueScreen({ npcKey }: NpcDialogueScreenProps) {
  const router = useRouter();
  const {
    scenarioType,
    username,
    isAdmin,
    dialoguesUsedToday,
    incrementDialogue,
    setDialoguesUsed,
    sessionId,
    setCurrentDay,
    currentDay,
    lastDay,
    applySecondBreath,
    setTimeOfDay,
    timeOfDay,
    setNotes,
    authToken,
    inventory,
    addWarrant,
    consumeWarrant,
    evidence,
    setEvidence,
    addEvidence,
    hasHydrated,
    crimeScene,
  } = useGameStore();

  const { actualNpcKey, inferredScenario } = resolveNpcAlias(npcKey);
  const [urlScenario, setUrlScenario] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const q = new URLSearchParams(window.location.search).get('scenario');
      // eslint-disable-next-line react-hooks/set-state-in-effect -- URL yalnızca tarayıcıda okunabilir; sunucu render'ıyla uyuşsun diye mount sonrası
      if (q) setUrlScenario(q);
    }
  }, []);

  const scenario = inferredScenario || urlScenario || scenarioType || 'medieval';
  const baseProfile = getNpcProfile(actualNpcKey, scenario) ?? {
    name: 'Meçhul Köylü',
    title: 'Gölgelerin arasından bir yabancı',
    icon: '👤',
  };
  // Olay yeri her vakada evrenin 5 yerinden biridir: adı ve görseli o yerin
  const crimeSceneLabel =
    actualNpcKey === 'crime_scene' ? getCrimeSceneLabel(scenario, crimeScene) : null;
  const profile = crimeSceneLabel
    ? { ...baseProfile, name: crimeSceneLabel, title: 'Cinayet mahalli' }
    : baseProfile;

  const crimeSceneImage =
    actualNpcKey === 'crime_scene' ? getCrimeSceneImage(scenario, crimeScene) : null;
  // Görseli henüz çizilmemiş olay yerinde eski arka plan gösterilir
  const [missingImage, setMissingImage] = useState<string | null>(null);
  const portraitUrl =
    crimeSceneImage && missingImage !== crimeSceneImage
      ? crimeSceneImage
      : getNpcDialoguePortrait(scenario, actualNpcKey);
  const interior = getInterior(scenario, actualNpcKey);
  const hasInterior = Boolean(interior);

  // Portre yüklenene kadar geçiş ekranı kalır (önbellekteyse hiç açılmaz)
  useLayoutEffect(() => {
    void revealScene([portraitUrl], {
      kicker: 'Sorgu başlıyor',
      title: profile.name,
      subtitle: profile.title,
      image: portraitUrl,
    });
  }, [portraitUrl, profile.name, profile.title]);

  const goToMap = () => showScene(mapScene(scenarioType, timeOfDay, currentDay));
  const goToInterior = () => {
    if (interior) showScene(interiorScene(interior));
  };

  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isQuickQuestionsOpen, setIsQuickQuestionsOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isEvidencePickerOpen, setIsEvidencePickerOpen] = useState(false);
  const [isQuotePickerOpen, setIsQuotePickerOpen] = useState(false);
  const [fear, setFear] = useState<{ level: number; band: FearBand } | null>(null);
  const abilities = useAbilities(sessionId);
  const teyit = abilities.abilities.find((a) => a.id === 'verify_quote');
  const [shownEvidenceIds, setShownEvidenceIds] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const MAX_CHARS = 200;
  const isCrimeScene = actualNpcKey === 'crime_scene';
  const [isInvestigating, setIsInvestigating] = useState(isCrimeScene);
  const currentNpcKey = isInvestigating ? `narrator_${actualNpcKey}` : actualNpcKey;
  const canInvestigate = isCrimeScene || inventory?.activeWarrants?.includes(actualNpcKey);

  const canConfront = !isInvestigating && !isCrimeScene && evidence.length > 0;
  // Hazır sorular karakterlere sorulur; mekân araştırmasında ve olay yerinde gösterilmez
  const canAskQuickQuestions = !isInvestigating && !isCrimeScene;
  const quickQuestions = getQuickQuestions({ scenarioType: scenario, username });

  const evidenceSource = (item: EvidenceItem) =>
    item.category === 'ITEM'
      ? getLocationLabel(item.sourceId, scenario)
      : getNpcProfile(item.sourceId, scenario)?.name ?? item.sourceId;

  // İç mekândaki "Burayı Araştır" (?ara=1) doğrudan arama moduyla açar
  useEffect(() => {
    if (!hasHydrated) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('ara') !== '1') return;
    window.history.replaceState(null, '', window.location.pathname);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- ?ara=1 parametresi yalnızca tarayıcıda okunabilir
    if (canInvestigate) setIsInvestigating(true);
    else setToast('Bu mekânı araştırmak için önce arama izni almalısın.');
  }, [hasHydrated, canInvestigate]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (hasHydrated && !authToken && process.env.NODE_ENV === 'production') {
      router.push('/');
    }
  }, [authToken, router, hasHydrated]);

  // Diyalog geçmişini çek veya ilk selamlamayı yükle
  useEffect(() => {
    const fetchHistory = async () => {
      if (!sessionId) {
        const customGreeting = getNpcDialogueGreeting(scenario, actualNpcKey);
        if (customGreeting && !isInvestigating) {
          setMessages([{ role: 'npc', text: customGreeting, timestamp: new Date() }]);
        } else {
          setMessages([
            {
              role: 'npc',
              text: `*${profile.name} sana dikkatle bakıyor.*\n\n"Buraya neden geldiniz, Engizitör?"`,
              timestamp: new Date(),
            },
          ]);
        }
        setLoading(false);
        return;
      }
      setLoading(true);
      setMessages([]);

      try {
        const data = await api.post<{
          history?: { role: Message['role']; text: string; timestamp: string }[];
          fear?: { level: number; band: FearBand } | null;
          shownEvidenceIds?: string[];
          dialoguesUsed?: number;
          currentDay?: number;
        }>('/npcs/history', { sessionId, npcId: currentNpcKey });

        if (data.history && data.history.length > 0) {
          const formatted = data.history.map((h) => ({
            role: h.role,
            text: h.text,
            timestamp: new Date(h.timestamp),
          }));
          setMessages(formatted);
        } else {
          const customGreeting = getNpcDialogueGreeting(scenario, npcKey);
          if (customGreeting && !isInvestigating) {
            setMessages([{ role: 'npc', text: customGreeting, timestamp: new Date() }]);
          } else if (isInvestigating) {
            setMessages([
              {
                role: 'npc',
                text: `*[Mekân: ${profile.name}] Etrafı araştırmaya başlıyorsun. Ayrıntılara odaklan...*`,
                timestamp: new Date(),
              },
            ]);
          } else {
            setMessages([
              {
                role: 'npc',
                text: `*${profile.name} sana dikkatle bakıyor.*\n\n"Buraya neden geldiniz, Engizitör?"`,
                timestamp: new Date(),
              },
            ]);
          }
        }

        setFear(data.fear ?? null);
        setShownEvidenceIds(Array.isArray(data.shownEvidenceIds) ? data.shownEvidenceIds : []);

        if (typeof data.dialoguesUsed === 'number') {
          setDialoguesUsed(data.dialoguesUsed);
        }
        if (typeof data.currentDay === 'number') {
          setCurrentDay(data.currentDay);
        }

        const sessionData = await api.get<{ notes?: string }>(`/game-sessions/${sessionId}`);
        if (sessionData?.notes) {
          setNotes(sessionData.notes);
        }

        const evidenceData = await api.get<{ evidence: EvidenceItem[] }>(`/game-sessions/${sessionId}/evidence`);
        if (evidenceData && Array.isArray(evidenceData.evidence)) {
          setEvidence(evidenceData.evidence);
        }
      } catch (err) {
        logger.error('History fetch error:', err);
        setMessages([
          {
            role: 'npc',
            text: `*${profile.name} sana kuşkulu bir bakış atıyor.*`,
            timestamp: new Date(),
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [currentNpcKey, profile.name, sessionId, setDialoguesUsed, setCurrentDay, setEvidence, setNotes, isInvestigating, scenario, actualNpcKey, npcKey]);

  const applyTurnResult = (data: {
    newEvidence?: EvidenceItem[];
    notes?: string;
    fear?: { level: number; band: FearBand } | null;
  }) => {
    const fresh = Array.isArray(data.newEvidence) ? data.newEvidence : [];
    if (fresh.length > 0) {
      addEvidence(fresh);
      const hasItem = fresh.some((e) => e.category === 'ITEM');
      const hasStatement = fresh.some((e) => e.category === 'STATEMENT');
      setToast(
        hasItem && hasStatement
          ? 'Yeni kanıt Envanter’e eklendi, ifade Not defterine yazıldı.'
          : hasItem
          ? 'Yeni kanıt Envanter’e eklendi.'
          : 'İfade Not defterine yazıldı.',
      );
    }
    if (typeof data.notes === 'string') {
      setNotes(data.notes);
    }
    if (data.fear !== undefined) {
      setFear(data.fear);
    }
  };

  const sendMessageText = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    const maxLimit = isAdmin ? 999 : 100;
    if (!trimmed || loading || (!isAdmin && dialoguesUsedToday >= maxLimit) || !sessionId) return;

    const userMsg: Message = { role: 'player', text: trimmed, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    // Hazır soru gönderilince oyuncunun yarım kalmış yazısı silinmesin
    setInput((current) => (current.trim() === trimmed ? '' : current));
    setLoading(true);

    try {
      const data = await api.post<{
        reply?: string;
        grantedWarrants?: string[];
        newEvidence?: EvidenceItem[];
        notes?: string;
        fear?: { level: number; band: FearBand } | null;
        message?: string;
      }>('/npcs/interact', {
        sessionId,
        npcId: currentNpcKey,
        message: trimmed,
      });

      if (data.grantedWarrants && data.grantedWarrants.length > 0) {
        data.grantedWarrants.forEach((w: string) => addWarrant(w));
        const locNames = data.grantedWarrants
          .map((w: string) => getLocationLabel(w, scenario))
          .join(' ve ');

        setConfirmModal({
          isOpen: true,
          title: 'Arama İzni Alındı',
          message: `${profile.name} sana ${locNames} için arama izni verdi.`,
          onConfirm: () => setConfirmModal((prev) => ({ ...prev, isOpen: false })),
        });
      }

      if (data.reply) {
        setMessages((prev) => [...prev, { role: 'npc', text: data.reply!, timestamp: new Date() }]);
        incrementDialogue();
        applyTurnResult(data);
      } else if (data.message) {
        setMessages((prev) => [...prev, { role: 'npc', text: `*[Sistem hatası: ${data.message}]*`, timestamp: new Date() }]);
      } else {
        setMessages((prev) => [...prev, { role: 'npc', text: '*Karşındaki sessiz kaldı.*', timestamp: new Date() }]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'npc',
          text: '*Sunucuya ulaşılamıyor. Bağlantını kontrol edip birazdan tekrar dene.*',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfront = async (item: EvidenceItem, remark: string) => {
    const maxLimit = isAdmin ? 999 : 100;
    if (loading || (!isAdmin && dialoguesUsedToday >= maxLimit) || !sessionId) return;

    setIsEvidencePickerOpen(false);
    setMessages((prev) => [
      ...prev,
      {
        role: 'player',
        text: `*Ona bir kanıt gösteriyorsun:* ${item.text}${remark ? `\n${remark}` : ''}`,
        timestamp: new Date(),
      },
    ]);
    setLoading(true);

    try {
      const data = await api.post<{
        reply?: string;
        newEvidence?: EvidenceItem[];
        notes?: string;
        fear?: { level: number; band: FearBand } | null;
        message?: string;
      }>('/npcs/confront', {
        sessionId,
        npcId: npcKey,
        evidenceId: item.id,
        ...(remark ? { message: remark } : {}),
      });

      if (data.reply) {
        setShownEvidenceIds((prev) => (prev.includes(item.id) ? prev : [...prev, item.id]));
        setMessages((prev) => [...prev, { role: 'npc', text: data.reply!, timestamp: new Date() }]);
        incrementDialogue();
        applyTurnResult(data);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'npc', text: `*[Sistem hatası: ${data.message ?? 'Kanıt gösterilemedi.'}]*`, timestamp: new Date() },
        ]);
      }
    } catch (err) {
      // Sunucu reddettiyse (ör. kanıt ona zaten gösterilmiş) sebebi gösterilir
      const text =
        err instanceof ApiError
          ? `*[${err.message}]*`
          : '*Sunucuya ulaşılamıyor. Bağlantını kontrol edip birazdan tekrar dene.*';
      setMessages((prev) => [...prev, { role: 'npc', text, timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  // Teyit (Gece Muhabiri): başka bir şüphelinin sözünü bu şüpheliye okur
  const handleVerifyQuote = async (quote: QuoteOption) => {
    if (loading || !sessionId) return;
    setIsQuotePickerOpen(false);
    setMessages((prev) => [
      ...prev,
      { role: 'player', text: `*${quote.name} bana şunu söyledi:* “${quote.text}”`, timestamp: new Date() },
    ]);
    setLoading(true);
    try {
      const data = await api.post<{
        reply?: string;
        newEvidence?: EvidenceItem[];
        notes?: string;
        fear?: { level: number; band: FearBand } | null;
      }>('/npcs/verify-quote', { sessionId, npcId: npcKey, quoteId: quote.id });
      if (data.reply) {
        setMessages((prev) => [...prev, { role: 'npc', text: data.reply!, timestamp: new Date() }]);
        incrementDialogue();
        applyTurnResult(data);
      }
      abilities.refresh();
    } catch (err) {
      const text =
        err instanceof ApiError
          ? `*[${err.message}]*`
          : '*Sunucuya ulaşılamıyor. Bağlantını kontrol edip birazdan tekrar dene.*';
      setMessages((prev) => [...prev, { role: 'npc', text, timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  const handleCondemn = () => {
    if (!sessionId) return;

    setConfirmModal({
      isOpen: true,
      title: 'Nihai Hüküm',
      message: `${profile.name} adlı kişiyi mahkûm etmek istediğine emin misin? Bu karar geri alınamaz.`,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          const data = await api.post<{
            session?: { truthReveal?: string; locationClues?: Record<string, string>; lastDay?: number; timeOfDay?: number };
            reward?: { tokens?: number; score?: number };
            won?: boolean;
            spared?: boolean;
            clearedNpcId?: string;
            message?: string;
          }>(`/game-sessions/${sessionId}/condemn`, { npcId: actualNpcKey });

          // İkinci Nefes (Yeşim Hekim): yanlış hüküm vakayı bitirmez; kişi aklanır, gün kapanır
          if (data.spared && data.clearedNpcId) {
            applySecondBreath(data.clearedNpcId, data.session?.lastDay ?? lastDay);
            if (typeof data.session?.timeOfDay === 'number') setTimeOfDay(data.session.timeOfDay);
            abilities.refresh();
            router.push('/map');
            return;
          }

          if (data.session && data.session.truthReveal) {
            useGameStore.getState().setTruthReveal(data.session.truthReveal);
          }
          if (data.session && data.session.locationClues) {
            useGameStore.getState().setLocationClues(data.session.locationClues);
          }
          const rewardTokens = data.reward?.tokens ? `&rewardTokens=${data.reward.tokens}` : '';
          const scoreEarned = data.reward?.score ? `&scoreEarned=${data.reward.score}` : '';
          router.push(`/result?won=${data.won}&message=${encodeURIComponent(data.message ?? '')}${rewardTokens}${scoreEarned}`);
        } catch (err) {
          logger.error('Failed to condemn', err);
        }
      },
    });
  };

  // Anlık soru ve cevap: son oyuncu sorusu ve son NPC cevabı
  const latestNpcMessage = [...messages].reverse().find((m) => m.role === 'npc');
  const latestPlayerMessage = [...messages].reverse().find((m) => m.role === 'player');
  const maxDaily = isAdmin ? 'Sınırsız' : `${Math.max(0, 30 - dialoguesUsedToday)}/30`;

  return (
    <div className={styles.screen}>
      <div
        className={styles.ambientBackdrop}
        style={{ backgroundImage: `url(${portraitUrl})` }}
      />
      <div className={styles.ambientOverlay} />

      {/* ─── HUD ÜST ÇUBUK ─── */}
      <header className={styles.headerHud}>
        <div className={styles.navGroup}>
          {hasInterior ? (
            <Link
              href={`/interior/${actualNpcKey}`}
              className={`${styles.backBtn} ${styles.interiorBackBtn}`}
              onClick={goToInterior}
              title="Mekânın içini 360° incele"
            >
              <Compass size={15} />
              <span>Mekâna Dön (360°)</span>
            </Link>
          ) : (
            <Link href="/map" className={styles.backBtn} onClick={goToMap}>
              <ArrowLeft size={15} />
              <span>Haritaya Dön</span>
            </Link>
          )}

          {hasInterior && (
            <Link href="/map" className={styles.backBtn} style={{ opacity: 0.8 }} onClick={goToMap}>
              <span>Harita</span>
            </Link>
          )}
        </div>

        <div className={styles.hudRight}>
          {fear && (
            <div className={`${styles.fearPill} ${styles[`fear${fear.band}`]}`} title="Karakterin Ruh Hâli">
              <HeartPulse size={13} />
              <span>{FEAR_LABELS[fear.band]}</span>
            </div>
          )}

          <div className={styles.quotaPill} title="Günlük Kalan Sorgu Hakkı">
            <span>Sorgu:</span>
            <span className={styles.quotaValue}>{maxDaily}</span>
          </div>

          <button
            className={styles.hudActionBtn}
            onClick={() => setIsNotesOpen(true)}
            title="Engizitörün Not Defteri"
          >
            <BookOpen size={14} />
            <span>Notlar</span>
          </button>

          <button
            className={styles.hudActionBtn}
            onClick={() => setIsInventoryOpen(true)}
            title="Envanter ve İzinler"
          >
            <Briefcase size={14} />
            <span>Envanter</span>
          </button>
        </div>
      </header>

      {/* ─── MERKEZİ DİYALOG SAHNESİ (ÇERÇEVELİ VİTRİN) ─── */}
      <main className={styles.stageContainer}>
        <div className={styles.portraitWindow}>
          {/* Çerçeveli Karakter Portresi */}
          <div className={styles.portraitCanvas}>
            <img
              src={portraitUrl}
              alt={profile.name}
              className={`${styles.characterImg} ${portraitUrl === crimeSceneImage ? styles.crimeSceneImg : ''}`}
              onError={() => {
                if (portraitUrl === crimeSceneImage) setMissingImage(crimeSceneImage);
              }}
            />
            <div className={styles.portraitVignette} />
          </div>

          {/* Kart: Çerçevenin Alt Kısmında Konumlanır (Yalnızca Anlık Soru, Cevap ve Soru Girişi) */}
          <div className={styles.dialogueCard}>
            {/* NPC İsim Rozeti (Sol Üstte Asılı) */}
            <div className={styles.nameBadge}>
              <span className={styles.nameBadgeText}>
                {isInvestigating && !crimeSceneLabel ? 'Fiziksel Çevre' : profile.name}
              </span>
              <span className={styles.nameBadgeTitle}>
                {isInvestigating && !crimeSceneLabel ? 'Mekân Araştırması' : profile.title}
              </span>
            </div>

            {/* Anlık Soru ve Cevap Alanı */}
            <div className={styles.dialogueContent}>
              {/* Oyuncunun Anlık Sorusu (Varsa) */}
              {latestPlayerMessage && (
                <div className={styles.playerTurn}>
                  <span className={styles.turnSpeaker}>Sen:</span>
                  <span className={styles.playerQueryText}>
                    &ldquo;{latestPlayerMessage.text}&rdquo;
                  </span>
                </div>
              )}

              {/* NPC'nin Anlık Yanıtı */}
              <div className={styles.npcTurn}>
                {isInvestigating && (
                  <div className={styles.investigatingNotice}>
                    <span>🔍 Mekân Araştırma Modu</span>
                  </div>
                )}

                {loading ? (
                  <div className={styles.typingIndicator}>
                    <span>{isInvestigating ? 'İnceleniyor' : `${profile.name} düşünüyor`}</span>
                    <div className={styles.typingDots}>
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                ) : latestNpcMessage ? (
                  <div className={styles.speechText}>
                    {latestNpcMessage.text}
                  </div>
                ) : (
                  <div className={styles.speechText} style={{ opacity: 0.6 }}>
                    ...
                  </div>
                )}
              </div>
            </div>

            {/* Hazır Sorular: genel sorgu cümleleri tek tıkla sorulur */}
            {isQuickQuestionsOpen && canAskQuickQuestions && (
              <div className={styles.quickQuestions} role="group" aria-label="Hazır sorular">
                {quickQuestions.map((question) => (
                  <button
                    key={question.label}
                    type="button"
                    className={styles.quickQuestionBtn}
                    onClick={() => sendMessageText(question.text)}
                    disabled={loading}
                    title={question.text}
                  >
                    {question.label}
                  </button>
                ))}
              </div>
            )}

            {/* Doğrudan Soru Yazma ve Gönderme Alanı */}
            <form
              className={styles.inputBar}
              onSubmit={(e) => {
                e.preventDefault();
                sendMessageText(input);
              }}
            >
              <input
                type="text"
                className={styles.textInput}
                value={input}
                onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
                placeholder={isInvestigating ? 'Neyi incelemek istiyorsun?' : `${profile.name}'e sorunu sor...`}
                disabled={loading}
                maxLength={MAX_CHARS}
                autoFocus
              />
              <div className={styles.charCount}>
                {input.length}/{MAX_CHARS}
              </div>
              <button
                type="submit"
                className={styles.sendBtn}
                disabled={loading || !input.trim()}
                title="Soruyu gönder"
              >
                <Send size={14} />
                <span>Sor</span>
              </button>
            </form>

            {/* Kart Altı Araçlar ve Eylemler */}
            <footer className={styles.cardFooter}>
              <div className={styles.footerLeft}>
                <button
                  className={styles.utilityBtn}
                  onClick={() => setIsHistoryDrawerOpen(true)}
                  title="Tüm önceki konuşmaları görüntüle"
                >
                  <MessageSquare size={13} />
                  <span>Chat Geçmişi ({messages.length})</span>
                </button>

                {canAskQuickQuestions && (
                  <button
                    className={`${styles.utilityBtn} ${isQuickQuestionsOpen ? styles.activeUtilityBtn : ''}`}
                    onClick={() => setIsQuickQuestionsOpen((open) => !open)}
                    aria-expanded={isQuickQuestionsOpen}
                    title="Sık sorulan soruları tek tıkla sor"
                  >
                    <ListChecks size={13} />
                    <span>Hazır Sorular</span>
                  </button>
                )}

                {!isInvestigating && !isCrimeScene && (
                  <button
                    className={styles.utilityBtn}
                    onClick={() => setIsEvidencePickerOpen(true)}
                    disabled={!canConfront || loading}
                    title={canConfront ? 'Kanıt göstererek yüzleştir' : 'Henüz gösterilecek kanıt yok'}
                  >
                    <Hand size={13} />
                    <span>Kanıt Göster</span>
                  </button>
                )}

                {!isInvestigating && !isCrimeScene && teyit?.available && (
                  <button
                    className={styles.utilityBtn}
                    onClick={() => setIsQuotePickerOpen(true)}
                    disabled={loading}
                    title="Bir şüphelinin sözünü bu kişiye oku"
                  >
                    <Quote size={13} />
                    <span>Teyit</span>
                  </button>
                )}

                {!isInvestigating && !isCrimeScene && (
                  <AbilityControls
                    abilities={abilities}
                    only={DIALOGUE_ABILITIES}
                    npcId={actualNpcKey}
                    npcName={profile.name}
                    variant="inline"
                    onResult={(_ability, result) => {
                      if (result.notes !== undefined) setNotes(result.notes);
                      if (result.fear) setFear({ level: result.fear.level, band: result.fear.band as FearBand });
                    }}
                  />
                )}

                {!isInvestigating ? (
                  <button
                    className={`${styles.utilityBtn} ${canInvestigate ? styles.activeUtilityBtn : ''}`}
                    onClick={() => {
                      if (canInvestigate) {
                        setIsInvestigating(true);
                      } else {
                        setToast('Bu mekânı araştırmak için önce arama izni almalısın.');
                      }
                    }}
                    disabled={loading}
                    title={canInvestigate ? 'Mekânı araştırma moduna geç' : 'Arama izni gerekli'}
                  >
                    <Search size={13} />
                    <span>Mekânı Araştır</span>
                  </button>
                ) : (
                  !isCrimeScene && (
                    <button
                      className={`${styles.utilityBtn} ${styles.activeUtilityBtn}`}
                      onClick={() => {
                        setConfirmModal({
                          isOpen: true,
                          title: 'Araştırmayı Bitir',
                          message: 'Araştırmayı bitirirsen bu mekânın arama izni kullanılmış sayılır. Emin misin?',
                          onConfirm: async () => {
                            setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                            consumeWarrant(actualNpcKey);
                            setIsInvestigating(false);
                            try {
                              await api.post(`/game-sessions/${sessionId}/consume-warrant`, {
                                location: actualNpcKey,
                              });
                            } catch (e) {
                              logger.error('Failed to consume warrant', e);
                            }
                          },
                        });
                      }}
                    >
                      <span>⏹️ Araştırmayı Bitir</span>
                    </button>
                  )
                )}
              </div>

              <div className={styles.footerRight}>
                {!isInvestigating && !isCrimeScene && (
                  <button
                    className={`${styles.utilityBtn} ${styles.condemnUtilityBtn}`}
                    onClick={handleCondemn}
                    title="Şüpheliyi doğrudan suçlu ilan et ve yargıla"
                  >
                    <Scale size={13} />
                    <span>Hüküm Ver</span>
                  </button>
                )}
              </div>
            </footer>
          </div>
      </div>
    </main>

      {/* ─── DİYALOG GEÇMİŞİ ÇEKMECESİ ─── */}
      <DialogueHistoryDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        messages={messages}
        npcName={profile.name}
      />

      {/* ─── NOTLAR MODALI ─── */}
      {isNotesOpen && <NotebookModal onClose={() => setIsNotesOpen(false)} />}

      {/* ─── ENVANTER MODALI ─── */}
      {isInventoryOpen && <InventoryModal onClose={() => setIsInventoryOpen(false)} />}

      {/* ─── KANIT GÖSTERME (CONFRONT) MODALI ─── */}
      <ConfrontModal
        isOpen={isEvidencePickerOpen}
        onClose={() => setIsEvidencePickerOpen(false)}
        npcName={profile.name}
        evidence={evidence}
        shownEvidenceIds={shownEvidenceIds}
        loading={loading}
        onConfront={handleConfront}
        evidenceSource={evidenceSource}
      />

      <QuoteModal
        isOpen={isQuotePickerOpen}
        onClose={() => setIsQuotePickerOpen(false)}
        sessionId={sessionId}
        npcId={npcKey}
        npcName={profile.name}
        loading={loading}
        onPick={handleVerifyQuote}
      />

      {/* ─── ONAY MODALI ─── */}
      <DialogueConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
      />

      {/* ─── BİLDİRİM TOAST ─── */}
      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  );
}
