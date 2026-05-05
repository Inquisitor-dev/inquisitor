'use client';

import { useEffect, useRef, useState } from 'react';

interface AmbientAudioProps {
  timeOfDay: number;
  type: 'map' | 'interact';
}

const SOUND_MAPPING = {
  map: [
    '/sounds/map_morning.mp3',
    '/sounds/map_noon.mp3',
    '/sounds/map_afternoon.mp3',
    '/sounds/map_evening.mp3',
    '/sounds/map_night.mp3',
  ],
  interact: [
    '/sounds/interact_morning.mp3',
    '/sounds/interact_noon.mp3',
    '/sounds/interact_afternoon.mp3',
    '/sounds/interact_evening.mp3',
    '/sounds/interact_night.mp3',
  ]
};

export default function AmbientAudio({ timeOfDay, type }: AmbientAudioProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const currentSound = SOUND_MAPPING[type][timeOfDay] || SOUND_MAPPING[type][0];
    
    if (audio.src !== window.location.origin + currentSound) {
      audio.src = currentSound;
      audio.load();
      if (!isMuted) {
        audio.play().catch(err => console.log("Audio autoplay blocked or failed:", err));
      }
    }
  }, [timeOfDay, type, isMuted]);

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (isMuted) {
      audio.play().catch(e => console.log(e));
      setIsMuted(false);
    } else {
      audio.pause();
      setIsMuted(true);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '20px', left: '20px', zIndex: 1000 }}>
      <audio ref={audioRef} loop />
      <button 
        onClick={toggleMute}
        style={{
          background: 'rgba(0,0,0,0.5)',
          border: '1px solid rgba(232, 220, 196, 0.3)',
          color: '#E8DCC4',
          padding: '8px',
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(5px)'
        }}
        title={isMuted ? "Sesi Aç" : "Sesi Kapat"}
      >
        {isMuted ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        )}
      </button>
    </div>
  );
}
