import React from 'react';
import Link from 'next/link';
import {
  Coins,
  LogOut,
  Settings,
  X,
} from 'lucide-react';
import { DEFAULT_AVATARS, getAvatarSrc, getAvatarInfo } from '@/config/avatars';
import AudioSettingsPanel from '@/features/audio/AudioSettingsPanel';
import styles from '../../page.module.scss';

export interface AccountSummary {
  email: string;
  username?: string | null;
  avatar?: string;
  maxMessagesPerDay: number;
  maxSessionsPerDay?: number;
  dailySessionCount?: number;
  dailyMessageCount?: number;
  isAdmin?: boolean;
  score?: number;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  effectiveAvatar: string;
  inquisitorName: string;
  effectiveEmail: string;
  effectiveIsAdmin: boolean;
  editAvatar: string;
  setEditAvatar: (val: string) => void;
  editUsername: string;
  setEditUsername: (val: string) => void;
  onSaveProfile: () => void;
  profileSaving: boolean;
  profileMsg: { type: 'success' | 'error'; text: string } | null;
  tokenBalance: number;
  accountSummary: AccountSummary | null;
  fallbackMaxSessions: number;
  fallbackMaxMessages: number;
  onLogout: () => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  effectiveAvatar,
  inquisitorName,
  effectiveEmail,
  effectiveIsAdmin,
  editAvatar,
  setEditAvatar,
  editUsername,
  setEditUsername,
  onSaveProfile,
  profileSaving,
  profileMsg,
  tokenBalance,
  accountSummary,
  fallbackMaxSessions,
  fallbackMaxMessages,
  onLogout,
}: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={`${styles.sheet} ${styles.settingsSheet}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button className={styles.sheetClose} onClick={onClose} aria-label="Kapat">
          <X size={18} />
        </button>
        <span className={styles.sheetSeal} aria-hidden><Settings size={20} /></span>
        <span className={styles.sheetEyebrow}>Hesap ve Tercihler</span>
        <h2 id="settings-title" className={styles.sheetTitle}>Ayarlar</h2>

        <section className={styles.settingsBlock}>
          <h3 className={styles.blockLabel}>Hesap & Profil</h3>
          <div className={styles.profileRow}>
            <img
              src={getAvatarSrc(effectiveAvatar)}
              alt="Avatar"
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                border: '2px solid #daa520',
                boxShadow: '0 0 14px rgba(218, 165, 32, 0.35)',
                objectFit: 'cover',
              }}
            />
            <div className={styles.profileText}>
              <strong>{inquisitorName}</strong>
              <span>{effectiveEmail}</span>
              <small style={{ color: '#daa520', fontSize: '0.74rem', marginTop: '2px' }}>
                {getAvatarInfo(effectiveAvatar).name} ({getAvatarInfo(effectiveAvatar).role})
              </small>
            </div>
            <span className={styles.planBadge}>
              {effectiveIsAdmin ? 'Admin' : 'Standart'}
            </span>
          </div>

          {/* Avatar ve İsim Değiştir */}
          <div style={{ marginTop: '16px', padding: '14px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(232, 220, 196, 0.1)', borderRadius: '6px' }}>
            <span style={{ display: 'block', fontSize: '0.72rem', letterSpacing: '2px', color: '#daa520', textTransform: 'uppercase', marginBottom: '10px', fontWeight: 600 }}>
              Avatar ve Kullanıcı Adını Değiştir
            </span>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '12px' }}>
              {DEFAULT_AVATARS.map((av) => {
                const isSelected = editAvatar === av.id;
                return (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => setEditAvatar(av.id)}
                    style={{
                      background: isSelected ? 'rgba(138, 3, 3, 0.45)' : 'rgba(0, 0, 0, 0.35)',
                      border: isSelected ? '2px solid #daa520' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      padding: '6px 4px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      boxShadow: isSelected ? '0 0 10px rgba(218, 165, 32, 0.4)' : 'none',
                      transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                      transition: 'all 0.2s ease',
                    }}
                    title={`${av.name} — ${av.role}`}
                  >
                    <img
                      src={av.src}
                      alt={av.name}
                      style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <span style={{ fontSize: '0.62rem', color: isSelected ? '#daa520' : '#888', marginTop: '4px', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                      {av.name}
                    </span>
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="text"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                placeholder="Kullanıcı adı"
                style={{
                  flex: 1,
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(232, 220, 196, 0.15)',
                  color: '#e5d9c5',
                  padding: '8px 12px',
                  fontSize: '0.85rem',
                  fontFamily: 'Inter, sans-serif',
                  borderRadius: '4px',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={onSaveProfile}
                disabled={profileSaving}
                style={{
                  background: profileSaving ? 'rgba(138,3,3,0.3)' : '#8A0303',
                  border: '1px solid rgba(218, 165, 32, 0.4)',
                  color: '#e8dcc4',
                  padding: '8px 14px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: profileSaving ? 'not-allowed' : 'pointer',
                  borderRadius: '4px',
                  transition: 'all 0.2s ease',
                  fontFamily: 'Playfair Display, serif',
                }}
              >
                {profileSaving ? '...' : 'Kaydet'}
              </button>
            </div>

            {profileMsg && (
              <div
                style={{
                  marginTop: '10px',
                  padding: '6px 10px',
                  borderRadius: '4px',
                  fontSize: '0.78rem',
                  fontFamily: 'Inter, sans-serif',
                  background: profileMsg.type === 'success' ? 'rgba(0, 150, 0, 0.15)' : 'rgba(150, 0, 0, 0.2)',
                  border: profileMsg.type === 'success' ? '1px solid rgba(0, 200, 0, 0.3)' : '1px solid rgba(200, 0, 0, 0.3)',
                  color: profileMsg.type === 'success' ? '#8fdf8f' : '#f08080',
                }}
              >
                {profileMsg.type === 'success' ? '✓ ' : '⚠️ '}
                {profileMsg.text}
              </div>
            )}
          </div>

          <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(218, 165, 32, 0.08)', border: '1px solid rgba(218, 165, 32, 0.25)', borderRadius: '4px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e8dcc4', fontSize: '0.88rem' }}>
              <Coins size={16} color="#daa520" /> Hazine: <strong style={{ color: '#daa520' }}>{tokenBalance} Token</strong>
            </span>
            <Link href="/market" style={{ color: '#daa520', fontSize: '0.8rem', textDecoration: 'none', fontWeight: 600 }}>
              Markete Git →
            </Link>
          </div>

          <div className={styles.quotaGrid}>
            {[
              {
                label: 'Bugün kalan soruşturma',
                used: accountSummary?.dailySessionCount,
                max: accountSummary?.maxSessionsPerDay ?? fallbackMaxSessions,
              },
              {
                label: 'Bugün kalan diyalog',
                used: accountSummary?.dailyMessageCount,
                max: accountSummary?.maxMessagesPerDay ?? fallbackMaxMessages,
              },
            ].map((quota) => {
              const unlimited = effectiveIsAdmin || quota.max === 999;
              const remaining = Math.max(0, quota.max - (quota.used ?? 0));
              return (
                <div key={quota.label} className={styles.quotaTile}>
                  <span className={styles.quotaLabel}>{quota.label}</span>
                  <span className={styles.quotaValue}>
                    {unlimited ? 'Sınırsız' : (
                      <>
                        {remaining}
                        <small> / {quota.max}</small>
                      </>
                    )}
                  </span>
                  {!unlimited && (
                    <span className={styles.quotaBar}>
                      <span style={{ width: `${(remaining / quota.max) * 100}%` }} />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className={styles.settingsBlock}>
          <h3 className={styles.blockLabel}>Ses Ayarları</h3>
          <AudioSettingsPanel />
        </section>

        <button
          onClick={onLogout}
          className={styles.logoutBtn}
        >
          <LogOut size={16} /> Çıkış Yap
        </button>
      </div>
    </div>
  );
}
