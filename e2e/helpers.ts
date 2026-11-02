import { expect, type Locator, type Page } from '@playwright/test';

export async function openApp(page: Page): Promise<void> {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Personal details' }),
  ).toBeVisible();
}

/** Fills in the spec sample: R150 000 over 24 months, score 650. */
export async function fillValidForm(page: Page): Promise<void> {
  await page.getByRole('textbox', { name: 'Age', exact: true }).fill('35');
  await page.getByRole('radio', { name: 'Employed', exact: true }).check();
  await page
    .getByRole('textbox', { name: 'Time in current employment' })
    .fill('24');
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
  await page
    .getByRole('textbox', { name: 'Amount you want to borrow' })
    .fill('150000');
  await page
    .getByRole('textbox', { name: 'Repayment period', exact: true })
    .fill('24');
  await page
    .getByRole('combobox', { name: 'What is the loan for?' })
    .selectOption('home_improvement');
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
