import { getResponse, type RequestHandler } from 'msw';
import { handlers as defaultHandlers } from './handlers';

/**
 * Answer /api calls by patching fetch. Used when a service worker cannot
 * start (Safari on http://192.168.x.x is not a secure context).
 */
export function startInMemoryMocks(
  handlers: RequestHandler[] = defaultHandlers,
): void {
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input, init) => {
    const mocked = await getResponse(handlers, toRequest(input, init));

    if (mocked) {
      return mocked;
    }

    return originalFetch(input, init);
  };
}

function toRequest(input: RequestInfo | URL, init?: RequestInit): Request {
  if (input instanceof Request && init === undefined) {
    return input.clone();
  }

  return new Request(input, init);
}
