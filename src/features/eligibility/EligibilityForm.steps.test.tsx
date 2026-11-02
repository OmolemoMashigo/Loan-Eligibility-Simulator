import { cleanup, screen, within } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { setMockLatency } from '@/mocks/latency';
import { server } from '@/mocks/server';
import {
  fillLoanStep,
  fillPersonalStep,
  fillValidForm,
  next,
  openStep,
  reachStep,
  stepTab,
  submit,
} from '@/test/formJourney';
import { renderWithProviders } from '@/test/renderWithProviders';
import { EligibilityForm } from './EligibilityForm';

async function renderForm(): Promise<UserEvent> {
  const user = userEvent.setup();

  renderWithProviders(<EligibilityForm />);
  await screen.findByRole('heading', { name: 'Loan details' });

  return user;
}

describe('EligibilityForm steps', () => {
  beforeAll(() => {
    setMockLatency(0);
    server.listen({ onUnhandledRequest: 'error' });
  });

  afterEach(() => {
    server.resetHandlers();
    cleanup();
  });

  afterAll(() => {
    server.close();
  });

  it('starts on the loan step with the other steps greyed out', async () => {
    await renderForm();

    expect(stepTab('Loan details')).toHaveAttribute('aria-selected', 'true');
    expect(stepTab('Personal details')).toBeDisabled();
    expect(stepTab('Money')).toBeDisabled();
    expect(screen.getByRole('tabpanel')).toBeVisible();
    expect(screen.getAllByRole('tabpanel')).toHaveLength(1);
    expect(
      screen.queryByRole('button', { name: 'Back' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Check my eligibility' }),
    ).not.toBeInTheDocument();
  });

  it('unlocks and opens the next step once the current one is right, and marks it completed', async () => {
    const user = await renderForm();

    await fillLoanStep(user);
    await next(user, 'Personal details');

    expect(stepTab('Personal details')).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(stepTab('Personal details')).toBeEnabled();
    expect(
      screen.getByRole('tab', { name: /^Loan details\s?, completed$/ }),
    ).toBeEnabled();
    expect(stepTab('Money')).toBeDisabled();
    expect(screen.getByRole('tabpanel')).toHaveFocus();
  });

  it('offers the final action only on the last step', async () => {
    const user = await renderForm();

    await reachStep(user, 'Money');

    expect(
      screen.getByRole('button', { name: 'Check my eligibility' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Next' }),
    ).not.toBeInTheDocument();
  });

  it('goes Back without losing what was typed', async () => {
    const user = await renderForm();

    await reachStep(user, 'Personal details');
    await user.click(screen.getByRole('button', { name: 'Back' }));

    expect(stepTab('Loan details')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveFocus();
    expect(
      screen.getByRole('textbox', { name: 'Amount you want to borrow' }),
    ).toHaveValue('150000');
    // The step they came from stays unlocked.
    expect(stepTab('Personal details')).toBeEnabled();
  });

  it('treats Enter in a field as Next, and does not send anything', async () => {
    const user = await renderForm();

    await fillLoanStep(user);
    await user.type(
      screen.getByRole('textbox', { name: 'Repayment period' }),
      '{Enter}',
    );

    await screen.findByRole('tabpanel', { name: /^Personal details/ });

    expect(
      screen.queryByRole('status', { name: /eligible/i }),
    ).not.toBeInTheDocument();
  });

  it('does not let Enter move past a step with a problem', async () => {
    const user = await renderForm();

    await user.type(
      screen.getByRole('textbox', { name: 'Repayment period' }),
      '{Enter}',
    );

    expect(
      await screen.findByRole('alert', {
        name: /please fix 3 problems before continuing/i,
      }),
    ).toBeVisible();
    expect(stepTab('Loan details')).toHaveAttribute('aria-selected', 'true');
  });

  it('keeps the next steps locked after a failed Next, and unlocks them after a fix', async () => {
    const user = await renderForm();

    await user.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByRole('alert', { name: /please fix/i });

    expect(stepTab('Personal details')).toBeDisabled();

    await fillLoanStep(user);
    await next(user, 'Personal details');

    expect(
      screen.queryByRole('alert', { name: /please fix/i }),
    ).not.toBeInTheDocument();
  });

  it('shows only the errors of the step being left', async () => {
    const user = await renderForm();

    await reachStep(user, 'Personal details');
    await user.click(screen.getByRole('button', { name: 'Next' }));

    const summary = await screen.findByRole('alert', {
      name: /please fix 2 problems before continuing/i,
    });

    expect(
      within(summary).getByRole('button', { name: /^Age: / }),
    ).toBeVisible();
    expect(
      within(summary).getByRole('button', { name: /^Employment status: / }),
    ).toBeVisible();

    await fillPersonalStep(user);
    await next(user, 'Money');
  });

  it('cannot skip past a mistake made when editing an earlier step', async () => {
    const user = await renderForm();

    await fillValidForm(user);
    await submit(user);
    await screen.findByRole('status', { name: /likely eligible/i });

    await user.click(screen.getByRole('button', { name: 'Edit your details' }));
    await screen.findByRole('tabpanel', { name: /^Loan details/ });

    // Every step is open again, but a bad answer still blocks the way forward.
    expect(stepTab('Money')).toBeEnabled();

    await user.clear(
      screen.getByRole('textbox', { name: 'Amount you want to borrow' }),
    );
    await user.click(stepTab('Money'));

    expect(
      await screen.findByRole('alert', {
        name: /please fix 1 problem before continuing/i,
      }),
    ).toBeVisible();
    expect(stepTab('Loan details')).toHaveAttribute('aria-selected', 'true');
  });

  it('shows the result on its own and brings back the form on Edit your details', async () => {
    const user = await renderForm();

    await fillValidForm(user);
    await submit(user);
    await screen.findByRole('status', { name: /likely eligible/i });

    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('tabpanel', { name: /./ }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Edit your details' }));

    expect(
      screen.queryByRole('status', { name: /likely eligible/i }),
    ).not.toBeInTheDocument();
    expect(stepTab('Loan details')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveFocus();

    await openStep(user, 'Personal details');

    expect(screen.getByRole('textbox', { name: 'Age' })).toHaveValue('35');
  });
});
