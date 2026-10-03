'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/useGameStore';
import styles from './page.module.scss';

export default function LandingPage() {
  const router = useRouter();
  const headerRef = useRef<HTMLElement>(null);
  const { authToken } = useGameStore();

  const handleStart = () => {
    if (authToken) {
      router.push('/menu');
    } else {
      router.push('/login');
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (headerRef.current) {
        if (window.scrollY > 50) {
          headerRef.current.style.padding = '10px 0';
          headerRef.current.style.background = 'rgba(5, 5, 5, 0.95)';
        } else {
          headerRef.current.style.padding = '20px 0';
          headerRef.current.style.background = 'rgba(5, 5, 5, 0.85)';
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={styles.landingContainer}>
      <header ref={headerRef}>
        <div className={styles.container}>
          <nav>
            <a href="#ana-sayfa" className={styles.logoContainer}>
              <div className={styles.stampContainer}>
                <img
                  src="/logo/favicon.png"
                  alt="Damga"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/logo/logo.png';
                  }}
                />
              </div>
              <div className={styles.logoText}>
                The <span>Inquisitor</span>
              </div>
            </a>
            <div className={styles.navLinks}>
              <a href="#ozellikler">Özellikler</a>
              <a href="#nasil-oynanir">Nasıl Oynanır</a>
              <a href="#paketler">Paketler</a>
              <button
                className={styles.btn}
                style={{ padding: '8px 20px', fontSize: '0.9rem' }}
                onClick={() => router.push('/menu')}
              >
                Hemen Başla
              </button>
            </div>
          </nav>
        </div>
      </header>

      <section className={styles.hero} id="ana-sayfa">
        <div className={styles.heroContent}>
          <h1>The Inquısıtor</h1>
          <h2>Dinle. Analiz et. Hüküm ver.</h2>
          <p>
            Sen bu hikayenin kahramanı değilsin. Sen engizitörsün. Sıradan bir
            oyun oynamıyorsun, kararlarınla sanal bir cemaatin kaderini belirleyen
            mutlak bir yargıçsın.
          </p>
          <button className={styles.btn} onClick={handleStart}>
            Sorguyu Başlat
          </button>
        </div>
      </section>

      <section className={styles.features} id="ozellikler">
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2>Sıradan Bir Oyun Değil.</h2>
            <p>
              NPC'ler önceden yazılmış satırları okumaz. Düşünürler. Hatırlarlar.
              Ve en önemlisi... Yalan söylerler.
            </p>
          </div>

          <div className={styles.featureGrid}>
            <div className={styles.featureCard}>
              <div
                className={styles.featureBg}
                style={{ backgroundImage: "url('/stories/story4.jpg')" }}
              ></div>
              <div className={styles.featureOverlay}></div>
              <div className={styles.featureContent}>
                <h3>Dinamik AI Ajanları</h3>
                <p>
                  Karakterler kendi bağımsız hafızalarına, yalan söyleme eğilimlerine
                  ve gizli korku seviyelerine sahiptir. Her birinin kendi ajandası var.
                </p>
              </div>
            </div>

            <div className={styles.featureCard}>
              <div
                className={styles.featureBg}
                style={{ backgroundImage: "url('/stories/story5.jpg')" }}
              ></div>
              <div className={styles.featureOverlay}></div>
              <div className={styles.featureContent}>
                <h3>Çapraz Sorgu Mekaniği</h3>
                <p>
                  İstediğini sor. Hikayeleri karşılaştır. Çelişkileri açığa çıkar
                  ve manipülatif şüphelileri köşeye sıkıştır.
                </p>
              </div>
            </div>

            <div className={styles.featureCard}>
              <div
                className={styles.featureBg}
                style={{ backgroundImage: "url('/stories/story6.jpg')" }}
              ></div>
              <div className={styles.featureOverlay}></div>
              <div className={styles.featureContent}>
                <h3>Psikolojik Gerilim</h3>
                <p>
                  Yanlış kişiyi suçlarsan... veya fazla merhametli davranırsan,
                  bütün köy sana karşı ayaklanabilir. Tansiyon hep yüksek.
                </p>
              </div>
            </div>

            <div className={styles.featureCard}>
              <div
                className={styles.featureBg}
                style={{ backgroundImage: "url('/stories/story8.jpg')" }}
              ></div>
              <div className={styles.featureOverlay}></div>
              <div className={styles.featureContent}>
                <h3>Asla Aynı Hikaye Değil</h3>
                <p>
                  Her oturum, arka plandaki yapay zeka tarafından yeni yalanlar ve
                  yeni gerçeklerle tekrar örülür. Sonsuz tekrar oynanabilirlik.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.mechanics} id="nasil-oynanir">
        <div className={styles.container}>
          <div className={styles.mechanicsContent}>
            <div className={styles.mechText}>
              <h2>Köyde Kimse Göründüğü Gibi Değil.</h2>
              <p>
                Etkileşimli köy haritası üzerinden farklı mekanları ziyaret et.
                Taverna, Kilise, Mezarlık... Her mekan başka bir sır saklıyor.
              </p>
              <p>
                Karşılaştığın karakterlerle doğal dilde konuş. İfadelerindeki
                açıkları yakala ve gerçek cadıları bulmak için zekanı kullan.
              </p>
              <p>
                Sadece oynamakla kalma, oyun sonunda ajanların davranış
                algoritmalarını (korku, sadakat) detaylı raporlarla analiz et.
              </p>
            </div>
            <div className={styles.mechImages}>
              <div
                className={styles.mechImg}
                style={{ backgroundImage: "url('/stories/story7.jpg')" }}
              ></div>
              <div
                className={styles.mechImg}
                style={{ backgroundImage: "url('/stories/story3.jpg')" }}
              ></div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.pricing} id="paketler">
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2>Cemaatin Kaderi</h2>
            <p>
              Deneyimini seç ve sorguya başla. İndirme gerektirmez, doğrudan
              tarayıcında oynayabilirsin.
            </p>
          </div>

          <div className={styles.pricingCards}>
            <div className={styles.priceCard}>
              <h3>Aday Engizitör</h3>
              <div className={styles.price}>Ücretsiz</div>
              <ul className={styles.featuresList}>
                <li>Temel Köy Haritası (Kilise, Taverna vb.)</li>
                <li>5 Aktif Yapay Zeka Ajanı (NPC)</li>
                <li>Günde 1 Oyun Oturumu</li>
                <li>Maksimum 40 Diyalog Limiti</li>
                <li>Temel İstatistikler ve Oyun Raporu</li>
              </ul>
              <button
                className={styles.btn}
                style={{ width: '100%', borderColor: 'rgba(232, 220, 196, 0.3)', background: 'transparent' }}
                onClick={handleStart}
              >
                Köyü Ziyaret Et
              </button>
            </div>

            <div className={`${styles.priceCard} ${styles.premium}`}>
              <h3>Baş Engizitör</h3>
              <div className={styles.price}>
                $4.99 <span>/ ay</span>
              </div>
              <ul className={styles.featuresList}>
                <li>Sınırsız Etkileşim ve Token Limiti Yok</li>
                <li>Genişletilmiş Köy Halkı (15+ AI Karakter)</li>
                <li>AI Davranışları İçin Derin Analitik Raporu</li>
                <li>Farklı Fantastik Senaryolar</li>
                <li>Sunuculara Öncelikli ve Hızlı Erişim</li>
              </ul>
              <button
                className={styles.btn}
                style={{ width: '100%' }}
                onClick={() => router.push('/premium')}
              >
                Gerçek Deneyime Başla
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className={styles.container}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '15px',
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src="/logo/favicon.png"
                alt="The Inquisitor Logo"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo/logo.png';
                }}
                style={{
                  height: '100%',
                  width: '100%',
                  objectFit: 'cover',
                  objectPosition: 'left center',
                  marginBottom: '0',
                }}
              />
            </div>
            <span
              style={{
                fontFamily: "var(--font-headings)",
                fontSize: '2rem',
                color: 'var(--color-primary)',
                fontWeight: 700,
              }}
            >
              The <span style={{ color: 'var(--color-text)' }}>Inquisitor</span>
            </span>
          </div>
          <p>LISTEN. ANALYZE. CONDEMN.</p>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: '0.85rem',
              opacity: 0.5,
              marginTop: '5px',
            }}
          >
            Her sorgu bir iz bırakır.
          </p>
          <div className={styles.copyright}>
            &copy; 2026 Inquisitor AI. Tüm Hakları Saklıdır. Kurucu: Berke Çakıroğlu
          </div>
        </div>
      </footer>
    </div>
  );
}
