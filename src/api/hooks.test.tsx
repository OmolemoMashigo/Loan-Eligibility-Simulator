import { renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { type ReactNode } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { AppProviders } from '@/app/providers';
import { apiUrl } from '@/mocks/api';
import { SPEC_SAMPLE_REQUEST } from '@/mocks/engine';
import { setMockLatency } from '@/mocks/latency';
import { server } from '@/mocks/server';
import { isApiError } from './errors';
import {
  useCalculateRate,
  useCheckEligibility,
  useLoanProducts,
  useValidationRules,
} from './hooks';
import { createQueryClient } from './queryClient';

function createWrapper() {
  const queryClient = createQueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <AppProviders queryClient={queryClient}>{children}</AppProviders>;
  };
}

describe('loan query hooks', () => {
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

  it('loads loan products', async () => {
    const { result } = renderHook(() => useLoanProducts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.products).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'personal_loan' }),
        expect.objectContaining({ id: 'vehicle_loan' }),
      ]),
    );
  });

  it('loads validation rules', async () => {
    const { result } = renderHook(() => useValidationRules(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.personalInfo.age).toMatchObject({
      min: 18,
      max: 65,
      required: true,
    });
    expect(result.current.data?.financialInfo.creditScore.required).toBe(false);
  });

  it('checks eligibility for the spec sample', async () => {
    const { result } = renderHook(() => useCheckEligibility(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(SPEC_SAMPLE_REQUEST);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.eligibilityResult.isEligible).toBe(true);
    expect(result.current.data?.recommendedLoan.maxAmount).toBe(180_000);
    expect(result.current.data?.affordabilityAnalysis.loanToIncomeRatio).toBe(
      50,
    );
  });

  it('calculates a full repayment schedule', async () => {
    const { result } = renderHook(() => useCalculateRate(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      loanAmount: 150_000,
      loanTerm: 24,
      creditScore: 650,
      loanType: 'personal_loan',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.interestRate).toBe(12.5);
    expect(result.current.data?.monthlyPayment).toBe(7_096.1);
    expect(result.current.data?.paymentSchedule).toHaveLength(24);
  });

  it('surfaces a validation ApiError from eligibility', async () => {
    const { result } = renderHook(() => useCheckEligibility(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      ...SPEC_SAMPLE_REQUEST,
      personalInfo: { ...SPEC_SAMPLE_REQUEST.personalInfo, age: 17 },
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(isApiError(result.current.error)).toBe(true);
    if (isApiError(result.current.error)) {
      expect(result.current.error.kind).toBe('validation');
      expect(
        result.current.error.fieldErrors?.['personalInfo.age'],
      ).toBeDefined();
    }
  });

  it('surfaces a server ApiError from eligibility', async () => {
    server.use(
      http.post(apiUrl('/loans/eligibility'), () =>
        HttpResponse.json(
          {
            error: {
              code: 'INTERNAL_ERROR',
              message: 'Something went wrong. Please try again.',
            },
          },
          { status: 500 },
        ),
      ),
    );

    const { result } = renderHook(() => useCheckEligibility(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(SPEC_SAMPLE_REQUEST);

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(isApiError(result.current.error)).toBe(true);
    if (isApiError(result.current.error)) {
      expect(result.current.error.kind).toBe('server');
      expect(result.current.error.status).toBe(500);
    }
  });
});
