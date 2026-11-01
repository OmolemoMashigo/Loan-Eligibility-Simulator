import type { FieldErrors } from 'react-hook-form';

export type ErrorSummaryItem = {
  path: string;
  label: string;
  message: string;
};

/** Form order. The summary lists problems in the order the user sees fields. */
const FIELD_LABELS: readonly { path: string; label: string }[] = [
  { path: 'personalInfo.age', label: 'Age' },
  { path: 'personalInfo.employmentStatus', label: 'Employment status' },
  {
    path: 'personalInfo.employmentDuration',
    label: 'Time in current employment',
  },
  { path: 'financialInfo.monthlyIncome', label: 'Monthly income' },
  { path: 'financialInfo.monthlyExpenses', label: 'Monthly expenses' },
  {
    path: 'financialInfo.existingDebt',
    label: 'Total existing debt (outstanding balance)',
  },
  { path: 'financialInfo.creditScore', label: 'Credit score' },
  { path: 'loanDetails.requestedAmount', label: 'Amount you want to borrow' },
  { path: 'loanDetails.loanTerm', label: 'Repayment period' },
  { path: 'loanDetails.loanPurpose', label: 'What is the loan for?' },
];

export function isFormFieldPath(path: string): boolean {
  return FIELD_LABELS.some((field) => field.path === path);
}

/** Keeps only the form's own fields, in form order. */
export function summariseFieldMessages(
  messages: Readonly<Record<string, string>>,
): ErrorSummaryItem[] {
  return FIELD_LABELS.flatMap(({ path, label }) => {
    const message = messages[path];

    return message === undefined ? [] : [{ path, label, message }];
  });
}

export function summariseFormErrors(errors: FieldErrors): ErrorSummaryItem[] {
  const messages: Record<string, string> = {};

  collectMessages(errors, [], messages);

  return summariseFieldMessages(messages);
}

function collectMessages(
  node: unknown,
  path: readonly string[],
  messages: Record<string, string>,
): void {
  if (typeof node !== 'object' || node === null) {
    return;
  }

  const entry = node as Record<string, unknown>;

  if (typeof entry['message'] === 'string' && entry['message'].length > 0) {
    messages[path.join('.')] = entry['message'];
    return;
  }

  for (const [key, child] of Object.entries(entry)) {
    // `ref` points at a DOM element and is never a nested field.
    if (key !== 'ref') {
      collectMessages(child, [...path, key], messages);
    }
  }
}
