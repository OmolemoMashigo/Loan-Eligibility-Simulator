import { describe, expect, it } from 'vitest';
import { SPEC_SAMPLE_REQUEST } from './config';
import {
  validateCalculateRateRequest,
  validateEligibilityRequest,
} from './validate';

describe('validateEligibilityRequest', () => {
  it('accepts the spec sample', () => {
    const result = validateEligibilityRequest(SPEC_SAMPLE_REQUEST);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.financialInfo.creditScore).toBe(650);
    }
  });

  it('rejects an under-age applicant', () => {
    const result = validateEligibilityRequest({
      ...SPEC_SAMPLE_REQUEST,
      personalInfo: { ...SPEC_SAMPLE_REQUEST.personalInfo, age: 17 },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.error.code).toBe('VALIDATION_ERROR');
      expect(result.error.error.fieldErrors?.['personalInfo.age']).toMatch(
        /18 and 65/,
      );
    }
  });

  it('requires employment duration only for employed and self-employed (SI-3)', () => {
    const employed = validateEligibilityRequest({
      ...SPEC_SAMPLE_REQUEST,
      personalInfo: {
        ...SPEC_SAMPLE_REQUEST.personalInfo,
        employmentStatus: 'employed',
        employmentDuration: undefined,
      },
    });
    const unemployed = validateEligibilityRequest({
      ...SPEC_SAMPLE_REQUEST,
      personalInfo: {
        age: 35,
        employmentStatus: 'unemployed',
      },
    });

    expect(employed.ok).toBe(false);
    if (!employed.ok) {
      expect(
        employed.error.error.fieldErrors?.['personalInfo.employmentDuration'],
      ).toBeDefined();
    }

    expect(unemployed.ok).toBe(true);
    if (unemployed.ok) {
      expect(unemployed.value.personalInfo.employmentDuration).toBeUndefined();
    }
  });

  it('allows existing debt of 0 and rejects a missing debt field (SI-9)', () => {
    const zeroDebt = validateEligibilityRequest({
      ...SPEC_SAMPLE_REQUEST,
      financialInfo: { ...SPEC_SAMPLE_REQUEST.financialInfo, existingDebt: 0 },
    });
    const { existingDebt: _omitted, ...financialWithoutDebt } =
      SPEC_SAMPLE_REQUEST.financialInfo;
    const missingDebt = validateEligibilityRequest({
      ...SPEC_SAMPLE_REQUEST,
      financialInfo: financialWithoutDebt,
    });

    expect(zeroDebt.ok).toBe(true);
    expect(missingDebt.ok).toBe(false);
    if (!missingDebt.ok) {
      expect(
        missingDebt.error.error.fieldErrors?.['financialInfo.existingDebt'],
      ).toBeDefined();
    }
  });

  it('omits a blank credit score and rejects 0 (SI-8)', () => {
    const { creditScore: _omitted, ...financialWithoutScore } =
      SPEC_SAMPLE_REQUEST.financialInfo;
    const omitted = validateEligibilityRequest({
      ...SPEC_SAMPLE_REQUEST,
      financialInfo: financialWithoutScore,
    });
    const zero = validateEligibilityRequest({
      ...SPEC_SAMPLE_REQUEST,
      financialInfo: { ...SPEC_SAMPLE_REQUEST.financialInfo, creditScore: 0 },
    });

    expect(omitted.ok).toBe(true);
    if (omitted.ok) {
      expect(omitted.value.financialInfo.creditScore).toBeUndefined();
    }

    expect(zero.ok).toBe(false);
  });

  it('rejects a vehicle purpose because only personal loans are in scope (SI-1)', () => {
    const result = validateEligibilityRequest({
      ...SPEC_SAMPLE_REQUEST,
      loanDetails: {
        ...SPEC_SAMPLE_REQUEST.loanDetails,
        loanPurpose: 'new_vehicle',
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(
        result.error.error.fieldErrors?.['loanDetails.loanPurpose'],
      ).toBeDefined();
    }
  });

  it('returns every field error in one response', () => {
    const result = validateEligibilityRequest({
      personalInfo: { age: 17, employmentStatus: 'nope' },
      financialInfo: { monthlyIncome: 100, monthlyExpenses: -1 },
      loanDetails: { requestedAmount: 1, loanTerm: 3 },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(
        Object.keys(result.error.error.fieldErrors ?? {}).length,
      ).toBeGreaterThan(3);
    }
  });
});

describe('validateCalculateRateRequest', () => {
  it('accepts a personal loan calculation and rejects vehicle_loan (SI-2)', () => {
    const valid = validateCalculateRateRequest({
      loanAmount: 150_000,
      loanTerm: 24,
      creditScore: 650,
      loanType: 'personal_loan',
    });
    const vehicle = validateCalculateRateRequest({
      loanAmount: 150_000,
      loanTerm: 24,
      loanType: 'vehicle_loan',
    });

    expect(valid.ok).toBe(true);
    expect(vehicle.ok).toBe(false);
  });
});
