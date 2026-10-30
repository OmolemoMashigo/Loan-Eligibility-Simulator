import { describe, expect, it } from 'vitest';
import {
  calculateAmortisationSchedule,
  calculateMonthlyPayment,
  roundToCents,
} from './amortisation';

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

describe('calculateMonthlyPayment', () => {
  it('matches an independent PMT for R150,000 at 12.5% over 24 months (SI-6)', () => {
    const payment = calculateMonthlyPayment({
      principal: 150_000,
      annualRatePercent: 12.5,
      termMonths: 24,
    });

    expect(payment).toBe(7_096.1);
    expect(payment).not.toBe(7_089.5);
  });

  it('matches Excel-style PMT for R10,000 at 12% over 12 months', () => {
    expect(
      calculateMonthlyPayment({
        principal: 10_000,
        annualRatePercent: 12,
        termMonths: 12,
      }),
    ).toBe(888.49);
  });

  it('splits a zero-rate loan evenly across the term', () => {
    expect(
      calculateMonthlyPayment({
        principal: 12_000,
        annualRatePercent: 0,
        termMonths: 12,
      }),
    ).toBe(1_000);
  });
});

describe('calculateAmortisationSchedule', () => {
  const sample = calculateAmortisationSchedule({
    principal: 150_000,
    annualRatePercent: 12.5,
    termMonths: 24,
  });

  it('returns one row per month', () => {
    expect(sample.paymentSchedule).toHaveLength(24);
  });

  it('closes the balance at exactly zero', () => {
    const lastRow = sample.paymentSchedule.at(-1);

    expect(lastRow?.balance).toBe(0);
  });

  it('repays principal in full across the schedule', () => {
    const principalPaid = roundToCents(
      sum(sample.paymentSchedule.map((row) => row.principal)),
    );

    expect(principalPaid).toBe(150_000);
  });

  it('uses standard first-month interest, not the spec sample figure', () => {
    const firstRow = sample.paymentSchedule[0];

    expect(firstRow?.interest).toBe(1_562.5);
    expect(firstRow?.interest).not.toBe(1_562.33);
  });

  it('keeps interest plus principal equal to each payment', () => {
    for (const row of sample.paymentSchedule) {
      expect(roundToCents(row.principal + row.interest)).toBe(row.payment);
    }
  });

  it('absorbs rounding in the final payment on a zero-rate loan', () => {
    const result = calculateAmortisationSchedule({
      principal: 1_000,
      annualRatePercent: 0,
      termMonths: 3,
    });

    expect(result.paymentSchedule.map((row) => row.payment)).toEqual([
      333.33, 333.33, 333.34,
    ]);
    expect(result.paymentSchedule.at(-1)?.balance).toBe(0);
    expect(
      roundToCents(sum(result.paymentSchedule.map((row) => row.principal))),
    ).toBe(1_000);
  });
});
