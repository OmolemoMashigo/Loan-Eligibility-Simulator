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

/** Every `--name: #rrggbb` the stylesheet declares. */
function colourTokens(): Record<string, string> {
  const tokens: Record<string, string> = {};

  for (const match of tokensCss.matchAll(
    /--([\w-]+):\s*(#[0-9a-f]{6})\s*;/gi,
  )) {
    const [, name, value] = match;

    if (name && value) {
      tokens[name] = value;
    }
  }

  return tokens;
}

const tokens = colourTokens();

function ratioOf(foreground: string, background: string): number {
  const fg = tokens[foreground];
  const bg = tokens[background];

  if (!fg || !bg) {
    throw new Error(`Unknown colour token: ${foreground} or ${background}`);
  }

  return contrastRatio(fg, bg);
}

// WCAG 1.4.3: text needs 4.5:1.
const TEXT_PAIRS: [string, string][] = [
  ['color-text', 'color-surface'],
  ['color-text', 'color-bg'],
  ['color-text', 'color-success-subtle'],
  ['color-text', 'color-warning-subtle'],
  ['color-text-muted', 'color-surface'],
  ['color-text-muted', 'color-bg'],
  ['color-text-muted', 'color-surface-muted'],
  ['color-text-on-brand', 'color-brand'],
  ['color-text-on-brand', 'color-brand-hover'],
  ['color-brand', 'color-surface'],
  ['color-brand', 'color-brand-subtle'],
  ['color-success', 'color-success-subtle'],
  ['color-danger', 'color-danger-subtle'],
  ['color-warning', 'color-warning-subtle'],
  ['color-info', 'color-info-subtle'],
  ['color-danger', 'color-surface'],
  ['color-danger', 'color-bg'],
];

// WCAG 1.4.11: the edge of a control and the focus ring (--color-focus is
// --color-brand) need 3:1.
const NON_TEXT_PAIRS: [string, string][] = [
  ['color-border-control', 'color-surface'],
  ['color-danger', 'color-surface'],
  ['color-brand', 'color-surface'],
  ['color-brand', 'color-bg'],
  ['color-brand', 'color-success-subtle'],
  ['color-brand', 'color-warning-subtle'],
  ['color-brand', 'color-danger-subtle'],
  ['color-brand', 'color-info-subtle'],
];

describe('colour tokens meet WCAG 2.2 AA', () => {
  it.each(TEXT_PAIRS)('%s on %s is at least 4.5:1 (text)', (fg, bg) => {
    expect(ratioOf(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(NON_TEXT_PAIRS)(
    '%s on %s is at least 3:1 (controls and focus)',
    (fg, bg) => {
      expect(ratioOf(fg, bg)).toBeGreaterThanOrEqual(3);
    },
  );
});
