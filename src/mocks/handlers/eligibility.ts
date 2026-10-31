import { HttpResponse, http } from 'msw';
import { apiUrl } from '@/mocks/api';
import {
  evaluateEligibility,
  validateEligibilityRequest,
} from '@/mocks/engine';
import { applyMockLatency } from '@/mocks/latency';
import {
  internalErrorResponse,
  isSimulatedServerError,
  readJsonBody,
  validationErrorResponse,
} from './errors';

export const eligibilityHandlers = [
  http.post(apiUrl('/loans/eligibility'), async ({ request }) => {
    await applyMockLatency();

    if (isSimulatedServerError(request)) {
      return internalErrorResponse();
    }

    const parsed = validateEligibilityRequest(await readJsonBody(request));

    if (!parsed.ok) {
      return validationErrorResponse(parsed.error);
    }

    return HttpResponse.json(evaluateEligibility(parsed.value));
  }),
];
