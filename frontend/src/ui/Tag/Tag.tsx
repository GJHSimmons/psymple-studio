import type { HTMLAttributes } from 'react';
import styles from './Tag.module.css';

interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'neutral' | 'accent' | 'outline';
}

export function Tag({ variant = 'neutral', className, ...rest }: TagProps) {
  const variantClass = styles[variant];
  return <span className={[styles.tag, variantClass, className].filter(Boolean).join(' ')} {...rest} />;
}
