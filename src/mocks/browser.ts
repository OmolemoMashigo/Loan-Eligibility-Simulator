import { setupWorker } from 'msw/browser';
import { SIMULATED_LATENCY_MS } from './engine';
import { handlers } from './handlers';
import { setMockLatency } from './latency';

export const worker = setupWorker(...handlers);

export async function startMockWorker(): Promise<void> {
  setMockLatency(SIMULATED_LATENCY_MS);

  await worker.start({
    onUnhandledRequest(request, print) {
      const { pathname } = new URL(request.url);

      if (pathname.startsWith('/api/')) {
        print.error();
      }
    },
    serviceWorker: {
      url: '/mockServiceWorker.js',
    },
  });
}
