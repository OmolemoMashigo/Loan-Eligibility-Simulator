import { describe, expect, it } from 'vitest';
import {
  AFFORDABILITY_SCORE_THRESHOLDS,
  CREDIT_SCORE_RATE_BANDS,
  ENGINE_CONFIG,
  LOAN_TO_INCOME_INCOME_MONTHS,
  MAX_AMOUNT_ROUNDING_INCREMENT,
  MAX_PAYMENT_TO_DISPOSABLE_RATIO,
  PERSONAL_LOAN_PRODUCT,
  SPEC_SAMPLE_REQUEST,
  UNKNOWN_CREDIT_SCORE_RATE_PERCENT,
} from './config';

describe('engine config', () => {
  it('keeps personal loan bounds aligned with validation rules (SI-1)', () => {
    expect(PERSONAL_LOAN_PRODUCT.minAmount).toBe(5_000);
    expect(PERSONAL_LOAN_PRODUCT.maxAmount).toBe(300_000);
    expect(PERSONAL_LOAN_PRODUCT.minTerm).toBe(6);
    expect(PERSONAL_LOAN_PRODUCT.maxTerm).toBe(60);
  });

  it('maps a credit score of 650 to 12.5 percent (SI-6 sample rate)', () => {
    const band = CREDIT_SCORE_RATE_BANDS.find(
      (candidate) => 650 >= candidate.minScore,
    );

    expect(band?.annualRatePercent).toBe(12.5);
  });

  it('uses a conservative rate when the credit score is unknown (SI-8)', () => {
    expect(UNKNOWN_CREDIT_SCORE_RATE_PERCENT).toBe(14.5);
    expect(UNKNOWN_CREDIT_SCORE_RATE_PERCENT).toBeGreaterThanOrEqual(
      PERSONAL_LOAN_PRODUCT.interestRateRange.min,
    );
    expect(UNKNOWN_CREDIT_SCORE_RATE_PERCENT).toBeLessThanOrEqual(
      PERSONAL_LOAN_PRODUCT.interestRateRange.max,
    );
  });

  it('defines LTI against twelve months of income (SI-7)', () => {
    expect(LOAN_TO_INCOME_INCOME_MONTHS).toBe(12);

    const sampleLti =
      (SPEC_SAMPLE_REQUEST.loanDetails.requestedAmount /
        (SPEC_SAMPLE_REQUEST.financialInfo.monthlyIncome *
          LOAN_TO_INCOME_INCOME_MONTHS)) *
      100;

    expect(sampleLti).toBe(50);
  });

  it('rounds max amount to the nearest R5,000 at 85 percent of disposable', () => {
    expect(MAX_PAYMENT_TO_DISPOSABLE_RATIO).toBe(0.85);
    expect(MAX_AMOUNT_ROUNDING_INCREMENT).toBe(5_000);
  });

  it('labels the spec sample repayment share as good', () => {
    expect(AFFORDABILITY_SCORE_THRESHOLDS.good).toBeGreaterThan(0.709);
  });

  it('exposes a single config object for interview-time tweaks', () => {
    expect(ENGINE_CONFIG.personalLoan.id).toBe('personal_loan');
  });
});
