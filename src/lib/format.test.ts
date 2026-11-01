import { describe, expect, it } from 'vitest';
import { formatMonthDuration, formatPercent, formatWholeRand } from './format';

describe('formatPercent', () => {
  it('shows whole and one-decimal percentages with a % sign', () => {
    expect(formatPercent(85)).toBe('85%');
    expect(formatPercent(0)).toBe('0%');
    expect(formatPercent(12.5)).toMatch(/^12[,.]5%$/);
  });
});

describe('formatWholeRand', () => {
  it('formats rand amounts in en-ZA without cents', () => {
    expect(formatWholeRand(5_000)).toMatch(/^R\s5\s000$/);
    expect(formatWholeRand(150_000)).toMatch(/^R\s150\s000$/);
    expect(formatWholeRand(0)).toMatch(/^R\s0$/);
  });
});

describe('formatMonthDuration', () => {
  it('echoes whole years the way the form hint describes', () => {
    expect(formatMonthDuration(1)).toBe('1 month');
    expect(formatMonthDuration(3)).toBe('3 months');
    expect(formatMonthDuration(12)).toBe('12 months = 1 year');
    expect(formatMonthDuration(24)).toBe('24 months = 2 years');
    expect(formatMonthDuration(18)).toBe('18 months');
  });
});
