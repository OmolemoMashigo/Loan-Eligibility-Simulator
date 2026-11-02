export type Theme = 'light' | 'dark';

/** The only thing the app saves: a light or dark choice. Never user input. */
export const THEME_STORAGE_KEY = 'theme';

function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark';
}

function readSavedTheme(): Theme | undefined {
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);

    return isTheme(saved) ? saved : undefined;
  } catch {
    // Storage can be blocked, for example in some private modes.
    return undefined;
  }
}

/**
 * The theme in use: what is already on the page (set before first paint by
 * `public/theme-init.js`), else the saved choice, else light. The system's
 * light or dark setting is deliberately not used.
 */
export function currentTheme(): Theme {
  const applied = document.documentElement.getAttribute('data-theme');

  return isTheme(applied) ? applied : (readSavedTheme() ?? 'light');
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
}

/** Remembers the user's choice. A failure to save never breaks the page. */
export function saveTheme(theme: Theme): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // The choice still applies for this visit.
  }
}
