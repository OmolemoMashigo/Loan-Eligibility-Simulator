import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { fillValidForm, openApp, reachStep, submit } from './helpers';

/** The WCAG 2.2 A and AA rules axe can check automatically. */
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/** Cards fade in and the chart draws itself; scan once they have settled. */
async function waitForMotionToSettle(page: Page): Promise<void> {
  await page.waitForFunction(
    "document.getAnimations().every((animation) => animation.playState !== 'running')",
  );
}

async function expectNoViolations(page: Page): Promise<void> {
  await waitForMotionToSettle(page);

  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

  expect(
    results.violations.map(({ id, help, nodes }) => ({
      id,
      help,
      targets: nodes.map((node) => node.target),
    })),
  ).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  await openApp(page);
});

test('the empty form has no WCAG A/AA violations', async ({ page }) => {
  await expectNoViolations(page);
});

test('the unemployed notice has no violations', async ({ page }) => {
  await reachStep(page, 'Personal details');
  await page.getByRole('radio', { name: 'Unemployed', exact: true }).check();

  await expect(page.getByRole('radio', { name: 'Unemployed' })).toBeChecked();
  await expectNoViolations(page);
});

test('the error summary and field errors have no violations', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Next' }).click();

  await expect(page.getByRole('alert', { name: /please fix/i })).toBeVisible();
  await expectNoViolations(page);
});

test('an eligible result with the full schedule has no violations', async ({
  page,
}) => {
  await fillValidForm(page);
  await submit(page);
  await expect(page.getByRole('table')).toBeVisible();
  await page.getByRole('button', { name: 'Show all 24 months' }).click();

  await expect(page.getByRole('table').getByRole('row')).toHaveCount(1 + 24);
  await expectNoViolations(page);
});

test('a declined result with next steps has no violations', async ({
  page,
}) => {
  await fillValidForm(page);
  await page.getByRole('textbox', { name: 'Monthly expenses' }).fill('24000');
  await submit(page);

  await expect(
    page.getByRole('heading', { name: 'What you can try' }),
  ).toBeVisible();
  await expect(page.getByRole('table')).toBeVisible();
  await expectNoViolations(page);
});

test('a result with no credit score and a what-if error has no violations', async ({
  page,
}) => {
  await fillValidForm(page);
  await page.getByRole('textbox', { name: 'Credit score (optional)' }).clear();
  await submit(page);
  await expect(page.getByRole('table')).toBeVisible();

  await page.getByRole('textbox', { name: /^Loan amount/ }).fill('1000');

  await expect(
    page.getByText('Loan amount must be between R5,000 and R300,000'),
  ).toBeVisible();
  await expectNoViolations(page);
});

test.describe('in dark mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.getByRole('switch', { name: 'Dark mode' }).click();

    // Without this the scans below could quietly be looking at the light theme.
    await expect(page.locator('body')).toHaveCSS(
      'background-color',
      'rgb(11, 15, 23)',
    );
  });

  test('the form, notice and error summary have no violations', async ({
    page,
  }) => {
    await expectNoViolations(page);

    await reachStep(page, 'Personal details');
    await page.getByRole('radio', { name: 'Unemployed', exact: true }).check();
    await expectNoViolations(page);

    await page.getByRole('button', { name: 'Next' }).click();
    await expect(
      page.getByRole('alert', { name: /please fix/i }),
    ).toBeVisible();
    await expectNoViolations(page);
  });

  test('an eligible result with the full schedule has no violations', async ({
    page,
  }) => {
    await fillValidForm(page);
    await submit(page);
    await expect(page.getByRole('table')).toBeVisible();
    await page.getByRole('button', { name: 'Show all 24 months' }).click();

    await expectNoViolations(page);
  });

  test('a declined result with next steps has no violations', async ({
    page,
  }) => {
    await fillValidForm(page);
    await page.getByRole('textbox', { name: 'Monthly expenses' }).fill('24000');
    await submit(page);

    await expect(
      page.getByRole('heading', { name: 'What you can try' }),
    ).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
    await expectNoViolations(page);
  });
});

test('the result animations switch off when reduced motion is asked for', async ({
  page,
}) => {
  await fillValidForm(page);
  await submit(page);
  await expect(page.getByRole('table')).toBeVisible();

  // Seconds the ring takes to fill, read from the live styles.
  const ringSeconds =
    'parseFloat(getComputedStyle(document.querySelector(\'[aria-label="Eligibility result"] svg circle:nth-of-type(2)\')).animationDuration)';

  expect(await page.evaluate(ringSeconds)).toBe(0.6);

  await page.emulateMedia({ reducedMotion: 'reduce' });

  expect(await page.evaluate<number>(ringSeconds)).toBeLessThan(0.001);
});
