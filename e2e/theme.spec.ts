import { expect, test } from '@playwright/test';
import { fillValidForm, openApp, submit } from './helpers';

const LIGHT_PAGE = 'rgb(245, 247, 251)';
const DARK_PAGE = 'rgb(11, 15, 23)';

test.describe('the dark mode toggle', () => {
  // Even a system set to dark must not change the default.
  test.use({ colorScheme: 'dark' });

  test.beforeEach(async ({ page }) => {
    await openApp(page);
  });

  test('is off and the page is light by default, whatever the system says', async ({
    page,
  }) => {
    await expect(
      page.getByRole('switch', { name: 'Dark mode' }),
    ).not.toBeChecked();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('body')).toHaveCSS(
      'background-color',
      LIGHT_PAGE,
    );
  });

  test('switches the whole page to dark and back', async ({ page }) => {
    const toggle = page.getByRole('switch', { name: 'Dark mode' });

    await toggle.click();

    await expect(toggle).toBeChecked();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('body')).toHaveCSS('background-color', DARK_PAGE);

    await toggle.click();

    await expect(toggle).not.toBeChecked();
    await expect(page.locator('body')).toHaveCSS(
      'background-color',
      LIGHT_PAGE,
    );
  });

  test('remembers the choice after a reload', async ({ page }) => {
    await page.getByRole('switch', { name: 'Dark mode' }).click();
    await page.reload({ waitUntil: 'commit' });

    // The init script restores it from the first moment the page loads.
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.getByRole('switch', { name: 'Dark mode' })).toBeChecked();
    await expect(page.locator('body')).toHaveCSS('background-color', DARK_PAGE);

    // Choosing light again is remembered too.
    await page.getByRole('switch', { name: 'Dark mode' }).click();
    await page.reload();

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('saves only the theme name, never anything typed into the form', async ({
    page,
  }) => {
    await fillValidForm(page);
    await page.getByRole('switch', { name: 'Dark mode' }).click();

    const saved = await page.evaluate(
      'JSON.stringify(Object.fromEntries(Object.entries(localStorage)))',
    );

    expect(JSON.parse(String(saved))).toEqual({ theme: 'dark' });
    expect(
      await page.evaluate('JSON.stringify(Object.keys(sessionStorage))'),
    ).toBe('[]');
  });

  test('can be used from the keyboard and keeps a result on screen', async ({
    page,
  }) => {
    await fillValidForm(page);
    await submit(page);
    await expect(page.getByRole('table')).toBeVisible();

    const toggle = page.getByRole('switch', { name: 'Dark mode' });

    await toggle.focus();
    await page.keyboard.press('Space');

    await expect(toggle).toBeChecked();
    await expect(toggle).toBeFocused();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    // The estimate and the form values are untouched by the switch.
    await expect(
      page.getByRole('region', { name: 'Eligibility result' }),
    ).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
    await expect(
      page.locator('input[name="financialInfo.monthlyIncome"]'),
    ).toHaveValue(/25\s?000/);
  });

  test('is big enough to tap', async ({ page }) => {
    const box = await page
      .getByRole('switch', { name: 'Dark mode' })
      .boundingBox();

    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  });
});
