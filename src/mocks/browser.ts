import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);

export async function startMockWorker(): Promise<void> {
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
