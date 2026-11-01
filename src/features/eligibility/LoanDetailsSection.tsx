import { useFormContext } from 'react-hook-form';
import { CurrencyField } from '@/components/CurrencyField/CurrencyField';
import { NumberField } from '@/components/NumberField/NumberField';
import { SelectField } from '@/components/SelectField/SelectField';
import { formatMonthDuration, formatWholeRand } from '@/lib/format';
import styles from './EligibilityForm.module.css';
import { parseNumericInput } from './buildFormSchema';
import type { FormFieldMeta } from './buildFormSchema';
import type { EligibilityFormValues } from './formDefaults';
import { loanPurposeOptions } from './labels';

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
    watch,
    formState: { errors },
  } = useFormContext<EligibilityFormValues>();

  const { requestedAmount, loanTerm, loanPurpose } = meta.loanDetails;
  const parsedTerm = parseNumericInput(watch('loanDetails.loanTerm'));
  const termEcho =
    parsedTerm !== undefined && Number.isInteger(parsedTerm) && parsedTerm > 0
      ? formatMonthDuration(parsedTerm)
      : undefined;
  const amountHint =
    requestedAmount.min !== undefined && requestedAmount.max !== undefined
      ? `Between ${formatWholeRand(requestedAmount.min)} and ${formatWholeRand(requestedAmount.max)}`
      : undefined;
  const termHint =
    loanTerm.min !== undefined && loanTerm.max !== undefined
      ? `In months, between ${loanTerm.min} and ${loanTerm.max}`
      : 'In months';

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
        <SelectField
          id="loanDetails-loanPurpose"
          label="What is the loan for?"
          placeholder="Select a purpose"
          options={loanPurposeOptions(loanPurpose.options)}
          error={errors.loanDetails?.loanPurpose?.message}
          required={loanPurpose.required}
          {...register('loanDetails.loanPurpose')}
        />
      </div>
    </section>
  );
}
