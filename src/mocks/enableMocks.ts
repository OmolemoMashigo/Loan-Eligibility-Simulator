export function isMocksEnabled(
  flag: string | undefined = import.meta.env.VITE_ENABLE_MOCKS,
): boolean {
  return flag !== 'false';
}

export async function enableMocks(): Promise<void> {
  if (!isMocksEnabled()) {
    return;
  }

  const { SIMULATED_LATENCY_MS } = await import('./engine');
  const { setMockLatency } = await import('./latency');
  setMockLatency(SIMULATED_LATENCY_MS);

  if (window.isSecureContext) {
    try {
      const { startMockWorker } = await import('./browser');
      await Promise.race([
        startMockWorker(),
        new Promise<never>((_, reject) => {
          window.setTimeout(() => {
            reject(new Error('Mock worker timed out'));
          }, 4000);
        }),
      ]);
      return;
    } catch {
      // Phone HTTP, a missing worker file, or a timed-out registration.
    }
  }

  const { startInMemoryMocks } = await import('./inMemory');
  startInMemoryMocks();
}
