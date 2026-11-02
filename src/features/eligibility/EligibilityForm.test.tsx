import { act, cleanup, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { apiMatch } from '@/mocks/api';
import { VALIDATION_RULES_RESPONSE } from '@/mocks/engine';
import { FORM_VALIDATION_DEFAULTS } from './formDefaults';
import { setMockLatency } from '@/mocks/latency';
import { server } from '@/mocks/server';
import { reachStep } from '@/test/formJourney';
import { renderWithProviders } from '@/test/renderWithProviders';
import { EligibilityForm } from './EligibilityForm';

async function renderForm() {
  renderWithProviders(<EligibilityForm />);

  expect(
    await screen.findByRole('heading', { name: 'Loan details' }),
  ).toBeInTheDocument();
}

describe('EligibilityForm', () => {
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

  it('loads age and employment status from the validation-rules API', async () => {
    const user = userEvent.setup();
    await renderForm();
    await reachStep(user, 'Personal details');

    expect(
      screen.getByRole('textbox', { name: 'Age' }),
    ).toHaveAccessibleDescription(/between 18 and 65/i);
    expect(screen.getByRole('radio', { name: 'Employed' })).toBeInTheDocument();
    expect(
      screen.getByRole('radio', { name: 'Unemployed' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('textbox', { name: 'Time in current employment' }),
    ).not.toBeInTheDocument();
  });

  it('shows duration and a months echo only when employed (SI-3, SI-5)', async () => {
    const user = userEvent.setup();
    await renderForm();
    await reachStep(user, 'Personal details');

    await user.click(screen.getByRole('radio', { name: 'Employed' }));

    const duration = screen.getByRole('textbox', {
      name: 'Time in current employment',
    });
    expect(duration).toBeRequired();

    await user.type(duration, '24');

    expect(
      within(screen.getByRole('tabpanel')).getByText('24 months = 2 years'),
    ).toBeInTheDocument();
  });

  it('hides duration for unemployed and retired and explains unemployed (SI-3)', async () => {
    const user = userEvent.setup();
    await renderForm();
    await reachStep(user, 'Personal details');

    await user.click(screen.getByRole('radio', { name: 'Employed' }));
    await user.type(
      screen.getByRole('textbox', { name: 'Time in current employment' }),
      '24',
    );

    await user.click(screen.getByRole('radio', { name: 'Unemployed' }));

    expect(
      screen.queryByRole('textbox', { name: 'Time in current employment' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/income you declare/i)).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: 'Retired' }));

    expect(
      screen.queryByRole('textbox', { name: 'Time in current employment' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/income you declare/i)).not.toBeInTheDocument();
  });

  it('shows the API age message after an invalid blur', async () => {
    const user = userEvent.setup();
    await renderForm();
    await reachStep(user, 'Personal details');

    const age = screen.getByRole('textbox', { name: 'Age' });
    await user.type(age, '17');
    await user.tab();

    expect(
      await screen.findByText(
        VALIDATION_RULES_RESPONSE.personalInfo.age.errorMessage,
      ),
    ).toBeInTheDocument();
  });

  it('lets the user retry when validation rules fail to load', async () => {
    const user = userEvent.setup();
    server.use(
      http.get(apiMatch('/loans/validation-rules'), () =>
        HttpResponse.json(
          {
            error: {
              code: 'INTERNAL_ERROR',
              message: 'Something went wrong. Please try again.',
            },
          },
          { status: 500 },
        ),
      ),
    );

    renderWithProviders(<EligibilityForm />);

    expect(
      await screen.findByRole('alert', { name: /could not load the form/i }),
    ).toBeInTheDocument();

    server.resetHandlers();
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(
      await screen.findByRole('heading', { name: 'Loan details' }),
    ).toBeInTheDocument();
  });

  it('shows the money fields with rand inputs and an optional credit score', async () => {
    const user = userEvent.setup();
    await renderForm();
    await reachStep(user, 'Results');

    expect(
      screen.getByRole('heading', { name: 'Results' }),
    ).toBeInTheDocument();

    const income = screen.getByRole('textbox', { name: 'Monthly income' });
    expect(income).toBeRequired();
    expect(income).toHaveAttribute('inputmode', 'decimal');
    expect(income).toHaveAttribute('autocomplete', 'off');
    expect(income).toHaveAccessibleDescription(/at least r\s5\s000 a month/i);

    expect(
      screen.getByRole('textbox', { name: 'Monthly expenses' }),
    ).toBeRequired();
    expect(
      screen.getByRole('textbox', {
        name: 'Total existing debt (outstanding balance)',
      }),
    ).toBeRequired();

    const creditScore = screen.getByRole('textbox', {
      name: 'Credit score (optional)',
    });
    expect(creditScore).not.toBeRequired();
    expect(creditScore).toHaveAccessibleDescription(
      /between 300 and 850\. leave blank/i,
    );
  });

  it('accepts a blank credit score and 0 existing debt on blur (SI-8, SI-9)', async () => {
    const user = userEvent.setup();
    await renderForm();
    await reachStep(user, 'Results');

    await user.click(
      screen.getByRole('textbox', { name: 'Credit score (optional)' }),
    );
    await user.tab();
    await user.type(
      screen.getByRole('textbox', {
        name: 'Total existing debt (outstanding balance)',
      }),
      '0',
    );
    await user.tab();

    await waitFor(() => {
      expect(
        screen.getByRole('textbox', { name: 'Credit score (optional)' }),
      ).toBeValid();
    });
    expect(
      screen.getByRole('textbox', {
        name: 'Total existing debt (outstanding balance)',
      }),
    ).toBeValid();
    expect(
      screen.queryByText(FORM_VALIDATION_DEFAULTS.existingDebt.errorMessage),
    ).not.toBeInTheDocument();
  });

  it('shows the API messages for low income and an out-of-range score', async () => {
    const user = userEvent.setup();
    await renderForm();
    await reachStep(user, 'Results');

    await user.type(
      screen.getByRole('textbox', { name: 'Monthly income' }),
      '4000',
    );
    await user.tab();
    await user.type(
      screen.getByRole('textbox', { name: 'Credit score (optional)' }),
      '900',
    );
    await user.tab();

    expect(
      await screen.findByText(
        VALIDATION_RULES_RESPONSE.financialInfo.monthlyIncome.errorMessage,
      ),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(
        VALIDATION_RULES_RESPONSE.financialInfo.creditScore.errorMessage,
      ),
    ).toBeInTheDocument();
  });

  it('shows the personal loan product with bounds and purposes from the API (SI-1)', async () => {
    await renderForm();

    expect(
      screen.getByRole('heading', { name: 'Loan details' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Personal Loan')).toBeInTheDocument();
    expect(screen.queryByText('Vehicle Finance')).not.toBeInTheDocument();

    const amount = screen.getByRole('textbox', {
      name: 'Amount you want to borrow',
    });
    expect(amount).toBeRequired();
    expect(amount).toHaveAttribute('inputmode', 'decimal');
    expect(amount).toHaveAttribute('autocomplete', 'off');
    expect(amount).toHaveAccessibleDescription(
      /between r\s5\s000 and r\s300\s000/i,
    );

    expect(
      screen.getByRole('textbox', { name: 'Repayment period' }),
    ).toHaveAccessibleDescription(/in months, between 6 and 60/i);

    const purpose = screen.getByRole('group', {
      name: 'What is the loan for?',
    });
    const purposeNames = within(purpose)
      .getAllByRole('radio')
      .map((radio) => radio.closest('label')?.textContent);

    expect(purposeNames).toEqual([
      'Debt consolidation',
      'Home improvement',
      'Education',
      'Medical expenses',
      'Other',
    ]);
  });

  it('shows an icon beside every loan purpose, without changing its name', async () => {
    await renderForm();

    const purpose = screen.getByRole('group', {
      name: 'What is the loan for?',
    });
    const radios = within(purpose).getAllByRole('radio');

    expect(radios).toHaveLength(5);

    for (const radio of radios) {
      const icon = radio.closest('label')?.querySelector('svg');

      expect(icon).not.toBeNull();
      expect(icon?.parentElement).toHaveAttribute('aria-hidden', 'true');
    }

    // The icon adds no words: the name is still just the purpose.
    expect(
      within(purpose).getByRole('radio', { name: 'Medical expenses' }),
    ).toBeInTheDocument();
  });

  it('echoes the repayment period in years and lets the user pick a purpose', async () => {
    const user = userEvent.setup();
    await renderForm();

    await user.type(
      screen.getByRole('textbox', { name: 'Repayment period' }),
      '24',
    );
    await user.click(screen.getByRole('radio', { name: 'Home improvement' }));

    expect(screen.getByText('24 months = 2 years')).toBeInTheDocument();
    expect(
      screen.getByRole('radio', { name: 'Home improvement' }),
    ).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Education' })).not.toBeChecked();
  });

  it('shows the API messages for an out-of-range amount and term', async () => {
    const user = userEvent.setup();
    await renderForm();

    await user.type(
      screen.getByRole('textbox', { name: 'Amount you want to borrow' }),
      '400000',
    );
    await user.tab();
    await user.type(
      screen.getByRole('textbox', { name: 'Repayment period' }),
      '72',
    );
    await user.tab();

    expect(
      await screen.findByText(
        VALIDATION_RULES_RESPONSE.loanDetails.requestedAmount.errorMessage,
      ),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(
        VALIDATION_RULES_RESPONSE.loanDetails.loanTerm.errorMessage,
      ),
    ).toBeInTheDocument();
  });

  it('asks for a purpose after leaving it empty', async () => {
    const user = userEvent.setup();
    await renderForm();

    // Move through the group without choosing anything, then leave it.
    act(() => {
      screen.getByRole('radio', { name: 'Debt consolidation' }).focus();
    });
    await user.tab();

    expect(
      await screen.findByText(
        FORM_VALIDATION_DEFAULTS.loanPurpose.errorMessage,
      ),
    ).toBeInTheDocument();
  });

  it('lets the user retry when the products fail to load', async () => {
    const user = userEvent.setup();
    server.use(
      http.get(apiMatch('/loans/products'), () =>
        HttpResponse.json(
          {
            error: {
              code: 'INTERNAL_ERROR',
              message: 'Something went wrong. Please try again.',
            },
          },
          { status: 500 },
        ),
      ),
    );

    renderWithProviders(<EligibilityForm />);

    expect(
      await screen.findByRole('alert', { name: /could not load the form/i }),
    ).toBeInTheDocument();

    server.resetHandlers();
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(
      await screen.findByRole('heading', { name: 'Loan details' }),
    ).toBeInTheDocument();
  });

  it('shows a loading state before the rules arrive', async () => {
    renderWithProviders(<EligibilityForm />);

    expect(
      screen.getByRole('status', { name: 'Loading the form' }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Loan details' }),
      ).toBeInTheDocument();
    });
  });
});
