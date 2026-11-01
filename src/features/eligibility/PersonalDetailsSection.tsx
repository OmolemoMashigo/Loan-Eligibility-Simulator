import { Controller, useFormContext } from 'react-hook-form';
import { NumberField } from '@/components/NumberField/NumberField';
import { RadioGroup } from '@/components/RadioGroup/RadioGroup';
import { formatMonthDuration } from '@/lib/format';
import styles from './EligibilityForm.module.css';
import { parseNumericInput } from './buildFormSchema';
import type { FormFieldMeta } from './buildFormSchema';
import type { EligibilityFormValues } from './formDefaults';
import { requiresEmploymentDuration } from './formDefaults';
import { employmentStatusOptions } from './labels';

export type PersonalDetailsSectionProps = {
  meta: FormFieldMeta;
};

export function PersonalDetailsSection({ meta }: PersonalDetailsSectionProps) {
  const {
    register,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<EligibilityFormValues>();

  const employmentStatus = watch('personalInfo.employmentStatus');
  const durationValue = watch('personalInfo.employmentDuration');
  const showDuration = requiresEmploymentDuration(employmentStatus);
  const parsedDuration = parseNumericInput(durationValue);
  const durationEcho =
    parsedDuration !== undefined &&
    Number.isInteger(parsedDuration) &&
    parsedDuration > 0
      ? formatMonthDuration(parsedDuration)
      : undefined;
  const ageHint =
    meta.personalInfo.age.min !== undefined &&
    meta.personalInfo.age.max !== undefined
      ? `Between ${meta.personalInfo.age.min} and ${meta.personalInfo.age.max}`
      : undefined;

  return (
    <section
      className={styles.section}
      aria-labelledby="personal-details-heading"
    >
      <h2 className={styles.heading} id="personal-details-heading">
        Personal details
      </h2>
      <div className={styles.fields}>
        <NumberField
          id="personalInfo-age"
          label="Age"
          hint={ageHint}
          error={errors.personalInfo?.age?.message}
          required={meta.personalInfo.age.required}
          {...register('personalInfo.age')}
        />
        <Controller
          name="personalInfo.employmentStatus"
          control={control}
          render={({ field, fieldState }) => (
            <RadioGroup
              name={field.name}
              legend="Employment status"
              options={employmentStatusOptions(
                meta.personalInfo.employmentStatus.options,
              )}
              required={meta.personalInfo.employmentStatus.required}
              value={field.value}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              onChange={(event) => {
                field.onChange(event);

                if (!requiresEmploymentDuration(event.target.value)) {
                  setValue('personalInfo.employmentDuration', '');
                }
              }}
            />
          )}
        />
        {employmentStatus === 'unemployed' ? (
          <p className={styles.notice} role="status">
            You can still get an estimate from the income you declare. Time in
            employment is not needed.
          </p>
        ) : null}
        {showDuration ? (
          <div>
            <NumberField
              id="personalInfo-employmentDuration"
              label="Time in current employment"
              hint="In months"
              error={errors.personalInfo?.employmentDuration?.message}
              required
              {...register('personalInfo.employmentDuration')}
            />
            {durationEcho ? (
              <p className={styles.echo} aria-live="polite">
                {durationEcho}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
