import { cleanup, screen, waitFor, within } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { apiMatch } from '@/mocks/api';
import { setMockLatency } from '@/mocks/latency';
import { server } from '@/mocks/server';
import {
  fillValidForm,
  openStep,
  reachStep,
  stepTab,
  submit,
} from '@/test/formJourney';
import { renderWithProviders } from '@/test/renderWithProviders';
import { App } from './App';

/**
 * Whole-app journeys, the way a person would use the page. Only the network is
 * mocked (with the real mock API); nothing inside the app is stubbed.
 */

const eligibilityUrl = apiMatch('/loans/eligibility');
const calculateRateUrl = apiMatch('/loans/calculate-rate');

async function openApp(): Promise<UserEvent> {
  const user = userEvent.setup();

  renderWithProviders(<App />);
  await screen.findByRole('heading', { name: 'Loan details' });

  return user;
}

/** Records request bodies and leaves the answer to the real mock API. */
function recordBodies(url: RegExp): unknown[] {
  const bodies: unknown[] = [];

  server.use(
    http.post(url, async ({ request }) => {
      bodies.push(await request.clone().json());
    }),
  );

  return bodies;
}

function resultRegion(): HTMLElement {
  return screen.getByRole('region', { name: 'Eligibility result' });
}

/** The value shown next to a label in the result. */
function shown(label: string): string {
  return (
    within(resultRegion()).getByText(label).parentElement?.querySelector('dd')
      ?.textContent ?? ''
  );
}

const SERVER_ERROR = {
  error: {
    code: 'INTERNAL_ERROR',
    message: 'Something went wrong. Please try again.',
  },
};

