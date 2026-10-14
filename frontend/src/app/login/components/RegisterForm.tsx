import React from 'react';
import { DEFAULT_AVATARS, getAvatarInfo } from '@/config/avatars';
import styles from '../login.module.scss';

interface RegisterFormProps {
  username: string;
  setUsername: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  selectedAvatar: string;
  setSelectedAvatar: (val: string) => void;
  loading: boolean;
  onSubmit: () => void;
}

export default function RegisterForm({
  username,
  setUsername,
  email,
  setEmail,
  password,
  setPassword,
  selectedAvatar,
  setSelectedAvatar,
  loading,
  onSubmit,
}: RegisterFormProps) {
  return (
    <>
      {/* Avatar Seçici */}
      <div className={styles.formGroup}>
        <label>Engizisyon Avatarı Seç</label>
        <div className={styles.avatarGrid}>
          {DEFAULT_AVATARS.map((av) => {
            const isSelected = selectedAvatar === av.id;
            return (
              <button
                key={av.id}
                type="button"
                onClick={() => setSelectedAvatar(av.id)}
                className={`${styles.avatarBtn} ${isSelected ? styles.avatarSelected : ''}`}
                title={`${av.name} — ${av.role}`}
              >
                <img src={av.src} alt={av.name} />
              </button>
            );
          })}
        </div>
        <div className={styles.avatarInfo}>
          <strong>{getAvatarInfo(selectedAvatar).name}</strong>
          <span>— {getAvatarInfo(selectedAvatar).role}</span>
        </div>
      </div>

      {/* Kullanıcı Adı */}
      <div className={styles.formGroup}>
        <label>Kullanıcı Adı</label>
        <input
          type="text"
          placeholder="Örn: engizitor_marcus"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
          className={styles.input}
        />
      </div>

      {/* E-posta */}
      <div className={styles.formGroup}>
        <label>E-posta</label>
        <input
          type="email"
          placeholder="ornek@engizisyon.org"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
          className={styles.input}
        />
      </div>

      {/* Şifre */}
      <div className={`${styles.formGroup} ${styles.formGroupLg}`}>
        <label>Şifre Belirle</label>
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
        {loading ? 'Gönderiliyor...' : 'Doğrulama Kodu Gönder'}
      </button>
    </>
  );
}
