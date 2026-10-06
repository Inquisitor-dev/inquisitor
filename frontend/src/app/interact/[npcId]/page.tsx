'use client';

import { useState, useRef, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/config/api';
import { HeartPulse, Hand, ScrollText, Search } from 'lucide-react';
import { useGameStore, type EvidenceItem } from '../../../store/useGameStore';
import styles from './interact.module.scss';

type FearBand = 'CALM' | 'UNEASY' | 'NERVOUS' | 'PANIC';

// Korkunun oyuncuya görünen işaretleri; sayı yerine karakterin hâli gösterilir
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
  if (scenarioType === 'modern') {
    const profiles: Record<string, { name: string; title: string; icon: string }> = {
      tavern: { name: 'Şerif Dale Cooper', title: 'Polis Amiri — Karakolun Tek Kanunu', icon: '🚔' },
      church: { name: 'Papaz Gerald', title: 'Papaz — Kilisenin Sessiz Tanığı', icon: '⛪' },
      graveyard: { name: 'Randy', title: 'Kasetçi — Herkesin Uğradığı Dükkân', icon: '📼' },
      mill: { name: 'Donna', title: 'Gişe Görevlisi — Açık Hava Sinemasının Gözü', icon: '🎬' },
      farm: { name: 'Earl', title: 'Pompacı — Benzinliğin Sessiz Bekçisi', icon: '⛽' },
      clinic: { name: 'Old Marge', title: 'Kasabanın Yaşlısı — Her Şeyi Bilen Ama Söylemeyen', icon: '🏠' },
      crime_scene: { name: 'Olay Yeri', title: 'Sessiz Tanıklar...', icon: '🩸' },
    };
    return profiles[npcKey];
  } else if (scenarioType === 'cyberpunk') {
    const profiles: Record<string, { name: string; title: string; icon: string }> = {
      tavern: { name: 'Officer Kael Voss', title: 'Memur — Neon Prime Karakolu', icon: '👮' },
      church: { name: 'Mirel Sato', title: 'Lokanta Sahibi — Static Spoon', icon: '🍜' },
      graveyard: { name: 'Brakk Coil', title: 'Hurdacı — Coil Yard', icon: '🛠️' },
      mill: { name: 'AURA-9', title: 'Satıcı Android — AURA Robotics', icon: '🤖' },
      farm: { name: 'Ash', title: 'Dilenci — Köprü Altının Muhbiri', icon: '🧥' },
      clinic: { name: 'Vera Nyx', title: 'Barmen — Velvet Static', icon: '🍸' },
      crime_scene: { name: 'Olay Yeri', title: 'Sessiz Tanıklar...', icon: '🩸' },
    };
    return profiles[npcKey];
  } else if (scenarioType === 'china') {
    const profiles: Record<string, { name: string; title: string; icon: string }> = {
      tavern: { name: 'Lin Feng', title: 'Çay Ustası — Altın Lotus Çay Evi', icon: '🍵' },
      church: { name: 'Komutan Zhao', title: 'Muhafız Amiri — İmparatorluk Garnizonu', icon: '🏯' },
      graveyard: { name: 'Keşiş Huikang', title: 'Kadim Tapınak Bilgesi', icon: '⛩️' },
      mill: { name: 'Usta Guan', title: 'Silah Ustası — Demirci Ocağı', icon: '⚒️' },
      farm: { name: 'Mei Teyze', title: 'Şifalı Ot Bahçıvanı', icon: '🎋' },
      clinic: { name: 'Bilgin Song', title: 'Saray Eczacısı ve Hekim', icon: '🌿' },
      crime_scene: { name: 'Pazar Meydanı', title: 'Sessiz Tanıklar...', icon: '🩸' },
    };
    return profiles[npcKey];
  } else if (scenarioType === 'winter') {
    const profiles: Record<string, { name: string; title: string; icon: string }> = {
      tavern: { name: 'Torstein', title: 'Hancı — Ocak Ateşi Hanı', icon: '🔥' },
      church: { name: 'Kahin Valda', title: 'Kutsal Yürek Ağacının Bekçisi', icon: '🍁' },
      graveyard: { name: 'Komutan Bjorn', title: 'Kale Muhafızı — Gözcü Kalesi', icon: '🏰' },
      mill: { name: 'Madenci Durn', title: 'Terk Edilmiş Madenin Ustabaşısı', icon: '⛏️' },
      farm: { name: 'Avcı Einar', title: 'Vahşi Doğa ve Tuzak Avcısı', icon: '🏹' },
      clinic: { name: 'Muhafız Kenneth', title: 'İnfaz ve Yargı Meydanı Çavuşu', icon: '⚔️' },
      crime_scene: { name: 'Buzlu Geçit', title: 'Sessiz Tanıklar...', icon: '🩸' },
    };
    return profiles[npcKey];
  } else {
    const profiles: Record<string, { name: string; title: string; icon: string }> = {
      tavern: { name: 'Kardeş Aldric', title: 'Hancı — Sırların Bekçisi', icon: '🍺' },
      church: { name: 'Peder Malachar', title: 'Rahip — İki Efendinin Hizmetkârı', icon: '⛪' },
      graveyard: { name: 'İhtiyar Silas', title: 'Mezarcı — Gerçeği Gömüp Saklayan', icon: '🪦' },
      mill: { name: 'Değirmenci Giles', title: 'Değirmenci — Rüzgârın Sırdaşı', icon: '⚙️' },
      farm: { name: 'Çiftçi Edmund', title: 'Çiftçi — Toprağın ve Karanlığın Tanığı', icon: '🌾' },
      clinic: { name: 'Doktor Harland', title: 'Hekim — Soğuk Ellerin ve Daha Soğuk Gözlerin Sahibi', icon: '🏥' },
      crime_scene: { name: 'Cinayet Mahalli', title: 'Sessiz Tanıklar...', icon: '🩸' },
    };
    return profiles[npcKey];
  }
};

