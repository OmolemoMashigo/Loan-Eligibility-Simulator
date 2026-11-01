import { CurrencyField } from '@/components/CurrencyField/CurrencyField';
import { NumberField } from '@/components/NumberField/NumberField';
import { RadioGroup } from '@/components/RadioGroup/RadioGroup';
import { SelectField } from '@/components/SelectField/SelectField';
import { TextField } from '@/components/TextField/TextField';
import styles from './ControlPreview.module.css';

const purposes = [
  { value: 'home_improvement', label: 'Home improvement' },
  { value: 'debt_consolidation', label: 'Debt consolidation' },
  { value: 'education', label: 'Education' },
] as const;

const employmentStatuses = [
  { value: 'employed', label: 'Employed' },
  { value: 'self_employed', label: 'Self-employed' },
  { value: 'unemployed', label: 'Unemployed' },
  { value: 'retired', label: 'Retired' },
] as const;

export function ControlPreview() {
  return (
    <form className={styles.form} aria-label="Sample form controls">
      <h2 className={styles.title}>Sample form controls</h2>
      <TextField
        id="preview-name"
        name="fullName"
        label="Full name"
        hint="This control will not be on the eligibility form."
      />
      <NumberField
        id="preview-age"
        name="age"
        label="Age"
        hint="Whole years, from 18 to 65."
      />
      <CurrencyField
        id="preview-income"
        name="monthlyIncome"
        label="Monthly income"
        hint="Enter the amount in rands."
      />
      <SelectField
        id="preview-purpose"
        name="loanPurpose"
        label="Loan purpose"
        placeholder="Select a purpose"
        options={purposes}
      />
      <RadioGroup
        name="employmentStatus"
        legend="Employment status"
        options={employmentStatuses}
      />
      <TextField
        id="preview-error"
        name="errorExample"
        label="Field with an error"
        error="This is how a field error will look."
        required
      />
    </form>
  );
}
