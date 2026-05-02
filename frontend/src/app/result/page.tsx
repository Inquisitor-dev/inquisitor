'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { useGameStore } from '../../store/useGameStore';

function ResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { reset } = useGameStore();
  
  const won = searchParams.get('won') === 'true';
  const message = searchParams.get('message') || '';

  return (
    <main style={{ 
      minHeight: '100vh', 
      background: 'radial-gradient(circle at center, #1a0505 0%, #000000 100%)',
      color: '#e5d9c5',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      textAlign: 'center',
      fontFamily: 'serif'
    }}>
      <h1 style={{ 
        fontSize: '3rem', 
        color: won ? '#b8860b' : '#8A0303',
        marginBottom: '16px',
        textTransform: 'uppercase',
        letterSpacing: '4px'
      }}>
        {won ? 'Soruşturma Başarıyla Sonuçlandı' : 'Korkunç Bir Hata Yaptınız'}
      </h1>

      <p style={{
        fontSize: '1.25rem',
        maxWidth: '600px',
        lineHeight: 1.6,
        marginBottom: '32px',
        opacity: 0.9
      }}>
        {won 
          ? `Mahkumiyet kararı verildi. ${message} Ashenmoor köyü karanlıktan arındı. Ancak Engizisyon'un işi asla bitmez.`
          : searchParams.get('reason') === 'timeout'
            ? `Verilen 3 günlük sürede köyü karanlıktan arındıramadınız. Engizisyon, başarısızlığa ve zayıflığa tahammül etmez. Kilise tarafından derhal görevden alındınız...`
            : `Masum bir ruhu alevlere teslim ettiniz. Gerçek suçlu ise karanlıkta saklanmaya devam ediyor... Köyün kaderi mühürlendi.`
        }
      </p>

      <button 
        onClick={() => {
          reset();
          router.push('/');
        }}
        style={{
          background: 'transparent',
          border: `1px solid ${won ? '#b8860b' : '#8A0303'}`,
          color: won ? '#b8860b' : '#8A0303',
          padding: '12px 32px',
          fontSize: '1rem',
          cursor: 'pointer',
          textTransform: 'uppercase',
          letterSpacing: '2px',
          fontFamily: 'inherit',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = won ? '#b8860b22' : '#8a030322';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        Ana Ekrana Dön ve Yeni Soruşturma Başlat
      </button>
    </main>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<div>Sonuçlar Yükleniyor...</div>}>
      <ResultContent />
    </Suspense>
  );
}
