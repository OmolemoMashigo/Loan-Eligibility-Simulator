import { describe, expect, it } from 'vitest';
import { formatMonthDuration } from './format';

describe('formatMonthDuration', () => {
  it('echoes whole years the way the form hint describes', () => {
    expect(formatMonthDuration(1)).toBe('1 month');
    expect(formatMonthDuration(3)).toBe('3 months');
    expect(formatMonthDuration(12)).toBe('12 months = 1 year');
    expect(formatMonthDuration(24)).toBe('24 months = 2 years');
    expect(formatMonthDuration(18)).toBe('18 months');
  });
});
