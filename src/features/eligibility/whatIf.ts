import type { EligibilityRequest } from '@/api';
import { formFieldErrors, type EligibilityFormSchema } from './buildFormSchema';
import { eligibilityFormValuesFromRequest } from './formDefaults';

/** What the user typed into the what-if fields. */
export type WhatIfInput = { amount: string; term: string };

export type WhatIfParse =
  | { ok: true; request: EligibilityRequest }
  | {
      ok: false;
      errors: { amount?: string | undefined; term?: string | undefined };
    };

/**
 * Checks a changed amount and term with the same schema and messages as the
 * form, and builds the full request for them. Everything else in the request
 * stays as it was submitted.
 */
export function parseWhatIf(
  schema: EligibilityFormSchema,
  base: EligibilityRequest,
  input: WhatIfInput,
): WhatIfParse {
  const values = eligibilityFormValuesFromRequest(base);
  const result = schema.safeParse({
    ...values,
    loanDetails: {
      ...values.loanDetails,
      requestedAmount: input.amount,
      loanTerm: input.term,
    },
  });

  if (result.success) {
    return { ok: true, request: result.data };
  }

  const errors = formFieldErrors(result.error);

  return {
    ok: false,
    errors: {
      amount: errors['loanDetails.requestedAmount'],
      term: errors['loanDetails.loanTerm'],
    },
  };
}

/** True when two requests ask for the same amount and term. */
export function sameLoan(a: EligibilityRequest, b: EligibilityRequest) {
  return (
    a.loanDetails.requestedAmount === b.loanDetails.requestedAmount &&
    a.loanDetails.loanTerm === b.loanDetails.loanTerm
  );
}
