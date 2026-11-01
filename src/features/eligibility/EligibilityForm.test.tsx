import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { apiMatch } from '@/mocks/api';
import { VALIDATION_RULES_RESPONSE } from '@/mocks/engine';
import { setMockLatency } from '@/mocks/latency';
import { server } from '@/mocks/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import { EligibilityForm } from './EligibilityForm';

async function renderForm() {
  renderWithProviders(<EligibilityForm />);

  expect(
    await screen.findByRole('heading', { name: 'Personal details' }),
  ).toBeInTheDocument();
}

describe('EligibilityForm personal details', () => {
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
    await renderForm();

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

    await user.click(screen.getByRole('radio', { name: 'Employed' }));

    const duration = screen.getByRole('textbox', {
      name: 'Time in current employment',
    });
    expect(duration).toBeRequired();

    await user.type(duration, '24');

    expect(screen.getByText('24 months = 2 years')).toBeInTheDocument();
  });

  it('hides duration for unemployed and retired and explains unemployed (SI-3)', async () => {
    const user = userEvent.setup();
    await renderForm();

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
      await screen.findByRole('heading', { name: 'Personal details' }),
    ).toBeInTheDocument();
  });

  it('shows a loading state before the rules arrive', async () => {
    renderWithProviders(<EligibilityForm />);

    expect(
      screen.getByRole('status', { name: 'Loading the form' }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Personal details' }),
      ).toBeInTheDocument();
    });
  });
});
