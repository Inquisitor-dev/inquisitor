'use client';

import { useEffect, type RefObject } from 'react';
import type { LocationInteriorData } from '@/config/interiorConfig';

// ─── AMBİYANS PARÇACIK MOTORU (Uçuşan Közler, Yağmur, Kar ve Toz) ───────────
export function useAmbientParticles(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  particleType: LocationInteriorData['particleType']
) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    // Pencere boyutu değişince güncellenir; yoksa parçacıklar eski kenarda birikir
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const isEmbers = particleType === 'embers';
    const isRain = particleType === 'rain';
    // Kar: yavaş düşen, sağa sola salınan yumuşak taneler (açık hava sahneleri)
    const isSnow = particleType === 'snow';
    const count = isRain ? 90 : isSnow ? 80 : isEmbers ? 45 : 35;

    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: isRain
        ? Math.random() * 12 + 10
        : isSnow
        ? Math.random() * 2 + 1.2
        : Math.random() * (isEmbers ? 2.8 : 2) + 0.8,
      speedY: isRain
        ? Math.random() * 6 + 9
        : isSnow
        ? Math.random() + 0.6
        : isEmbers
        ? -(Math.random() * 0.9 + 0.3)
        : Math.random() * 0.4 - 0.2,
      speedX: isRain ? -1.2 : isSnow ? (Math.random() - 0.5) * 0.4 : (Math.random() - 0.5) * 0.6,
      opacity: Math.random() * 0.6 + 0.2,
      pulse: Math.random() * Math.PI * 2,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX + (isSnow ? Math.sin(p.pulse) * 0.3 : 0);
        p.pulse += 0.03;

        if (isEmbers && p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        } else if (!isEmbers) {
          if (p.y < -10) p.y = height + 10;
          if (p.y > height + 10) p.y = -10;
          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;
        }

        const currentOpacity = Math.max(
          0.1,
          Math.min(0.85, p.opacity + Math.sin(p.pulse) * 0.25)
        );

        if (isRain) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.speedX * 2, p.y + p.size);
          ctx.strokeStyle = `rgba(170, 220, 255, ${currentOpacity * 0.35})`;
          ctx.lineWidth = 1;
          ctx.shadowBlur = 0;
          ctx.stroke();
          return;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        if (isSnow) {
          ctx.fillStyle = `rgba(245, 250, 255, ${currentOpacity * 0.8})`;
          ctx.shadowBlur = 0;
        } else if (isEmbers) {
          ctx.fillStyle = `rgba(255, ${Math.floor(140 + Math.sin(p.pulse) * 40)}, 40, ${currentOpacity})`;
          ctx.shadowBlur = 8;
          ctx.shadowColor = 'rgba(255, 120, 20, 0.6)';
        } else {
          ctx.fillStyle = `rgba(232, 220, 196, ${currentOpacity * 0.5})`;
          ctx.shadowBlur = 0;
        }
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [canvasRef, particleType]);
}