const getLocationLabel = (locationId: string, scenarioType: string) => {
  if (scenarioType === 'modern') {
    const labels: Record<string, string> = {
      tavern: 'Karakol',
      church: 'Kilise',
      graveyard: 'Kaset Dükkânı',
      mill: 'Açık Hava Sineması',
      farm: 'Benzinlik',
      clinic: 'Prefabrik Evler',
      crime_scene: 'Olay Yeri',
    };
    return labels[locationId] ?? locationId.toUpperCase();
  }

  if (scenarioType === 'cyberpunk') {
    const labels: Record<string, string> = {
      tavern: 'Polis Karakolu',
      church: 'Lokanta',
      graveyard: 'Hurdalık',
      mill: 'Robot Dükkânı',
      farm: 'Köprü Altı',
      clinic: 'Bar',
      crime_scene: 'Olay Yeri',
    };
    return labels[locationId] ?? locationId.toUpperCase();
  }

  if (scenarioType === 'china') {
    const labels: Record<string, string> = {
      tavern: 'Çay Evi & Han',
      church: 'Muhafız Karargahı',
      graveyard: 'Kadim Tapınak',
      mill: 'Demirci Ocağı',
      farm: 'Bahçıvan Kulübesi',
      clinic: 'Şifacı & Baharatçı',
      crime_scene: 'Pazar Meydanı',
    };
    return labels[locationId] ?? locationId.toUpperCase();
  }

  if (scenarioType === 'winter') {
    const labels: Record<string, string> = {
      tavern: 'Kış Hanı',
      church: 'Kutsal Yürek Ağacı',
      graveyard: 'Gözcü Kalesi',
      mill: 'Terk Edilmiş Maden',
      farm: 'Avcı Kulübesi',
      clinic: 'İnfaz Meydanı',
      crime_scene: 'Buzlu Geçit',
    };
    return labels[locationId] ?? locationId.toUpperCase();
  }

  const labels: Record<string, string> = {
    tavern: 'Taverna',
    church: 'Kilise',
    graveyard: 'Mezarlık',
    mill: 'Değirmen',
    farm: 'Çiftlik',
    clinic: 'Klinik',
    crime_scene: 'Cinayet Mahalli',
  };
  return labels[locationId] ?? locationId.toUpperCase();
};

