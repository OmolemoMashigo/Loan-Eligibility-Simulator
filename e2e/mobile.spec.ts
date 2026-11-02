import { expect, test, type Page } from '@playwright/test';
import { fillValidForm, openApp, submit } from './helpers';

/** The smallest screen the app supports. */
test.use({ viewport: { width: 320, height: 640 } });

const MIN_TOUCH_TARGET = 44;

/** True when the page is no wider than the screen, so nothing scrolls sideways. */
async function hasNoSideScroll(page: Page): Promise<boolean> {
  return page.evaluate<boolean>(
    'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
  );
}

test('the form fits a 320px screen with touch-sized controls', async ({
  page,
}) => {
  await openApp(page);

  expect(await hasNoSideScroll(page)).toBe(true);

  const nextButton = page.getByRole('button', { name: 'Next' });
  const box = await nextButton.boundingBox();

  expect(box?.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
  expect(box?.width).toBeLessThanOrEqual(320);
});

test('the result and the full schedule stay inside the screen, with each month stacked', async ({
  page,
}) => {
  await openApp(page);
  await fillValidForm(page);
  await submit(page);

  const table = page.getByRole('table', {
    name: /monthly payments on r\s150\s000 over 24 months/i,
  });

  await expect(table).toBeVisible();

  const showAll = page.getByRole('button', { name: 'Show all 24 months' });

  expect((await showAll.boundingBox())?.height).toBeGreaterThanOrEqual(
    MIN_TOUCH_TARGET,
  );

  await showAll.click();

  await expect(table.getByRole('row')).toHaveCount(1 + 24);
  expect(await hasNoSideScroll(page)).toBe(true);

  // On a phone each month reads top to bottom, not across.
  const firstMonth = table.getByRole('row').nth(1);
  const payment = await firstMonth.getByRole('cell').nth(0).boundingBox();
  const principal = await firstMonth.getByRole('cell').nth(1).boundingBox();

  expect(payment).not.toBeNull();
  expect(principal).not.toBeNull();
  expect(principal?.y).toBeGreaterThan(payment?.y ?? Infinity);
  expect(principal?.x).toBe(payment?.x);
});
