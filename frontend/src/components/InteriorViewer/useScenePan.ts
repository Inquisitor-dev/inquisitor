'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type React from 'react';

// Sürüklerken görselin kenarı en fazla bu kadar aşılabilir (lastik efekti)
const OVERSCROLL = 40;
// Görsel yüksekliğinin ekran yüksekliğine oranı: dikeyde de biraz gezinme payı bırakır
const FRAME_HEIGHT_RATIO = 1.15;

type DragState = {
  startX: number;
  startY: number;
  panX: number;
  panY: number;
  moved: number;
  lastX: number;
  lastY: number;
  lastT: number;
  vx: number;
  vy: number;
};

// Ekranı boşluksuz dolduran, sürüklenerek gezilen sahne (iç mekânlar ve oyuncunun evi).
// `locked` iken (ör. bir pencere açıkken) sürükleme ve ok tuşları çalışmaz.
// `focusX`: açılışta yatayda ekranın ortasına gelen nokta (görsel genişliğinin oranı, varsayılan orta).
export function useScenePan(aspectRatio: number, locked: boolean, focusX = 0.5) {
  const [viewport, setViewport] = useState<{ w: number; h: number }>(() => ({
    w: typeof window === 'undefined' ? 1920 : window.innerWidth,
    h: typeof window === 'undefined' ? 1080 : window.innerHeight,
  }));
  // Görsel her iki eksende de ekrandan taşar (yükseklik ekranın %115'i, en az esneme payı kadar):
  // böylece yukarı-aşağı da biraz gezilir ve kenara çekince siyah yerine görselin kenarı görünür
  const frameH = Math.max(
    viewport.h * FRAME_HEIGHT_RATIO,
    viewport.h + 2 * OVERSCROLL,
    (viewport.w + 2 * OVERSCROLL) / aspectRatio
  );
  const frameW = frameH * aspectRatio;
  // Sürüklerken kenarı bu kadar aşabilir (lastik efekti). Sınırlar bu pay kadar içeride tutulur;
  // esneme görselin ekran dışında kalan kenarından yapılır, siyah boşluk görünmez.
  const edgeX = Math.min(OVERSCROLL, (frameW - viewport.w) / 2);
  const edgeY = Math.min(OVERSCROLL, (frameH - viewport.h) / 2);
  const bounds = {
    minX: -(frameW - viewport.w) + edgeX,
    maxX: -edgeX,
    minY: -(frameH - viewport.h) + edgeY,
    maxY: -edgeY,
  };
  const [pan, setPan] = useState<{ x: number; y: number } | null>(null);
  // `stretch`: sürüklerken esnemeye izin verir. Esneme her eksende o eksende gizli kalan pay kadardır;
  // görsel bir eksende ekrana tam sığıyorsa (gizli pay 0) o eksende hiç esnemez, siyah boşluk açılmaz.
  const clampPan = useCallback(
    (p: { x: number; y: number }, stretch = false) => {
      const slackX = stretch ? edgeX : 0;
      const slackY = stretch ? edgeY : 0;
      return {
        x: Math.max(bounds.minX - slackX, Math.min(bounds.maxX + slackX, p.x)),
        y: Math.max(bounds.minY - slackY, Math.min(bounds.maxY + slackY, p.y)),
      };
    },
    [bounds.minX, bounds.maxX, bounds.minY, bounds.maxY, edgeX, edgeY]
  );
  // İlk açılışta ve ekran boyutu değişince sahne ortalanır
  // Açılışta yatayda odak noktasına ortalı, dikeyde biraz aşağı bakar: zemin ve masalar görünür
  const centered = {
    x: Math.max(bounds.minX, Math.min(bounds.maxX, viewport.w / 2 - focusX * frameW)),
    y: bounds.maxY + (bounds.minY - bounds.maxY) * 0.45,
  };
  const currentPan = pan ?? centered;
  const dragRef = useRef<DragState | null>(null);
  const inertiaRef = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setViewport({ w: window.innerWidth, h: window.innerHeight });
      setPan(null);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => () => {
    if (inertiaRef.current) cancelAnimationFrame(inertiaRef.current);
  }, []);

  // Bırakınca hız azalarak kayar; sınırın dışına taşmışsa yaylanarak yumuşakça geri döner
  const startInertia = (from: { x: number; y: number }, vx: number, vy: number) => {
    let p = { ...from };
    let v = { x: vx, y: vy };
    const step = () => {
      v = { x: v.x * 0.92, y: v.y * 0.92 };
      p = clampPan({ x: p.x + v.x, y: p.y + v.y }, true);
      const target = clampPan(p);
      const outX = target.x - p.x;
      const outY = target.y - p.y;
      // Sınır dışındaki eksende hız sönümlenir ve görüntü her karede kalan mesafenin bir kısmı kadar içeri çekilir
      if (outX !== 0) v.x *= 0.5;
      if (outY !== 0) v.y *= 0.5;
      p = { x: p.x + outX * 0.18, y: p.y + outY * 0.18 };
      const settled = Math.hypot(v.x, v.y) < 0.3 && Math.hypot(outX, outY) < 0.5;
      if (settled) {
        setPan(target);
        inertiaRef.current = null;
        return;
      }
      setPan(p);
      inertiaRef.current = requestAnimationFrame(step);
    };
    inertiaRef.current = requestAnimationFrame(step);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (locked || e.button !== 0) return;
    // Üst ve alt çubuktaki buton, menü ve bağlantılar sürükleme başlatmaz
    if ((e.target as HTMLElement).closest('header, footer')) return;
    if (inertiaRef.current) cancelAnimationFrame(inertiaRef.current);
    const now = performance.now();
    dragRef.current = {
      startX: e.clientX, startY: e.clientY, panX: currentPan.x, panY: currentPan.y,
      moved: 0, lastX: e.clientX, lastY: e.clientY, lastT: now, vx: 0, vy: 0,
    };
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const now = performance.now();
      const dt = Math.max(1, now - d.lastT);
      d.vx = ((e.clientX - d.lastX) / dt) * 16;
      d.vy = ((e.clientY - d.lastY) / dt) * 16;
      d.moved += Math.hypot(e.clientX - d.lastX, e.clientY - d.lastY);
      d.lastX = e.clientX;
      d.lastY = e.clientY;
      d.lastT = now;
      setPan(clampPan({ x: d.panX + e.clientX - d.startX, y: d.panY + e.clientY - d.startY }, true));
    };
    const handleUp = () => {
      const d = dragRef.current;
      setIsDragging(false);
      if (!d) return;
      const from = { x: d.panX + d.lastX - d.startX, y: d.panY + d.lastY - d.startY };
      startInertia(clampPan(from, true), d.vx, d.vy);
      // Tıklama olayı bu kareden sonra geldiği için sürükleme bilgisi bir an korunur
      setTimeout(() => {
        dragRef.current = null;
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
    // startInertia her render'da yeniden oluşur; sürükleme boyunca son hâli yeterli
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging, clampPan]);

  // Sürüklemenin sonunda bir noktanın üstünde bırakılırsa o nokta açılmaz
  const handleClickCapture = (e: React.MouseEvent) => {
    if ((dragRef.current?.moved ?? 0) > 6) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  // Ok tuşlarıyla etrafa bakma
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
      setPan((prev) => clampPan({ x: (prev ?? centered).x + d[0], y: (prev ?? centered).y + d[1] }));
    };
    window.addEventListener('keydown', handleArrows);
    return () => window.removeEventListener('keydown', handleArrows);
  });

  return { viewport, frameW, frameH, currentPan, isDragging, handlePointerDown, handleClickCapture };
}
