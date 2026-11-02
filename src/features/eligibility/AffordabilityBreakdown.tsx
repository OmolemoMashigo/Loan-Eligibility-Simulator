import type { EligibilityResponse } from '@/api';
import { formatPercent, formatWholeRand } from '@/lib/format';
import styles from './EligibilityResult.module.css';
import { affordabilityScoreLabel } from './labels';
import { ResultFigure, type FigureTone } from './ResultFigure';

export type AffordabilityBreakdownProps = {
  analysis: EligibilityResponse['affordabilityAnalysis'];
};

const SCORE_TONE: Record<
  EligibilityResponse['affordabilityAnalysis']['affordabilityScore'],
  FigureTone
> = {
  excellent: 'success',
  good: 'success',
  fair: 'warning',
  poor: 'danger',
};

export function AffordabilityBreakdown({
  analysis,
}: AffordabilityBreakdownProps) {
  return (
    <div className={styles.figures}>
      <h2 className={styles.heading}>Your affordability</h2>
      <dl className={styles.list}>
        <ResultFigure
          label="Disposable income"
          value={formatWholeRand(analysis.disposableIncome)}
          hint="What is left each month after your expenses."
        />
        <ResultFigure
          label="Debt-to-income ratio"
          value={formatPercent(analysis.debtToIncomeRatio)}
          hint="Your existing debt as a percentage of your monthly income."
        />
        <ResultFigure
          label="Loan-to-income ratio"
          value={formatPercent(analysis.loanToIncomeRatio)}
          hint="The amount you asked for as a percentage of your yearly income."
        />
        <ResultFigure
          label="Affordability rating"
          value={affordabilityScoreLabel(analysis.affordabilityScore)}
          tone={SCORE_TONE[analysis.affordabilityScore]}
          hint="How comfortably the repayment on the amount you asked for fits into your disposable income."
        />
      </dl>
    </div>
  );
}
