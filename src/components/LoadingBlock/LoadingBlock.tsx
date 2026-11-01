import { useId } from 'react';
import { Spinner } from '@/components/Spinner/Spinner';
import styles from './LoadingBlock.module.css';

export type LoadingBlockProps = {
  label: string;
};

export function LoadingBlock({ label }: LoadingBlockProps) {
  const labelId = useId();

  return (
    <div
      className={styles.block}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-labelledby={labelId}
    >
      <Spinner decorative />
      <p className={styles.label} id={labelId}>
        {label}
      </p>
    </div>
  );
}
