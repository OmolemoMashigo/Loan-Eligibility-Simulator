import { describe, expect, it } from 'vitest';
import { SPEC_SAMPLE_REQUEST } from './config';
import { evaluateEligibility } from './decision';
import type { EligibilityRequest } from './types';

function withOverrides(
  overrides: {
    personalInfo?: Partial<EligibilityRequest['personalInfo']>;
    financialInfo?: Partial<EligibilityRequest['financialInfo']>;
    loanDetails?: Partial<EligibilityRequest['loanDetails']>;
  } = {},
): EligibilityRequest {
  return {
    personalInfo: {
      ...SPEC_SAMPLE_REQUEST.personalInfo,
      ...overrides.personalInfo,
    },
    financialInfo: {
      ...SPEC_SAMPLE_REQUEST.financialInfo,
      ...overrides.financialInfo,
    },
    loanDetails: {
      ...SPEC_SAMPLE_REQUEST.loanDetails,
      ...overrides.loanDetails,
    },
  };
}

describe('evaluateEligibility', () => {
  it('marks the spec sample as eligible with low risk', () => {
    const result = evaluateEligibility(SPEC_SAMPLE_REQUEST);

    expect(result.eligibilityResult.isEligible).toBe(true);
    expect(result.eligibilityResult.riskCategory).toBe('low');
    expect(result.eligibilityResult.approvalLikelihood).toBeGreaterThanOrEqual(
      80,
    );
    expect(result.eligibilityResult.decisionReason).toMatch(
      /income-to-expense/i,
    );
    expect(result.recommendedLoan.maxAmount).toBe(180_000);
    expect(result.recommendedLoan.recommendedAmount).toBe(150_000);
    expect(result.recommendedLoan.interestRate).toBe(12.5);
    expect(result.affordabilityAnalysis.loanToIncomeRatio).toBe(50);
  });

  it('declines when disposable income is zero or negative', () => {
    const result = evaluateEligibility(
      withOverrides({ financialInfo: { monthlyExpenses: 25_000 } }),
    );

    expect(result.eligibilityResult.isEligible).toBe(false);
    expect(result.eligibilityResult.decisionReason).toMatch(/no income/i);
  });

  it('declines when repayment exceeds 85% of disposable income', () => {
    const result = evaluateEligibility(
      withOverrides({
        financialInfo: { monthlyIncome: 8_000, monthlyExpenses: 7_400 },
        loanDetails: { requestedAmount: 150_000 },
      }),
    );

    expect(result.eligibilityResult.isEligible).toBe(false);
    expect(result.eligibilityResult.decisionReason).toMatch(/85%/);
  });

  it('declines when the requested amount is above the product maximum', () => {
    const result = evaluateEligibility(
      withOverrides({
        financialInfo: { monthlyIncome: 80_000, monthlyExpenses: 10_000 },
        loanDetails: { requestedAmount: 400_000 },
      }),
    );

    expect(result.eligibilityResult.isEligible).toBe(false);
    expect(result.eligibilityResult.decisionReason).toMatch(/maximum/i);
  });

  it('declines when the requested amount is below the product minimum', () => {
    const result = evaluateEligibility(
      withOverrides({ loanDetails: { requestedAmount: 1_000 } }),
    );

    expect(result.eligibilityResult.isEligible).toBe(false);
    expect(result.eligibilityResult.decisionReason).toMatch(/minimum/i);
  });

  it('does not auto-decline unemployed applicants who can afford the loan', () => {
    const result = evaluateEligibility(
      withOverrides({
        personalInfo: {
          employmentStatus: 'unemployed',
          employmentDuration: undefined,
        },
      }),
    );

    expect(result.eligibilityResult.isEligible).toBe(true);
    expect(result.eligibilityResult.approvalLikelihood).toBeLessThan(
      evaluateEligibility(SPEC_SAMPLE_REQUEST).eligibilityResult
        .approvalLikelihood,
    );
    expect(result.eligibilityResult.decisionReason).toMatch(/unemployment/i);
  });
});

describe('approval likelihood monotonicity', () => {
  const baseline =
    evaluateEligibility(SPEC_SAMPLE_REQUEST).eligibilityResult
      .approvalLikelihood;

  it('never falls when monthly income rises', () => {
    const improved = evaluateEligibility(
      withOverrides({ financialInfo: { monthlyIncome: 30_000 } }),
    );

    expect(
      improved.eligibilityResult.approvalLikelihood,
    ).toBeGreaterThanOrEqual(baseline);
  });

  it('never falls when expenses fall', () => {
    const improved = evaluateEligibility(
      withOverrides({ financialInfo: { monthlyExpenses: 12_000 } }),
    );

    expect(
      improved.eligibilityResult.approvalLikelihood,
    ).toBeGreaterThanOrEqual(baseline);
  });

  it('never falls when existing debt falls', () => {
    const improved = evaluateEligibility(
      withOverrides({ financialInfo: { existingDebt: 0 } }),
    );

    expect(
      improved.eligibilityResult.approvalLikelihood,
    ).toBeGreaterThanOrEqual(baseline);
  });

  it('never falls when the credit score moves to a better band', () => {
    const improved = evaluateEligibility(
      withOverrides({ financialInfo: { creditScore: 700 } }),
    );

    expect(
      improved.eligibilityResult.approvalLikelihood,
    ).toBeGreaterThanOrEqual(baseline);
  });

  it('never falls when employment duration increases', () => {
    const improved = evaluateEligibility(
      withOverrides({ personalInfo: { employmentDuration: 48 } }),
    );

    expect(
      improved.eligibilityResult.approvalLikelihood,
    ).toBeGreaterThanOrEqual(baseline);
  });
});
