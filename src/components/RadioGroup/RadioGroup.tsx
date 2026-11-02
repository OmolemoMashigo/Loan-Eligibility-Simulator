import { type ComponentProps, type ReactNode } from 'react';
import {
  describedById,
  fieldErrorId,
  fieldHintId,
} from '@/components/Field/ids';
import fieldStyles from '@/components/Field/Field.module.css';
import styles from './RadioGroup.module.css';

export type RadioOption = {
  value: string;
  label: string;
  /** Decoration shown before the label. It is hidden from assistive tech. */
  icon?: ReactNode;
};

export type RadioGroupProps = {
  name: string;
  legend: string;
  options: readonly RadioOption[];
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  value?: string;
  defaultValue?: string;
  onChange?: ComponentProps<'input'>['onChange'];
  onBlur?: ComponentProps<'input'>['onBlur'];
};

export function RadioGroup({
  name,
  legend,
  options,
  hint,
  error,
  required,
  disabled,
  value,
  defaultValue,
  onChange,
  onBlur,
}: RadioGroupProps) {
  const describedBy = describedById(name, { hint, error });

  return (
    <fieldset
      className={styles.fieldset}
      aria-describedby={describedBy}
      aria-invalid={Boolean(error)}
      disabled={disabled}
    >
      <legend className={styles.legend}>
        {legend}
        {required ? (
          <span className={fieldStyles.required} aria-hidden="true">
            {' '}
            *
          </span>
        ) : null}
      </legend>
      {hint ? (
        <p className={fieldStyles.hint} id={fieldHintId(name)}>
          {hint}
        </p>
      ) : null}
      <div className={styles.options}>
        {options.map((option) => {
          const optionId = `${name}-${option.value}`;
          const checkedProps =
            value !== undefined
              ? { checked: value === option.value }
              : defaultValue !== undefined
                ? { defaultChecked: defaultValue === option.value }
                : {};

          return (
            <label
              key={option.value}
              className={styles.option}
              htmlFor={optionId}
            >
              <input
                id={optionId}
                className={styles.input}
                type="radio"
                name={name}
                value={option.value}
                required={required}
                onChange={onChange}
                onBlur={onBlur}
                {...checkedProps}
              />
              {option.icon ? (
                <span className={styles.icon} aria-hidden="true">
                  {option.icon}
                </span>
              ) : null}
              {option.label}
            </label>
          );
        })}
      </div>
      {error ? (
        <p className={fieldStyles.error} id={fieldErrorId(name)} role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
