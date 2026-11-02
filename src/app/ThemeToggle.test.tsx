import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { THEME_STORAGE_KEY } from './theme';
import { ThemeToggle } from './ThemeToggle';

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('is a switch named "Dark mode" that starts off, on the light theme', () => {
    render(<ThemeToggle />);

    expect(screen.getByRole('switch', { name: 'Dark mode' })).not.toBeChecked();
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
  });

  it('starts off even when the system prefers dark', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({ matches: true, media: '' }),
    );

    render(<ThemeToggle />);

    expect(screen.getByRole('switch', { name: 'Dark mode' })).not.toBeChecked();
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
  });

  it('switches to dark and back, and remembers each choice', async () => {
    const user = userEvent.setup();

    render(<ThemeToggle />);

    const toggle = screen.getByRole('switch', { name: 'Dark mode' });

    await user.click(toggle);

    expect(toggle).toBeChecked();
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    await user.click(toggle);

    expect(toggle).not.toBeChecked();
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('works from the keyboard', async () => {
    const user = userEvent.setup();

    render(<ThemeToggle />);

    await user.tab();

    expect(screen.getByRole('switch')).toHaveFocus();

    await user.keyboard('[Space]');

    expect(screen.getByRole('switch')).toBeChecked();
  });

  it('starts on dark when dark was chosen last time', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');

    render(<ThemeToggle />);

    expect(screen.getByRole('switch', { name: 'Dark mode' })).toBeChecked();
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  });

  it('saves nothing until the user chooses', () => {
    render(<ThemeToggle />);

    expect(localStorage.length).toBe(0);
  });
});
