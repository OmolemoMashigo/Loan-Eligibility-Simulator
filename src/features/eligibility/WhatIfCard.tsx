import { useEffect, useRef, useState } from 'react';
import type { EligibilityRequest } from '@/api';
import { Alert } from '@/components/Alert/Alert';
import { CurrencyField } from '@/components/CurrencyField/CurrencyField';
import { NumberField } from '@/components/NumberField/NumberField';
import type { EligibilityFormSchema, FormFieldMeta } from './buildFormSchema';
import resultStyles from './EligibilityResult.module.css';
import { loanAmountHint, loanTermHint } from './loanHints';
import styles from './WhatIfCard.module.css';
import { parseWhatIf, sameLoan, type WhatIfInput } from './whatIf';

/** How long typing must pause before the result is recalculated. */
export const WHAT_IF_DEBOUNCE_MS = 500;

export type WhatIfCardProps = {
  schema: EligibilityFormSchema;
  rules: FormFieldMeta['loanDetails'];
  /** The request the fields start from. */
  request: EligibilityRequest;
  /** A recalculation is running; the result above is the last good one. */
  updating: boolean;
  /** Why the last recalculation failed, if it did. */
  failure?: string | undefined;
  onRecalculate: (request: EligibilityRequest) => void;
  onRetry: () => void;
};

export function WhatIfCard({
  schema,
  rules,
  request,
  updating,
  failure,
  onRecalculate,
  onRetry,
}: WhatIfCardProps) {
  const [draft, setDraft] = useState<WhatIfInput>(() => ({
    amount: String(request.loanDetails.requestedAmount),
    term: String(request.loanDetails.loanTerm),
  }));
  // What the user left alone for a moment. Errors show for this, not mid-typing.
  const [settled, setSettled] = useState(draft);
  const lastSent = useRef(request);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    return () => {
      clearTimeout(timer.current);
    };
  }, []);

  function settle(input: WhatIfInput) {
    setSettled(input);

    const parsed = parseWhatIf(schema, request, input);

    if (parsed.ok && !sameLoan(parsed.request, lastSent.current)) {
      lastSent.current = parsed.request;
      onRecalculate(parsed.request);
    }
  }

  function change(input: WhatIfInput) {
    setDraft(input);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      settle(input);
    }, WHAT_IF_DEBOUNCE_MS);
  }

  const parsed = parseWhatIf(schema, request, settled);
  const showErrors =
    draft.amount === settled.amount && draft.term === settled.term;
  const errors = showErrors && !parsed.ok ? parsed.errors : {};

  return (
    <div className={resultStyles.figures}>
      <h2 className={resultStyles.heading}>Try a different amount or period</h2>
      <p className={styles.intro}>
        Change either value and your result updates. The details you entered
        above stay as they are.
      </p>
      <div className={styles.fields}>
        <CurrencyField
          id="whatIf-amount"
          label="Loan amount"
          hint={loanAmountHint(rules.requestedAmount)}
          error={errors.amount}
          required={rules.requestedAmount.required}
          value={draft.amount}
          onChange={(event) => {
            change({ ...draft, amount: event.target.value });
          }}
        />
        <NumberField
          id="whatIf-term"
          label="Repayment period (months)"
          hint={loanTermHint(rules.loanTerm)}
          error={errors.term}
          required={rules.loanTerm.required}
          value={draft.term}
          onChange={(event) => {
            change({ ...draft, term: event.target.value });
          }}
        />
      </div>
      <p className={styles.status} role="status">
        {updating ? 'Updating your results…' : ''}
      </p>
      {failure ? (
        <Alert tone="danger" title="We could not update your results">
          <p>{failure}</p>
          <button className={styles.retry} type="button" onClick={onRetry}>
            Try again
          </button>
        </Alert>
      ) : null}
    </div>
  );
}
