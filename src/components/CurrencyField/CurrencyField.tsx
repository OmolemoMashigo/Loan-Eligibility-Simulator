import { type ComponentProps } from 'react';
import { Field } from '@/components/Field/Field';
import { describedById } from '@/components/Field/ids';
import { cx } from '@/components/cx';
import fieldStyles from '@/components/Field/Field.module.css';
import styles from './CurrencyField.module.css';

export type CurrencyFieldProps = Omit<
  ComponentProps<'input'>,
  'id' | 'type'
> & {
  id: string;
  label: string;
  hint?: string;
  error?: string;
};

export function CurrencyField({
  id,
  label,
  hint,
  error,
  required,
  disabled,
  className,
  inputMode = 'decimal',
  autoComplete = 'off',
  ...props
}: CurrencyFieldProps) {
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required}>
      <div
        className={cx(
          styles.wrap,
          Boolean(error) && styles.wrapError,
          disabled && styles.wrapDisabled,
        )}
      >
        <span className={styles.prefix} aria-hidden="true">
          R
        </span>
        <input
          {...props}
          id={id}
          type="text"
          inputMode={inputMode}
          autoComplete={autoComplete}
          disabled={disabled}
          className={cx(
            fieldStyles.control,
            styles.input,
            Boolean(error) && fieldStyles.controlError,
            className,
          )}
          aria-invalid={Boolean(error)}
          aria-describedby={describedById(id, { hint, error })}
          aria-required={required}
          required={required}
        />
      </div>
    </Field>
  );
}
