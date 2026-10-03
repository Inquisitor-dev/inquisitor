'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { TruthRevealPanel } from '../../components/TruthRevealPanel';

function ResultContent() {
  const searchParams = useSearchParams();
  const { reset, truthReveal, locationClues, scenarioType } = useGameStore();

  const won = searchParams.get('won') === 'true';
  const message = searchParams.get('message') || '';

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at center, #1a0505 0%, #000000 100%)',
        color: '#e5d9c5',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center',
        fontFamily: 'serif',
      }}
    >
      <h1
        style={{
          fontSize: '3rem',
          color: won ? '#b8860b' : '#8A0303',
          marginBottom: '16px',
          textTransform: 'uppercase',
          letterSpacing: '4px',
        }}
      >
        {won ? 'Sorusturma Basariyla Sonuclandi' : 'Korkunc Bir Hata Yaptiniz'}
      </h1>

      <p
        style={{
          fontSize: '1.25rem',
          maxWidth: '600px',
          lineHeight: 1.6,
          marginBottom: '32px',
          opacity: 0.9,
        }}
      >
        {won
          ? `Mahkumiyet karari verildi. ${message} Ashenmoor koyu karanliktan arindirildi. Ancak Engizisyon'un isi asla bitmez.`
          : searchParams.get('reason') === 'timeout'
            ? `Verilen 3 gunluk surede koyu karanliktan arindiramadiniz. Engizisyon, basarisizliga ve zayifliga tahammul etmez. Kilise tarafindan derhal gorevden alindiniz...`
            : `Masum bir ruhu alevlere teslim ettiniz. Gercek suclu ise karanlikta saklanmaya devam ediyor... Koyun kaderi muhurlendi.`}
      </p>

      {(truthReveal || (locationClues && Object.keys(locationClues).length > 0)) && (
        <div style={{ maxWidth: '800px', marginBottom: '24px', width: '100%' }}>
          <TruthRevealPanel
            truthReveal={truthReveal}
            locationClues={locationClues}
            scenarioType={scenarioType}
          />
        </div>
      )}

      <button
        onClick={() => {
          reset();
          window.location.href = '/menu';
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
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = won ? '#b8860b22' : '#8a030322';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        Ana Ekrana Don ve Yeni Sorusturma Baslat
      </button>
    </main>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<div>Sonuclar Yukleniyor...</div>}>
      <ResultContent />
    </Suspense>
  );
}
