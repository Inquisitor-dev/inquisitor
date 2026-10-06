'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Coins, ArrowRight } from 'lucide-react';

export default function PremiumPage() {
  const router = useRouter();

  useEffect(() => {
    // 3 saniye sonra otomatik olarak markete yönlendir
    const timer = setTimeout(() => {
      router.replace('/market');
    }, 3500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at center, #0f0707 0%, #050202 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Playfair Display', Georgia, serif",
        padding: '24px',
        color: '#e8dcc4',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          background: 'rgba(18, 10, 10, 0.85)',
          border: '1px solid rgba(200, 150, 60, 0.35)',
          backdropFilter: 'blur(20px)',
          padding: '48px 36px',
          textAlign: 'center',
          boxShadow: '0 0 60px rgba(0, 0, 0, 0.8)',
          borderRadius: '4px',
        }}
      >
        <div style={{ display: 'inline-flex', padding: '16px', background: 'rgba(218, 165, 32, 0.1)', borderRadius: '50%', marginBottom: '20px', color: '#c99a3e' }}>
          <Coins size={36} />
        </div>
        <h1
          style={{
            color: '#c99a3e',
            fontSize: '1.6rem',
            letterSpacing: '2px',
            marginBottom: '16px',
          }}
        >
          Abonelik Modeli Kaldırıldı
        </h1>
        <p
          style={{
            fontSize: '0.95rem',
            lineHeight: 1.7,
            color: '#c4b69c',
            marginBottom: '24px',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Aylık Premium abonelik yerine <strong>Token Marketi</strong> sistemine geçtik!
          Günlük 100 diyalog ve 5 soruşturma hakkı artık tüm oyunculara standart olarak tanımlandı.
          Evrenleri, zorlukları ve kozmetikleri dilediğin gibi token ile açabilirsin.
        </p>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            marginTop: '28px',
          }}
        >
          <Link
            href="/market"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: '#8a0303',
              color: '#fff',
              padding: '14px 24px',
              fontSize: '0.9rem',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              textDecoration: 'none',
              fontWeight: 600,
              fontFamily: 'Inter, sans-serif',
              borderRadius: '2px',
            }}
          >
            Markete Git <ArrowRight size={16} />
          </Link>

          <Link
            href="/menu"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              color: '#8e826e',
              padding: '10px',
              fontSize: '0.85rem',
              textDecoration: 'none',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Ana Menüye Dön
          </Link>
        </div>

        <small
          style={{
            display: 'block',
            marginTop: '20px',
            color: '#6e6250',
            fontSize: '0.75rem',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Otomatik olarak markete yönlendiriliyorsunuz...
        </small>
      </div>
    </main>
  );
}
