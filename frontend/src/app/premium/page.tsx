'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/config/api';
import { useGameStore } from '../../store/useGameStore';

export default function PremiumPage() {
  const router = useRouter();
  const { authToken, isPremium, setIsPremium } = useGameStore();
  const [activationCode, setActivationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleActivate = async () => {
    if (!termsAccepted) {
      setError('Kullanım koşullarını kabul etmeniz gerekmektedir.');
      return;
    }
    if (!activationCode.trim()) {
      setError('Aktivasyon kodunu girin.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiUrl('/auth/activate-premium'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ activationCode: activationCode.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsPremium(true);
        setSuccess(true);
      } else {
        setError(data.message || 'Aktivasyon başarısız.');
      }
    } catch {
      setError('Sunucuya bağlanılamadı.');
    } finally {
      setLoading(false);
    }
  };

  if (isPremium || success) {
    return (
      <main style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at center, #0d0404 0%, #000 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Playfair Display', serif",
        padding: '24px',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '500px',
          background: 'rgba(10,5,5,0.8)',
          border: '1px solid rgba(218,165,32,0.4)',
          backdropFilter: 'blur(20px)',
          padding: '48px 40px',
          textAlign: 'center',
          boxShadow: '0 0 60px rgba(218,165,32,0.1)',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⭐</div>
          <h1 style={{ color: '#DAA520', fontSize: '1.6rem', letterSpacing: '3px', marginBottom: '16px' }}>
            PREMIUM AKTİF
          </h1>
          <p style={{ color: '#e5d9c5', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '24px' }}>
            Tebrikler! Artık tüm premium özelliklere erişebilirsiniz.
          </p>
          <div style={{ color: '#888', fontSize: '0.85rem', lineHeight: 2, marginBottom: '32px', textAlign: 'left', padding: '16px', background: 'rgba(218,165,32,0.05)', border: '1px solid rgba(218,165,32,0.15)' }}>
            ✓ Günlük 100 diyalog hakkı<br/>
            ✓ Günlük 5 soruşturma hakkı<br/>
            ✓ Sunuculara öncelikli erişim<br/>
            ✓ Zorluk seçimi (Orta & Zor)<br/>
            ✓ Ek senaryolar (Modern & Cyberpunk)
          </div>
          <button
            onClick={() => router.push('/')}
            style={{
              width: '100%',
              background: '#DAA520',
              border: 'none',
              color: '#000',
              padding: '14px',
              fontSize: '0.85rem',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              fontFamily: 'Playfair Display, serif',
              fontWeight: 700,
            }}
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </main>
    );
  }

  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#e5d9c5',
    padding: '14px 16px',
    fontSize: '1rem',
    fontFamily: 'Inter, sans-serif',
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s',
  };

  return (
    <main style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at center, #0d0404 0%, #000 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Playfair Display', serif",
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '500px',
        background: 'rgba(10,5,5,0.8)',
        border: '1px solid rgba(218,165,32,0.3)',
        backdropFilter: 'blur(20px)',
        padding: '48px 40px',
        boxShadow: '0 40px 80px rgba(0,0,0,0.8)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⭐</div>
          <h1 style={{ color: '#DAA520', fontSize: '1.4rem', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '8px' }}>
            Premium Üyelik
          </h1>
          <p style={{ color: '#888', fontSize: '0.8rem', letterSpacing: '2px', textTransform: 'uppercase' }}>
            — Tam Engizisyon Yetkisi —
          </p>
        </div>

        {/* Benefits */}
        <div style={{ 
          marginBottom: '32px', 
          padding: '20px', 
          background: 'rgba(218,165,32,0.03)', 
          border: '1px solid rgba(218,165,32,0.15)',
        }}>
          <h3 style={{ color: '#DAA520', fontSize: '0.75rem', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '16px' }}>
            Premium Avantajları
          </h3>
          <div style={{ color: '#aaa', fontSize: '0.85rem', lineHeight: 2.2 }}>
            ⚡ Sunuculara öncelikli erişim<br/>
            🎯 Zorluk seçimi (Orta & Zor modlar)<br/>
            🌍 Ek senaryolar (Modern Kasaba & Cyberpunk)<br/>
            💬 Günlük 100 diyalog hakkı (3x artış)<br/>
            🔍 Günlük 5 soruşturma hakkı (2.5x artış)<br/>
            👥 Ek NPC'ler (Çiftçi & Doktor)
          </div>
        </div>

        {/* Simulated Payment */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '0.7rem', letterSpacing: '2px', color: '#666', textTransform: 'uppercase', marginBottom: '8px' }}>
            Kart Numarası (Aktivasyon Kodu)
          </label>
          <input
            type="text"
            value={activationCode}
            onChange={(e) => setActivationCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleActivate()}
            placeholder="Aktivasyon kodunuzu girin"
            style={inputStyle}
          />
        </div>

        {/* Simulated card fields (decorative) */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.65rem', letterSpacing: '1px', color: '#444', textTransform: 'uppercase', marginBottom: '6px' }}>
              Son Kullanma
            </label>
            <input
              type="text"
              placeholder="AA/YY"
              disabled
              style={{ ...inputStyle, opacity: 0.4, cursor: 'not-allowed' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.65rem', letterSpacing: '1px', color: '#444', textTransform: 'uppercase', marginBottom: '6px' }}>
              CVV
            </label>
            <input
              type="text"
              placeholder="•••"
              disabled
              style={{ ...inputStyle, opacity: 0.4, cursor: 'not-allowed' }}
            />
          </div>
        </div>

        {/* Terms */}
        <label style={{ 
          display: 'flex', 
          alignItems: 'flex-start', 
          gap: '10px', 
          marginBottom: '24px',
          cursor: 'pointer',
          color: '#888',
          fontSize: '0.8rem',
          fontFamily: 'Inter, sans-serif',
          lineHeight: 1.5,
        }}>
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            style={{ marginTop: '3px', accentColor: '#DAA520' }}
          />
          <span>
            <strong style={{ color: '#aaa' }}>Kullanım Koşulları</strong> ve <strong style={{ color: '#aaa' }}>Gizlilik Politikası</strong>&apos;nı okudum, kabul ediyorum. Premium üyelik abonelik bazlıdır ve istediğiniz zaman iptal edilebilir.
          </span>
        </label>

        {/* Submit */}
        <button
          onClick={handleActivate}
          disabled={loading}
          style={{
            width: '100%',
            background: loading ? 'rgba(218,165,32,0.3)' : '#DAA520',
            border: 'none',
            color: '#000',
            padding: '14px',
            fontSize: '0.85rem',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            fontFamily: 'Playfair Display, serif',
            fontWeight: 700,
          }}
        >
          {loading ? 'İşleniyor...' : 'Premium\'u Aktifleştir'}
        </button>

        {/* Back */}
        <button
          onClick={() => router.push('/')}
          style={{
            width: '100%',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#666',
            padding: '12px',
            fontSize: '0.8rem',
            letterSpacing: '1px',
            cursor: 'pointer',
            marginTop: '12px',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          ← Geri Dön
        </button>

        {error && (
          <div style={{ marginTop: '16px', padding: '10px 14px', background: 'rgba(138,3,3,0.15)', border: '1px solid rgba(138,3,3,0.4)', color: '#e07070', fontSize: '0.82rem', fontFamily: 'Inter, sans-serif', textAlign: 'center' }}>
            ⚠️ {error}
          </div>
        )}

        <p style={{ color: '#333', fontSize: '0.7rem', textAlign: 'center', marginTop: '20px', fontFamily: 'Inter, sans-serif' }}>
          🔒 Ödeme bilgileriniz 256-bit SSL ile şifrelenmektedir.
        </p>
      </div>
    </main>
  );
}
