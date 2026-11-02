import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  THEME_STORAGE_KEY,
  applyTheme,
  currentTheme,
  saveTheme,
} from './theme';

function pretendSystemPrefersDark(): void {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({ matches: true, media: '' }),
  );
}

describe('theme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('is light when nothing has been chosen', () => {
    expect(currentTheme()).toBe('light');
  });

  it('stays light even when the system prefers dark', () => {
    pretendSystemPrefersDark();

    expect(currentTheme()).toBe('light');
  });

  it('uses the saved choice', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');

    expect(currentTheme()).toBe('dark');
  });

  it('ignores a saved value that is not a theme', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'purple');

    expect(currentTheme()).toBe('light');
  });

  it('prefers the theme already on the page', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    document.documentElement.setAttribute('data-theme', 'dark');

    expect(currentTheme()).toBe('dark');
  });

  it('applies a theme to the page', () => {
    applyTheme('dark');

    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  });

  it('saves the choice under one key, holding only the theme name', () => {
    saveTheme('dark');

    expect(localStorage.length).toBe(1);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });

  it('does not break when storage refuses to save or to read', () => {
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('Storage is full');
    });
    vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
      throw new Error('Storage is blocked');
    });

    expect(() => {
      saveTheme('dark');
    }).not.toThrow();
    expect(currentTheme()).toBe('light');
  });
});
