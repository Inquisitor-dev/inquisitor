'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/shared/api/client';
import { logger } from '@/shared/lib/logger';
import { getNpcProfile } from '@/config/npcProfiles';
import { getLocationLabel } from '@/config/locationLabels';

export interface WarrantInfo {
  // İzni veren karakterler (NPC id'leri mekân id'leriyle aynıdır)
  issuers: string[];
  limit: number;
  remaining: number;
  active: string[];
  used: string[];
}

// Arama izinleri: kimin verdiği ve kaç hak kaldığı (GET /game-sessions/:id/warrants).
// İzin yazıyla değil, izin verenin sorgu ekranındaki "Arama İzni İste" penceresinden istenir.
export function useWarrantInfo(sessionId: string | null) {
  const [info, setInfo] = useState<WarrantInfo | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    (async () => {
      try {
        const response = await api.get<WarrantInfo>(`/game-sessions/${sessionId}/warrants`);
        if (!cancelled) setInfo(response);
      } catch (err) {
        logger.error('Failed to load warrants', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, version]);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);
  return { info, refresh };
}

// "Komutan Bjorn (Gözcü Kalesi) ya da Kahin Valda (Kutsal Yürek Ağacı)"
export function issuerNames(issuers: string[], scenario: string): string {
  return issuers
    .map((id) => {
      const name = getNpcProfile(id, scenario)?.name ?? id;
      return `${name} (${getLocationLabel(id, scenario)})`;
    })
    .join(' ya da ');
}
