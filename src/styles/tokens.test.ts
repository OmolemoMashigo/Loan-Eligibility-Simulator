import { describe, expect, it } from 'vitest';
import './tokens.css';
import '../index.css';

function token(name: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim()
    .toLowerCase();
}

function channel(value: number): number {
  const scaled = value / 255;

  return scaled <= 0.04045 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const value = Number.parseInt(hex.slice(1), 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;

  return (
    0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue)
  );
}

function contrast(foreground: string, background: string): number {
  const first = luminance(foreground);
  const second = luminance(background);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);

  return (lighter + 0.05) / (darker + 0.05);
}

describe('design tokens', () => {
  it('exposes the agreed colour, type, and space tokens', () => {
    expect(token('--color-bg')).toBe('#f4f1ea');
    expect(token('--color-surface')).toBe('#ffffff');
    expect(token('--color-text')).toBe('#1c2430');
    expect(token('--color-text-muted')).toBe('#5c6570');
    expect(token('--color-brand')).toBe('#0f5c56');
    expect(token('--color-brand-hover')).toBe('#0a4a45');
    expect(token('--color-success')).toBe('#1b6b4a');
    expect(token('--color-danger')).toBe('#9b2c2c');
    expect(token('--color-warning')).toBe('#8a5a12');
    expect(token('--font-sans').toLowerCase()).toContain('segoe ui');
    expect(token('--font-size-md')).toBe('1rem');
    expect(token('--space-4')).toBe('1rem');
    expect(token('--touch-min')).toBe('2.75rem');
    expect(token('--duration-fast')).toBe('150ms');
  });

  it('keeps text pairs at WCAG AA contrast or better', () => {
    const pairs: Array<[string, string]> = [
      [token('--color-text'), token('--color-bg')],
      [token('--color-text'), token('--color-surface')],
      [token('--color-text-muted'), token('--color-bg')],
      [token('--color-text-muted'), token('--color-surface')],
      [token('--color-text-on-brand'), token('--color-brand')],
      [token('--color-success'), token('--color-success-subtle')],
      [token('--color-danger'), token('--color-danger-subtle')],
      [token('--color-warning'), token('--color-warning-subtle')],
      [token('--color-info'), token('--color-info-subtle')],
    ];

    for (const [foreground, background] of pairs) {
      expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('wires the page to the colour and type tokens', () => {
    const body = getComputedStyle(document.body);

    expect(body.backgroundColor).toBe('var(--color-bg)');
    expect(body.color).toBe('var(--color-text)');
    expect(body.fontFamily).toBe('var(--font-sans)');
  });
});
