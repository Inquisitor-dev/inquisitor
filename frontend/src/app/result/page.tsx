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
        {won
          ? 'Soruşturma Başarıyla Sonuçlandı'
          : searchParams.get('reason') === 'timeout'
            ? 'Süre Doldu'
            : 'Korkunç Bir Hata Yaptın'}
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
          ? `Hüküm verildi. ${message} Karanlık bu kez geri çekildi, ama Engizisyon’un işi asla bitmez.`
          : searchParams.get('reason') === 'timeout'
            ? `Sana verilen dört günde katili bulamadın. Engizisyon başarısızlığı ve zaafı affetmez; görevinden derhal alındın...`
            : `Masum bir ruhu alevlere teslim ettin. Gerçek katil ise karanlıkta saklanmaya devam ediyor... Bu toprakların kaderi artık mühürlendi.`}
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
        Ana Menüye Dön
      </button>
    </main>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<div>Sonuçlar yükleniyor...</div>}>
      <ResultContent />
    </Suspense>
  );
}
