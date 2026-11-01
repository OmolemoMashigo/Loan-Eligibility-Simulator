import { formatWholeRand } from '@/lib/format';
import styles from './DeclineNextSteps.module.css';
import resultStyles from './EligibilityResult.module.css';

export type DeclineNextStepsProps = {
  /** The most the engine found affordable over the requested period. */
  maxAmount: number;
  requestedAmount: number;
  /** The repayment period asked for, in months. */
  loanTerm: number;
  /** The longest repayment period allowed, in months, when known. */
  maxTerm: number | undefined;
  disposableIncome: number;
  onEditDetails: () => void;
};

function months(count: number): string {
  return count === 1 ? '1 month' : `${count} months`;
}

/** What to try after a decline: a lower amount, a longer period, or new details. */
export function DeclineNextSteps({
  maxAmount,
  requestedAmount,
  loanTerm,
  maxTerm,
  disposableIncome,
  onEditDetails,
}: DeclineNextStepsProps) {
  // With nothing left after expenses, no amount or period can change the result.
  const canBeChanged = disposableIncome > 0;
  const lowerAmount =
    canBeChanged && maxAmount > 0 && maxAmount < requestedAmount;
  const longerTerm =
    canBeChanged && (maxTerm === undefined || loanTerm < maxTerm);

  return (
    <div className={resultStyles.figures}>
      <h2 className={resultStyles.heading}>What you can try</h2>
      {lowerAmount || longerTerm ? (
        <ul className={styles.list}>
          {lowerAmount ? (
            <li>
              Borrow <strong>{formatWholeRand(maxAmount)}</strong> or less. That
              is the most that fits your budget over {months(loanTerm)}.
            </li>
          ) : null}
          {longerTerm ? (
            <li>
              Choose a longer repayment period
              {maxTerm === undefined ? '' : `, up to ${months(maxTerm)}`}.
              Spreading the loan out lowers each monthly repayment.
            </li>
          ) : null}
        </ul>
      ) : (
        <p className={styles.note}>
          {canBeChanged
            ? 'Check that the details you entered are right.'
            : 'Your monthly expenses leave no income to repay a loan, so a different amount or period would not change this. Check the income and expenses you entered.'}
        </p>
      )}
      <p className={styles.note}>
        {canBeChanged
          ? 'Try a new amount or period below, or go back and change your details.'
          : 'You can go back and change your details.'}
      </p>
      <button className={styles.edit} type="button" onClick={onEditDetails}>
        Edit details
      </button>
    </div>
  );
}
