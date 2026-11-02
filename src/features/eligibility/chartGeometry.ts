export const CHART_WIDTH = 320;
export const CHART_HEIGHT = 120;
/** Space kept above and below the line so it never touches the edge. */
const CHART_PADDING = 8;

export type ChartPoint = { x: number; y: number };

export type BalanceChartShape = {
  /** SVG path for the balance line, from the opening balance to the end. */
  line: string;
  /** The same path closed down to the floor, for the soft fill under it. */
  area: string;
  start: ChartPoint;
  end: ChartPoint;
  /** Y positions of the top, middle, and bottom guide lines. */
  guides: readonly [number, number, number];
};

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Turns a loan's balance after each month into drawing coordinates. The line
 * starts at the opening balance (month 0) at the top left and falls to the
 * last balance at the right. Returns nothing when there is nothing to draw.
 */
export function buildBalanceChart(
  openingBalance: number,
  balances: readonly number[],
): BalanceChartShape | undefined {
  if (openingBalance <= 0 || balances.length === 0) {
    return undefined;
  }

  const values = [openingBalance, ...balances];
  const top = CHART_PADDING;
  const bottom = CHART_HEIGHT - CHART_PADDING;
  const monthWidth = CHART_WIDTH / balances.length;

  const points = values.map((value, index): ChartPoint => {
    const share = Math.min(1, Math.max(0, value / openingBalance));

    return {
      x: round(index * monthWidth),
      y: round(top + (1 - share) * (bottom - top)),
    };
  });

  const [start, ...rest] = points;
  const end = rest[rest.length - 1];

  if (!start || !end) {
    return undefined;
  }

  const line = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`)
    .join(' ');

  return {
    line,
    area: `${line} L${end.x} ${CHART_HEIGHT} L${start.x} ${CHART_HEIGHT} Z`,
    start,
    end,
    guides: [top, round((top + bottom) / 2), bottom],
  };
}
