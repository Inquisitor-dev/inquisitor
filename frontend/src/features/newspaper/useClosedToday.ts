'use client';

import { useEffect, useState } from 'react';
import { api } from '@/shared/api/client';
import { logger } from '@/shared/lib/logger';

export interface Closure {
  locationId: string;
  // AWAY: sahibi şehir dışında (kasaba olayı); BREAK_IN: gece zorla açılmış (katilin hamlesi);
  // DETAINED: sahibi nezarette; LEFT: sahibi kasabadan temelli ayrıldı (Ayrılan Tanık wildcard'ı)
  reason: 'AWAY' | 'BREAK_IN' | 'DETAINED' | 'LEFT';
}

// Bugün kapalı mekânlar: girilemez, sahibi sorgulanamaz. Sunucu yalnızca bugünü söyler, planı değil.
export function useClosedToday(sessionId: string | null, currentDay: number, ready: boolean) {
  const [closures, setClosures] = useState<Closure[]>([]);

  useEffect(() => {
    if (!ready || !sessionId) return;
    let cancelled = false;
    api
      .get<{ closedToday?: Closure[] }>(`/game-sessions/${sessionId}`)
      .then((data) => {
        if (!cancelled) setClosures(Array.isArray(data.closedToday) ? data.closedToday : []);
      })
      .catch((err) => logger.error('Failed to load closed places', err));
    return () => {
      cancelled = true;
    };
  }, [sessionId, currentDay, ready]);

  return closures;
}
