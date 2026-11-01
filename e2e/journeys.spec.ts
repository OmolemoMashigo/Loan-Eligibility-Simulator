import { expect, test } from '@playwright/test';
import {
  figure,
  fillValidForm,
  openApp,
  resultRegion,
  submit,
} from './helpers';

const LIKELY_ELIGIBLE = /you are likely eligible for this loan/i;
const UNLIKELY_ELIGIBLE =
  /you are unlikely to be eligible for this loan as requested/i;
const ASK_FOR_SCORE = 'Add your credit score for a more accurate estimate.';

test.beforeEach(async ({ page }) => {
  await openApp(page);
});

test('happy path: fill in the form and read the estimate and schedule', async ({
  page,
}) => {
  await expect(
    page.getByText(/this is an estimate, not a credit offer/i),
  ).toBeVisible();

  await fillValidForm(page);
  await submit(page);

  const banner = page.getByRole('status', { name: LIKELY_ELIGIBLE });

  await expect(banner).toBeVisible();
  await expect(banner).toBeFocused();
  await expect(figure(page, 'Recommended amount')).toHaveText(/^R\s150\s000$/);
  await expect(figure(page, 'Interest rate')).toHaveText('12,5% a year');
  await expect(figure(page, 'Monthly repayment')).toHaveText(/^R\s7\s096$/);
  await expect(figure(page, 'Debt-to-income ratio')).toHaveText('20%');
  await expect(figure(page, 'Affordability rating')).toHaveText('Good');
  await expect(page.getByText(ASK_FOR_SCORE)).toBeHidden();

  const table = page.getByRole('table', {
    name: /monthly payments on r\s150\s000 over 24 months/i,
  });

  await expect(table.getByRole('row')).toHaveCount(1 + 6);

  await page.getByRole('button', { name: 'Show all 24 months' }).click();

  await expect(table.getByRole('row')).toHaveCount(1 + 24);
  await expect(
    page.getByRole('button', { name: 'Show fewer months' }),
  ).toBeVisible();
});

test('decline path: read why, go back to the details, fix them, and get approved', async ({
  page,
}) => {
  await fillValidForm(page);
  await page.getByRole('textbox', { name: 'Monthly expenses' }).fill('24000');
  await submit(page);

  const banner = page.getByRole('status', { name: UNLIKELY_ELIGIBLE });

  await expect(banner).toBeVisible();
  await expect(banner).toContainText(
    /more than 85% of your disposable income/i,
  );
  await expect(
    page.getByRole('heading', { level: 2, name: 'What would fit your budget' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { level: 2, name: 'What you can try' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Edit details' }).click();

  await expect(
    page.getByRole('textbox', { name: 'Age', exact: true }),
  ).toBeFocused();
  // Their answers are still there.
  await expect(
    page.getByRole('textbox', { name: 'Monthly expenses' }),
  ).toHaveValue('24000');

  await page.getByRole('textbox', { name: 'Monthly expenses' }).fill('15000');
  await submit(page);

  await expect(
    page.getByRole('status', { name: LIKELY_ELIGIBLE }),
  ).toBeFocused();
  await expect(
    page.getByRole('status', { name: UNLIKELY_ELIGIBLE }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: 'What you can try' }),
  ).toHaveCount(0);
  await expect(resultRegion(page)).toHaveCount(1);
});

test('errors: an empty form lists every problem and links to the fields', async ({
  page,
}) => {
  await submit(page);

  const summary = page.getByRole('alert', {
    name: /please fix 8 problems before continuing/i,
  });

  await expect(summary).toBeVisible();
  await expect(summary).toBeFocused();
  await expect(resultRegion(page)).toHaveCount(0);

  await summary.getByRole('button', { name: /^Age: / }).click();

  await expect(
    page.getByRole('textbox', { name: 'Age', exact: true }),
  ).toBeFocused();

  await fillValidForm(page);
  await submit(page);

  await expect(
    page.getByRole('status', { name: LIKELY_ELIGIBLE }),
  ).toBeVisible();
  await expect(page.getByRole('alert', { name: /please fix/i })).toHaveCount(0);
});

test('blank credit score: accepted, priced at the unknown-score rate, and flagged', async ({
  page,
}) => {
  await fillValidForm(page);
  await page.getByRole('textbox', { name: 'Credit score (optional)' }).clear();
  await submit(page);

  await expect(
    page.getByRole('status', { name: LIKELY_ELIGIBLE }),
  ).toBeVisible();
  await expect(page.getByRole('alert', { name: /please fix/i })).toHaveCount(0);
  await expect(figure(page, 'Interest rate')).toHaveText('14,5% a year');
  await expect(page.getByText(ASK_FOR_SCORE)).toBeVisible();
});

test('what-if: changing the amount updates the estimate without losing the result', async ({
  page,
}) => {
  await fillValidForm(page);
  await submit(page);

  await expect(figure(page, 'Recommended amount')).toHaveText(/^R\s150\s000$/);

  const amount = page.getByRole('textbox', { name: /^Loan amount/ });

  await amount.fill('40000');

  await expect(figure(page, 'Recommended amount')).toHaveText(/^R\s40\s000$/);
  await expect(
    page.getByRole('table', {
      name: /monthly payments on r\s40\s000 over 24 months/i,
    }),
  ).toBeVisible();
  // Typing into the card never pulled focus away.
  await expect(amount).toHaveValue('40000');
  await expect(
    page.getByRole('status', { name: LIKELY_ELIGIBLE }),
  ).toBeVisible();
});
