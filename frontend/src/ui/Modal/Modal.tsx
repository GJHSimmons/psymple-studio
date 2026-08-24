import type { ReactNode } from 'react';
import { Icon } from '../Icon';
import styles from './Modal.module.css';

interface ModalProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  onClose: () => void;
  maxWidth?: string;
  children: ReactNode;
}

export function Modal({ eyebrow, title, subtitle, onClose, maxWidth, children }: ModalProps) {
  return (
    <div className={styles.overlay} onMouseDown={onClose}>
      <div
        className={styles.dialog}
        style={maxWidth ? ({ '--dialog-max-width': maxWidth } as React.CSSProperties) : undefined}
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className={styles.header}>
          <div>
            {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
            <h2 className={styles.title}>{title}</h2>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
            <Icon name="x" size={16} />
          </button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}
