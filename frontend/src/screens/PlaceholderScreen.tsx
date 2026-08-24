import styles from './PlaceholderScreen.module.css';

interface PlaceholderScreenProps {
  eyebrow: string;
  title: string;
  copy: string;
}

export function PlaceholderScreen({ eyebrow, title, copy }: PlaceholderScreenProps) {
  return (
    <div className={styles.screen}>
      <p className={styles.eyebrow}>{eyebrow}</p>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.copy}>{copy}</p>
    </div>
  );
}