describe('journeys', () => {
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

  it('happy path: fill in the form and read the estimate and schedule', async () => {
    const user = await openApp();

    expect(
      screen.getByText(/this is an estimate, not a credit offer/i),
    ).toBeVisible();

    await fillValidForm(user);
    await submit(user);

    const banner = await screen.findByRole('status', {
      name: /you are likely eligible for this loan/i,
    });

    expect(banner).toHaveFocus();
    expect(banner).toHaveTextContent(/approval likelihood/i);
    // The report has the page to itself: no steps and no form fields.
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('textbox', { name: 'Monthly income' }),
    ).not.toBeInTheDocument();
    expect(shown('Recommended amount')).toMatch(/^R\s150\s000$/);
    expect(shown('Interest rate')).toBe('12,5% a year');
    expect(shown('Monthly repayment')).toMatch(/^R\s7\s096$/);
    expect(shown('Debt-to-income ratio')).toBe('20%');
    expect(shown('Affordability rating')).toBe('Good');

    const table = await screen.findByRole('table', {
      name: /monthly payments on r\s150\s000 over 24 months/i,
    });

    expect(within(table).getAllByRole('row')).toHaveLength(1 + 6);

    await user.click(
      screen.getByRole('button', { name: 'Show all 24 months' }),
    );

    expect(within(table).getAllByRole('row')).toHaveLength(1 + 24);
    expect(
      screen.getByRole('button', { name: 'Show fewer months' }),
    ).toBeVisible();
    // The estimate disclaimer never goes away.
    expect(
      screen.getByText(/this is an estimate, not a credit offer/i),
    ).toBeVisible();
  });

  it('decline path: read why, go back to the details, fix them, and get approved', async () => {
    const user = await openApp();

    await fillValidForm(user);

    const expenses = screen.getByRole('textbox', { name: 'Monthly expenses' });

    await user.clear(expenses);
    await user.type(expenses, '24000');
    await submit(user);

    const banner = await screen.findByRole('status', {
      name: /unlikely to be eligible for this loan as requested/i,
    });

    expect(banner).toHaveTextContent(
      /more than 85% of your disposable income/i,
    );
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'What would fit your budget',
      }),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', { level: 2, name: 'What you can try' }),
    ).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Edit details' }));

    expect(
      screen.getByRole('tabpanel', { name: /^Loan details/ }),
    ).toHaveFocus();

    // Their answers are still there, on the step they were given.
    await openStep(user, 'Money');

    expect(expenses).toHaveValue('24000');

    await user.clear(expenses);
    await user.type(expenses, '15000');
    await submit(user);

    expect(
      await screen.findByRole('status', { name: /you are likely eligible/i }),
    ).toHaveFocus();
    expect(
      screen.queryByRole('status', { name: /unlikely to be eligible/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'What you can try' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByRole('region', { name: 'Eligibility result' }),
    ).toHaveLength(1);
  });

  describe('errors', () => {
    it('lists every missing answer on a step, jumps to a field, and moves on once it is valid', async () => {
      const requests = recordBodies(eligibilityUrl);
      const user = await openApp();

      await user.click(screen.getByRole('button', { name: 'Next' }));

      const summary = await screen.findByRole('alert', {
        name: /please fix 3 problems before continuing/i,
      });

      expect(summary).toHaveFocus();
      expect(requests).toHaveLength(0);
      // Nothing past the first step can be opened until it is right.
      expect(stepTab('Personal details')).toBeDisabled();
      expect(stepTab('Money')).toBeDisabled();

      await user.click(
        within(summary).getByRole('button', {
          name: /^Amount you want to borrow: /,
        }),
      );

      const amount = screen.getByRole('textbox', {
        name: 'Amount you want to borrow',
      });

      expect(amount).toHaveFocus();
      expect(amount).toBeInvalid();

      await fillValidForm(user);
      await submit(user);

      await screen.findByRole('status', { name: /you are likely eligible/i });

      expect(
        screen.queryByRole('alert', { name: /please fix/i }),
      ).not.toBeInTheDocument();
      expect(amount).toBeValid();
      expect(requests).toHaveLength(1);
    });

    it('shows a field-level message as soon as an answer is left out of range', async () => {
      const user = await openApp();

      await reachStep(user, 'Personal details');

      const age = screen.getByRole('textbox', { name: 'Age' });

      await user.type(age, '17');
      await user.tab();

      expect(age).toBeInvalid();
      expect(age).toHaveAccessibleDescription(/age must be between 18 and 65/i);

      await user.clear(age);
      await user.type(age, '35');
      await user.tab();

      expect(age).toBeValid();
    });

    it('puts a server-side field error on its field, and accepts the corrected answer', async () => {
      server.use(
        http.post(
          eligibilityUrl,
          () =>
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
          { once: true },
        ),
      );
      const user = await openApp();

      await fillValidForm(user);
      await submit(user);

      const summary = await screen.findByRole('alert', {
        name: /please fix 1 problem before continuing/i,
      });
      const age = screen.getByRole('textbox', { name: 'Age' });

      expect(summary).toHaveFocus();
      expect(age).toBeInvalid();

      await user.click(within(summary).getByRole('button', { name: /^Age: / }));

      expect(age).toHaveFocus();

      await user.clear(age);
      await user.type(age, '36');
      await openStep(user, 'Money');
      await submit(user);

      expect(
        await screen.findByRole('status', { name: /you are likely eligible/i }),
      ).toBeInTheDocument();
      expect(age).toBeValid();
      expect(
        screen.queryByRole('alert', { name: /please fix/i }),
      ).not.toBeInTheDocument();
    });

    it('explains a server failure and recovers with Try again', async () => {
      server.use(
        http.post(
          eligibilityUrl,
          () => HttpResponse.json(SERVER_ERROR, { status: 500 }),
          { once: true },
        ),
      );
      const user = await openApp();

      await fillValidForm(user);
      await submit(user);

      const failure = await screen.findByRole('alert', {
        name: /we could not check your eligibility/i,
      });

      expect(failure).toHaveFocus();
      expect(failure).toHaveTextContent(
        'Something went wrong. Please try again.',
      );
      // Their answers survive the failure.
      expect(
        screen.getByRole('textbox', { name: 'Monthly income' }),
      ).toHaveValue('25000');

      await user.click(
        within(failure).getByRole('button', { name: 'Try again' }),
      );

      expect(
        await screen.findByRole('status', { name: /you are likely eligible/i }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('alert', { name: /could not check/i }),
      ).not.toBeInTheDocument();
    });

    it('keeps the estimate when only the schedule fails, and loads it on Try again', async () => {
      server.use(
        http.post(
          calculateRateUrl,
          () => HttpResponse.json(SERVER_ERROR, { status: 500 }),
          { once: true },
        ),
      );
      const user = await openApp();

      await fillValidForm(user);
      await submit(user);

      const failure = await screen.findByRole('alert', {
        name: /could not load the repayment schedule/i,
      });

      expect(
        screen.getByRole('status', { name: /you are likely eligible/i }),
      ).toBeInTheDocument();
      expect(shown('Recommended amount')).toMatch(/^R\s150\s000$/);

      await user.click(
        within(failure).getByRole('button', { name: 'Try again' }),
      );

      expect(await screen.findByRole('table')).toBeInTheDocument();
    });
  });

  describe('blank credit score', () => {
    it('is accepted, left out of every request, and priced at the unknown-score rate', async () => {
      const eligibilityRequests = recordBodies(eligibilityUrl);
      const scheduleRequests = recordBodies(calculateRateUrl);
      const user = await openApp();

      await fillValidForm(user);
      await user.clear(
        screen.getByRole('textbox', { name: 'Credit score (optional)' }),
      );
      await submit(user);

      await screen.findByRole('status', { name: /you are likely eligible/i });
      await screen.findByRole('table');

      expect(
        screen.queryByRole('alert', { name: /please fix/i }),
      ).not.toBeInTheDocument();
      expect(eligibilityRequests).toHaveLength(1);
      expect(scheduleRequests).toHaveLength(1);
      expect(
        (eligibilityRequests[0] as { financialInfo: object }).financialInfo,
      ).not.toHaveProperty('creditScore');
      expect(scheduleRequests[0]).not.toHaveProperty('creditScore');
      // Never sent as 0 or null.
      expect(JSON.stringify(eligibilityRequests[0])).not.toMatch(/creditScore/);
      expect(JSON.stringify(scheduleRequests[0])).not.toMatch(/creditScore/);
      expect(shown('Interest rate')).toBe('14,5% a year');
      expect(
        screen.getByText('Add your credit score for a more accurate estimate.'),
      ).toBeVisible();
    });

    it('prices a given score in its own band', async () => {
      const user = await openApp();

      await fillValidForm(user);
      await submit(user);

      await screen.findByRole('status', { name: /you are likely eligible/i });

      expect(shown('Interest rate')).toBe('12,5% a year');
      expect(
        screen.queryByText(
          'Add your credit score for a more accurate estimate.',
        ),
      ).not.toBeInTheDocument();
    });

    it('keeps asking for a score after the amount is changed in the what-if card', async () => {
      const user = await openApp();

      await fillValidForm(user);
      await user.clear(
        screen.getByRole('textbox', { name: 'Credit score (optional)' }),
      );
      await submit(user);
      await screen.findByRole('status', { name: /you are likely eligible/i });

      const amount = screen.getByRole('textbox', { name: /^Loan amount/ });

      await user.clear(amount);
      await user.type(amount, '40000');

      await waitFor(
        () => {
          expect(shown('Recommended amount')).toMatch(/^R\s40\s000$/);
        },
        { timeout: 3000 },
      );
      expect(
        screen.getByText('Add your credit score for a more accurate estimate.'),
      ).toBeVisible();
    });
  });
});
