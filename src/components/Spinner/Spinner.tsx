import styles from './Spinner.module.css';

export type SpinnerProps = {
  label?: string;
  decorative?: boolean;
};

export function Spinner({
  label = 'Loading',
  decorative = false,
}: SpinnerProps) {
  if (decorative) {
    return (
      <span className={styles.wrap} aria-hidden="true">
        <span className={styles.spinner} />
      </span>
    );
  }

  return (
    <span className={styles.wrap} role="status">
      <span className={styles.spinner} />
      <span className={styles.visuallyHidden}>{label}</span>
    </span>
  );
}
