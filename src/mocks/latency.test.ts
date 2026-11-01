import { afterEach, describe, expect, it } from 'vitest';
import { SIMULATED_LATENCY_MS } from '@/mocks/engine';
import {
  applyMockLatency,
  getMockLatency,
  pickLatencyMs,
  setMockLatency,
} from './latency';

describe('mock latency', () => {
  afterEach(() => {
    setMockLatency(0);
  });

  it('is off by default so tests stay fast', () => {
    expect(getMockLatency()).toBe(0);
  });

  it('keeps a fixed delay as it is and never goes below zero', () => {
    expect(pickLatencyMs(250)).toBe(250);
    expect(pickLatencyMs(-5)).toBe(0);
  });

  it('picks the ends of the simulated range and values between them', () => {
    expect(pickLatencyMs(SIMULATED_LATENCY_MS, () => 0)).toBe(300);
    expect(pickLatencyMs(SIMULATED_LATENCY_MS, () => 0.5)).toBe(550);
    expect(pickLatencyMs(SIMULATED_LATENCY_MS, () => 0.999999)).toBe(800);
  });

  it('stays inside the range for any random value', () => {
    for (let step = 0; step <= 100; step += 1) {
      const ms = pickLatencyMs(SIMULATED_LATENCY_MS, () => step / 100);

      expect(ms).toBeGreaterThanOrEqual(SIMULATED_LATENCY_MS.min);
      expect(ms).toBeLessThanOrEqual(SIMULATED_LATENCY_MS.max);
    }
  });

  it('waits for the delay and returns straight away at zero', async () => {
    const started = performance.now();
    await applyMockLatency();
    expect(performance.now() - started).toBeLessThan(50);

    setMockLatency({ min: 120, max: 120 });
    const delayedStart = performance.now();
    await applyMockLatency();
    expect(performance.now() - delayedStart).toBeGreaterThanOrEqual(100);
  });
});
