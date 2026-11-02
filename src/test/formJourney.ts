import { screen } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';

/** Fills in the spec sample. */
export async function fillValidForm(user: UserEvent): Promise<void> {
  await user.type(screen.getByRole('textbox', { name: 'Age' }), '35');
  await user.click(screen.getByRole('radio', { name: 'Employed' }));
  await user.type(
    screen.getByRole('textbox', { name: 'Time in current employment' }),
    '24',
  );
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
  await user.type(
    screen.getByRole('textbox', { name: 'Amount you want to borrow' }),
    '150000',
  );
  await user.type(
    screen.getByRole('textbox', { name: 'Repayment period' }),
    '24',
  );
  await user.selectOptions(
    screen.getByRole('combobox', { name: 'What is the loan for?' }),
    'home_improvement',
  );
}

export async function submit(user: UserEvent): Promise<void> {
  await user.click(
    screen.getByRole('button', { name: 'Check my eligibility' }),
  );
}
