import { cleanup, screen, waitFor, within } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { formatWholeRand } from '@/lib/format';
import { apiMatch } from '@/mocks/api';
import { SPEC_SAMPLE_REQUEST, evaluateEligibility } from '@/mocks/engine';
import { setMockLatency } from '@/mocks/latency';
import { server } from '@/mocks/server';
import { fillValidForm, submit } from '@/test/formJourney';
import { renderWithProviders } from '@/test/renderWithProviders';
import { EligibilityForm } from './EligibilityForm';

const eligibilityUrl = apiMatch('/loans/eligibility');
const calculateRateUrl = apiMatch('/loans/calculate-rate');

function recordRequests(): unknown[] {
  const bodies: unknown[] = [];

  server.use(
    http.post(eligibilityUrl, async ({ request }) => {
      bodies.push(await request.json());

      return HttpResponse.json(evaluateEligibility(SPEC_SAMPLE_REQUEST));
    }),
  );

  return bodies;
}

async function renderForm(): Promise<UserEvent> {
  const user = userEvent.setup();

  renderWithProviders(<EligibilityForm />);
  await screen.findByRole('heading', { name: 'Personal details' });

  return user;
}

describe('EligibilityForm submit', () => {
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

  it('lists every problem in a summary that takes focus and sends nothing', async () => {
    const requests = recordRequests();
    const user = await renderForm();

    await submit(user);

    const summary = await screen.findByRole('alert', {
      name: /please fix 8 problems before continuing/i,
    });

    expect(summary).toHaveFocus();
    expect(within(summary).getAllByRole('button')).toHaveLength(8);
    expect(requests).toHaveLength(0);

    await user.click(within(summary).getByRole('button', { name: /^Age: / }));

    expect(screen.getByRole('textbox', { name: 'Age' })).toHaveFocus();
  });

  it('sends the typed request when the form is valid and confirms it', async () => {
    const requests = recordRequests();
    const user = await renderForm();

    await fillValidForm(user);
    await submit(user);

    const done = await screen.findByRole('status', {
      name: /you are likely eligible for this loan/i,
    });

    expect(done).toHaveFocus();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Your estimate' }),
    ).toBeInTheDocument();
    expect(requests).toEqual([SPEC_SAMPLE_REQUEST]);
    expect(
      screen.getByRole('button', { name: 'Check my eligibility' }),
    ).not.toHaveAttribute('aria-disabled');
  });

  it('leaves out a blank credit score and the duration for unemployed (SI-3, SI-8)', async () => {
    const requests = recordRequests();
    const user = await renderForm();

    await fillValidForm(user);
    await user.clear(
      screen.getByRole('textbox', { name: 'Credit score (optional)' }),
    );
    await user.click(screen.getByRole('radio', { name: 'Unemployed' }));
    await submit(user);

    await screen.findByRole('status', { name: /likely eligible/i });

    expect(requests).toEqual([
      {
        personalInfo: { age: 35, employmentStatus: 'unemployed' },
        financialInfo: {
          monthlyIncome: 25_000,
          monthlyExpenses: 15_000,
          existingDebt: 5_000,
        },
        loanDetails: {
          requestedAmount: 150_000,
          loanTerm: 24,
          loanPurpose: 'home_improvement',
        },
      },
    ]);
  });

  it('shows a pending state, announces it, and ignores a second submit', async () => {
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let calls = 0;

    server.use(
      http.post(eligibilityUrl, async () => {
        calls += 1;
        await gate;

        return HttpResponse.json(evaluateEligibility(SPEC_SAMPLE_REQUEST));
      }),
    );

    const user = await renderForm();

    await fillValidForm(user);
    await submit(user);

    const pending = await screen.findByRole('button', { name: /^checking/i });

    expect(pending).toHaveAttribute('aria-disabled', 'true');
    expect(
      screen.getByRole('status', { name: 'Checking your eligibility' }),
    ).toBeInTheDocument();

    await user.click(pending);
    release();

    await screen.findByRole('status', { name: /likely eligible/i });

    expect(calls).toBe(1);
  });

  it('shows a decline from the engine with its reason and what would fit', async () => {
    const user = await renderForm();

    await fillValidForm(user);
    const expenses = screen.getByRole('textbox', { name: 'Monthly expenses' });
    await user.clear(expenses);
    await user.type(expenses, '24000');
    await submit(user);

    const banner = await screen.findByRole('status', {
      name: /unlikely to be eligible for this loan as requested/i,
    });

    expect(banner).toHaveFocus();
    expect(banner).toHaveTextContent(
      'The monthly repayment would take more than 85% of your disposable income',
    );
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'What would fit your budget',
      }),
    ).toBeInTheDocument();

    const affordability = screen.getByRole('heading', {
      level: 2,
      name: 'Your affordability',
    }).parentElement as HTMLElement;

    expect(within(affordability).getByText('Disposable income')).toBeVisible();
    expect(
      within(affordability).getByText('Affordability rating').nextSibling,
    ).toHaveTextContent('Poor');
    expect(
      within(affordability).getByText('Debt-to-income ratio').nextSibling,
    ).toHaveTextContent('20%');
  });

  it('replaces the result with a new one after changing the details', async () => {
    const user = await renderForm();

    await fillValidForm(user);
    await submit(user);
    await screen.findByRole('status', { name: /you are likely eligible/i });

    const expenses = screen.getByRole('textbox', { name: 'Monthly expenses' });
    await user.clear(expenses);
    await user.type(expenses, '24000');
    await submit(user);

    expect(
      await screen.findByRole('status', { name: /unlikely to be eligible/i }),
    ).toHaveFocus();
    expect(
      screen.queryByRole('status', { name: /you are likely eligible/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByRole('region', { name: 'Eligibility result' }),
    ).toHaveLength(1);
  });

  it('loads the repayment schedule for the recommended loan and shows it in stages', async () => {
    const scheduleRequests: unknown[] = [];

    server.use(
      http.post(calculateRateUrl, async ({ request }) => {
        scheduleRequests.push(await request.clone().json());
      }),
    );
    const user = await renderForm();

    await fillValidForm(user);
    await submit(user);

    const table = await screen.findByRole('table', {
      name: /monthly payments on r\s150\s000 over 24 months/i,
    });

    expect(scheduleRequests).toEqual([
      {
        loanAmount: 150_000,
        loanTerm: 24,
        loanType: 'personal_loan',
        creditScore: 650,
      },
    ]);
    expect(within(table).getAllByRole('row')).toHaveLength(1 + 6);

    // The first month's payment is the monthly repayment shown above it.
    const monthlyRepayment =
      screen.getByText('Monthly repayment').nextSibling?.textContent;
    const firstMonth = within(table).getByRole('rowheader', { name: '1' })
      .parentElement as HTMLElement;

    expect(monthlyRepayment).toMatch(/^R\s7\s096$/);
    expect(within(firstMonth).getAllByRole('cell')[0]?.textContent).toBe(
      monthlyRepayment,
    );

    await user.click(
      screen.getByRole('button', { name: 'Show all 24 months' }),
    );

    expect(within(table).getAllByRole('row')).toHaveLength(1 + 24);
    expect(
      screen.getByRole('status', { name: /you are likely eligible/i }),
    ).toBeInTheDocument();
  });

  it('shows the schedule for a declined loan too, using what would fit', async () => {
    const scheduleRequests: unknown[] = [];

    server.use(
      http.post(calculateRateUrl, async ({ request }) => {
        scheduleRequests.push(await request.clone().json());
      }),
    );
    const user = await renderForm();

    await fillValidForm(user);
    const expenses = screen.getByRole('textbox', { name: 'Monthly expenses' });
    await user.clear(expenses);
    await user.type(expenses, '24000');
    await submit(user);

    await screen.findByRole('table', {
      name: /monthly payments on r\s20\s000/i,
    });

    expect(scheduleRequests).toEqual([
      expect.objectContaining({ loanAmount: 20_000, loanTerm: 24 }),
    ]);
  });

  it('asks for no schedule when no amount is affordable', async () => {
    const scheduleRequests: unknown[] = [];

    server.use(
      http.post(calculateRateUrl, async ({ request }) => {
        scheduleRequests.push(await request.clone().json());
      }),
    );
    const user = await renderForm();

    await fillValidForm(user);
    const expenses = screen.getByRole('textbox', { name: 'Monthly expenses' });
    await user.clear(expenses);
    await user.type(expenses, '24950');
    await submit(user);

    await screen.findByRole('status', { name: /unlikely to be eligible/i });

    expect(
      screen.getByText(/could not find a loan amount that fits/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Repayment schedule' }),
    ).not.toBeInTheDocument();
    expect(scheduleRequests).toHaveLength(0);
  });

  it('keeps the result when the schedule fails and loads it on try again', async () => {
    server.use(
      http.post(
        calculateRateUrl,
        () =>
          HttpResponse.json(
            {
              error: {
                code: 'INTERNAL_ERROR',
                message: 'Something went wrong. Please try again.',
              },
            },
            { status: 500 },
          ),
        { once: true },
      ),
    );
    const user = await renderForm();

    await fillValidForm(user);
    await submit(user);

    const failure = await screen.findByRole('alert', {
      name: /could not load the repayment schedule/i,
    });

    expect(
      screen.getByRole('status', { name: /you are likely eligible/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Your estimate' }),
    ).toBeInTheDocument();

    await user.click(
      within(failure).getByRole('button', { name: 'Try again' }),
    );

    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(
      screen.queryByRole('alert', { name: /could not load/i }),
    ).not.toBeInTheDocument();
  });

  describe('next steps after a decline', () => {
    async function declineWithExpenses(user: UserEvent, expenses: string) {
      await fillValidForm(user);

      const field = screen.getByRole('textbox', { name: 'Monthly expenses' });

      await user.clear(field);
      await user.type(field, expenses);
      await submit(user);
      await screen.findByRole('status', { name: /unlikely to be eligible/i });
    }

    it('suggests the affordable amount and a longer period, and takes the user back to their details', async () => {
      const maxAmount = evaluateEligibility({
        ...SPEC_SAMPLE_REQUEST,
        financialInfo: {
          ...SPEC_SAMPLE_REQUEST.financialInfo,
          monthlyExpenses: 24_000,
        },
      }).recommendedLoan.maxAmount;
      const user = await renderForm();

      await declineWithExpenses(user, '24000');

      const card = screen.getByRole('heading', {
        level: 2,
        name: 'What you can try',
      }).parentElement as HTMLElement;
      const [amount, term] = within(card).getAllByRole('listitem');

      expect(maxAmount).toBeGreaterThan(0);
      expect(amount?.textContent).toBe(
        `Borrow ${formatWholeRand(maxAmount)} or less. That is the most that fits your budget over 24 months.`,
      );
      expect(term).toHaveTextContent('up to 60 months');

      // The result is still on screen and the form still holds the user's answers.
      await user.click(
        within(card).getByRole('button', { name: 'Edit details' }),
      );

      const age = screen.getByRole('textbox', { name: 'Age' });

      expect(age).toHaveFocus();
      expect(age).toHaveValue('35');
      expect(
        screen.getByRole('textbox', { name: 'Monthly expenses' }),
      ).toHaveValue('24000');
    });

    it('follows the what-if amount and period it was last given', async () => {
      const user = await renderForm();

      await declineWithExpenses(user, '24000');

      const period = screen.getByRole('textbox', {
        name: /^Repayment period \(months\)/,
      });

      await user.clear(period);
      await user.type(period, '60');

      await waitFor(
        () => {
          expect(
            screen.getByText(/most that fits your budget over 60 months/i),
          ).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
      expect(
        screen.queryByText(/choose a longer repayment period/i),
      ).not.toBeInTheDocument();
    });

    it('makes no suggestions when expenses leave no income, but still offers to edit', async () => {
      const user = await renderForm();

      await declineWithExpenses(user, '25000');

      const card = screen.getByRole('heading', {
        level: 2,
        name: 'What you can try',
      }).parentElement as HTMLElement;

      expect(within(card).queryByRole('list')).not.toBeInTheDocument();
      expect(card).toHaveTextContent(
        /expenses leave no income to repay a loan/i,
      );
      expect(
        within(card).getByRole('button', { name: 'Edit details' }),
      ).toBeInTheDocument();
    });

    it('is not shown for an eligible result', async () => {
      const user = await renderForm();

      await fillValidForm(user);
      await submit(user);
      await screen.findByRole('status', { name: /you are likely eligible/i });

      expect(
        screen.queryByRole('heading', { name: 'What you can try' }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Edit details' }),
      ).not.toBeInTheDocument();
    });
  });

  describe('what-if', () => {
    const whatIfAmount = () =>
      screen.getByRole('textbox', { name: /^Loan amount/ });
    const whatIfTerm = () =>
      screen.getByRole('textbox', { name: /^Repayment period \(months\)/ });

    /** Fills the spec sample, submits, and waits for the first result. */
    async function firstResult(user: UserEvent): Promise<void> {
      await fillValidForm(user);
      await submit(user);
      await screen.findByRole('status', { name: /you are likely eligible/i });
    }

    it('recalculates for a new amount, refreshes the schedule, and leaves focus alone', async () => {
      const eligibilityRequests: unknown[] = [];
      const scheduleRequests: unknown[] = [];

      server.use(
        http.post(eligibilityUrl, async ({ request }) => {
          eligibilityRequests.push(await request.clone().json());
        }),
        http.post(calculateRateUrl, async ({ request }) => {
          scheduleRequests.push(await request.clone().json());
        }),
      );
      const user = await renderForm();

      await firstResult(user);
      await screen.findByRole('table');

      await user.clear(whatIfAmount());
      await user.type(whatIfAmount(), '40000');

      expect(
        await screen.findByRole(
          'table',
          { name: /monthly payments on r\s40\s000 over 24 months/i },
          { timeout: 3000 },
        ),
      ).toBeInTheDocument();
      expect(whatIfAmount()).toHaveFocus();
      expect(eligibilityRequests).toHaveLength(2);
      expect(eligibilityRequests[1]).toEqual({
        ...SPEC_SAMPLE_REQUEST,
        loanDetails: {
          ...SPEC_SAMPLE_REQUEST.loanDetails,
          requestedAmount: 40_000,
        },
      });
      expect(scheduleRequests).toEqual([
        {
          loanAmount: 150_000,
          loanTerm: 24,
          loanType: 'personal_loan',
          creditScore: 650,
        },
        {
          loanAmount: 40_000,
          loanTerm: 24,
          loanType: 'personal_loan',
          creditScore: 650,
        },
      ]);
      expect(
        screen.getByText('Recommended amount').nextSibling?.textContent,
      ).toMatch(/^R\s40\s000$/);
    });

    it('recalculates for a new repayment period', async () => {
      const eligibilityRequests: unknown[] = [];

      server.use(
        http.post(eligibilityUrl, async ({ request }) => {
          eligibilityRequests.push(await request.clone().json());
        }),
      );
      const user = await renderForm();

      await firstResult(user);
      await user.clear(whatIfTerm());
      await user.type(whatIfTerm(), '36');

      expect(
        await screen.findByRole(
          'table',
          { name: /over 36 months/i },
          { timeout: 3000 },
        ),
      ).toBeInTheDocument();
      expect(
        within(
          screen.getByRole('region', { name: 'Eligibility result' }),
        ).getByText('Repayment period').nextSibling,
      ).toHaveTextContent('36 months');
      expect(eligibilityRequests[1]).toEqual({
        ...SPEC_SAMPLE_REQUEST,
        loanDetails: { ...SPEC_SAMPLE_REQUEST.loanDetails, loanTerm: 36 },
      });
    });

    it('keeps the last result on screen, marked as busy, while the new one loads', async () => {
      let release: () => void = () => undefined;
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      let calls = 0;

      server.use(
        http.post(eligibilityUrl, async () => {
          calls += 1;

          if (calls > 1) {
            await gate;
          }
        }),
      );
      const user = await renderForm();

      await firstResult(user);

      const before =
        screen.getByText('Monthly repayment').nextSibling?.textContent;
      const region = screen.getByRole('region', { name: 'Eligibility result' });

      await user.clear(whatIfAmount());
      await user.type(whatIfAmount(), '40000');

      expect(
        await screen.findByText(
          'Updating your results…',
          {},
          { timeout: 3000 },
        ),
      ).toBeInTheDocument();
      expect(region).toHaveAttribute('aria-busy', 'true');
      expect(
        screen.getByRole('status', { name: /you are likely eligible/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Monthly repayment').nextSibling?.textContent,
      ).toBe(before);

      release();

      await waitFor(() => {
        expect(region).not.toHaveAttribute('aria-busy');
      });
      expect(
        screen.getByText('Monthly repayment').nextSibling?.textContent,
      ).not.toBe(before);
      expect(
        screen.queryByText('Updating your results…'),
      ).not.toBeInTheDocument();
    });

    it('can change the decision when the new amount is too much', async () => {
      const user = await renderForm();

      await fillValidForm(user);
      await user.clear(
        screen.getByRole('textbox', { name: 'Amount you want to borrow' }),
      );
      await user.type(
        screen.getByRole('textbox', { name: 'Amount you want to borrow' }),
        '20000',
      );
      await submit(user);
      await screen.findByRole('status', { name: /you are likely eligible/i });

      await user.clear(whatIfAmount());
      await user.type(whatIfAmount(), '300000');

      expect(
        await screen.findByRole(
          'status',
          { name: /unlikely to be eligible/i },
          { timeout: 3000 },
        ),
      ).toBeInTheDocument();
      expect(whatIfAmount()).toHaveFocus();
    });

    it('sends nothing for an invalid amount and shows the rule message', async () => {
      const requests = recordRequests();
      const user = await renderForm();

      await firstResult(user);
      await user.clear(whatIfAmount());
      await user.type(whatIfAmount(), '1000');

      expect(
        await screen.findByText(
          'Loan amount must be between R5,000 and R300,000',
          {},
          { timeout: 3000 },
        ),
      ).toBeInTheDocument();
      expect(whatIfAmount()).toBeInvalid();
      expect(requests).toHaveLength(1);
    });

    it('keeps the result, says the update failed, and updates on try again', async () => {
      let calls = 0;

      server.use(
        http.post(eligibilityUrl, () => {
          calls += 1;

          if (calls === 2) {
            return HttpResponse.json(
              {
                error: {
                  code: 'INTERNAL_ERROR',
                  message: 'Something went wrong. Please try again.',
                },
              },
              { status: 500 },
            );
          }
        }),
      );
      const user = await renderForm();

      await firstResult(user);
      await user.clear(whatIfAmount());
      await user.type(whatIfAmount(), '40000');

      const failure = await screen.findByRole(
        'alert',
        { name: /we could not update your results/i },
        { timeout: 3000 },
      );

      expect(failure).toHaveTextContent(
        'Something went wrong. Please try again.',
      );
      expect(
        screen.getByRole('status', { name: /you are likely eligible/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Recommended amount').nextSibling?.textContent,
      ).toMatch(/^R\s150\s000$/);

      await user.click(
        within(failure).getByRole('button', { name: 'Try again' }),
      );

      await waitFor(() => {
        expect(
          screen.getByText('Recommended amount').nextSibling?.textContent,
        ).toMatch(/^R\s40\s000$/);
      });
      expect(
        screen.queryByRole('alert', { name: /could not update/i }),
      ).not.toBeInTheDocument();
    });

    it('starts the fields over from the new request after the main form is resubmitted', async () => {
      const user = await renderForm();

      await firstResult(user);
      await user.clear(whatIfAmount());
      await user.type(whatIfAmount(), '40000');
      await waitFor(
        () => {
          expect(
            screen.getByText('Recommended amount').nextSibling?.textContent,
          ).toMatch(/^R\s40\s000$/);
        },
        { timeout: 3000 },
      );

      await submit(user);

      await waitFor(() => {
        expect(whatIfAmount()).toHaveValue('150000');
      });
      expect(whatIfTerm()).toHaveValue('24');
    });

    it('ignores a late what-if answer after the main form is resubmitted', async () => {
      let release: () => void = () => undefined;
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      let calls = 0;

      server.use(
        http.post(eligibilityUrl, async () => {
          calls += 1;

          if (calls === 2) {
            await gate;
          }
        }),
      );
      const user = await renderForm();

      await firstResult(user);
      await user.clear(whatIfAmount());
      await user.type(whatIfAmount(), '40000');
      await screen.findByText('Updating your results…', {}, { timeout: 3000 });

      const expenses = screen.getByRole('textbox', {
        name: 'Monthly expenses',
      });

      await user.clear(expenses);
      await user.type(expenses, '24000');
      await submit(user);
      await screen.findByRole('status', { name: /unlikely to be eligible/i });

      release();
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(
        screen.getByRole('status', { name: /unlikely to be eligible/i }),
      ).toBeInTheDocument();
      expect(whatIfAmount()).toHaveValue('150000');
      expect(
        screen.queryByText('Updating your results…'),
      ).not.toBeInTheDocument();
    });
  });

  it('puts server field errors on the fields and in the summary', async () => {
    server.use(
      http.post(eligibilityUrl, () =>
        HttpResponse.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Please correct the highlighted fields',
              fieldErrors: {
                'personalInfo.age': 'Age must be between 18 and 65',
              },
            },
          },
          { status: 400 },
        ),
      ),
    );
    const user = await renderForm();

    await fillValidForm(user);
    await submit(user);

    const summary = await screen.findByRole('alert', {
      name: /please fix 1 problem before continuing/i,
    });
    const age = screen.getByRole('textbox', { name: 'Age' });

    expect(summary).toHaveFocus();
    expect(age).toBeInvalid();
    expect(age).toHaveAccessibleDescription(/age must be between 18 and 65/i);
  });

  it('explains a server failure and lets the user try again', async () => {
    server.use(
      http.post(
        eligibilityUrl,
        () =>
          HttpResponse.json(
            {
              error: {
                code: 'INTERNAL_ERROR',
                message: 'Something went wrong. Please try again.',
              },
            },
            { status: 500 },
          ),
        { once: true },
      ),
    );
    const user = await renderForm();

    await fillValidForm(user);
    await submit(user);

    const failure = await screen.findByRole('alert', {
      name: /could not check your eligibility/i,
    });

    expect(failure).toHaveFocus();
    expect(failure).toHaveTextContent(
      'Something went wrong. Please try again.',
    );

    await user.click(
      within(failure).getByRole('button', { name: 'Try again' }),
    );

    expect(
      await screen.findByRole('status', { name: /likely eligible/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('alert', { name: /could not check/i }),
    ).not.toBeInTheDocument();
  });
});
