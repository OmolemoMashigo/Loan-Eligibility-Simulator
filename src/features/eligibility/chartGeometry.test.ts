import { describe, expect, it } from 'vitest';
import { CHART_HEIGHT, CHART_WIDTH, buildBalanceChart } from './chartGeometry';

describe('buildBalanceChart', () => {
  it('draws nothing when there is no loan or no months', () => {
    expect(buildBalanceChart(0, [10])).toBeUndefined();
    expect(buildBalanceChart(-5, [10])).toBeUndefined();
    expect(buildBalanceChart(1000, [])).toBeUndefined();
  });

  it('starts at the top left and ends at the floor on the right', () => {
    const shape = buildBalanceChart(1000, [500, 0]);

    expect(shape?.start).toEqual({ x: 0, y: 8 });
    expect(shape?.end).toEqual({ x: CHART_WIDTH, y: CHART_HEIGHT - 8 });
  });

  it('spaces the months evenly and places each balance in proportion', () => {
    const shape = buildBalanceChart(1000, [750, 500, 250, 0]);

    expect(shape?.line).toBe('M0 8 L80 34 L160 60 L240 86 L320 112');
  });

  it('keeps the line inside the drawing even if a balance overshoots', () => {
    const shape = buildBalanceChart(1000, [1500, -20]);

    expect(shape?.line).toBe('M0 8 L160 8 L320 112');
  });

  it('closes the fill down to the floor and back to the start', () => {
    const shape = buildBalanceChart(1000, [500, 0]);

    expect(
      shape?.area.endsWith(`L320 ${CHART_HEIGHT} L0 ${CHART_HEIGHT} Z`),
    ).toBe(true);
    expect(shape?.area.startsWith(shape?.line ?? 'x')).toBe(true);
  });

  it('puts the guide lines at the top, middle, and bottom', () => {
    expect(buildBalanceChart(1000, [0])?.guides).toEqual([8, 60, 112]);
  });
});
