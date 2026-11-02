import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import initScript from '../../public/theme-init.js?raw';
import { THEME_STORAGE_KEY } from './theme';

/** Runs the page's pre-paint script, the way the browser does. */
function runInitScript(): string | null {
  new Function(initScript)();

  return document.documentElement.getAttribute('data-theme');
}

describe('public/theme-init.js', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('starts on light when nothing has been chosen', () => {
    expect(runInitScript()).toBe('light');
  });

  it('starts on light even when the system prefers dark', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({ matches: true, media: '' }),
    );

    expect(runInitScript()).toBe('light');
  });

  it('restores a saved dark choice, using the same key as the app', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');

    expect(runInitScript()).toBe('dark');
  });

  it('falls back to light for an unknown value or blocked storage', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'purple');

    expect(runInitScript()).toBe('light');

    vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
      throw new Error('Storage is blocked');
    });

    expect(runInitScript()).toBe('light');
  });
});
