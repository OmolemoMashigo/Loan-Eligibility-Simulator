import styles from './Disclaimer.module.css';

export function Disclaimer() {
  return (
    <aside
      className={styles.disclaimer}
      role="note"
      aria-label="Estimate disclaimer"
    >
      <p className={styles.title}>This is an estimate, not a credit offer.</p>
      <p className={styles.body}>
        A lender would still need a full application and a credit check. Nothing
        you enter is stored.
      </p>
    </aside>
  );
}
