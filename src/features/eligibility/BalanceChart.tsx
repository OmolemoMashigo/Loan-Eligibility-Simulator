import { formatWholeRand } from '@/lib/format';
import styles from './BalanceChart.module.css';
import { CHART_HEIGHT, CHART_WIDTH, buildBalanceChart } from './chartGeometry';

export type BalanceChartProps = {
  /** What the loan starts at, in rand. */
  loanAmount: number;
  /** The balance left after each month, in order. */
  balances: readonly number[];
};

/**
 * A small line chart of the balance falling to zero. It adds a picture to the
 * table below it and says the same thing in its label, so nothing depends on
 * seeing it.
 */
export function BalanceChart({ loanAmount, balances }: BalanceChartProps) {
  const shape = buildBalanceChart(loanAmount, balances);

  if (!shape) {
    return null;
  }

  const months = balances.length;
  const finalBalance = balances[months - 1] ?? 0;

  return (
    <div className={styles.chart}>
      <p className={styles.title} aria-hidden="true">
        Balance left to repay
      </p>
      <svg
        key={`${loanAmount}-${months}`}
        className={styles.svg}
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        role="img"
        aria-label={`Chart of your remaining balance. It starts at ${formatWholeRand(loanAmount)} and falls to ${formatWholeRand(finalBalance)} after ${months} months.`}
      >
        {shape.guides.map((y) => (
          <line
            key={y}
            className={styles.guide}
            x1={0}
            x2={CHART_WIDTH}
            y1={y}
            y2={y}
          />
        ))}
        <path className={styles.area} d={shape.area} />
        <path className={styles.line} d={shape.line} pathLength={1} />
        <circle
          className={styles.dot}
          cx={shape.start.x}
          cy={shape.start.y}
          r={4}
        />
        <circle
          className={styles.dot}
          cx={shape.end.x}
          cy={shape.end.y}
          r={4}
        />
      </svg>
      <div className={styles.axis} aria-hidden="true">
        <span>Start</span>
        <span>Month {months}</span>
      </div>
    </div>
  );
}
