import { cleanup, screen, within } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { apiMatch } from '@/mocks/api';
import { SPEC_SAMPLE_REQUEST, evaluateEligibility } from '@/mocks/engine';
import { setMockLatency } from '@/mocks/latency';
import { server } from '@/mocks/server';
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

/** Fills in the spec sample. */
async function fillValidForm(user: UserEvent): Promise<void> {
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

async function submit(user: UserEvent): Promise<void> {
  await user.click(
    screen.getByRole('button', { name: 'Check my eligibility' }),
  );
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
