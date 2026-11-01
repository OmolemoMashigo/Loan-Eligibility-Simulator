import { describe, expect, it } from 'vitest';
import { SPEC_SAMPLE_REQUEST } from '@/mocks/engine';
import { buildScheduleRequest } from './scheduleRequest';

describe('buildScheduleRequest', () => {
  it('asks for the recommended amount over the requested term', () => {
    expect(buildScheduleRequest(SPEC_SAMPLE_REQUEST, 120_000)).toEqual({
      loanAmount: 120_000,
      loanTerm: 24,
      loanType: 'personal_loan',
      creditScore: 650,
    });
  });

  it('leaves out a blank credit score', () => {
    const { monthlyIncome, monthlyExpenses, existingDebt } =
      SPEC_SAMPLE_REQUEST.financialInfo;
    const request = buildScheduleRequest(
      {
        ...SPEC_SAMPLE_REQUEST,
        financialInfo: { monthlyIncome, monthlyExpenses, existingDebt },
      },
      50_000,
    );

    expect(request).toEqual({
      loanAmount: 50_000,
      loanTerm: 24,
      loanType: 'personal_loan',
    });
    expect(request).not.toHaveProperty('creditScore');
  });

  it('asks for nothing when no amount is affordable', () => {
    expect(buildScheduleRequest(SPEC_SAMPLE_REQUEST, 0)).toBeUndefined();
  });
});
