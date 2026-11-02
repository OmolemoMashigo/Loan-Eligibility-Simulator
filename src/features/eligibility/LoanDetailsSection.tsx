import { Controller, useFormContext } from 'react-hook-form';
import { CurrencyField } from '@/components/CurrencyField/CurrencyField';
import { NumberField } from '@/components/NumberField/NumberField';
import { RadioGroup } from '@/components/RadioGroup/RadioGroup';
import { formatMonthDuration } from '@/lib/format';
import styles from './EligibilityForm.module.css';
import { parseNumericInput } from './buildFormSchema';
import type { FormFieldMeta } from './buildFormSchema';
import type { EligibilityFormValues } from './formDefaults';
import { loanPurposeOptions } from './labels';
import { loanAmountHint, loanTermHint } from './loanHints';
import { LoanPurposeIcon } from './LoanPurposeIcon';

export type LoanDetailsSectionProps = {
  meta: FormFieldMeta;
  productName: string;
};

export function LoanDetailsSection({
  meta,
  productName,
}: LoanDetailsSectionProps) {
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = useFormContext<EligibilityFormValues>();

  const { requestedAmount, loanTerm, loanPurpose } = meta.loanDetails;
  const parsedTerm = parseNumericInput(watch('loanDetails.loanTerm'));
  const termEcho =
    parsedTerm !== undefined && Number.isInteger(parsedTerm) && parsedTerm > 0
      ? formatMonthDuration(parsedTerm)
      : undefined;
  const amountHint = loanAmountHint(requestedAmount);
  const termHint = loanTermHint(loanTerm);

  return (
    <section className={styles.section} aria-labelledby="loan-details-heading">
      <h2 className={styles.heading} id="loan-details-heading">
        Loan details
      </h2>
      <div className={styles.fields}>
        <p className={styles.product}>
          <span className={styles.productLabel}>Loan type</span>
          <span className={styles.productName}>{productName}</span>
        </p>
        <CurrencyField
          id="loanDetails-requestedAmount"
          label="Amount you want to borrow"
          hint={amountHint}
          error={errors.loanDetails?.requestedAmount?.message}
          required={requestedAmount.required}
          {...register('loanDetails.requestedAmount')}
        />
        <div>
          <NumberField
            id="loanDetails-loanTerm"
            label="Repayment period"
            hint={termHint}
            error={errors.loanDetails?.loanTerm?.message}
            required={loanTerm.required}
            {...register('loanDetails.loanTerm')}
          />
          {termEcho ? (
            <p className={styles.echo} aria-live="polite">
              {termEcho}
            </p>
          ) : null}
        </div>
        <Controller
          name="loanDetails.loanPurpose"
          control={control}
          render={({ field, fieldState }) => (
            <RadioGroup
              name={field.name}
              legend="What is the loan for?"
              options={loanPurposeOptions(loanPurpose.options).map(
                (option) => ({
                  ...option,
                  icon: <LoanPurposeIcon purpose={option.value} />,
                }),
              )}
              required={loanPurpose.required}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          )}
        />
      </div>
    </section>
  );
}
