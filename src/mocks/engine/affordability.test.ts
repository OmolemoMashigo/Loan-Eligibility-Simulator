import { describe, expect, it } from 'vitest';
import {
  analyseAffordability,
  calculateDisposableIncome,
  calculateLoanToIncomeRatio,
  calculateMaxAffordableAmount,
  scoreAffordability,
} from './affordability';
import { SPEC_SAMPLE_REQUEST } from './config';

const sampleRate = 12.5;

describe('affordability ratios', () => {
  it('matches the spec sample disposable income and DTI (SI-7)', () => {
    const result = analyseAffordability({
      monthlyIncome: SPEC_SAMPLE_REQUEST.financialInfo.monthlyIncome,
      monthlyExpenses: SPEC_SAMPLE_REQUEST.financialInfo.monthlyExpenses,
      existingDebt: SPEC_SAMPLE_REQUEST.financialInfo.existingDebt,
      requestedAmount: SPEC_SAMPLE_REQUEST.loanDetails.requestedAmount,
      loanTerm: SPEC_SAMPLE_REQUEST.loanDetails.loanTerm,
      annualRatePercent: sampleRate,
    });

    expect(result.disposableIncome).toBe(10_000);
    expect(result.debtToIncomeRatio).toBe(20);
    expect(result.loanToIncomeRatio).toBe(50);
    expect(result.affordabilityScore).toBe('good');
  });

  it('treats LTI as requested amount over annual income, not 60 from the sample', () => {
    expect(calculateLoanToIncomeRatio(150_000, 25_000)).toBe(50);
    expect(calculateLoanToIncomeRatio(150_000, 25_000)).not.toBe(60);
  });
});

describe('calculateMaxAffordableAmount', () => {
  it('rounds the sample scenario to R180,000', () => {
    expect(
      calculateMaxAffordableAmount({
        disposableIncome: 10_000,
        annualRatePercent: sampleRate,
        termMonths: 24,
      }),
    ).toBe(180_000);
  });

  it('returns 0 when disposable income is zero or negative', () => {
    expect(
      calculateMaxAffordableAmount({
        disposableIncome: 0,
        annualRatePercent: sampleRate,
        termMonths: 24,
      }),
    ).toBe(0);
    expect(
      calculateMaxAffordableAmount({
        disposableIncome: -500,
        annualRatePercent: sampleRate,
        termMonths: 24,
      }),
    ).toBe(0);
  });

  it('does not round a tiny affordable principal up to the product minimum', () => {
    expect(
      calculateMaxAffordableAmount({
        disposableIncome: 50,
        annualRatePercent: sampleRate,
        termMonths: 6,
      }),
    ).toBe(0);
  });
});

describe('scoreAffordability', () => {
  it('uses the configured repayment-to-disposable bands', () => {
    expect(scoreAffordability(0.3)).toBe('excellent');
    expect(scoreAffordability(0.709)).toBe('good');
    expect(scoreAffordability(0.8)).toBe('fair');
    expect(scoreAffordability(0.9)).toBe('poor');
  });
});

describe('calculateDisposableIncome', () => {
  it('does not subtract existing debt (SI-7)', () => {
    expect(calculateDisposableIncome(25_000, 15_000)).toBe(10_000);
  });
});
