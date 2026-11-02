import { screen } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';

export type StepName = 'Loan details' | 'Personal details' | 'Results';

/** The step bar's tab for a step. A finished step adds ", completed". */
export function stepTab(name: StepName): HTMLElement {
  return screen.getByRole('tab', { name: new RegExp(`^${name}`) });
}

/** Opens a step that is already unlocked, and waits for it to show. */
export async function openStep(user: UserEvent, name: StepName): Promise<void> {
  await user.click(stepTab(name));
  await screen.findByRole('tabpanel', { name: new RegExp(`^${name}`) });
}

/** Presses Next and waits for the named step to show. */
export async function next(user: UserEvent, name: StepName): Promise<void> {
  await user.click(screen.getByRole('button', { name: 'Next' }));
  await screen.findByRole('tabpanel', { name: new RegExp(`^${name}`) });
}

/** Fills in the spec sample's loan: R150 000 over 24 months, for home work. */
export async function fillLoanStep(user: UserEvent): Promise<void> {
  await user.type(
    screen.getByRole('textbox', { name: 'Amount you want to borrow' }),
    '150000',
  );
  await user.type(
    screen.getByRole('textbox', { name: 'Repayment period' }),
    '24',
  );
  await user.click(screen.getByRole('radio', { name: 'Home improvement' }));
}

export async function fillPersonalStep(user: UserEvent): Promise<void> {
  await user.type(screen.getByRole('textbox', { name: 'Age' }), '35');
  await user.click(screen.getByRole('radio', { name: 'Employed' }));
  await user.type(
    screen.getByRole('textbox', { name: 'Time in current employment' }),
    '24',
  );
}

export async function fillMoneyStep(user: UserEvent): Promise<void> {
  await user.type(
    screen.getByRole('textbox', { name: 'Monthly income' }),
    '25000',
  );
  await user.type(
    screen.getByRole('textbox', { name: 'Monthly expenses' }),
    '15000',
  );
  await user.type(
    screen.getByRole('textbox', {
      name: 'Total existing debt (outstanding balance)',
    }),
    '5000',
  );
  await user.type(
    screen.getByRole('textbox', { name: 'Credit score (optional)' }),
    '650',
  );
}

/** Fills in the first steps correctly and stops on the step you name. */
export async function reachStep(
  user: UserEvent,
  name: 'Personal details' | 'Results',
): Promise<void> {
  await fillLoanStep(user);
  await next(user, 'Personal details');

  if (name === 'Results') {
    await fillPersonalStep(user);
    await next(user, 'Results');
  }
}

/** Fills in the spec sample, step by step, and stops on the last step. */
export async function fillValidForm(user: UserEvent): Promise<void> {
  await reachStep(user, 'Results');
  await fillMoneyStep(user);
}

export async function submit(user: UserEvent): Promise<void> {
  await user.click(
    screen.getByRole('button', { name: 'Check my eligibility' }),
  );
}
