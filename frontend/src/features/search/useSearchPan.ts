'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type React from 'react';

// Sürükleme bu kadar pikseli geçerse bırakılan yer tıklama sayılmaz
const DRAG_THRESHOLD = 6;

type Point = { x: number; y: number };

// Arama sahnesinin görünümü: üst şerit ile nesne listesi arasındaki alan (sahne). Görsel sahneyi boşluksuz
// dolduracak kadar büyütülür (siyah şerit kalmaz); ekranın oranı farklıysa taşan kısım sürüklenerek ya da
// ok tuşlarıyla gezilir ve sınır tam görselin kenarıdır, her köşesi sahneye getirilebilir. Yakınlaştırma yok.
// İç mekânların useScenePan'ından farkı: görsel fazladan büyütülmez, kenarlar hiçbir zaman ulaşılamaz kalmaz.
export function useSearchPan(aspectRatio: number, locked: boolean) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [stage, setStage] = useState({ w: 0, h: 0 });

  // Sahnenin ölçüsü: şeritler belirip kaybolunca (liste, süre satırı) değişir. ResizeObserver'a ek olarak
  // her çizimden sonra da okunur; değişmediyse durum güncellenmez
  const measure = useCallback(() => {
    const el = stageRef.current;
    if (!el) return;
    const w = el.clientWidth;
    const h = el.clientHeight;
    setStage((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
  }, []);
  useLayoutEffect(measure);
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure]);

  // Sahneyi boşluksuz dolduran ölçü
  const frameW = Math.max(stage.w, stage.h * aspectRatio);
  const frameH = frameW / aspectRatio;

  // Görselin kenarı sahnenin kenarını geçemez
  const clamp = useCallback(
    (p: Point): Point => ({
      x: Math.min(0, Math.max(stage.w - frameW, p.x)),
      y: Math.min(0, Math.max(stage.h - frameH, p.y)),
    }),
    [stage.w, stage.h, frameW, frameH]
  );
  const [panState, setPanState] = useState<Point | null>(null);
  const pan = clamp(panState ?? { x: (stage.w - frameW) / 2, y: (stage.h - frameH) / 2 });

  // Ekran boyutu değişince görünüm ortalanır
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sahne ölçüsü değişince görünüm sıfırlanır
    setPanState(null);
  }, [stage.w, stage.h]);

  // Görselin bir noktasını (yüzde) sahnenin ortasına getirir; ör. ipucu dairesi
  const focus = (xPct: number, yPct: number) =>
    setPanState(clamp({ x: stage.w / 2 - (xPct / 100) * frameW, y: stage.h / 2 - (yPct / 100) * frameH }));

  const drag = useRef<{ start: Point; pan: Point; moved: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (locked || e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button')) return;
    drag.current = { start: { x: e.clientX, y: e.clientY }, pan, moved: 0 };
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      d.moved = Math.max(d.moved, Math.hypot(e.clientX - d.start.x, e.clientY - d.start.y));
      setPanState({ x: d.pan.x + e.clientX - d.start.x, y: d.pan.y + e.clientY - d.start.y });
    };
    const handleUp = () => {
      setIsDragging(false);
      // Tıklama olayı bu kareden sonra geldiği için sürükleme bilgisi bir an korunur
      setTimeout(() => {
        drag.current = null;
      }, 0);
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [isDragging]);

  // Sürükleyip bırakmak tıklama sayılmaz (yanlış tıklama cezası yedirmesin)
  const handleClickCapture = (e: React.MouseEvent) => {
    if ((drag.current?.moved ?? 0) > DRAG_THRESHOLD) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  // Ok tuşlarıyla gezinme. Aynı karede gelen birden çok tuş birbirini ezmesin diye son konum ayrıca tutulur
  const panRef = useRef(pan);
  useEffect(() => {
    panRef.current = pan;
  });
  useEffect(() => {
    const handleArrows = (e: KeyboardEvent) => {
      if (locked) return;
      const step = 80;
      const delta: Record<string, [number, number]> = {
        ArrowLeft: [step, 0],
        ArrowRight: [-step, 0],
        ArrowUp: [0, step],
        ArrowDown: [0, -step],
      };
      const d = delta[e.key];
      if (!d) return;
      e.preventDefault();
      const next = clamp({ x: panRef.current.x + d[0], y: panRef.current.y + d[1] });
      panRef.current = next;
      setPanState(next);
    };
    window.addEventListener('keydown', handleArrows);
    return () => window.removeEventListener('keydown', handleArrows);
  }, [locked, clamp]);

  return { stageRef, frameW, frameH, pan, focus, isDragging, handlePointerDown, handleClickCapture };
}
