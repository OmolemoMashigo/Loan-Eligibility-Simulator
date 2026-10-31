import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { apiUrl } from '@/mocks/api';
import { SPEC_SAMPLE_REQUEST } from '@/mocks/engine';
import { setMockLatency } from '@/mocks/latency';
import { server } from '@/mocks/server';

const jsonHeaders = { 'Content-Type': 'application/json' };

describe('POST mock endpoints', () => {
  beforeAll(() => {
    setMockLatency(0);
    server.listen({ onUnhandledRequest: 'error' });
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  it('returns an eligibility result for the spec sample', async () => {
    const response = await fetch(apiUrl('/loans/eligibility'), {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(SPEC_SAMPLE_REQUEST),
    });
    const body = (await response.json()) as {
      eligibilityResult: { isEligible: boolean };
      recommendedLoan: { maxAmount: number; interestRate: number };
      affordabilityAnalysis: { loanToIncomeRatio: number };
    };

    expect(response.status).toBe(200);
    expect(body.eligibilityResult.isEligible).toBe(true);
    expect(body.recommendedLoan.maxAmount).toBe(180_000);
    expect(body.recommendedLoan.interestRate).toBe(12.5);
    expect(body.affordabilityAnalysis.loanToIncomeRatio).toBe(50);
  });

  it('returns a full amortisation schedule from calculate-rate', async () => {
    const response = await fetch(apiUrl('/loans/calculate-rate'), {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({
        loanAmount: 150_000,
        loanTerm: 24,
        creditScore: 650,
        loanType: 'personal_loan',
      }),
    });
    const body = (await response.json()) as {
      interestRate: number;
      monthlyPayment: number;
      paymentSchedule: { month: number; balance: number }[];
    };

    expect(response.status).toBe(200);
    expect(body.interestRate).toBe(12.5);
    expect(body.monthlyPayment).toBe(7_096.1);
    expect(body.paymentSchedule).toHaveLength(24);
    expect(body.paymentSchedule.at(-1)?.balance).toBe(0);
  });

  it('returns a 400 validation error for an invalid eligibility body', async () => {
    const response = await fetch(apiUrl('/loans/eligibility'), {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({
        ...SPEC_SAMPLE_REQUEST,
        personalInfo: { ...SPEC_SAMPLE_REQUEST.personalInfo, age: 17 },
      }),
    });
    const body = (await response.json()) as {
      error: { code: string; fieldErrors?: Record<string, string> };
    };

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.fieldErrors?.['personalInfo.age']).toBeDefined();
  });

  it('returns a 500 when mockError=500 is on the query string', async () => {
    const response = await fetch(
      `${apiUrl('/loans/eligibility')}?mockError=500`,
      {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify(SPEC_SAMPLE_REQUEST),
      },
    );
    const body = (await response.json()) as {
      error: { code: string; message: string };
    };

    expect(response.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
    expect(body.error.message).toMatch(/try again/i);
  });
});
