import { HttpResponse, delay, http } from 'msw';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { apiUrl } from '@/mocks/api';
import { SPEC_SAMPLE_REQUEST } from '@/mocks/engine';
import { PRODUCTS_RESPONSE } from '@/mocks/fixtures/products';
import { setMockLatency } from '@/mocks/latency';
import { server } from '@/mocks/server';
import { DEFAULT_API_BASE_URL, buildApiUrl, getApiBaseUrl } from './client';
import { isApiError, type ApiError } from './errors';
import {
  calculateRate,
  checkEligibility,
  fetchLoanProducts,
  fetchValidationRules,
} from './loans';

const sampleRateRequest = {
  loanAmount: 150_000,
  loanTerm: 24,
  creditScore: 650,
  loanType: 'personal_loan' as const,
};

describe('typed loan API client', () => {
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

  it('uses /api when no base URL is configured', () => {
    expect(getApiBaseUrl()).toBe(DEFAULT_API_BASE_URL);
    expect(buildApiUrl('/loans/products')).toBe(apiUrl('/loans/products'));
  });

  it('parses the products payload', async () => {
    const body = await fetchLoanProducts();

    expect(body.products).toEqual(
      JSON.parse(JSON.stringify(PRODUCTS_RESPONSE.products)),
    );
    expect(body.products[0]).toMatchObject({
      id: 'personal_loan',
      minAmount: 5_000,
      maxAmount: 300_000,
    });
  });

  it('parses the validation-rules payload', async () => {
    const body = await fetchValidationRules();

    expect(body.personalInfo.age).toMatchObject({
      min: 18,
      max: 65,
      required: true,
    });
    expect(body.financialInfo.creditScore.required).toBe(false);
    expect(body.loanDetails.requestedAmount).toMatchObject({
      min: 5_000,
      max: 300_000,
    });
  });

  it('parses an eligibility result for the spec sample', async () => {
    const body = await checkEligibility(SPEC_SAMPLE_REQUEST);

    expect(body.eligibilityResult.isEligible).toBe(true);
    expect(body.recommendedLoan.maxAmount).toBe(180_000);
    expect(body.recommendedLoan.interestRate).toBe(12.5);
    expect(body.affordabilityAnalysis.loanToIncomeRatio).toBe(50);
  });

  it('parses a full amortisation schedule from calculate-rate', async () => {
    const body = await calculateRate(sampleRateRequest);

    expect(body.interestRate).toBe(12.5);
    expect(body.monthlyPayment).toBe(7_096.1);
    expect(body.paymentSchedule).toHaveLength(24);
    expect(body.paymentSchedule.at(-1)?.balance).toBe(0);
  });

  it('normalises a 400 into a validation ApiError', async () => {
    const error = await getApiError(() =>
      checkEligibility({
        ...SPEC_SAMPLE_REQUEST,
        personalInfo: { ...SPEC_SAMPLE_REQUEST.personalInfo, age: 17 },
      }),
    );

    expect(error.kind).toBe('validation');
    expect(error.status).toBe(400);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.fieldErrors?.['personalInfo.age']).toBeDefined();
  });

  it('normalises mockError=500 into a server ApiError', async () => {
    const error = await getApiError(() =>
      checkEligibility(SPEC_SAMPLE_REQUEST, {
        searchParams: { mockError: '500' },
      }),
    );

    expect(error.kind).toBe('server');
    expect(error.status).toBe(500);
    expect(error.code).toBe('INTERNAL_ERROR');
    expect(error.message).toMatch(/try again/i);
  });

  it('normalises a drifted response into a schema ApiError', async () => {
    server.use(
      http.get(apiUrl('/loans/products'), () =>
        HttpResponse.json({ unexpected: true }),
      ),
    );

    const error = await getApiError(() => fetchLoanProducts());

    expect(error.kind).toBe('schema');
    expect(error.status).toBe(200);
    expect(error.message).toMatch(/unexpected response/i);
  });

  it('normalises a failed fetch into a network ApiError', async () => {
    server.use(http.get(apiUrl('/loans/products'), () => HttpResponse.error()));

    const error = await getApiError(() => fetchLoanProducts());

    expect(error.kind).toBe('network');
    expect(error.message).toMatch(/unable to reach the server/i);
  });

  it('normalises a timeout into a network ApiError', async () => {
    server.use(
      http.get(apiUrl('/loans/products'), async () => {
        await delay(80);
        return HttpResponse.json(PRODUCTS_RESPONSE);
      }),
    );

    const error = await getApiError(() => fetchLoanProducts({ timeoutMs: 15 }));

    expect(error.kind).toBe('network');
    expect(error.message).toMatch(/timed out/i);
  });

  it('normalises an abort into a network ApiError', async () => {
    const controller = new AbortController();

    server.use(
      http.get(apiUrl('/loans/products'), async () => {
        await delay(80);
        return HttpResponse.json(PRODUCTS_RESPONSE);
      }),
    );

    const pending = fetchLoanProducts({ signal: controller.signal });
    controller.abort();

    const error = await getApiError(() => pending);

    expect(error.kind).toBe('network');
    expect(error.message).toMatch(/cancelled/i);
  });
});

async function getApiError(run: () => Promise<unknown>): Promise<ApiError> {
  try {
    await run();
  } catch (error) {
    expect(isApiError(error)).toBe(true);

    if (isApiError(error)) {
      return error;
    }
  }

  throw new Error('expected the request to fail');
}
