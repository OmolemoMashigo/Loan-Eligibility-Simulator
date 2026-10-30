import { describe, expect, it } from 'vitest';
import { PERSONAL_LOAN_PRODUCT } from './config';
import { selectAnnualInterestRate } from './rates';

describe('selectAnnualInterestRate', () => {
  it.each([
    [549, 18.5],
    [550, 16.5],
    [599, 16.5],
    [600, 14.5],
    [649, 14.5],
    [650, 12.5],
    [699, 12.5],
    [700, 11.5],
    [749, 11.5],
    [750, 10.5],
  ] as const)('maps score %i to %s percent', (score, expectedRate) => {
    expect(selectAnnualInterestRate(score)).toBe(expectedRate);
  });

  it('uses the conservative unknown rate when the score is omitted (SI-8)', () => {
    expect(selectAnnualInterestRate(undefined)).toBe(14.5);
  });

  it('clamps the result to the personal loan rate range', () => {
    const { min, max } = PERSONAL_LOAN_PRODUCT.interestRateRange;

    expect(selectAnnualInterestRate(300)).toBeGreaterThanOrEqual(min);
    expect(selectAnnualInterestRate(850)).toBeLessThanOrEqual(max);
    expect(selectAnnualInterestRate(900, { min: 11, max: 12 })).toBe(11);
    expect(selectAnnualInterestRate(300, { min: 11, max: 12 })).toBe(12);
  });
});
