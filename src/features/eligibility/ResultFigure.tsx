import { cx } from '@/components/cx';
import styles from './EligibilityResult.module.css';

export type FigureTone = 'success' | 'warning' | 'danger';

export type ResultFigureProps = {
  label: string;
  value: string;
  /** A short plain-language explanation shown under the label and value. */
  hint?: string;
  /** Fill the tile with the brand colour, for the headline numbers. */
  highlight?: boolean;
  /** Show the value as a coloured pill, for a rating. */
  tone?: FigureTone;
};

/** One tile of a result `<dl>`. */
export function ResultFigure({
  label,
  value,
  hint,
  highlight = false,
  tone,
}: ResultFigureProps) {
  return (
    <div className={cx(styles.row, highlight && styles.highlight)}>
      <dt className={styles.label}>{label}</dt>
      <dd
        className={cx(styles.value, tone && styles.pill, tone && styles[tone])}
      >
        {value}
      </dd>
      {hint ? <dd className={styles.hint}>{hint}</dd> : null}
    </div>
  );
}
