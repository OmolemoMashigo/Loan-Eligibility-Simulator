import { delay } from 'msw';
import { TEST_LATENCY_MS } from '@/mocks/engine';

export interface LatencyRange {
  readonly min: number;
  readonly max: number;
}

export type MockLatency = number | LatencyRange;

let latency: MockLatency = TEST_LATENCY_MS;

/** A fixed delay in ms, or a range that picks a new delay for every request. */
export function setMockLatency(next: MockLatency): void {
  latency = next;
}

export function getMockLatency(): MockLatency {
  return latency;
}

export function pickLatencyMs(
  value: MockLatency,
  random: () => number = Math.random,
): number {
  if (typeof value === 'number') {
    return Math.max(0, value);
  }

  const min = Math.max(0, value.min);
  const max = Math.max(min, value.max);

  return Math.round(min + random() * (max - min));
}

export async function applyMockLatency(): Promise<void> {
  const ms = pickLatencyMs(latency);

  if (ms <= 0) {
    return;
  }

  await delay(ms);
}
