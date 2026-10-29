'use client';

import { useEffect, useState } from 'react';
import { api } from '@/shared/api/client';
import { useGameStore } from '@/store/useGameStore';
import type { SearchAvailability } from './searchTypes';

const NONE: SearchAvailability = { available: false, areas: [], openArea: null, view: null };

// Mekânın tıkla-bul alanları ve son araması. Alan yoksa (ya da istek başarısızsa) mekân eski yolla,
// anlatıcıyla aranır. null: henüz bilinmiyor
export function useSearchAvailability(locationId: string): SearchAvailability | null {
  const sessionId = useGameStore((s) => s.sessionId);
  const [info, setInfo] = useState<SearchAvailability | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    api
      .get<SearchAvailability>(`/game-sessions/${sessionId}/search/${locationId}`)
      .then((res) => {
        if (!cancelled) setInfo(res);
      })
      .catch(() => {
        if (!cancelled) setInfo(NONE);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId, locationId]);

  return info;
}
