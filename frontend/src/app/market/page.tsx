'use client';

import React from 'react';
import Link from 'next/link';
import styles from './page.module.scss';
import { useGameStore } from '@/store/useGameStore';

export default function MarketPage() {
  const { isPremium } = useGameStore();
  // Geçici bakiye değeri, ilerde backend'den gelecek
  const tokenBalance = 100;

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Link href="/menu" className={styles.backBtn}>
          &#8592; Lobiye Dön
        </Link>
        
        <header className={styles.header}>
          <h1 className={styles.title}>Market</h1>
          
          <div className={styles.tokenBalance}>
            <span className={styles.tokenIcon}>🪙</span>
            <span className={styles.tokenAmount}>{tokenBalance}</span>
          </div>
        </header>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Hikaye Evrenleri (Konseptler)</h2>
          <div className={styles.grid}>
            {/* Ortaçağ */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Klasik Ortaçağ</h3>
                <span className={styles.cardBadge} style={{ background: 'rgba(100, 180, 100, 0.2)', borderColor: 'rgba(100, 180, 100, 0.5)' }}>SAHİPSİNİZ</span>
              </div>
              <p className={styles.cardDesc}>Ashenmoor Köyü. Engizisyon, batıl inanç ve karanlık sırlar. Standart karanlık fantezi deneyimi.</p>
              <div className={styles.cardFooter}>
                <span className={styles.price}>ÜCRETSİZ</span>
                <button className={styles.ownedBtn}>Seçili</button>
              </div>
            </div>

            {/* Modern */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>90'lar Amerikan Kasabası</h3>
              </div>
              <p className={styles.cardDesc}>Oakhaven. Yerel polis, cinayet dedektifleri ve şüpheli kasabalılar. Nostaljik ve karanlık bir polisiye atmosfer.</p>
              <div className={styles.cardFooter}>
                <span className={styles.price}>🪙 500</span>
                <button className={styles.buyBtn}>Satın Al</button>
              </div>
            </div>

            {/* Cyberpunk */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Distopik Cyberpunk</h3>
                {isPremium && <span className={styles.cardBadge}>İndirimli</span>}
              </div>
              <p className={styles.cardDesc}>Neon Prime. Yozlaşmış mega şirketler, siber geliştirmeler ve tech-noir bilimkurgu. Geleceğin sorgulayıcısı olun.</p>
              <div className={styles.cardFooter}>
                <span className={styles.price}>🪙 800</span>
                <button className={styles.buyBtn}>Satın Al</button>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Zorluk Paketleri</h2>
          <div className={styles.grid}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Acemi Engizitör (Kolay)</h3>
                <span className={styles.cardBadge} style={{ background: 'rgba(100, 180, 100, 0.2)', borderColor: 'rgba(100, 180, 100, 0.5)' }}>SAHİPSİNİZ</span>
              </div>
              <p className={styles.cardDesc}>4 Şüpheli ile standart başlangıç seviyesi. Suçluyu bulmak için yeterli ipucu.</p>
              <div className={styles.cardFooter}>
                <span className={styles.price}>ÜCRETSİZ</span>
                <button className={styles.ownedBtn}>Seçili</button>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Kıdemli Engizitör (Orta)</h3>
              </div>
              <p className={styles.cardDesc}>5 Şüpheli. Çiftçi Edmund olaya dahil oluyor. İlişkiler karmaşıklaşır ve yalanlar artar.</p>
              <div className={styles.cardFooter}>
                <span className={styles.price}>🪙 300</span>
                <button className={styles.buyBtn}>Satın Al</button>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Baş Engizitör (Zor)</h3>
              </div>
              <p className={styles.cardDesc}>6 Şüpheli. Doktor olaya dahil oluyor. Alibi'ler çakışır, herkesin bir sırrı vardır. En üst düzey dedektiflik deneyimi.</p>
              <div className={styles.cardFooter}>
                <span className={styles.price}>🪙 600</span>
                <button className={styles.buyBtn}>Satın Al</button>
              </div>
            </div>
          </div>
        </section>
        
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Kozmetik Eşyalar (Yakında)</h2>
          <div className={styles.grid}>
            <div className={styles.card} style={{ opacity: 0.6 }}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Gümüş Mühür Yüzük</h3>
                <span className={styles.cardBadge}>YAKINDA</span>
              </div>
              <p className={styles.cardDesc}>Oyun içinde sorgulama yaparken mühür görselinizi gümüş renkli yapın.</p>
              <div className={styles.cardFooter}>
                <span className={styles.price}>🪙 200</span>
                <button className={styles.buyBtn} disabled>Kilidi Açılmadı</button>
              </div>
            </div>
            <div className={styles.card} style={{ opacity: 0.6 }}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Veba Doktoru Maskesi</h3>
                <span className={styles.cardBadge}>YAKINDA</span>
              </div>
              <p className={styles.cardDesc}>Lobi ekranındaki 2D karakterinize ikonik bir veba doktoru maskesi giydirin.</p>
              <div className={styles.cardFooter}>
                <span className={styles.price}>🪙 1500</span>
                <button className={styles.buyBtn} disabled>Kilidi Açılmadı</button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
