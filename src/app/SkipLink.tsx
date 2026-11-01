import styles from './SkipLink.module.css';

export function SkipLink() {
  return (
    <a className={styles.skip} href="#main-content">
      Skip to main content
    </a>
  );
}
