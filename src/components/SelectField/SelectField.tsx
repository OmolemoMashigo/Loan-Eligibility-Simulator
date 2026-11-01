import { type ComponentProps } from 'react';
import { Field } from '@/components/Field/Field';
import { describedById } from '@/components/Field/ids';
import { cx } from '@/components/cx';
import styles from '@/components/Field/Field.module.css';

export type SelectOption = {
  value: string;
  label: string;
};

export type SelectFieldProps = Omit<ComponentProps<'select'>, 'id'> & {
  id: string;
  label: string;
  options: readonly SelectOption[];
  placeholder?: string;
  hint?: string;
  error?: string;
};

export function SelectField({
  id,
  label,
  options,
  placeholder,
  hint,
  error,
  required,
  className,
  ...props
}: SelectFieldProps) {
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required}>
      <select
        {...props}
        id={id}
        className={cx(
          styles.control,
          Boolean(error) && styles.controlError,
          className,
        )}
        aria-invalid={Boolean(error)}
        aria-describedby={describedById(id, { hint, error })}
        aria-required={required}
        required={required}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}
