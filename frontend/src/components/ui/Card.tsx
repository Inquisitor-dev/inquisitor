import React from 'react';
import styles from './Card.module.scss';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  glow = false, 
  className = '', 
  ...props 
}) => {
  const rootClasses = [
    styles.card,
    glow ? styles['card--glow'] : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={rootClasses} {...props}>
      {children}
    </div>
  );
};
