'use client';

import { useState, useEffect, useLayoutEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/config/api';
import { getInterior } from '@/config/interiorConfig';
import { revealScene, showScene } from '@/components/SceneTransition/sceneStore';
import { interiorScene, mapScene } from '@/components/SceneTransition/scenes';
import {
  getNpcDialoguePortrait,
  getNpcDialogueGreeting,
} from '@/config/dialogueConfig';
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
} from 'lucide-react';
import { useGameStore, type EvidenceItem } from '@/store/useGameStore';
import styles from './NpcDialogueScreen.module.scss';

type FearBand = 'CALM' | 'UNEASY' | 'NERVOUS' | 'PANIC';

const FEAR_LABELS: Record<FearBand, string> = {
  CALM: 'Sakin',
  UNEASY: 'Tedirgin',
  NERVOUS: 'Terliyor, elleri titriyor',
  PANIC: 'Paniğe kapıldı',
};

interface Message {
  role: 'player' | 'npc';
  text: string;
  timestamp: Date;
}

const getNpcProfile = (npcKey: string, scenarioType: string) => {
  if (scenarioType === 'china') {
    const profiles: Record<string, { name: string; title: string; icon: string }> = {
      tavern: { name: 'Lin Feng', title: 'Çay Ustası — Altın Lotus Çay Evi', icon: '🍵' },
      church: { name: 'Komutan Zhao', title: 'Muhafız Amiri — İmparatorluk Garnizonu', icon: '🏯' },
      graveyard: { name: 'Keşiş Huikang', title: 'Kadim Tapınak Bilgesi', icon: '⛩️' },
      mill: { name: 'Usta Guan', title: 'Silah Ustası — Demirci Ocağı', icon: '⚒️' },
      farm: { name: 'Mei Teyze', title: 'Balıkçı ve İskele Gözcüsü', icon: '🎣' },
      clinic: { name: 'Bilgin Song', title: 'Saray Eczacısı ve Hekim', icon: '🌿' },
      crime_scene: { name: 'Pazar Meydanı', title: 'Sessiz Tanıklar...', icon: '🩸' },
    };
    return profiles[npcKey];
  } else if (scenarioType === 'cyberpunk') {
    const profiles: Record<string, { name: string; title: string; icon: string }> = {
      tavern: { name: 'Officer Kael Voss', title: 'Memur — Neon Prime Karakolu', icon: '👮' },
      church: { name: 'Mirel Sato', title: 'Lokanta Sahibi — Static Spoon', icon: '🍜' },
      graveyard: { name: 'Brakk Coil', title: 'Siber Cerrah — Neon Prime Kliniği', icon: '🏥' },
      mill: { name: 'AURA-9', title: 'Usta Android — AURA Tamirhanesi', icon: '🛠️' },
      farm: { name: 'Ash', title: 'Sokak Muhbiri — Gece Pazarı', icon: '🏮' },
      clinic: { name: 'Vera Nyx', title: 'Barmen — Velvet Static Bar', icon: '🍸' },
      crime_scene: { name: 'Olay Yeri', title: 'Sessiz Tanıklar...', icon: '🩸' },
    };
    return profiles[npcKey];
  } else if (scenarioType === 'winter') {
    const profiles: Record<string, { name: string; title: string; icon: string }> = {
      tavern: { name: 'Torstein', title: 'Hancı — Ocak Ateşi Hanı', icon: '🔥' },
      church: { name: 'Kahin Valda', title: 'Kutsal Yürek Ağacının Bekçisi', icon: '🍁' },
      graveyard: { name: 'Komutan Bjorn', title: 'Kale Muhafızı — Gözcü Kalesi', icon: '🏰' },
      mill: { name: 'Madenci Durn', title: 'Terk Edilmiş Madenin Ustabaşısı', icon: '⛏️' },
      farm: { name: 'Einar', title: 'Sur Nöbetçisi ve Okçu', icon: '🛡️' },
      clinic: { name: 'Muhafız Kenneth', title: 'İnfaz ve Yargı Meydanı Çavuşu', icon: '⚔️' },
      crime_scene: { name: 'Buzlu Geçit', title: 'Sessiz Tanıklar...', icon: '🩸' },
    };
    return profiles[npcKey];
  } else if (scenarioType === 'modern') {
    const profiles: Record<string, { name: string; title: string; icon: string }> = {
      tavern: { name: 'Şerif Dale Cooper', title: 'Polis Amiri — Karakolun Tek Kanunu', icon: '🚔' },
      church: { name: 'Gerald', title: 'Otel İşletmecisi — Millfield Oteli', icon: '🏨' },
      graveyard: { name: 'Randy', title: 'Video Oyuncusu — Pixel Arcade Salonu', icon: '🎮' },
      mill: { name: 'Donna', title: 'Lokantacı — The Maple Cafe & Diner', icon: '🍽️' },
      farm: { name: 'Earl', title: 'Pompacı — Petrol İstasyonunun Bekçisi', icon: '⛽' },
      clinic: { name: 'David', title: "Barmen — David's Bar", icon: '🍺' },
      crime_scene: { name: 'Olay Yeri', title: 'Sessiz Tanıklar...', icon: '🩸' },
    };
    return profiles[npcKey];
  } else {
    const profiles: Record<string, { name: string; title: string; icon: string }> = {
      tavern: { name: 'Kardeş Aldric', title: 'Hancı — Sırların Bekçisi', icon: '🍺' },
      church: { name: 'Peder Malachar', title: 'Rahip — İki Efendinin Hizmetkârı', icon: '⛪' },
      graveyard: { name: 'İhtiyar Silas', title: 'Mezarcı — Gerçeği Gömüp Saklayan', icon: '🪦' },
      mill: { name: 'Değirmenci Giles', title: 'Değirmenci — Rüzgârın Sırdaşı', icon: '⚙️' },
      farm: { name: 'Çiftçi Edmund', title: 'Çiftçi — Toprağın ve Karanlığın Tanığı', icon: '🌾' },
      clinic: { name: 'Doktor Harland', title: 'Hekim — Soğuk Ellerin ve Gözlerin Sahibi', icon: '🏥' },
      crime_scene: { name: 'Cinayet Mahalli', title: 'Sessiz Tanıklar...', icon: '🩸' },
    };
    return profiles[npcKey];
  }
};

