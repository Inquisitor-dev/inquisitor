import React from 'react';
import styles from '../login.module.scss';

interface LoginFormProps {
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  loading: boolean;
  onSubmit: () => void;
}

export default function LoginForm({
  email,
  setEmail,
  password,
  setPassword,
  loading,
  onSubmit,
}: LoginFormProps) {
  return (
    <>
      <div className={styles.formGroup}>
        <label>E-posta veya Kullanıcı Adı</label>
        <input
          type="text"
          placeholder="Örn: ornek@engizisyon.org veya dedektif"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
          className={styles.input}
        />
      </div>
      <div className={`${styles.formGroup} ${styles.formGroupLg}`}>
        <label>Şifre</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
          className={styles.input}
        />
      </div>
      <button
        type="button"
        onClick={onSubmit}
        disabled={loading}
        className={styles.primaryBtn}
      >
        {loading ? 'Bağlanıyor...' : "Ashenmoor'a Dön"}
      </button>
    </>
  );
}
