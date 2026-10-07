'use client';

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import dynamic from 'next/dynamic';
import { useCharacterManifest, type CharacterManifest } from './characterManifest';
import styles from './CharacterTurntable.module.scss';

// three.js yalnızca 3D model gösterilecekse yüklensin
const CharacterModelView = dynamic(() => import('./CharacterModelView'), { ssr: false });

// Bir tam tur süresi (sn), kendi kendine dönerken
const AUTO_TURN_SECONDS = 14;
// Sürüklerken bir kare ilerlemek için gereken yatay piksel
const DRAG_PX_PER_FRAME = 4;
// Bırakıldıktan sonra kendi kendine dönmeye devam etmeden önce beklenen süre (ms)
const RESUME_DELAY = 1800;

type Props = {
  outfitId: string | null;
  className?: string;
  alt?: string;
};

let webglSupport: boolean | null = null;

function supportsWebGL(): boolean {
  if (webglSupport === null) {
    try {
      const gl = document.createElement('canvas').getContext('webgl2');
      webglSupport = !!gl;
      // Deneme bağlamı hemen bırakılsın; tarayıcının açık bağlam sınırından yemesin
      gl?.getExtension('WEBGL_lose_context')?.loseContext();
    } catch {
      webglSupport = false;
    }
  }
  return webglSupport;
}

// Menüdeki 360° karakter: yavaşça kendi etrafında döner, fareyle/parmakla sürüklenince elle çevrilir.
// Manifest'te 3D model varsa gerçek zamanlı gösterilir; yoksa (ya da WebGL yoksa) sprite dönüşüne düşer.
// Boyut `className` ile verilir (yükseklik); genişlik karenin oranından gelir.
export default function CharacterTurntable({ outfitId, className = '', alt = 'Karakter' }: Props) {
  const manifest = useCharacterManifest(outfitId, 'turntable');
  const [failedModel, setFailedModel] = useState<string | null>(null);

  if (manifest?.model && failedModel !== manifest.model && supportsWebGL()) {
    const model = manifest.model;
    return <CharacterModelView src={model} alt={alt} className={className} onError={() => setFailedModel(model)} />;
  }
  return <SpriteTurntable manifest={manifest} className={className} alt={alt} />;
}

function SpriteTurntable({
  manifest,
  className,
  alt,
}: {
  manifest: CharacterManifest | null;
  className: string;
  alt: string;
}) {
  const turntable = manifest?.turntable;
  const [frame, setFrame] = useState(0);
  const frameRef = useRef(0);
  const drag = useRef<{ x: number; frame: number } | null>(null);
  const resumeAt = useRef(0);

  useEffect(() => {
    if (!turntable) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    let last: number | null = null;
    const tick = (now: number) => {
      const dt = last === null ? 0 : Math.min((now - last) / 1000, 0.1);
      last = now;
      if (!drag.current && now >= resumeAt.current) {
        frameRef.current = (frameRef.current + (dt * turntable.frames) / AUTO_TURN_SECONDS) % turntable.frames;
        setFrame(frameRef.current);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [turntable]);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, frame: frameRef.current };
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current || !turntable) return;
    // Sağa sürükleyince karakterin önü sağa döner
    const n = turntable.frames;
    const next = drag.current.frame + (e.clientX - drag.current.x) / DRAG_PX_PER_FRAME;
    frameRef.current = ((next % n) + n) % n;
    setFrame(frameRef.current);
  };

  const endDrag = () => {
    drag.current = null;
    resumeAt.current = performance.now() + RESUME_DELAY;
  };

  if (!turntable) {
    return <div className={`${styles.turntable} ${className}`} aria-hidden />;
  }

  const { frames, columns, frameWidth, frameHeight, src } = turntable;
  const rows = Math.ceil(frames / columns);
  const index = Math.floor(frame) % frames;
  const style: CSSProperties = {
    aspectRatio: `${frameWidth} / ${frameHeight}`,
    backgroundImage: `url(${src})`,
    backgroundSize: `${columns * 100}% ${rows * 100}%`,
    backgroundPosition: `${((index % columns) / (columns - 1)) * 100}% ${(Math.floor(index / columns) / Math.max(rows - 1, 1)) * 100}%`,
  };

  return (
    <div
      className={`${styles.turntable} ${styles.ready} ${className}`}
      style={style}
      role="img"
      aria-label={`${alt} (döndürmek için sürükle)`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    />
  );
}
