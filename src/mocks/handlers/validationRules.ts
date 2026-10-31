import { HttpResponse, http } from 'msw';
import { apiUrl } from '@/mocks/api';
import { VALIDATION_RULES_RESPONSE } from '@/mocks/engine';
import { applyMockLatency } from '@/mocks/latency';

export const validationRulesHandlers = [
  http.get(apiUrl('/loans/validation-rules'), async () => {
    await applyMockLatency();

    return HttpResponse.json(VALIDATION_RULES_RESPONSE);
  }),
];
