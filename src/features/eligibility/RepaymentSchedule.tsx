import { useId, useState } from 'react';
import type { CalculateRateResponse } from '@/api';
import { Alert } from '@/components/Alert/Alert';
import { LoadingBlock } from '@/components/LoadingBlock/LoadingBlock';
import { cx } from '@/components/cx';
import { formatWholeRand } from '@/lib/format';
import { BalanceChart } from './BalanceChart';
import resultStyles from './EligibilityResult.module.css';
import styles from './RepaymentSchedule.module.css';

export type ScheduleRow = CalculateRateResponse['paymentSchedule'][number];

/** How many months show before "Show all". */
export const INITIAL_SCHEDULE_ROWS = 6;

export type RepaymentScheduleProps =
  | { status: 'loading' }
  | { status: 'error'; message: string; onRetry: () => void }
  | {
      status: 'ready';
      schedule: readonly ScheduleRow[];
      /** The amount the schedule repays, for the table caption. */
      loanAmount: number;
      /** A newer schedule is loading; this one is the last good one. */
      updating?: boolean;
    };

export function RepaymentSchedule(props: RepaymentScheduleProps) {
  const updating = props.status === 'ready' && props.updating === true;

  return (
    <div
      className={cx(resultStyles.figures, updating && styles.updating)}
      aria-busy={updating || undefined}
    >
      <h2 className={resultStyles.heading}>Repayment schedule</h2>
      {props.status === 'loading' ? (
        <LoadingBlock label="Loading your repayment schedule" />
      ) : props.status === 'error' ? (
        <Alert tone="danger" title="We could not load the repayment schedule">
          <p>{props.message}</p>
          <button
            className={styles.toggle}
            type="button"
            onClick={props.onRetry}
          >
            Try again
          </button>
        </Alert>
      ) : (
        <ScheduleTable
          schedule={props.schedule}
          loanAmount={props.loanAmount}
        />
      )}
    </div>
  );
}

function ScheduleTable({
  schedule,
  loanAmount,
}: {
  schedule: readonly ScheduleRow[];
  loanAmount: number;
}) {
  const tableId = useId();
  const [expanded, setExpanded] = useState(false);
  const canCollapse = schedule.length > INITIAL_SCHEDULE_ROWS;
  const rows =
    expanded || !canCollapse
      ? schedule
      : schedule.slice(0, INITIAL_SCHEDULE_ROWS);

  return (
    <>
      <BalanceChart
        loanAmount={loanAmount}
        balances={schedule.map((row) => row.balance)}
      />
      <table id={tableId} className={styles.table}>
        <caption className={styles.caption}>
          Monthly payments on {formatWholeRand(loanAmount)} over{' '}
          {schedule.length} months
        </caption>
        <thead className={styles.head}>
          <tr>
            <th scope="col">Month</th>
            <th scope="col">Payment</th>
            <th scope="col">Principal</th>
            <th scope="col">Interest</th>
            <th scope="col">Balance</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.month} className={styles.row}>
              <th scope="row" data-label="Month" className={styles.cell}>
                {row.month}
              </th>
              <td data-label="Payment" className={styles.cell}>
                {formatWholeRand(row.payment)}
              </td>
              <td data-label="Principal" className={styles.cell}>
                {formatWholeRand(row.principal)}
              </td>
              <td data-label="Interest" className={styles.cell}>
                {formatWholeRand(row.interest)}
              </td>
              <td data-label="Balance" className={styles.cell}>
                {formatWholeRand(row.balance)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {canCollapse ? (
        <div className={styles.footer}>
          <p className={styles.count}>
            {expanded
              ? `Showing all ${schedule.length} months.`
              : `Showing the first ${INITIAL_SCHEDULE_ROWS} of ${schedule.length} months.`}
          </p>
          <button
            className={styles.toggle}
            type="button"
            aria-expanded={expanded}
            aria-controls={tableId}
            onClick={() => {
              setExpanded((value) => !value);
            }}
          >
            {expanded
              ? 'Show fewer months'
              : `Show all ${schedule.length} months`}
          </button>
        </div>
      ) : null}
    </>
  );
}
