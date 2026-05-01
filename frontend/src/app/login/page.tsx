'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '../../store/useGameStore';

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useGameStore();

  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const handleSendCode = async () => {
    if (!email.includes('@')) {
      setError('Geçerli bir e-posta adresi girin.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:3001/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setInfo('Doğrulama kodu e-posta adresinize gönderildi.');
        setStep('code');
      } else {
        setError(data.message || 'Bir hata oluştu.');
      }
    } catch {
      setError('Sunucuya bağlanılamadı.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError('6 haneli kodu eksiksiz girin.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:3001/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        setUser(email, data.userId, data.token);
        router.push('/');
      } else {
        setError(data.message || 'Geçersiz kod.');
      }
    } catch {
      setError('Sunucuya bağlanılamadı.');
    } finally {
      setLoading(false);
    }
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
        maxWidth: '440px',
        background: 'rgba(10,5,5,0.8)',
        border: '1px solid rgba(138,3,3,0.3)',
        backdropFilter: 'blur(20px)',
        padding: '48px 40px',
        boxShadow: '0 40px 80px rgba(0,0,0,0.8)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <svg viewBox="0 0 80 80" fill="none" style={{ width: '60px', margin: '0 auto 16px' }}>
            <circle cx="40" cy="40" r="36" stroke="#8A0303" strokeWidth="1" strokeDasharray="4 3"/>
            <line x1="40" y1="10" x2="40" y2="70" stroke="#8A0303" strokeWidth="1.5"/>
            <line x1="10" y1="40" x2="70" y2="40" stroke="#8A0303" strokeWidth="1.5"/>
            <rect x="36" y="36" width="8" height="8" fill="#8A0303" transform="rotate(45 40 40)"/>
          </svg>
          <h1 style={{ fontSize: '1.8rem', color: '#e5d9c5', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '4px' }}>
            The Inquisitor
          </h1>
          <p style={{ fontSize: '0.7rem', color: '#666', letterSpacing: '3px', textTransform: 'uppercase' }}>
            — Anno Domini MCCXII —
          </p>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(138,3,3,0.3)' }}/>
          <span style={{ color: '#8A0303', fontSize: '0.7rem', letterSpacing: '2px' }}>
            {step === 'email' ? 'KİMLİĞİNİZİ KANITLAYIN' : 'KODU GİRİN'}
          </span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(138,3,3,0.3)' }}/>
        </div>

        {step === 'email' ? (
          <>
            <p style={{ color: '#888', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '24px', textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
              E-posta adresinizi girin. Ashenmoor'a girişiniz için bir doğrulama kodu göndereceğiz.
            </p>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.7rem', letterSpacing: '2px', color: '#666', textTransform: 'uppercase', marginBottom: '8px' }}>
                E-posta Adresi
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendCode()}
                placeholder="ornek@email.com"
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#e5d9c5',
                  padding: '14px 16px',
                  fontSize: '1rem',
                  fontFamily: 'Inter, sans-serif',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.target.style.borderColor = '#8A0303'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>
            <button
              onClick={handleSendCode}
              disabled={loading}
              style={{
                width: '100%',
                background: loading ? 'rgba(138,3,3,0.3)' : '#8A0303',
                border: 'none',
                color: '#fff',
                padding: '14px',
                fontSize: '0.85rem',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                fontFamily: 'Playfair Display, serif',
              }}
            >
              {loading ? 'Gönderiliyor...' : 'Doğrulama Kodu Gönder'}
            </button>
          </>
        ) : (
          <>
            {info && (
              <p style={{ color: '#7a9e7a', fontSize: '0.85rem', marginBottom: '16px', textAlign: 'center', fontFamily: 'Inter, sans-serif', background: 'rgba(0,100,0,0.1)', padding: '10px', border: '1px solid rgba(0,150,0,0.2)' }}>
                ✓ {info}
              </p>
            )}
            <p style={{ color: '#888', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '24px', textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
              <strong style={{ color: '#e5d9c5' }}>{email}</strong> adresine gönderilen 6 haneli kodu girin.
            </p>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.7rem', letterSpacing: '2px', color: '#666', textTransform: 'uppercase', marginBottom: '8px' }}>
                Doğrulama Kodu
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                placeholder="000000"
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#e5d9c5',
                  padding: '14px 16px',
                  fontSize: '1.8rem',
                  fontFamily: 'monospace',
                  letterSpacing: '8px',
                  textAlign: 'center',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => e.target.style.borderColor = '#8A0303'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>
            <button
              onClick={handleVerify}
              disabled={loading}
              style={{
                width: '100%',
                background: loading ? 'rgba(138,3,3,0.3)' : '#8A0303',
                border: 'none',
                color: '#fff',
                padding: '14px',
                fontSize: '0.85rem',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'Playfair Display, serif',
              }}
            >
              {loading ? 'Doğrulanıyor...' : 'Ashenmoor\'a Gir'}
            </button>
            <button
              onClick={() => { setStep('email'); setError(null); setCode(''); }}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: '#555',
                padding: '12px',
                fontSize: '0.75rem',
                letterSpacing: '1px',
                cursor: 'pointer',
                marginTop: '8px',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              ← Farklı e-posta kullan
            </button>
          </>
        )}

        {error && (
          <div style={{ marginTop: '16px', padding: '10px 14px', background: 'rgba(138,3,3,0.15)', border: '1px solid rgba(138,3,3,0.4)', color: '#e07070', fontSize: '0.82rem', fontFamily: 'Inter, sans-serif', textAlign: 'center' }}>
            ⚠️ {error}
          </div>
        )}
      </div>
    </main>
  );
}
