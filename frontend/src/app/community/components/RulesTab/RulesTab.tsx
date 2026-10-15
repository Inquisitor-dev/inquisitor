import React from 'react';
import { ArrowRight, ScrollText } from 'lucide-react';
import styles from '../../page.module.scss';

export const RULES = [
  {
    title: 'Çözülebilirlik ve Mantık Zinciri',
    text: 'Katil, oyuncunun şans eseri tahmin edeceği biri olmamalı. Olay yeri incelemesi, arama izinleri ve sorgulardaki çelişkiler bir araya geldiğinde tek bir mantıklı sonuca varmalı.',
  },
  {
    title: 'Masumların Sırları',
    text: 'Masum şüpheliler düz ve sıkıcı olmamalı. Her birinin kendi utancı, hırsızlığı ya da sakladığı bir sırrı olmalı ki oyuncu sorgu sırasında onlardan da şüphelensin.',
  },
  {
    title: 'Edebi Dil ve Atmosfer',
    text: 'Oyunun karanlık, gotik ve psikolojik gerilim tonu korunmalı. Kaba mizah, sokak ağzı ya da atmosferi bozan göndermeler içeren vakalar onaylanmaz.',
  },
  {
    title: 'Hakikatin Tutarlılığı',
    text: 'Soruşturmanın sonunda gösterilen hakikat metni, hikâyedeki tüm kanıtları ve karakterlerin neden yalan söylediğini açıkça aydınlatmalı.',
  },
];

interface RulesTabProps {
  onLoadSample: () => void;
  onGoToStory: () => void;
}

export default function RulesTab({ onLoadSample, onGoToStory }: RulesTabProps) {
  return (
    <section className={`${styles.folio} ${styles.narrow}`}>
      <header className={styles.folioHeader}>
        <span className={styles.folioIcon}>
          <ScrollText size={18} />
        </span>
        <div>
          <h2 className={styles.folioTitle}>Vaka Kabul Kriterleri</h2>
          <p className={styles.folioDesc}>
            Konsey, topluluğun yazdığı vakaları oyuna eklerken şu dört ölçüte bakar.
          </p>
        </div>
      </header>

      <ol className={styles.ruleList}>
        {RULES.map((rule, i) => (
          <li key={rule.title} className={styles.ruleCard}>
            <span className={styles.ruleSeal}>{['I', 'II', 'III', 'IV'][i]}</span>
            <div>
              <h4>{rule.title}</h4>
              <p>{rule.text}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className={styles.rulesCta}>
        <button
          onClick={() => {
            onGoToStory();
            onLoadSample();
          }}
          className={styles.primaryBtn}
        >
          Örnek Vakayla Başla <ArrowRight size={16} />
        </button>
      </div>
    </section>
  );
}
