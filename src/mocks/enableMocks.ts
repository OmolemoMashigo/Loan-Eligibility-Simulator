export function isMocksEnabled(
  flag: string | undefined = import.meta.env.VITE_ENABLE_MOCKS,
): boolean {
  return flag !== 'false';
}

export async function enableMocks(): Promise<void> {
  if (!isMocksEnabled()) {
    return;
  }

  const { startMockWorker } = await import('./browser');
  await startMockWorker();
}
