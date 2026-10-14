'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/shared/api/client';
import { useGameStore } from '../../store/useGameStore';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import VerifyCodeForm from './components/VerifyCodeForm';
import styles from './login.module.scss';

export default function LoginPage() {
  const router = useRouter();
  const { setUser, authToken, hasHydrated } = useGameStore();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [step, setStep] = useState<'details' | 'code'>('details');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('avatar_1');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const resetState = () => {
    setError(null);
    setInfo(null);
    setCode('');
    setStep('details');
  };

  const switchMode = (m: 'login' | 'register') => {
    setMode(m);
    resetState();
  };

  // Zaten giriş yapılmışsa ana sayfaya at
  useEffect(() => {
    if (hasHydrated && authToken) {
      router.push('/menu');
    }
  }, [hasHydrated, authToken, router]);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Kullanıcı adı/e-posta adresini ve şifreni gir.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await api.post<{
        email: string;
        userId: string;
        token: string;
        isAdmin: boolean;
        isPremium?: boolean;
        username?: string;
        avatar?: string;
      }>('/auth/login', { identifier: email.trim(), password }, { token: null });

      setUser(
        data.email,
        data.userId,
        data.token,
        data.isAdmin,
        data.isPremium || false,
        data.username,
        data.avatar,
      );
      router.push('/menu');
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Sunucuya bağlanılamadı.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendCode = async () => {
    if (username.trim().length < 3) {
      setError('Kullanıcı adı en az 3 karakter olmalıdır.');
      return;
    }
    if (!email.includes('@') || password.length < 6) {
      setError('Geçerli bir e-posta adresi ve en az 6 karakterli bir şifre gir.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await api.post<{ message?: string }>(
        '/auth/send-code',
        {
          email: email.trim(),
          password,
          username: username.trim(),
          avatar: selectedAvatar,
        },
        { token: null },
      );

      setInfo(data.message || 'Doğrulama kodu e-posta adresine gönderildi.');
      setStep('code');
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Sunucuya bağlanılamadı.');
      }
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
      const data = await api.post<{
        email: string;
        userId: string;
        token: string;
        isAdmin: boolean;
        isPremium?: boolean;
        username?: string;
        avatar?: string;
      }>('/auth/verify', { email: email.trim(), code }, { token: null });

      setUser(
        data.email,
        data.userId,
        data.token,
        data.isAdmin,
        data.isPremium || false,
        data.username,
        data.avatar,
      );
      router.push('/menu');
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Sunucuya bağlanılamadı.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.card}>
        {/* Logo */}
        <div className={styles.logoArea}>
          <svg viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="36" stroke="#8A0303" strokeWidth="1" strokeDasharray="4 3" />
            <line x1="40" y1="10" x2="40" y2="70" stroke="#8A0303" strokeWidth="1.5" />
            <line x1="10" y1="40" x2="70" y2="40" stroke="#8A0303" strokeWidth="1.5" />
            <rect x="36" y="36" width="8" height="8" fill="#8A0303" transform="rotate(45 40 40)" />
          </svg>
          <h1>The Inquisitor</h1>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`${styles.tabBtn} ${mode === 'login' ? styles.active : ''}`}
          >
            Giriş Yap
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            className={`${styles.tabBtn} ${mode === 'register' ? styles.active : ''}`}
          >
            Kaydol
          </button>
        </div>

        {mode === 'login' && (
          <LoginForm
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            loading={loading}
            onSubmit={handleLogin}
          />
        )}

        {mode === 'register' && step === 'details' && (
          <RegisterForm
            username={username}
            setUsername={setUsername}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            selectedAvatar={selectedAvatar}
            setSelectedAvatar={setSelectedAvatar}
            loading={loading}
            onSubmit={handleSendCode}
          />
        )}

        {mode === 'register' && step === 'code' && (
          <VerifyCodeForm
            email={email}
            code={code}
            setCode={setCode}
            info={info}
            loading={loading}
            onVerify={handleVerify}
            onBack={resetState}
          />
        )}

        {error && (
          <div className={styles.errorBox}>
            ⚠️ {error}
          </div>
        )}
      </div>
    </main>
  );
}
