import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  icon?: ReactNode;
}

export function Button({ variant = 'secondary', icon, children, className, ...rest }: ButtonProps) {
  const variantClass = variant === 'primary' ? styles.primary : styles.secondary;
  return (
    <button type="button" className={[styles.button, variantClass, className].filter(Boolean).join(' ')} {...rest}>
      {icon}
      {children}
    </button>
  );
}