const getLocationLabel = (locationId: string, scenarioType: string) => {
  if (scenarioType === 'china') {
    const labels: Record<string, string> = {
      tavern: 'Çay Evi & Han',
      church: 'Muhafız Karargahı',
      graveyard: 'Kadim Tapınak',
      mill: 'Demirci Ocağı',
      farm: 'Balıkçı İskelesi',
      clinic: 'Şifacı & Baharatçı',
      crime_scene: 'Pazar Meydanı',
    };
    return labels[locationId] ?? locationId.toUpperCase();
  }
  const labels: Record<string, string> = {
    tavern: 'Taverna',
    church: 'Kilise',
    graveyard: 'Mezarlık',
    mill: 'Değirmen',
    farm: 'Çiftlik',
    clinic: 'Revir',
    crime_scene: 'Cinayet Mahalli',
  };
  return labels[locationId] ?? locationId.toUpperCase();
};

export interface NpcDialogueScreenProps {
  npcKey: string;
  onClose?: () => void;
}

export default function NpcDialogueScreen({ npcKey }: NpcDialogueScreenProps) {
  const router = useRouter();
  const {
    scenarioType,
    isAdmin,
    dialoguesUsedToday,
    incrementDialogue,
    setDialoguesUsed,
    sessionId,
    setCurrentDay,
    currentDay,
    timeOfDay,
    notes,
    setNotes,
    authToken,
    inventory,
    addWarrant,
    consumeWarrant,
    evidence,
    setEvidence,
    addEvidence,
    hasHydrated,
  } = useGameStore();

  // Çin ve diğer evrenler için doğrudan isimle çağrılan NPC anahtar eşleştirmeleri
  const CHINA_NPC_ALIASES: Record<string, string> = {
    lin_feng: 'tavern',
    zhao: 'church',
    komutan_zhao: 'church',
    huikang: 'graveyard',
    kesis_huikang: 'graveyard',
    keşiş_huikang: 'graveyard',
    guan: 'mill',
    usta_guan: 'mill',
    song: 'clinic',
    bilgin_song: 'clinic',
    mei: 'farm',
    mei_teyze: 'farm',
  };

  const isExplicitChinaNpc = Boolean(CHINA_NPC_ALIASES[npcKey]);
  const actualNpcKey = CHINA_NPC_ALIASES[npcKey] || npcKey;
  const [urlScenario, setUrlScenario] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const q = new URLSearchParams(window.location.search).get('scenario');
      // eslint-disable-next-line react-hooks/set-state-in-effect -- URL yalnızca tarayıcıda okunabilir; sunucu render'ıyla uyuşsun diye mount sonrası
      if (q) setUrlScenario(q);
    }
  }, []);

  const scenario = isExplicitChinaNpc ? 'china' : (urlScenario || scenarioType || 'medieval');
  const profile = getNpcProfile(actualNpcKey, scenario) ?? {
    name: 'Meçhul Köylü',
    title: 'Gölgelerin arasından bir yabancı',
    icon: '👤',
  };

  const portraitUrl = getNpcDialoguePortrait(scenario, actualNpcKey);
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
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [localNotes, setLocalNotes] = useState(notes);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isEvidencePickerOpen, setIsEvidencePickerOpen] = useState(false);
  const [fear, setFear] = useState<{ level: number; band: FearBand } | null>(null);
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

  const items = evidence.filter((e) => e.category === 'ITEM');
  const canConfront = !isInvestigating && !isCrimeScene && evidence.length > 0;

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

  // Sunucudan gelen notlar (ör. yeni ifade) yerel taslağın üzerine yazılır
  const [syncedNotes, setSyncedNotes] = useState(notes);
  if (notes !== syncedNotes) {
    setSyncedNotes(notes);
    setLocalNotes(notes);
  }

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
        const res = await fetch(apiUrl('/npcs/history'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            sessionId,
            npcId: currentNpcKey,
          }),
        });

        const data = await res.json();

        if (data.history && data.history.length > 0) {
          const formatted = data.history.map((h: { role: Message['role']; text: string; timestamp: string }) => ({
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

        const sessionRes = await fetch(apiUrl(`/game-sessions/${sessionId}`), {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          setNotes(sessionData.notes || '');
        }

        const evidenceRes = await fetch(apiUrl(`/game-sessions/${sessionId}/evidence`), {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (evidenceRes.ok) {
          const evidenceData = await evidenceRes.json();
          setEvidence(Array.isArray(evidenceData.evidence) ? evidenceData.evidence : []);
        }
      } catch (err) {
        console.error('History fetch error:', err);
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
  }, [currentNpcKey, profile.name, sessionId, setDialoguesUsed, setCurrentDay, setNotes, setEvidence, authToken, isInvestigating, scenario, npcKey, actualNpcKey]);

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
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(apiUrl('/npcs/interact'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          sessionId,
          npcId: currentNpcKey,
          message: trimmed,
        }),
      });

      const data = await res.json();

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

      if (res.ok && data.reply) {
        setMessages((prev) => [...prev, { role: 'npc', text: data.reply, timestamp: new Date() }]);
        incrementDialogue();
        applyTurnResult(data);
      } else if (!res.ok && data.message) {
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

  const handleConfront = async (item: EvidenceItem) => {
    const maxLimit = isAdmin ? 999 : 100;
    if (loading || (!isAdmin && dialoguesUsedToday >= maxLimit) || !sessionId) return;

    setIsEvidencePickerOpen(false);
    setMessages((prev) => [
      ...prev,
      { role: 'player', text: `*Ona bir kanıt gösteriyorsun:* ${item.text}`, timestamp: new Date() },
    ]);
    setLoading(true);

    try {
      const res = await fetch(apiUrl('/npcs/confront'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ sessionId, npcId: npcKey, evidenceId: item.id }),
      });
      const data = await res.json();

      if (res.ok && data.reply) {
        setShownEvidenceIds((prev) => (prev.includes(item.id) ? prev : [...prev, item.id]));
        setMessages((prev) => [...prev, { role: 'npc', text: data.reply, timestamp: new Date() }]);
        incrementDialogue();
        applyTurnResult(data);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'npc', text: `*[Sistem hatası: ${data.message ?? 'Kanıt gösterilemedi.'}]*`, timestamp: new Date() },
        ]);
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

  const handleCondemn = () => {
    if (!sessionId) return;

    setConfirmModal({
      isOpen: true,
      title: 'Nihai Hüküm',
      message: `${profile.name} adlı kişiyi mahkûm etmek istediğine emin misin? Bu karar geri alınamaz.`,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          const res = await fetch(apiUrl(`/game-sessions/${sessionId}/condemn`), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({ npcId: actualNpcKey }),
          });
          const data = await res.json();
          if (data.session && data.session.truthReveal) {
            useGameStore.getState().setTruthReveal(data.session.truthReveal);
          }
          if (data.session && data.session.locationClues) {
            useGameStore.getState().setLocationClues(data.session.locationClues);
          }
          const rewardTokens = data.reward?.tokens ? `&rewardTokens=${data.reward.tokens}` : '';
          const scoreEarned = data.reward?.score ? `&scoreEarned=${data.reward.score}` : '';
          router.push(`/result?won=${data.won}&message=${encodeURIComponent(data.message)}${rewardTokens}${scoreEarned}`);
        } catch (err) {
          console.error('Failed to condemn', err);
        }
      },
    });
  };

  const handleNotesBlur = async () => {
    if (localNotes !== notes && sessionId) {
      setNotes(localNotes);
      try {
        await fetch(apiUrl(`/game-sessions/${sessionId}/notes`), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ notes: localNotes }),
        });
      } catch (err) {
        console.error('Failed to save notes', err);
      }
    }
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
              className={styles.characterImg}
            />
            <div className={styles.portraitVignette} />
          </div>

          {/* Kart: Çerçevenin Alt Kısmında Konumlanır (Yalnızca Anlık Soru, Cevap ve Soru Girişi) */}
          <div className={styles.dialogueCard}>
            {/* NPC İsim Rozeti (Sol Üstte Asılı) */}
            <div className={styles.nameBadge}>
              <span className={styles.nameBadgeText}>
                {isInvestigating ? 'Fiziksel Çevre' : profile.name}
              </span>
              <span className={styles.nameBadgeTitle}>
                {isInvestigating ? 'Mekân Araştırması' : profile.title}
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
                placeholder={`${profile.name}'e sorunu sor...`}
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
                              await fetch(apiUrl(`/game-sessions/${sessionId}/consume-warrant`), {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  Authorization: `Bearer ${authToken}`,
                                },
                                body: JSON.stringify({ location: actualNpcKey }),
                              });
                            } catch (e) {
                              console.error(e);
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
      {isHistoryDrawerOpen && (
        <div className={styles.historyDrawer}>
          <div className={styles.modalHeader}>
            <h3 className={styles.modalTitle}>Konuşma Geçmişi</h3>
            <button
              className={styles.modalCloseBtn}
              onClick={() => setIsHistoryDrawerOpen(false)}
            >
              ✕
            </button>
          </div>
          <div className={styles.historyList}>
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`${styles.historyBubble} ${
                  m.role === 'player' ? styles.historyPlayer : styles.historyNpc
                }`}
              >
                <div className={styles.historySpeaker}>
                  {m.role === 'player' ? 'Engizitör' : profile.name}
                </div>
                <div>{m.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── NOTLAR MODALI ─── */}
      {isNotesOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsNotesOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Engizitörün Notları</h3>
              <button
                className={styles.modalCloseBtn}
                onClick={() => setIsNotesOpen(false)}
              >
                ✕
              </button>
            </div>
            <textarea
              className={styles.textarea}
              style={{ minHeight: '180px', padding: '14px' }}
              value={localNotes}
              onChange={(e) => setLocalNotes(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder="Şüpheli davranışları, çelişkileri ve çıkarımlarını buraya not et..."
              autoFocus
            />
          </div>
        </div>
      )}

      {/* ─── ENVANTER MODALI ─── */}
      {isInventoryOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsInventoryOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Envanter ve İzinler</h3>
              <button
                className={styles.modalCloseBtn}
                onClick={() => setIsInventoryOpen(false)}
              >
                ✕
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {inventory?.activeWarrants?.map((w, idx) => (
                <div
                  key={`act-${idx}`}
                  style={{
                    padding: '10px 14px',
                    background: 'rgba(212, 175, 55, 0.1)',
                    border: '1px solid rgba(212, 175, 55, 0.3)',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>📜 Arama İzni: {getLocationLabel(w, scenario)}</span>
                  <span style={{ color: '#4ade80', fontSize: '0.8rem' }}>(Hazır)</span>
                </div>
              ))}
              {items.map((it) => (
                <div
                  key={it.id}
                  style={{
                    padding: '10px 14px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ color: '#f7eedd', fontWeight: 600 }}>🔍 {it.text}</div>
                  <div style={{ color: '#8c8376', fontSize: '0.78rem', marginTop: 4 }}>
                    {evidenceSource(it)} · {it.dayNumber}. Gün
                  </div>
                </div>
              ))}
              {(!inventory?.activeWarrants?.length && !items.length) && (
                <p style={{ color: '#8c8376', textAlign: 'center', margin: '20px 0' }}>
                  Envanterinde henüz bir eşya veya aktif izin yok.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── KANIT GÖSTERME (CONFRONT) MODALI ─── */}
      {isEvidencePickerOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsEvidencePickerOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Kanıt Göster</h3>
              <button
                className={styles.modalCloseBtn}
                onClick={() => setIsEvidencePickerOpen(false)}
              >
                ✕
              </button>
            </div>
            <p style={{ color: '#cfc5b4', fontSize: '0.88rem', marginBottom: '14px' }}>
              {profile.name} karşısında hangi kanıtı ortaya koyacaksın?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {evidence.map((item) => (
                <button
                  key={item.id}
                  className={styles.choiceBtn}
                  onClick={() => handleConfront(item)}
                  disabled={loading}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: '#f7eedd' }}>
                      {item.category === 'ITEM' ? '🔍' : '📜'} {item.text}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#8c8376', marginTop: 2 }}>
                      {evidenceSource(item)}
                      {shownEvidenceIds.includes(item.id) ? ' (Zaten Gösterildi)' : ''}
                    </div>
                  </div>
                  <span className={styles.choiceIcon}>→</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── ONAY MODALI ─── */}
      {confirmModal.isOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard} style={{ maxWidth: 440 }}>
            <h3 className={styles.modalTitle}>{confirmModal.title}</h3>
            <p style={{ color: '#cfc5b4', margin: '14px 0 20px', lineHeight: 1.5 }}>
              {confirmModal.message}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                className={styles.choiceBtn}
                style={{ width: 'auto', padding: '8px 16px' }}
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
              >
                Vazgeç
              </button>
              <button
                className={styles.sendBtn}
                style={{ padding: '8px 18px' }}
                onClick={confirmModal.onConfirm}
              >
                Onayla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── BİLDİRİM TOAST ─── */}
      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  );
}
