import styles from './EligibilityResult.module.css';

export type ResultFigureProps = {
  label: string;
  value: string;
  /** A short plain-language explanation shown under the label and value. */
  hint?: string;
};

/** One row of a result `<dl>`. */
export function ResultFigure({ label, value, hint }: ResultFigureProps) {
  return (
    <div className={styles.row}>
      <dt className={styles.label}>{label}</dt>
      <dd className={styles.value}>{value}</dd>
      {hint ? <dd className={styles.hint}>{hint}</dd> : null}
    </div>
  );
}
