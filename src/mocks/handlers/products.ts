import { HttpResponse, http } from 'msw';
import { apiUrl } from '@/mocks/api';
import { PRODUCTS_RESPONSE } from '@/mocks/fixtures/products';
import { applyMockLatency } from '@/mocks/latency';

export const productsHandlers = [
  http.get(apiUrl('/loans/products'), async () => {
    await applyMockLatency();

    return HttpResponse.json(PRODUCTS_RESPONSE);
  }),
];
