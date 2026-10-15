'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/shared/api/client';
import { logger } from '@/shared/lib/logger';
import type { AbilityInfo, AbilityResult, AbilityState, UseAbilityInput } from './abilityTypes';

interface AbilitiesResponse {
  characterId: string;
  abilityState: AbilityState;
  abilities: AbilityInfo[];
}

const EMPTY_STATE: AbilityState = { uses: {} };

// Vakadaki karakterin yetenekleri. Karakter vaka başında sunucuda kilitlenir; kullanım hakları
// ve kalan etkiler (Sessiz Oda, Çatı Geçişi…) sunucudan okunur.
export function useAbilities(sessionId: string | null) {
  const [data, setData] = useState<AbilitiesResponse | null>(null);
  // Artınca yetenekler sunucudan yeniden okunur
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    (async () => {
      try {
        const response = await api.get<AbilitiesResponse>(`/game-sessions/${sessionId}/abilities`);
        if (!cancelled) setData(response);
      } catch (err) {
        logger.error('Failed to load abilities', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, version]);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  // Hata ApiError olarak fırlatılır; mesajı oyuncuya gösterilebilir
  const activate = useCallback(
    async (input: UseAbilityInput) => {
      if (!sessionId) throw new Error('Aktif soruşturma yok.');
      const response = await api.post<{ result: AbilityResult; session: Record<string, unknown> }>(
        `/game-sessions/${sessionId}/abilities/use`,
        input,
      );
      refresh();
      return response;
    },
    [sessionId, refresh],
  );

  return {
    characterId: data?.characterId ?? null,
    abilities: data?.abilities ?? [],
    abilityState: data?.abilityState ?? EMPTY_STATE,
    refresh,
    activate,
  };
}
