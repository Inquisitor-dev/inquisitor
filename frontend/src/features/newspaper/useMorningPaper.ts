'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/shared/api/client';
import { logger } from '@/shared/lib/logger';

export interface NewspaperItem {
  // NOTICE: kasaba olayının duyurusu (yarın / bugün kapalı)
  kind: 'MURDER' | 'PERSONA' | 'NOTICE' | 'TOWN';
  headline: string;
  body: string;
}

export interface Newspaper {
  day: number;
  title: string;
  items: NewspaperItem[];
}

// Sahne geçişi bitmeden gazete açılmasın
const OPEN_DELAY = 1200;

const seenKey = (sessionId: string) => `inquisitor-newspaper-seen:${sessionId}`;

function readSeen(sessionId: string): number {
  try {
    return Number(localStorage.getItem(seenKey(sessionId))) || 0;
  } catch {
    return 0;
  }
}

function writeSeen(sessionId: string, day: number) {
  try {
    localStorage.setItem(seenKey(sessionId), String(day));
  } catch {
    // Depolama kapalıysa gazete bir dahaki açılışta yeniden gösterilir
  }
}

// Sabah gazetesi: haritaya o sabah ilk gelişte bir kez açılır (v3, docs/v3-persona-tasarimi.md)
export function useMorningPaper(sessionId: string | null, currentDay: number, ready: boolean) {
  const [paper, setPaper] = useState<Newspaper | null>(null);

  useEffect(() => {
    if (!ready || !sessionId || readSeen(sessionId) >= currentDay) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    api
      .get<{ day: number; paper: Newspaper | null }>(`/game-sessions/${sessionId}/newspaper`)
      .then((data) => {
        if (cancelled || !data.paper || data.paper.day !== currentDay) return;
        const next = data.paper;
        timer = setTimeout(() => setPaper(next), OPEN_DELAY);
      })
      .catch((err) => logger.error('Failed to load newspaper', err));
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [sessionId, currentDay, ready]);

  const close = useCallback(() => {
    if (sessionId && paper) writeSeen(sessionId, paper.day);
    setPaper(null);
  }, [sessionId, paper]);

  return { paper, close };
}
