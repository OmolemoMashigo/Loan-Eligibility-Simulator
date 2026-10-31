import { delay } from 'msw';
import { TEST_LATENCY_MS } from '@/mocks/engine';

let latencyMs = TEST_LATENCY_MS;

export function setMockLatency(ms: number): void {
  latencyMs = Math.max(0, ms);
}

export function getMockLatency(): number {
  return latencyMs;
}

export async function applyMockLatency(): Promise<void> {
  if (latencyMs <= 0) {
    return;
  }

  await delay(latencyMs);
}
