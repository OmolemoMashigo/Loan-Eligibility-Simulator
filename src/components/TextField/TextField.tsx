import { type ComponentProps } from 'react';
import { Field } from '@/components/Field/Field';
import { describedById } from '@/components/Field/ids';
import { cx } from '@/components/cx';
import styles from '@/components/Field/Field.module.css';

export type TextFieldProps = Omit<ComponentProps<'input'>, 'id'> & {
  id: string;
  label: string;
  hint?: string;
  error?: string;
};

export function TextField({
  id,
  label,
  hint,
  error,
  required,
  className,
  type = 'text',
  ...props
}: TextFieldProps) {
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required}>
      <input
        {...props}
        id={id}
        type={type}
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
