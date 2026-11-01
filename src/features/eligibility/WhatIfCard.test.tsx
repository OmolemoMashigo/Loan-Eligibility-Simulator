import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SPEC_SAMPLE_REQUEST, VALIDATION_RULES_RESPONSE } from '@/mocks/engine';
import {
  buildEligibilityFormSchema,
  buildFormFieldMeta,
} from './buildFormSchema';
import { WhatIfCard, type WhatIfCardProps } from './WhatIfCard';

const schema = buildEligibilityFormSchema(VALIDATION_RULES_RESPONSE);
const rules = buildFormFieldMeta(VALIDATION_RULES_RESPONSE).loanDetails;
// Longer than the debounce, so a recalculation has had time to fire.
const SETTLE = { timeout: 2000 };

function renderCard(props: Partial<WhatIfCardProps> = {}) {
  const onRecalculate = vi.fn();
  const onRetry = vi.fn();

  render(
    <WhatIfCard
      schema={schema}
      rules={rules}
      request={SPEC_SAMPLE_REQUEST}
      updating={false}
      onRecalculate={onRecalculate}
      onRetry={onRetry}
      {...props}
    />,
  );

  return {
    onRecalculate,
    onRetry,
    amount: screen.getByLabelText(/loan amount/i),
    term: screen.getByLabelText(/repayment period/i),
  };
}

describe('WhatIfCard', () => {
  afterEach(cleanup);

  it('starts from the amount and period that were submitted', () => {
    const { amount, term } = renderCard();

    expect(amount).toHaveValue('150000');
    expect(term).toHaveValue('24');
  });

  it('waits for typing to pause, then recalculates once with the final values', async () => {
    const user = userEvent.setup();
    const { onRecalculate, amount } = renderCard();

    await user.clear(amount);
    await user.type(amount, '80000');

    expect(onRecalculate).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(onRecalculate).toHaveBeenCalledTimes(1);
    }, SETTLE);
    expect(onRecalculate).toHaveBeenCalledWith({
      ...SPEC_SAMPLE_REQUEST,
      loanDetails: {
        ...SPEC_SAMPLE_REQUEST.loanDetails,
        requestedAmount: 80_000,
      },
    });
  });

  it('recalculates for a changed repayment period', async () => {
    const user = userEvent.setup();
    const { onRecalculate, term } = renderCard();

    await user.clear(term);
    await user.type(term, '36');

    await waitFor(() => {
      expect(onRecalculate).toHaveBeenCalledTimes(1);
    }, SETTLE);
    expect(onRecalculate).toHaveBeenCalledWith({
      ...SPEC_SAMPLE_REQUEST,
      loanDetails: { ...SPEC_SAMPLE_REQUEST.loanDetails, loanTerm: 36 },
    });
  });

  it('does not recalculate when the values end up unchanged', async () => {
    const user = userEvent.setup();
    const { onRecalculate, term } = renderCard();

    await user.type(term, '5');
    await user.keyboard('{Backspace}');
    await new Promise((resolve) => setTimeout(resolve, 800));

    expect(onRecalculate).not.toHaveBeenCalled();
  });

  it('shows the rule message for an invalid value once typing pauses, and does not recalculate', async () => {
    const user = userEvent.setup();
    const { onRecalculate, amount } = renderCard();

    await user.clear(amount);
    await user.type(amount, '1000');

    expect(screen.queryByText(/must be between/i)).not.toBeInTheDocument();

    expect(
      await screen.findByText(
        VALIDATION_RULES_RESPONSE.loanDetails.requestedAmount.errorMessage,
        {},
        SETTLE,
      ),
    ).toBeInTheDocument();
    expect(amount).toBeInvalid();
    expect(onRecalculate).not.toHaveBeenCalled();
  });

  it('says when the results are updating', () => {
    renderCard({ updating: true });

    expect(screen.getByRole('status')).toHaveTextContent(
      'Updating your results…',
    );
  });

  it('keeps an empty status region for announcements while idle', () => {
    renderCard();

    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('offers to try again when the update failed', async () => {
    const user = userEvent.setup();
    const { onRetry } = renderCard({ failure: 'The service is unavailable.' });

    expect(
      screen.getByRole('alert', { name: /we could not update your results/i }),
    ).toHaveTextContent('The service is unavailable.');

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('does not recalculate after it has been removed', async () => {
    const user = userEvent.setup();
    const onRecalculate = vi.fn();
    const { unmount } = render(
      <WhatIfCard
        schema={schema}
        rules={rules}
        request={SPEC_SAMPLE_REQUEST}
        updating={false}
        onRecalculate={onRecalculate}
        onRetry={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText(/repayment period/i), '0');
    unmount();
    await new Promise((resolve) => setTimeout(resolve, 800));

    expect(onRecalculate).not.toHaveBeenCalled();
  });
});
