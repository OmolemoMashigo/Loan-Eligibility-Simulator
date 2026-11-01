import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DeclineNextSteps,
  type DeclineNextStepsProps,
} from './DeclineNextSteps';

const base: DeclineNextStepsProps = {
  maxAmount: 95_000,
  requestedAmount: 150_000,
  loanTerm: 24,
  maxTerm: 60,
  disposableIncome: 5_000,
  onEditDetails: () => undefined,
};

function renderSteps(props: Partial<DeclineNextStepsProps> = {}) {
  return render(<DeclineNextSteps {...base} {...props} />);
}

describe('DeclineNextSteps', () => {
  afterEach(cleanup);

  it('suggests a lower amount and a longer period', () => {
    renderSteps();

    expect(
      screen.getByRole('heading', { level: 2, name: 'What you can try' }),
    ).toBeVisible();

    const [amount, term] = screen.getAllByRole('listitem');

    expect(amount?.textContent).toMatch(
      /^Borrow R\s95\s000 or less\. That is the most that fits your budget over 24 months\.$/,
    );
    expect(term).toHaveTextContent(
      'Choose a longer repayment period, up to 60 months. Spreading the loan out lowers each monthly repayment.',
    );
    expect(screen.getByText(/try a new amount or period below/i)).toBeVisible();
  });

  it('leaves out the longer period when it is already the longest', () => {
    renderSteps({ loanTerm: 60 });

    const items = screen.getAllByRole('listitem');

    expect(items).toHaveLength(1);
    expect(items[0]).toHaveTextContent(/^Borrow /);
  });

  it('does not say how far to go when the longest period is unknown', () => {
    renderSteps({ maxAmount: 0, maxTerm: undefined });

    expect(screen.getByRole('listitem')).toHaveTextContent(
      'Choose a longer repayment period. Spreading',
    );
  });

  it('leaves out the lower amount when nothing fits, or when it is not lower', () => {
    const { unmount } = renderSteps({ maxAmount: 0 });

    expect(screen.getByRole('listitem')).toHaveTextContent(
      /^Choose a longer repayment period/,
    );

    unmount();
    renderSteps({ maxAmount: 150_000 });

    expect(screen.getByRole('listitem')).toHaveTextContent(
      /^Choose a longer repayment period/,
    );
  });

  it('only asks to check the details when neither suggestion applies', () => {
    renderSteps({ maxAmount: 0, loanTerm: 60 });

    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(
      screen.getByText('Check that the details you entered are right.'),
    ).toBeVisible();
  });

  it('makes no suggestions when expenses leave no income to repay a loan', () => {
    renderSteps({ disposableIncome: 0 });

    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(
      screen.getByText(/expenses leave no income to repay a loan/i),
    ).toBeVisible();
    expect(screen.queryByText(/below/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit details' })).toBeVisible();
  });

  it('calls back when the user chooses to edit their details', async () => {
    const onEditDetails = vi.fn();
    const user = userEvent.setup();

    renderSteps({ onEditDetails });

    await user.click(
      within(
        screen.getByRole('heading', { name: 'What you can try' })
          .parentElement as HTMLElement,
      ).getByRole('button', {
        name: 'Edit details',
      }),
    );

    expect(onEditDetails).toHaveBeenCalledTimes(1);
  });
});
