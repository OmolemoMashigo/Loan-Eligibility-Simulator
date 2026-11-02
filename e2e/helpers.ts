import { expect, type Locator, type Page } from '@playwright/test';

export type StepName = 'Loan details' | 'Personal details' | 'Results';

export async function openApp(page: Page): Promise<void> {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Loan details' }),
  ).toBeVisible();
}

/** The step bar's tab for a step. A finished step adds ", completed". */
export function stepTab(page: Page, name: StepName): Locator {
  return page.getByRole('tab', { name: new RegExp(`^${name}`) });
}

/** Opens a step that is already unlocked, and waits for it to show. */
export async function openStep(page: Page, name: StepName): Promise<void> {
  await stepTab(page, name).click();
  await expect(
    page.getByRole('tabpanel', { name: new RegExp(`^${name}`) }),
  ).toBeVisible();
}

/** Presses Next and waits for the named step to show. */
export async function next(page: Page, name: StepName): Promise<void> {
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(
    page.getByRole('tabpanel', { name: new RegExp(`^${name}`) }),
  ).toBeVisible();
}

/** Fills in the spec sample's loan: R150 000 over 24 months, for home work. */
export async function fillLoanStep(page: Page): Promise<void> {
  await page
    .getByRole('textbox', { name: 'Amount you want to borrow' })
    .fill('150000');
  await page
    .getByRole('textbox', { name: 'Repayment period', exact: true })
    .fill('24');
  await page.getByRole('radio', { name: 'Home improvement' }).check();
}

export async function fillPersonalStep(page: Page): Promise<void> {
  await page.getByRole('textbox', { name: 'Age', exact: true }).fill('35');
  await page.getByRole('radio', { name: 'Employed', exact: true }).check();
  await page
    .getByRole('textbox', { name: 'Time in current employment' })
    .fill('24');
}

export async function fillMoneyStep(page: Page): Promise<void> {
  await page.getByRole('textbox', { name: 'Monthly income' }).fill('25000');
  await page.getByRole('textbox', { name: 'Monthly expenses' }).fill('15000');
  await page
    .getByRole('textbox', {
      name: 'Total existing debt (outstanding balance)',
    })
    .fill('5000');
  await page
    .getByRole('textbox', { name: 'Credit score (optional)' })
    .fill('650');
}

/** Fills in the first steps correctly and stops on the step you name. */
export async function reachStep(
  page: Page,
  name: 'Personal details' | 'Results',
): Promise<void> {
  await fillLoanStep(page);
  await next(page, 'Personal details');

  if (name === 'Results') {
    await fillPersonalStep(page);
    await next(page, 'Results');
  }
}

/** Fills in the spec sample, step by step, and stops on the last step. */
export async function fillValidForm(page: Page): Promise<void> {
  await reachStep(page, 'Results');
  await fillMoneyStep(page);
}

export async function submit(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Check my eligibility' }).click();
}

export function resultRegion(page: Page): Locator {
  return page.getByRole('region', { name: 'Eligibility result' });
}

/** The value shown next to a label in the result. */
export function figure(page: Page, label: string): Locator {
  return resultRegion(page)
    .locator('dl > div')
    .filter({ hasText: label })
    .locator('dd')
    .first();
}
