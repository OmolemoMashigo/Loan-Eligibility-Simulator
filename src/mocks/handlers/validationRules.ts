import { HttpResponse, http } from 'msw';
import { apiMatch } from '@/mocks/api';
import { VALIDATION_RULES_RESPONSE } from '@/mocks/engine';
import { applyMockLatency } from '@/mocks/latency';

export const validationRulesHandlers = [
  http.get(apiMatch('/loans/validation-rules'), async () => {
    await applyMockLatency();

    return HttpResponse.json(VALIDATION_RULES_RESPONSE);
  }),
];
