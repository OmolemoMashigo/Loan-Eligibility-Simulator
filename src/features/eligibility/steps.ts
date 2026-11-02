import type { Path } from 'react-hook-form';
import type { EligibilityFormValues } from './formDefaults';

export type FormStep = {
  id: 'loan' | 'personal' | 'money';
  /** Shown on the step bar, and used as the step's heading. */
  label: string;
  /** The fields on this step, in the order they appear. */
  fields: readonly Path<EligibilityFormValues>[];
};

/** The form is filled in one step at a time, in this order. */
export const FORM_STEPS: readonly FormStep[] = [
  {
    id: 'loan',
    label: 'Loan details',
    fields: [
      'loanDetails.requestedAmount',
      'loanDetails.loanTerm',
      'loanDetails.loanPurpose',
    ],
  },
  {
    id: 'personal',
    label: 'Personal details',
    fields: [
      'personalInfo.age',
      'personalInfo.employmentStatus',
      'personalInfo.employmentDuration',
    ],
  },
  {
    id: 'money',
    label: 'Results',
    fields: [
      'financialInfo.monthlyIncome',
      'financialInfo.monthlyExpenses',
      'financialInfo.existingDebt',
      'financialInfo.creditScore',
    ],
  },
];

export const LAST_STEP = FORM_STEPS.length - 1;

/** Which step a field is on. Falls back to the first step for an unknown path. */
export function stepIndexOfPath(path: string): number {
  const index = FORM_STEPS.findIndex((step) =>
    (step.fields as readonly string[]).includes(path),
  );

  return index === -1 ? 0 : index;
}
