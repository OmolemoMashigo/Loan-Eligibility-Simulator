import { expect, test } from '@playwright/test';
import { openApp } from './helpers';

/**
 * Describes where keyboard focus is, and whether it is clearly visible: a solid
 * outline of at least 2px on the control, or on its wrapper (the currency
 * fields draw the ring around the whole box).
 */
const FOCUS_STATE = `(() => {
  const el = document.activeElement;
  if (!el) return JSON.stringify({ name: 'none', visible: false });
  const visible = (style) =>
    style.outlineStyle === 'solid' && parseFloat(style.outlineWidth) >= 2;
  const own = getComputedStyle(el);
  const wrapper = el.parentElement ? getComputedStyle(el.parentElement) : own;
  const name =
    el.getAttribute('name') ||
    el.getAttribute('aria-label') ||
    (el.tagName === 'BUTTON' || el.tagName === 'A' ? el.textContent.trim() : el.tagName);
  return JSON.stringify({ name, visible: visible(own) || visible(wrapper) });
})()`;

const FORM_TAB_ORDER = [
  'Skip to main content',
  'Dark mode',
  'personalInfo.age',
  'personalInfo.employmentStatus',
  'financialInfo.monthlyIncome',
  'financialInfo.monthlyExpenses',
  'financialInfo.existingDebt',
  'financialInfo.creditScore',
  'loanDetails.requestedAmount',
  'loanDetails.loanTerm',
  'loanDetails.loanPurpose',
  'Check my eligibility',
];

test.beforeEach(async ({ page }) => {
  await openApp(page);
});

test('every control in the form is reached in reading order with a visible focus ring', async ({
  page,
}) => {
  const stops: { name: string; visible: boolean }[] = [];

  for (let press = 0; press < FORM_TAB_ORDER.length; press += 1) {
    await page.keyboard.press('Tab');
    stops.push(
      JSON.parse(String(await page.evaluate(FOCUS_STATE))) as {
        name: string;
        visible: boolean;
      },
    );
  }

  expect(stops.map((stop) => stop.name)).toEqual(FORM_TAB_ORDER);
  expect(stops.filter((stop) => !stop.visible)).toEqual([]);
});

test('the skip link appears on focus and moves focus to the main content', async ({
  page,
}) => {
  await page.keyboard.press('Tab');

  const skipLink = page.getByRole('link', { name: 'Skip to main content' });

  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeInViewport();

  await page.keyboard.press('Enter');

  await expect(page.locator('#main-content')).toBeFocused();

  await page.keyboard.press('Tab');

  await expect(
    page.getByRole('textbox', { name: 'Age', exact: true }),
  ).toBeFocused();
});

test('the whole journey works from the keyboard alone', async ({ page }) => {
  const { keyboard } = page;

  // Skip the header, then fill in the form field by field.
  await keyboard.press('Tab');
  await keyboard.press('Enter');
  await keyboard.press('Tab');
  await keyboard.type('35');
  await keyboard.press('Tab');
  // Space picks the focused radio ("Employed"), which reveals the duration.
  await keyboard.press('Space');
  await expect(
    page.getByRole('radio', { name: 'Employed', exact: true }),
  ).toBeChecked();
  await keyboard.press('Tab');
  await keyboard.type('24');

  for (const value of ['25000', '15000', '5000', '650', '150000', '24']) {
    await keyboard.press('Tab');
    await keyboard.type(value);
  }

  // Tab lands on the first purpose; the arrow key moves to, and picks, the next.
  await keyboard.press('Tab');
  await expect(
    page.getByRole('radio', { name: 'Debt consolidation' }),
  ).toBeFocused();
  await keyboard.press('ArrowDown');
  await expect(
    page.getByRole('radio', { name: 'Home improvement' }),
  ).toBeChecked();
  await keyboard.press('Tab');
  await expect(
    page.getByRole('button', { name: 'Check my eligibility' }),
  ).toBeFocused();
  await keyboard.press('Enter');

  // The result takes focus, so it is announced and found.
  await expect(
    page.getByRole('status', {
      name: /you are likely eligible for this loan/i,
    }),
  ).toBeFocused();

  // Next stops: the what-if fields, then the schedule's "show all".
  await keyboard.press('Tab');
  await expect(
    page.getByRole('textbox', { name: /^Loan amount/ }),
  ).toBeFocused();
  await keyboard.press('Tab');
  await expect(
    page.getByRole('textbox', { name: /^Repayment period \(months\)/ }),
  ).toBeFocused();
  // The schedule loads after the estimate; wait for it before tabbing on.
  await expect(page.getByRole('table')).toBeVisible();
  await keyboard.press('Tab');

  const showAll = page.getByRole('button', { name: 'Show all 24 months' });

  await expect(showAll).toBeFocused();
  await expect(showAll).toHaveAttribute('aria-expanded', 'false');

  await keyboard.press('Enter');

  const toggle = page.getByRole('button', { name: 'Show fewer months' });

  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('table').getByRole('row')).toHaveCount(1 + 24);

  await keyboard.press('Space');

  await expect(
    page.getByRole('button', { name: 'Show all 24 months' }),
  ).toBeFocused();
  await expect(page.getByRole('table').getByRole('row')).toHaveCount(1 + 6);
});

test('errors can be read and fixed from the keyboard', async ({ page }) => {
  const { keyboard } = page;

  await page.getByRole('button', { name: 'Check my eligibility' }).focus();
  await keyboard.press('Enter');

  const summary = page.getByRole('alert', {
    name: /please fix 8 problems before continuing/i,
  });

  await expect(summary).toBeFocused();

  await keyboard.press('Tab');
  await expect(summary.getByRole('button', { name: /^Age: / })).toBeFocused();

  await keyboard.press('Enter');

  await expect(
    page.getByRole('textbox', { name: 'Age', exact: true }),
  ).toBeFocused();
});
