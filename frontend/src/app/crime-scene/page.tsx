'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/config/api';
import { useGameStore } from '../../store/useGameStore';
import styles from './crime-scene.module.scss';

export default function CrimeScenePage() {
  const router = useRouter();
  const { isAdmin, currentDay, timeOfDay, maxDailyDialogues, dialoguesUsedToday, scenario, notes, setNotes, sessionId } = useGameStore();
  
  const [inspected, setInspected] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [isNotesExpanded, setIsNotesExpanded] = useState(false);
  
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const expandedNotesRef = useRef<HTMLTextAreaElement>(null);

  // Güvenlik kontrolü: Sadece 1. gün girilebilir
  useEffect(() => {
    if (currentDay !== 1) {
      router.push('/map');
    }
  }, [currentDay, router]);

  // Typewriter effect
  useEffect(() => {
    if (inspected && scenario) {
      let i = 0;
      const timer = setInterval(() => {
        setDisplayedText(scenario.slice(0, i));
        i++;
        if (i > scenario.length) {
          clearInterval(timer);
        }
      }, 30); // Daktilo hızı
      return () => clearInterval(timer);
    }
  }, [inspected, scenario]);

  const handleInspect = () => {
    setInspected(true);
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
  };

  const handleNotesBlur = async () => {
    if (!sessionId) return;
    try {
      await fetch(apiUrl(`/game-sessions/${sessionId}/notes`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
    } catch (err) {
      console.error('Failed to save notes', err);
    }
  };

  const toggleNotesExpanded = () => {
    setIsNotesExpanded(!isNotesExpanded);
    if (!isNotesExpanded) {
      setTimeout(() => expandedNotesRef.current?.focus(), 100);
    }
  };

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <Link href="/map" className={styles.backBtn}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M13 8H3M7 4L3 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Haritaya Dön
        </Link>
        
        <div className={styles.npcInfo}>
          <div className={styles.npcIcon}>🩸</div>
          <div className={styles.npcName}>Cinayet Mahalli</div>
          <div className={styles.npcTitle}>Sessiz tanıklar...</div>
        </div>

        <div className={styles.sessionInfo}>
          Bugün kalan sorgu hakkınız: {isAdmin ? 'Sınırsız' : (30 - dialoguesUsedToday)}
        </div>
      </header>

      <div className={styles.content}>
        {/* Sol Alan: Senaryo ve İncele Butonu */}
        <div className={styles.sceneArea}>
          {!inspected ? (
            <button className={styles.inspectBtn} onClick={handleInspect}>
              İncele
            </button>
          ) : (
            <div className={styles.scenarioTextWrapper}>
              <div className={styles.scenarioText}>
                {displayedText}
                {displayedText.length === scenario?.length ? '' : '...'}
              </div>
            </div>
          )}
        </div>

        {/* Sağ Alan: Engizisyoncunun Notları */}
        <aside className={styles.sidebar}>
          <div className={styles.panel}>
            <div className={styles.panelTitle}>
              Engizisyoncunun Notları
              <div className={styles.expandIcon} onClick={toggleNotesExpanded} title="Genişlet">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <polyline points="9 21 3 21 3 15"></polyline>
                  <line x1="21" y1="3" x2="14" y2="10"></line>
                  <line x1="3" y1="21" x2="10" y2="14"></line>
                </svg>
              </div>
            </div>
            <textarea
              ref={notesRef}
              className={styles.notesArea}
              placeholder="Şüpheli davranışları buraya not et..."
              value={notes}
              onChange={handleNotesChange}
              onBlur={handleNotesBlur}
            />
          </div>
        </aside>

        {/* Genişletilmiş Notlar (Drawer) */}
        {isNotesExpanded && (
          <div className={styles.expandedNotesOverlay}>
            <div className={styles.expandedNotesPanel}>
              <div className={styles.expandedNotesHeader}>
                <h2>Engizisyoncunun Notları</h2>
                <button className={styles.closeExpandedBtn} onClick={toggleNotesExpanded}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              <textarea
                ref={expandedNotesRef}
                className={styles.expandedNotesTextarea}
                placeholder="Şüpheli davranışları buraya not et... (Değişiklikler otomatik kaydedilir)"
                value={notes}
                onChange={handleNotesChange}
                onBlur={handleNotesBlur}
              />
              <div className={styles.saveHint}>Değişiklikler tıklanmadığında otomatik kaydedilir.</div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
