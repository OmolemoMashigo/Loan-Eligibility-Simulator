import { type ComponentProps } from 'react';
import { Field } from '@/components/Field/Field';
import { describedById } from '@/components/Field/ids';
import { cx } from '@/components/cx';
import styles from '@/components/Field/Field.module.css';

export type NumberFieldProps = Omit<ComponentProps<'input'>, 'id' | 'type'> & {
  id: string;
  label: string;
  hint?: string;
  error?: string;
};

export function NumberField({
  id,
  label,
  hint,
  error,
  required,
  className,
  inputMode = 'numeric',
  autoComplete = 'off',
  ...props
}: NumberFieldProps) {
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required}>
      <input
        {...props}
        id={id}
        type="text"
        inputMode={inputMode}
        autoComplete={autoComplete}
        className={cx(
          styles.control,
          Boolean(error) && styles.controlError,
          className,
        )}
        aria-invalid={Boolean(error)}
        aria-describedby={describedById(id, { hint, error })}
        aria-required={required}
        required={required}
      />
    </Field>
  );
}
