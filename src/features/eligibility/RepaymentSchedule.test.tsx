import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { calculateAmortisationSchedule } from '@/mocks/engine';
import {
  INITIAL_SCHEDULE_ROWS,
  RepaymentSchedule,
  type ScheduleRow,
} from './RepaymentSchedule';

function scheduleOf(months: number): ScheduleRow[] {
  return calculateAmortisationSchedule({
    principal: 150_000,
    annualRatePercent: 12.5,
    termMonths: months,
  }).paymentSchedule;
}

describe('RepaymentSchedule', () => {
  afterEach(cleanup);

  it('announces that the schedule is loading', () => {
    render(<RepaymentSchedule status="loading" />);

    expect(
      screen.getByRole('heading', { level: 2, name: 'Repayment schedule' }),
    ).toBeVisible();
    expect(
      screen.getByRole('status', { name: 'Loading your repayment schedule' }),
    ).toBeInTheDocument();
  });

  it('explains a failure and lets the user try again', async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();

    render(
      <RepaymentSchedule
        status="error"
        message="Something went wrong. Please try again."
        onRetry={onRetry}
      />,
    );

    const alert = screen.getByRole('alert', {
      name: /could not load the repayment schedule/i,
    });

    expect(alert).toHaveTextContent('Something went wrong. Please try again.');

    await user.click(within(alert).getByRole('button', { name: 'Try again' }));

    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('shows the first rows with every column labelled, then all of them', async () => {
    const user = userEvent.setup();

    render(
      <RepaymentSchedule
        status="ready"
        schedule={scheduleOf(24)}
        loanAmount={150_000}
      />,
    );

    const table = screen.getByRole('table', {
      name: /monthly payments on r\s150\s000 over 24 months/i,
    });

    for (const heading of [
      'Month',
      'Payment',
      'Principal',
      'Interest',
      'Balance',
    ]) {
      expect(
        within(table).getByRole('columnheader', { name: heading }),
      ).toBeInTheDocument();
    }

    expect(within(table).getAllByRole('row')).toHaveLength(
      1 + INITIAL_SCHEDULE_ROWS,
    );
    expect(screen.getByText('Showing the first 6 of 24 months.')).toBeVisible();

    const toggle = screen.getByRole('button', { name: 'Show all 24 months' });

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveAttribute('aria-controls', table.id);

    await user.click(toggle);

    expect(within(table).getAllByRole('row')).toHaveLength(1 + 24);
    expect(screen.getByText('Showing all 24 months.')).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Show fewer months' }),
    ).toHaveAttribute('aria-expanded', 'true');

    await user.click(screen.getByRole('button', { name: 'Show fewer months' }));

    expect(within(table).getAllByRole('row')).toHaveLength(
      1 + INITIAL_SCHEDULE_ROWS,
    );
  });

  it('formats each month in rand and starts at month 1', () => {
    render(
      <RepaymentSchedule
        status="ready"
        schedule={[
          {
            month: 1,
            payment: 7_089.5,
            principal: 5_526.75,
            interest: 1_562.5,
            balance: 144_473.25,
          },
        ]}
        loanAmount={150_000}
      />,
    );

    const row = screen.getByRole('rowheader', { name: '1' }).parentElement;
    const cells = within(row as HTMLElement).getAllByRole('cell');

    expect(cells.map((cell) => cell.textContent)).toEqual([
      expect.stringMatching(/^R\s7\s090$/),
      expect.stringMatching(/^R\s5\s527$/),
      expect.stringMatching(/^R\s1\s563$/),
      expect.stringMatching(/^R\s144\s473$/),
    ]);
  });

  it('has nothing to expand when the whole schedule already fits', () => {
    render(
      <RepaymentSchedule
        status="ready"
        schedule={scheduleOf(INITIAL_SCHEDULE_ROWS)}
        loanAmount={150_000}
      />,
    );

    expect(screen.getAllByRole('row')).toHaveLength(1 + INITIAL_SCHEDULE_ROWS);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('marks the table busy while a newer schedule loads, keeping the old one', () => {
    const { rerender } = render(
      <RepaymentSchedule
        status="ready"
        schedule={scheduleOf(24)}
        loanAmount={150_000}
      />,
    );

    expect(screen.getByRole('table').closest('[aria-busy]')).toBeNull();

    rerender(
      <RepaymentSchedule
        status="ready"
        schedule={scheduleOf(24)}
        loanAmount={150_000}
        updating
      />,
    );

    expect(screen.getByRole('table').closest('[aria-busy]')).toHaveAttribute(
      'aria-busy',
      'true',
    );
  });
});
