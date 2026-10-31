import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { PRODUCTS_RESPONSE } from '@/mocks/fixtures/products';
import { VALIDATION_RULES_RESPONSE } from '@/mocks/engine';
import { setMockLatency } from '@/mocks/latency';
import { server } from '@/mocks/server';
import { apiUrl } from '@/mocks/api';

describe('GET mock endpoints', () => {
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

  it('returns the spec products payload', async () => {
    const response = await fetch(apiUrl('/loans/products'));
    const body: unknown = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(JSON.parse(JSON.stringify(PRODUCTS_RESPONSE)));
    expect(body).toEqual({
      products: [
        expect.objectContaining({
          id: 'personal_loan',
          minAmount: 5_000,
          maxAmount: 300_000,
        }),
        expect.objectContaining({
          id: 'vehicle_loan',
          minAmount: 50_000,
          maxAmount: 1_500_000,
        }),
      ],
    });
  });

  it('returns the spec validation-rules payload', async () => {
    const response = await fetch(apiUrl('/loans/validation-rules'));
    const body: unknown = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(JSON.parse(JSON.stringify(VALIDATION_RULES_RESPONSE)));
    expect(body).toEqual({
      personalInfo: expect.objectContaining({
        age: expect.objectContaining({ min: 18, max: 65, required: true }),
      }),
      financialInfo: expect.objectContaining({
        creditScore: expect.objectContaining({ required: false }),
      }),
      loanDetails: expect.objectContaining({
        requestedAmount: expect.objectContaining({
          min: 5_000,
          max: 300_000,
        }),
      }),
    });
  });
});
