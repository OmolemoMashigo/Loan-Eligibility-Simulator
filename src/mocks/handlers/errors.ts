import { HttpResponse } from 'msw';
import { MOCK_ERROR_QUERY_PARAM, MOCK_ERROR_QUERY_VALUE } from '@/mocks/engine';
import type { ApiErrorBody } from '@/mocks/engine';

export function isSimulatedServerError(request: Request): boolean {
  const url = new URL(request.url);

  return (
    url.searchParams.get(MOCK_ERROR_QUERY_PARAM) === MOCK_ERROR_QUERY_VALUE
  );
}

export function validationErrorResponse(error: ApiErrorBody) {
  return HttpResponse.json(error, { status: 400 });
}

export function internalErrorResponse() {
  const body: ApiErrorBody = {
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong. Please try again.',
    },
  };

  return HttpResponse.json(body, { status: 500 });
}

export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
