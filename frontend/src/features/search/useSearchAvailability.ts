'use client';

import { useEffect, useState } from 'react';
import { api } from '@/shared/api/client';
import { useGameStore } from '@/store/useGameStore';
import type { SearchAvailability } from './searchTypes';

// Mekânın tıkla-bul sahnesi var mı? Yoksa (ya da istek başarısızsa) eski yolla anlatıcıyla aranır.
// null: henüz bilinmiyor
export function useSearchAvailability(locationId: string, enabled: boolean): boolean | null {
  const sessionId = useGameStore((s) => s.sessionId);
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    if (!enabled || !sessionId) return;
    let cancelled = false;
    api
      .get<SearchAvailability>(`/game-sessions/${sessionId}/search/${locationId}`)
      .then((res) => {
        if (!cancelled) setAvailable(res.available);
      })
      .catch(() => {
        if (!cancelled) setAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, sessionId, locationId]);

  return enabled ? available : null;
}
