import { describe, expect, it } from 'vitest';
import tokensCss from './tokens.css?raw';

/** WCAG 2.x contrast ratio between two #rrggbb colours. */
function contrastRatio(a: string, b: string): number {
  const [lighter = 0, darker = 0] = [luminance(a), luminance(b)].sort(
    (x, y) => y - x,
  );

  return (lighter + 0.05) / (darker + 0.05);
}

function luminance(hex: string): number {
  const [r = 0, g = 0, b = 0] = [1, 3, 5].map((start) => {
    const channel = parseInt(hex.slice(start, start + 2), 16) / 255;

    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Every `--name: #rrggbb` declared in a piece of CSS. */
function colourTokens(css: string): Record<string, string> {
  const tokens: Record<string, string> = {};

  for (const match of css.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})\s*;/gi)) {
    const [, name, value] = match;

    if (name && value) {
      tokens[name] = value;
    }
  }

  return tokens;
}

const DARK_SELECTOR = ":root[data-theme='dark']";
const darkStart = tokensCss.indexOf(DARK_SELECTOR);
// The dark block ends where the reduced-motion block begins.
const darkEnd = tokensCss.indexOf('@media (prefers-reduced-motion');
const lightTokens = colourTokens(tokensCss.slice(0, darkStart));
const darkOverrides = colourTokens(tokensCss.slice(darkStart, darkEnd));

const SCHEMES: Record<string, Record<string, string>> = {
  light: lightTokens,
  // Anything the dark block does not redefine keeps its light value.
  dark: { ...lightTokens, ...darkOverrides },
};

// WCAG 1.4.3: text needs 4.5:1.
const TEXT_PAIRS: [string, string][] = [
  ['color-text', 'color-surface'],
  ['color-text', 'color-bg'],
  ['color-text', 'color-surface-muted'],
  ['color-text', 'color-brand-subtle'],
  ['color-text', 'color-success-subtle'],
  ['color-text', 'color-warning-subtle'],
  ['color-text', 'color-danger-subtle'],
  ['color-text-muted', 'color-surface'],
  ['color-text-muted', 'color-bg'],
  ['color-text-muted', 'color-surface-muted'],
  ['color-text-muted', 'color-brand-subtle'],
  ['color-text-on-brand', 'color-brand'],
  ['color-text-on-brand', 'color-brand-hover'],
  ['color-brand', 'color-surface'],
  ['color-brand', 'color-bg'],
  ['color-brand', 'color-brand-subtle'],
  ['color-brand-hover', 'color-surface'],
  ['color-success', 'color-success-subtle'],
  ['color-danger', 'color-danger-subtle'],
  ['color-warning', 'color-warning-subtle'],
  ['color-info', 'color-info-subtle'],
  ['color-success', 'color-surface'],
  ['color-danger', 'color-surface'],
  ['color-warning', 'color-surface'],
  ['color-info', 'color-surface'],
  ['color-danger', 'color-bg'],
];

// The header title is 24px+ semibold, so WCAG large-text 3:1 applies.
// #2E71EF with white is 4.4:1 — short of 4.5 for small text, fine for the title.
const LARGE_TEXT_PAIRS: [string, string][] = [
  ['color-header-text', 'color-header-from'],
  ['color-header-text', 'color-header-to'],
];

// WCAG 1.4.11: the edge of a control, the focus ring (--color-focus is
// --color-brand) and the chart line need 3:1.
const NON_TEXT_PAIRS: [string, string][] = [
  ['color-border-control', 'color-surface'],
  ['color-danger', 'color-surface'],
  ['color-brand', 'color-surface'],
  ['color-brand', 'color-bg'],
  // The balance chart's line sits on a muted tile.
  ['color-brand', 'color-surface-muted'],
  ['color-brand', 'color-brand-subtle'],
  ['color-brand', 'color-success-subtle'],
  ['color-brand', 'color-warning-subtle'],
  ['color-brand', 'color-danger-subtle'],
  ['color-brand', 'color-info-subtle'],
];

function ratioOf(
  tokens: Record<string, string>,
  foreground: string,
  background: string,
): number {
  const fg = tokens[foreground];
  const bg = tokens[background];

  if (!fg || !bg) {
    throw new Error(`Unknown colour token: ${foreground} or ${background}`);
  }

  return contrastRatio(fg, bg);
}

describe.each(Object.entries(SCHEMES))(
  '%s colours meet WCAG 2.2 AA',
  (_, tokens) => {
    it.each(TEXT_PAIRS)('%s on %s is at least 4.5:1 (text)', (fg, bg) => {
      expect(ratioOf(tokens, fg, bg)).toBeGreaterThanOrEqual(4.5);
    });

    it.each(NON_TEXT_PAIRS)(
      '%s on %s is at least 3:1 (controls and focus)',
      (fg, bg) => {
        expect(ratioOf(tokens, fg, bg)).toBeGreaterThanOrEqual(3);
      },
    );

    it.each(LARGE_TEXT_PAIRS)(
      '%s on %s is at least 3:1 (large header title)',
      (fg, bg) => {
        expect(ratioOf(tokens, fg, bg)).toBeGreaterThanOrEqual(3);
      },
    );
  },
);

describe('the dark scheme', () => {
  it('redefines the colours that matter, so nothing is left light by accident', () => {
    for (const name of [
      'color-bg',
      'color-surface',
      'color-text',
      'color-text-muted',
      'color-text-on-brand',
      'color-brand',
      'color-border-control',
      'color-success',
      'color-danger',
      'color-warning',
      'color-info',
    ]) {
      expect(darkOverrides[name], name).toBeDefined();
      expect(darkOverrides[name], name).not.toBe(lightTokens[name]);
    }
  });

  it('is actually dark: the page is darker than the text on it', () => {
    const dark = SCHEMES['dark'] ?? {};

    expect(luminance(dark['color-bg'] ?? '#ffffff')).toBeLessThan(
      luminance(dark['color-text'] ?? '#000000'),
    );
    expect(luminance(dark['color-bg'] ?? '#ffffff')).toBeLessThan(0.05);
  });
});
