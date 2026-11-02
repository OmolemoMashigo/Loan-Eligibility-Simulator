import { HttpResponse, http } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';
import { apiMatch } from './api';
import { startInMemoryMocks } from './inMemory';
import { setMockLatency } from './latency';

describe('startInMemoryMocks', () => {
  const originalFetch = window.fetch;

  afterEach(() => {
    window.fetch = originalFetch;
    setMockLatency(0);
  });

  it('answers /api from the handlers without a service worker', async () => {
    setMockLatency(0);
    startInMemoryMocks([
      http.get(apiMatch('/loans/validation-rules'), () =>
        HttpResponse.json({ ok: true }),
      ),
    ]);

    const response = await fetch('http://localhost/api/loans/validation-rules');

    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it('leaves unmatched requests to the real fetch', async () => {
    setMockLatency(0);
    window.fetch = async () => new Response('passthrough');
    startInMemoryMocks([]);

    const response = await fetch('http://localhost/not-api');

    await expect(response.text()).resolves.toBe('passthrough');
  });
});
