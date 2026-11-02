import { useEffect, useState } from 'react';
import { applyTheme, currentTheme, saveTheme, type Theme } from './theme';
import styles from './ThemeToggle.module.css';

/** A switch for dark mode. It starts on light, then remembers the choice. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(currentTheme);
  const dark = theme === 'dark';

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <button
      className={styles.toggle}
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Dark mode"
      onClick={() => {
        const next: Theme = dark ? 'light' : 'dark';

        setTheme(next);
        saveTheme(next);
      }}
    >
      <span className={styles.track} aria-hidden="true">
        <span className={styles.thumb}>
          {dark ? <MoonIcon /> : <SunIcon />}
        </span>
      </span>
    </button>
  );
}

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="currentColor"
      focusable="false"
    >
      <circle cx="12" cy="12" r="5" />
      <path
        d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="currentColor"
      focusable="false"
    >
      <path d="M21 14.5A9 9 0 0 1 9.5 3 9 9 0 1 0 21 14.5Z" />
    </svg>
  );
}
