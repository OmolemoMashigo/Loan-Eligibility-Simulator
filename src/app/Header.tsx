import styles from './Header.module.css';
import { ThemeToggle } from './ThemeToggle';

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <svg
          className={styles.mark}
          viewBox="0 0 36 36"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
          aria-hidden="true"
          focusable="false"
        >
          <circle cx="18" cy="18" r="15.9155" opacity="0.28" />
          <path d="M18 2.0845 A15.9155 15.9155 0 1 1 3.1 23.7" />
        </svg>
        <h1 className={styles.title}>Loan Eligibility Simulator</h1>
        <ThemeToggle />
      </div>
    </header>
  );
}
