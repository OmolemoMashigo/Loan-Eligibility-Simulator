import { type ReactNode } from 'react';
import { fieldErrorId, fieldHintId } from './ids';
import styles from './Field.module.css';

export type FieldProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
};

export function Field({
  id,
  label,
  hint,
  error,
  required,
  children,
}: FieldProps) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
        {required ? (
          <span className={styles.required} aria-hidden="true">
            {' '}
            *
          </span>
        ) : null}
      </label>
      {hint ? (
        <p className={styles.hint} id={fieldHintId(id)}>
          {hint}
        </p>
      ) : null}
      {children}
      {error ? (
        <p className={styles.error} id={fieldErrorId(id)} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
