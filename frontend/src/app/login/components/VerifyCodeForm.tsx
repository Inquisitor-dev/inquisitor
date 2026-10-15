import React from 'react';
import styles from '../login.module.scss';

interface VerifyCodeFormProps {
  email: string;
  code: string;
  setCode: (val: string) => void;
  info: string | null;
  loading: boolean;
  onVerify: () => void;
  onBack: () => void;
}

export default function VerifyCodeForm({
  email,
  code,
  setCode,
  info,
  loading,
  onVerify,
  onBack,
}: VerifyCodeFormProps) {
  return (
    <>
      {info && (
        <p className={styles.infoBox}>
          ✓ {info}
        </p>
      )}
      <p className={styles.codeDesc}>
        <strong>{email}</strong> adresine gönderilen 6 haneli kodu girin.
      </p>
      <div className={styles.formGroup}>
        <label>Doğrulama Kodu</label>
        <input
          type="text"
          inputMode="numeric"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          onKeyDown={(e) => e.key === 'Enter' && onVerify()}
          placeholder="000000"
          className={styles.codeInput}
        />
      </div>
      <button
        type="button"
        onClick={onVerify}
        disabled={loading}
        className={styles.primaryBtn}
      >
        {loading ? 'Doğrulanıyor...' : "Ashenmoor'a Gir"}
      </button>
      <button
        type="button"
        onClick={onBack}
        className={styles.backBtn}
      >
        ← Geri Dön
      </button>
    </>
  );
}