export default function InteractPage({ params }: { params: Promise<{ npcId: string }> }) {
  const { npcId } = use(params);
  const npcKey = npcId;
  const {
    scenarioType,
    isAdmin,
    isPremium,
    dialoguesUsedToday,
    incrementDialogue,
    setDialoguesUsed,
    sessionId,
    currentDay,
    setCurrentDay,
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

  const profile = getNpcProfile(npcKey, scenarioType || 'medieval') ?? {
    name: 'Meçhul Köylü',
    title: 'Gölgelerin arasından bir yabancı',
    icon: '👤',
  };

  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const MAX_CHARS = 200;
  const [localNotes, setLocalNotes] = useState('');
  const [isNotesExpanded, setIsNotesExpanded] = useState(false);
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
  const bottomRef = useRef<HTMLDivElement>(null);

  const isCrimeScene = npcKey === 'crime_scene';
  const [isInvestigating, setIsInvestigating] = useState(isCrimeScene);
  const currentNpcKey = isInvestigating ? `narrator_${npcKey}` : npcKey;
  const canInvestigate = isCrimeScene || inventory?.activeWarrants?.includes(npcKey);
  const items = evidence.filter((e) => e.category === 'ITEM');
  const statements = evidence.filter((e) => e.category === 'STATEMENT');
  const canConfront = !isInvestigating && !isCrimeScene && evidence.length > 0;

  const evidenceSource = (item: EvidenceItem) =>
    item.category === 'ITEM'
      ? getLocationLabel(item.sourceId, scenarioType || 'medieval')
      : getNpcProfile(item.sourceId, scenarioType || 'medieval')?.name ?? item.sourceId;

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    setLocalNotes(notes);
  }, [notes]);

  useEffect(() => {
    if (hasHydrated && !authToken) {
      router.push('/');
    }
  }, [authToken, router, hasHydrated]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!sessionId) return;
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
          const formattedHistory = data.history.map((h: any) => ({
            role: h.role,
            text: h.text,
            timestamp: new Date(h.timestamp),
          }));
          setMessages(formattedHistory);
        } else {
          const fetchedDay = typeof data.currentDay === 'number' ? data.currentDay : 1;

          if (fetchedDay > 1 && !isInvestigating) {
            try {
              const greetRes = await fetch(apiUrl('/npcs/interact'), {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                  sessionId,
                  npcId: currentNpcKey,
                  message: '__NEW_DAY_GREETING__',
                }),
              });
              const greetData = await greetRes.json();
              if (greetData.reply) {
                setMessages([{ role: 'npc', text: greetData.reply, timestamp: new Date() }]);
              }
            } catch {
              setMessages([{ role: 'npc', text: `*${profile.name} seni tanıyormuş gibi başını kaldırıyor...*`, timestamp: new Date() }]);
            }
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
                text: `*${profile.name} sana şüpheyle bakıyor.*\n\n"Buraya neden geldiniz?"`,
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
  }, [currentNpcKey, profile.name, sessionId, setDialoguesUsed, setCurrentDay, setNotes, setEvidence, authToken, isInvestigating]);

  // Konuşma ya da yüzleştirme cevabındaki yeni kanıt, korku ve not değişikliklerini uygular
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

  const handleConfront = async (item: EvidenceItem) => {
    const maxLimit = isPremium ? 100 : 30;
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

  const handleSend = async () => {
    const trimmed = input.trim();
    const maxLimit = isPremium ? 100 : 30;
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
          .map((w: string) => getLocationLabel(w, scenarioType || 'medieval'))
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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
            body: JSON.stringify({ npcId: npcKey }),
          });
          const data = await res.json();
          if (data.session && data.session.truthReveal) {
            useGameStore.getState().setTruthReveal(data.session.truthReveal);
          }
          if (data.session && data.session.locationClues) {
            useGameStore.getState().setLocationClues(data.session.locationClues);
          }
          router.push(`/result?won=${data.won}&message=${encodeURIComponent(data.message)}`);
        } catch (err) {
          console.error('Failed to condemn', err);
        }
      },
    });
  };

  const maxDailyDialogues = isPremium ? 100 : 30;

  return (
    <main
      className={`${styles.main} ${(scenarioType === 'modern' || scenarioType === 'cyberpunk') ? styles.modernPlain : ''}`}
      style={
        (scenarioType === 'modern' || scenarioType === 'cyberpunk')
          ? { backgroundImage: 'none', backgroundColor: '#000000' }
          : { backgroundImage: `url('/backgrounds/bg_${npcKey}.png')` }
      }
    >
      <div className={styles.vignette} />

      <header className={styles.header}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Link href="/map" className={styles.back}>
            Haritaya Dön
          </Link>
          <Link 
            href={`/interior/${npcKey}`} 
            className={styles.back}
            style={{ 
              backgroundColor: 'rgba(138, 3, 3, 0.4)', 
              borderColor: 'rgba(138, 3, 3, 0.8)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Mekânın içini 360° incele"
          >
            <span>🧭</span>
            <span>Mekânı İncele (360°)</span>
          </Link>
        </div>

        <div className={styles.npcInfo}>
          <span className={styles.npcIcon}>{isInvestigating ? '👁️' : profile.icon}</span>
          <div>
            <div className={styles.npcName}>{isInvestigating ? 'Fiziksel Çevre' : profile.name}</div>
            <div className={styles.npcTitle}>{isInvestigating ? 'Etrafındaki Dünya' : profile.title}</div>
            {!isInvestigating && fear && (
              <div className={`${styles.fear} ${styles[`fear${fear.band}`]}`} title="Karakterin korkusu">
                <HeartPulse size={13} aria-hidden />
                <span>{FEAR_LABELS[fear.band]}</span>
              </div>
            )}
          </div>
        </div>

        <div className={styles.quota}>
          Bugün kalan sorgu hakkın: {isAdmin ? 'Sınırsız' : 30 - dialoguesUsedToday}
        </div>
      </header>

      <div className={styles.layout}>
        <div className={styles.chatColumn}>
          <div className={styles.messages}>
            {messages.map((msg, i) => (
              <div key={i} className={`${styles.bubble} ${msg.role === 'player' ? styles.player : styles.npc}`}>
                <div className={styles.bubbleLabel}>{msg.role === 'player' ? 'Engizitör' : isInvestigating ? 'Anlatıcı' : profile.name}</div>
                <div className={styles.bubbleText}>
                  {msg.text.split('\n').map((line, j) => (
                    <span key={j}>
                      {line}
                      {j < msg.text.split('\n').length - 1 && <br />}
                    </span>
                  ))}
                </div>
                <div className={styles.bubbleTime}>{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            ))}

            {loading && (
              <div className={`${styles.bubble} ${styles.npc} ${styles.typing}`}>
                <div className={styles.bubbleLabel}>{isInvestigating ? 'Anlatıcı' : profile.name}</div>
                <div className={styles.typingDots}>
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Mobile Quick Actions Toolbar */}
          <div className={styles.mobileToolbar}>
            <button className={styles.toolBtn} onClick={() => setIsNotesExpanded(true)}>
              <span>📝</span> Notlar
            </button>
            <button className={styles.toolBtn} onClick={() => setIsInventoryOpen(true)}>
              <span>📜</span> Envanter
            </button>
            {!isInvestigating && !isCrimeScene && (
              <button
                className={`${styles.toolBtn} ${canConfront ? styles.activeTool : ''}`}
                disabled={!canConfront || loading}
                onClick={() => setIsEvidencePickerOpen(true)}
              >
                <Hand size={14} aria-hidden /> Kanıt Göster
              </button>
            )}
            
            {!isInvestigating ? (
              <button 
                className={`${styles.toolBtn} ${canInvestigate ? styles.activeTool : ''}`}
                disabled={!canInvestigate}
                onClick={() => setIsInvestigating(true)}
              >
                <span>🔍</span> Mekânı Araştır
              </button>
            ) : (
              !isCrimeScene && (
                <button 
                  className={`${styles.toolBtn} ${styles.activeTool}`}
                  onClick={() => {
                    setConfirmModal({
                      isOpen: true,
                      title: 'Araştırmayı Bitir',
                      message: 'Araştırmayı bitirirsen bu mekânın arama izni kullanılmış sayılır. Emin misin?',
                      onConfirm: async () => {
                        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                        consumeWarrant(npcId);
                        setIsInvestigating(false);
                        try {
                          await fetch(apiUrl(`/game-sessions/${sessionId}/consume-warrant`), {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              Authorization: `Bearer ${authToken}`,
                            },
                            body: JSON.stringify({ location: npcId }),
                          });
                        } catch (e) {
                          console.error(e);
                        }
                      },
                    });
                  }}
                >
                  <span>⏹️</span> Araştırmayı Bitir
                </button>
              )
            )}

            {!isInvestigating && (
              <button className={`${styles.toolBtn} ${styles.condemnBtn}`} onClick={handleCondemn}>
                <span>⚖️</span> Hüküm Ver
              </button>
            )}
          </div>

          <div className={styles.inputArea}>
            {dialoguesUsedToday >= maxDailyDialogues && !isAdmin ? (
              <div className={styles.limitReached}>Bugünkü sorgu hakkın doldu. Yarın tekrar gel.</div>
            ) : (
              <>
                <textarea
                  className={styles.textarea}
                  value={input}
                  onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
                  onKeyDown={handleKeyDown}
                  placeholder="Sorunu sor..."
                  rows={2}
                  disabled={loading}
                  maxLength={MAX_CHARS}
                />
                <div style={{ fontSize: '0.7rem', color: input.length >= MAX_CHARS ? '#8A0303' : '#555', textAlign: 'right', paddingRight: '50px', marginTop: '2px' }}>
                  {input.length}/{MAX_CHARS}
                </div>
                <button className={styles.sendBtn} onClick={handleSend} disabled={loading || !input.trim()}>
                  Gönder
                </button>
              </>
            )}
          </div>
        </div>

        <aside className={styles.sidebar}>
          <div className={styles.sideCard}>
            <div className={styles.sideTitle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Engizitörün Notları
              <button className={styles.expandBtn} onClick={() => setIsNotesExpanded(true)} title="Genislet">
                +
              </button>
            </div>
            <textarea
              className={styles.textarea}
              style={{ minHeight: '120px', padding: '12px', marginTop: '8px', fontSize: '0.85rem' }}
              value={localNotes}
              onChange={(e) => setLocalNotes(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder="Şüpheli davranışları buraya not et..."
            />
          </div>

          <div className={styles.sideCard}>
            <div className={styles.sideTitle}>Günlük Hak</div>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${(dialoguesUsedToday / maxDailyDialogues) * 100}%` }} />
            </div>
            <p className={styles.sideHint}>Bugün {dialoguesUsedToday} / {isAdmin ? 'Sınırsız' : 30} sorgu hakkı kullanıldı.</p>
          </div>

          <div className={styles.sideCard}>
            <div className={styles.sideTitle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Envanter
              <button className={styles.expandBtn} onClick={() => setIsInventoryOpen(true)} title="Envanteri aç">
                +
              </button>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#ccc', marginBottom: '12px' }}>
              {inventory?.activeWarrants?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {inventory.activeWarrants.map((w) => (
                    <div key={w}>📜 Arama İzni: {getLocationLabel(w, scenarioType || 'medieval').toLocaleUpperCase('tr-TR')}</div>
                  ))}
                </div>
              ) : inventory?.usedWarrants?.length > 0 ? (
                <span style={{ color: '#8a7f72' }}>Tüm izinler kullanıldı.</span>
              ) : items.length === 0 ? (
                'Envanter boş'
              ) : null}
              {items.length > 0 && (
                <div className={styles.sideEvidenceList}>
                  {items.map((item) => (
                    <div key={item.id} className={styles.sideEvidence} title={item.text}>
                      <Search size={12} aria-hidden />
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!isInvestigating && !isCrimeScene && (
              <button
                className={styles.confrontBtn}
                onClick={() => setIsEvidencePickerOpen(true)}
                disabled={!canConfront || loading}
                title={canConfront ? 'Envanterden ya da ifadelerden birini seçip göster' : 'Henüz gösterebileceğin bir kanıt yok'}
              >
                <Hand size={14} aria-hidden /> Kanıt Göster
              </button>
            )}

            {!isInvestigating ? (
              <button
                onClick={() => {
                  if (canInvestigate) {
                    setIsInvestigating(true);
                  } else {
                    alert('Bu mekânı araştırmak için önce arama izni almalısın.');
                  }
                }}
                disabled={!canInvestigate}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: canInvestigate ? '#8A0303' : 'rgba(255,255,255,0.05)',
                  color: canInvestigate ? '#fff' : '#555',
                  border: '1px solid ' + (canInvestigate ? '#a00' : '#333'),
                  cursor: canInvestigate ? 'pointer' : 'not-allowed',
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                  letterSpacing: '1px',
                  fontFamily: 'inherit',
                }}
              >
                Mekânı Araştır
              </button>
            ) : (
              !isCrimeScene && (
                <button
                  onClick={() => {
                    setConfirmModal({
                      isOpen: true,
                      title: 'Araştırmayı Bitir',
                      message: 'Araştırmayı bitirirsen bu mekânın arama izni kullanılmış sayılır. Emin misin?',
                      onConfirm: async () => {
                        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                        consumeWarrant(npcId);
                        setIsInvestigating(false);
                        try {
                          await fetch(apiUrl(`/game-sessions/${sessionId}/consume-warrant`), {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              Authorization: `Bearer ${authToken}`,
                            },
                            body: JSON.stringify({ location: npcId }),
                          });
                        } catch (e) {
                          console.error(e);
                        }
                      },
                    });
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: '#8A0303',
                    color: '#fff',
                    border: '1px solid #a00',
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                    letterSpacing: '1px',
                    fontFamily: 'inherit',
                  }}
                >
                  Araştırmayı Bitir
                </button>
              )
            )}
          </div>

          <div className={styles.sideCard} style={{ marginTop: 'auto' }}>
            <button
              className={`${styles.sendBtn} ${styles.condemnBtn}`}
              style={{
                width: '100%',
                background: isInvestigating ? '#4a0202' : '#8A0303',
                color: isInvestigating ? '#888' : '#fff',
                border: 'none',
                padding: '12px',
                cursor: isInvestigating ? 'not-allowed' : 'pointer',
                opacity: isInvestigating ? 0.5 : 1,
              }}
              onClick={handleCondemn}
              disabled={isInvestigating}
            >
              BU KİŞİYİ MAHKÛM ET
            </button>
          </div>
        </aside>
      </div>

      {isNotesExpanded && (
        <div className={styles.notesExpandedOverlay}>
          <div className={styles.notesExpandedHeader}>
            <h2 className={styles.notesExpandedTitle}>Engizitörün Notları</h2>
            <button className={styles.closeBtn} onClick={() => setIsNotesExpanded(false)} title="Kucult">
              x
            </button>
          </div>
          <div className={styles.notesExpandedBody}>
            <textarea
              className={styles.notesExpandedTextarea}
              value={localNotes}
              onChange={(e) => setLocalNotes(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder="Şüpheli davranışları, çelişkileri ve çıkarımlarını buraya not et..."
              autoFocus
            />
          </div>
        </div>
      )}

      {isInventoryOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsInventoryOpen(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setIsInventoryOpen(false)}>&times;</button>
            <h2 className={styles.modalTitle}>Envanter</h2>
            <div className={styles.inventoryList}>
              {inventory?.activeWarrants?.length > 0 || inventory?.usedWarrants?.length > 0 || items.length > 0 ? (
                <>
                  {items.map((item) => (
                    <div key={item.id} className={styles.inventoryItem}>
                      <span className={styles.itemIcon}><Search size={20} aria-hidden /></span>
                      <div className={styles.itemDetails}>
                        <span className={styles.itemName}>{item.text}</span>
                        <span className={styles.itemLoc}>{evidenceSource(item)} · {item.dayNumber}. gün</span>
                      </div>
                    </div>
                  ))}
                  {inventory.activeWarrants.map((w, idx) => (
                    <div key={`active-${idx}`} className={styles.inventoryItem}>
                      <span className={styles.itemIcon}>📜</span>
                      <div className={styles.itemDetails}>
                        <span className={styles.itemName}>Arama İzni</span>
                        <span className={styles.itemLoc}>{getLocationLabel(w, scenarioType || 'medieval')}</span>
                      </div>
                      <span className={styles.itemStatus}>(Hazır)</span>
                    </div>
                  ))}
                  {inventory.usedWarrants.map((w, idx) => (
                    <div key={`used-${idx}`} className={styles.inventoryItem} style={{ opacity: 0.6 }}>
                      <span className={styles.itemIcon}>📜</span>
                      <div className={styles.itemDetails}>
                        <span className={styles.itemName}>Arama İzni</span>
                        <span className={styles.itemLoc}>{getLocationLabel(w, scenarioType || 'medieval')}</span>
                      </div>
                      <span className={styles.itemStatus}>(Kullanıldı)</span>
                    </div>
                  ))}
                </>
              ) : (
                <p style={{ color: '#8a7f72', textAlign: 'center', width: '100%' }}>Henüz bir eşyan yok.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {isEvidencePickerOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsEvidencePickerOpen(false)}>
          <div className={`${styles.modalContent} ${styles.pickerContent}`} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setIsEvidencePickerOpen(false)}>&times;</button>
            <h2 className={styles.modalTitle}>Kanıt Göster</h2>
            <p className={styles.modalMessage}>{profile.name} karşısında hangi kanıtı ortaya koyacaksın?</p>
            {[
              { title: 'Envanter', list: items, icon: <Search size={18} aria-hidden /> },
              { title: 'İfadeler', list: statements, icon: <ScrollText size={18} aria-hidden /> },
            ]
              .filter((group) => group.list.length > 0)
              .map((group) => (
                <div key={group.title} className={styles.pickerGroup}>
                  <div className={styles.pickerGroupTitle}>{group.title}</div>
                  {group.list.map((item) => (
                    <button
                      key={item.id}
                      className={styles.pickerItem}
                      onClick={() => handleConfront(item)}
                      disabled={loading}
                    >
                      <span className={styles.itemIcon}>{group.icon}</span>
                      <span className={styles.itemDetails}>
                        <span className={styles.itemName}>{item.text}</span>
                        <span className={styles.itemLoc}>{evidenceSource(item)}</span>
                      </span>
                      {shownEvidenceIds.includes(item.id) && (
                        <span className={styles.itemStatus}>Gösterildi</span>
                      )}
                    </button>
                  ))}
                </div>
              ))}
            <p className={styles.pickerHint}>Kanıt göstermek bir sorgu hakkı harcar.</p>
          </div>
        </div>
      )}

      {toast && (
        <div className={styles.toast} role="status">
          {toast}
        </div>
      )}

      {confirmModal.isOpen && (
        <div className={styles.modalOverlay} onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>{confirmModal.title}</h2>
            <p className={styles.modalMessage}>{confirmModal.message}</p>
            <div className={styles.modalActions}>
              <button className={styles.modalCancel} onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}>
                Vazgeç
              </button>
              <button className={styles.modalConfirm} onClick={confirmModal.onConfirm}>
                Onayla
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
