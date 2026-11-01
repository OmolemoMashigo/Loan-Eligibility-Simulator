import type { EligibilityResponse } from '@/api';
import { Alert } from '@/components/Alert/Alert';
import {
  formatMonthDuration,
  formatPercent,
  formatWholeRand,
} from '@/lib/format';
import { AffordabilityBreakdown } from './AffordabilityBreakdown';
import styles from './EligibilityResult.module.css';
import { riskCategoryLabel } from './labels';
import { ResultFigure } from './ResultFigure';

export type EligibilityResultProps = {
  response: EligibilityResponse;
  /** The repayment period the user asked for, in months. */
  loanTerm: number;
};

export function EligibilityResult({
  response,
  loanTerm,
}: EligibilityResultProps) {
  const { eligibilityResult: result, recommendedLoan: loan } = response;
  const hasFigures = loan.recommendedAmount > 0;

  return (
    <section className={styles.result} aria-label="Eligibility result">
      <Alert
        ref={focusOnMount}
        tone={result.isEligible ? 'success' : 'warning'}
        live="polite"
        title={
          result.isEligible
            ? 'You are likely eligible for this loan'
            : 'You are unlikely to be eligible for this loan as requested'
        }
      >
        <p>{result.decisionReason}</p>
        <dl className={styles.facts}>
          <div className={styles.fact}>
            <dt>Approval likelihood</dt>
            <dd>{formatPercent(result.approvalLikelihood)}</dd>
          </div>
          <div className={styles.fact}>
            <dt>Risk level</dt>
            <dd>{riskCategoryLabel(result.riskCategory)}</dd>
          </div>
        </dl>
      </Alert>
      <div className={styles.figures}>
        <h2 className={styles.heading}>
          {result.isEligible ? 'Your estimate' : 'What would fit your budget'}
        </h2>
        {hasFigures ? (
          <dl className={styles.list}>
            <ResultFigure
              label="Recommended amount"
              value={formatWholeRand(loan.recommendedAmount)}
            />
            <ResultFigure
              label="Maximum affordable amount"
              value={formatWholeRand(loan.maxAmount)}
            />
            <ResultFigure
              label="Interest rate"
              value={`${formatPercent(loan.interestRate)} a year`}
            />
            <ResultFigure
              label="Repayment period"
              value={formatMonthDuration(loanTerm)}
            />
            <ResultFigure
              label="Monthly repayment"
              value={formatWholeRand(loan.monthlyPayment)}
            />
            <ResultFigure
              label="Total repayment"
              value={formatWholeRand(loan.totalRepayment)}
            />
          </dl>
        ) : (
          <p className={styles.note}>
            We could not find a loan amount that fits your budget over this
            repayment period.
          </p>
        )}
      </div>
      <AffordabilityBreakdown analysis={response.affordabilityAnalysis} />
    </section>
  );
}

// Moves focus to the banner so the result is announced and found by keyboard.
function focusOnMount(node: HTMLDivElement | null) {
  node?.focus();
}
