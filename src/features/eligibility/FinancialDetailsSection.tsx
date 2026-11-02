import { useFormContext } from 'react-hook-form';
import { CurrencyField } from '@/components/CurrencyField/CurrencyField';
import { NumberField } from '@/components/NumberField/NumberField';
import { formatWholeRand } from '@/lib/format';
import styles from './EligibilityForm.module.css';
import type { FormFieldMeta } from './buildFormSchema';
import type { EligibilityFormValues } from './formDefaults';

export type FinancialDetailsSectionProps = {
  meta: FormFieldMeta;
};

export function FinancialDetailsSection({
  meta,
}: FinancialDetailsSectionProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<EligibilityFormValues>();

  const { monthlyIncome, monthlyExpenses, existingDebt, creditScore } =
    meta.financialInfo;
  const incomeHint =
    monthlyIncome.min !== undefined
      ? `At least ${formatWholeRand(monthlyIncome.min)} a month`
      : undefined;
  const creditScoreRange =
    creditScore.min !== undefined && creditScore.max !== undefined
      ? `Between ${creditScore.min} and ${creditScore.max}. `
      : '';

  return (
    <section
      className={styles.section}
      aria-labelledby="financial-details-heading"
    >
      <h2 className={styles.heading} id="financial-details-heading">
        Results
      </h2>
      <div className={styles.fields}>
        <CurrencyField
          id="financialInfo-monthlyIncome"
          label="Monthly income"
          hint={incomeHint}
          error={errors.financialInfo?.monthlyIncome?.message}
          required={monthlyIncome.required}
          {...register('financialInfo.monthlyIncome')}
        />
        <CurrencyField
          id="financialInfo-monthlyExpenses"
          label="Monthly expenses"
          hint="Rent, transport, groceries and other regular costs"
          error={errors.financialInfo?.monthlyExpenses?.message}
          required={monthlyExpenses.required}
          {...register('financialInfo.monthlyExpenses')}
        />
        <CurrencyField
          id="financialInfo-existingDebt"
          label="Total existing debt (outstanding balance)"
          hint="What you still owe on loans and credit cards. Use 0 if you have none."
          error={errors.financialInfo?.existingDebt?.message}
          required={existingDebt.required}
          {...register('financialInfo.existingDebt')}
        />
        <NumberField
          id="financialInfo-creditScore"
          label={
            creditScore.required ? 'Credit score' : 'Credit score (optional)'
          }
          hint={`${creditScoreRange}Leave blank if you do not know it.`}
          error={errors.financialInfo?.creditScore?.message}
          required={creditScore.required}
          {...register('financialInfo.creditScore')}
        />
      </div>
    </section>
  );
}
