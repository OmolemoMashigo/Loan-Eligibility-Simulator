import type { ReactNode } from 'react';
import type { EligibilityResponse } from '@/api';
import { Alert } from '@/components/Alert/Alert';
import { cx } from '@/components/cx';
import {
  formatMonthDuration,
  formatPercent,
  formatWholeRand,
} from '@/lib/format';
import { AffordabilityBreakdown } from './AffordabilityBreakdown';
import styles from './EligibilityResult.module.css';
import { riskCategoryLabel } from './labels';
import { LikelihoodRing } from './LikelihoodRing';
import { ResultFigure, type FigureTone } from './ResultFigure';

export type EligibilityResultProps = {
  response: EligibilityResponse;
  /** The repayment period the user asked for, in months. */
  loanTerm: number;
  /** No credit score was given, so the estimate used the unknown-score rate. */
  creditScoreMissing?: boolean;
  /** A card shown straight after the estimate, with what to try next. */
  nextSteps?: ReactNode;
  /** A card shown after the next steps, for changing the loan. */
  adjust?: ReactNode;
  /** A newer result is loading; this one is the last good one. */
  updating?: boolean;
  /** Extra cards shown after the affordability breakdown. */
  children?: ReactNode;
};

const RISK_TONE: Record<
  EligibilityResponse['eligibilityResult']['riskCategory'],
  FigureTone
> = {
  low: 'success',
  medium: 'warning',
  high: 'danger',
};

export function EligibilityResult({
  response,
  loanTerm,
  creditScoreMissing = false,
  nextSteps,
  adjust,
  updating = false,
  children,
}: EligibilityResultProps) {
  const { eligibilityResult: result, recommendedLoan: loan } = response;
  const hasFigures = loan.recommendedAmount > 0;

  return (
    <section
      className={styles.result}
      aria-label="Eligibility result"
      aria-busy={updating || undefined}
    >
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
        <div className={styles.summary}>
          <LikelihoodRing
            percent={result.approvalLikelihood}
            tone={result.isEligible ? 'success' : 'warning'}
          />
          <dl className={styles.facts}>
            <div className={styles.fact}>
              <dt>Approval likelihood</dt>
              <dd className={styles.factValue}>
                {formatPercent(result.approvalLikelihood)}
              </dd>
            </div>
            <div className={styles.fact}>
              <dt>Risk level</dt>
              <dd
                className={cx(
                  styles.pill,
                  styles[RISK_TONE[result.riskCategory]],
                )}
              >
                {riskCategoryLabel(result.riskCategory)}
              </dd>
            </div>
          </dl>
        </div>
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
              highlight
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
              highlight
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
        {creditScoreMissing ? (
          <p className={styles.note}>
            Add your credit score for a more accurate estimate.
          </p>
        ) : null}
      </div>
      {nextSteps}
      {adjust}
      <AffordabilityBreakdown analysis={response.affordabilityAnalysis} />
      {children}
    </section>
  );
}

// Moves focus to the banner so the result is announced and found by keyboard.
function focusOnMount(node: HTMLDivElement | null) {
  node?.focus();
}
