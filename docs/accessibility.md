# Accessibility

The target is **WCAG 2.2 level AA**. This page records what was checked, how to
re-run it, what was fixed, and what has _not_ been verified.

## How it is tested

| Check                | What it covers                                                                                                                                                             | Where                         | Run                |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ------------------ |
| Automated scan (axe) | WCAG 2.0 to 2.2 A/AA rules in a real browser, for six screen states, on a desktop and a 320px phone screen, and for three states in dark mode, switched on with the toggle | `e2e/a11y.spec.ts`            | `npm run test:e2e` |
| Keyboard             | Tab order matches reading order, every stop has a visible focus ring, the skip link works, a whole journey and error recovery work with no mouse                           | `e2e/keyboard.spec.ts`        | `npm run test:e2e` |
| Colour contrast      | Every text and control colour pair in the design tokens, for both the light and the dark scheme, computed from `tokens.css`                                                | `src/styles/contrast.test.ts` | `npm test`         |
| Roles and names      | Component and journey tests find things by role and accessible name (banner, alerts, status, table, groups), so the semantics are asserted throughout                      | `src/**/*.test.tsx`           | `npm test`         |
| Mobile layout        | No sideways scroll at 320px, touch targets at least 44px, schedule rows stacked                                                                                            | `e2e/mobile.spec.ts`          | `npm run test:e2e` |

The six scanned states are: the empty form, the unemployed notice, the error
summary with field errors, an eligible result with the full schedule, a
declined result with next steps, and a result with no credit score and a
what-if error.

The e2e tests are not part of `npm run verify` yet. Run
`npx playwright install chromium` once before the first `npm run test:e2e`.

## What was checked by hand

### Keyboard

- Tab order: skip link, then each form field in order, the submit button, and
  after a result the what-if fields and the schedule's "Show all" button.
- No keyboard traps: after the last control, focus leaves the page and wraps
  back to the skip link.
- Every stop has a solid outline of at least 2px. The currency fields draw it
  around the whole box, not the bare input.
- After submitting, focus moves to the result banner or the error summary, so
  the outcome is announced. Changing the what-if fields never moves focus.
- The error summary links are buttons. Enter moves focus to the field.
- "Show all months" toggles with Enter or Space and keeps focus. It reports
  `aria-expanded`.

### Colour contrast

Text needs 4.5:1 and the edge of a control or the focus ring needs 3:1. There
are two palettes, light and dark, chosen with the toggle in the header, and
every pair is tested for both.

| Pair                                                                  | Light      | Dark       |
| --------------------------------------------------------------------- | ---------- | ---------- |
| Text on card                                                          | 16.8       | 14.0       |
| Muted text on card                                                    | 6.5        | 7.6        |
| Muted text on page background                                         | 5.8        | 8.4        |
| Muted text on muted surface (result tiles)                            | 5.4        | 6.7        |
| Button and highlighted tile text on brand                             | 6.4        | 8.1        |
| Header title on the darkest and lightest ends of the header           | 10.1, 6.4  | 10.7, 7.1  |
| Error text on card                                                    | 7.4        | 8.1        |
| Success, warning, danger and info colours on their tinted backgrounds | 5.2 to 6.7 | 7.5 to 8.3 |
| Focus ring (brand) on card                                            | 6.4        | 8.0        |
| Focus ring on tinted banners                                          | 5.4 to 5.6 | 6.7 to 7.6 |
| **Input border on card**                                              | **3.7**    | **5.1**    |

The balance chart's line uses the brand colour (5.3:1 on its tile in the light
scheme, 7.2:1 in the dark). Its soft fill and dashed guide lines are decoration, not information.

### Screen reader semantics

Reviewed from the browser's accessibility tree, not with a screen reader:

- `lang="en-ZA"`, a descriptive page title, and one `h1` followed by `h2`
  sections with no skipped levels.
- Landmarks: banner, main, the estimate disclaimer as a named note, the form,
  and the result as a named region.
- Every field has a visible label, a hint tied to it with `aria-describedby`,
  and, when invalid, `aria-invalid` and the error text. Employment status is a
  labelled group of radios.
- The result banner is a `status` region named by its title. It carries a
  hidden "Success:", "Warning:" or "Error:" prefix, so meaning never depends on
  colour or icon alone.
- Figures are definition lists. The schedule is a real table with a caption,
  column headers and a row header per month.
- Loading, "Updating your results…" and busy states are announced with
  `status` roles and `aria-busy`.

## What was fixed

- **Input borders were too faint (WCAG 1.4.11).** Text inputs, the currency
  field and the select used the soft card border, which is 1.5:1 on white. A new
  token, `--color-border-control` (3.7:1 in the light scheme), now outlines every input.
  Cards and dividers keep the soft border because they are decorative.

The automated scan found no violations in any state, so nothing else needed
fixing. The scan was confirmed to be able to fail: making the muted text colour
too light makes it report a contrast violation.

## The dark mode switch

- It is a real switch (`role="switch"`, `aria-checked`) named "Dark mode". It
  is the first stop after the skip link, works with Space or Enter, keeps focus
  when used, and is 44px square to tap.
- It sits on the teal header, where the page's brand-coloured focus ring would
  disappear, so it draws its ring in the header's text colour instead. That
  colour is tested against both ends of the header in both palettes.
- The theme is set by a small script in `public/theme-init.js` that runs before
  the page paints, so a saved dark choice does not flash light first. It is a
  separate file, not inline, so a strict Content-Security-Policy can allow it.
- Using the switch does not reset the form or the result on screen.

## Motion and graphics

- Cards rise into place, the approval ring fills, and the chart line draws
  itself. All of it is CSS only and short (under a second).
- With `prefers-reduced-motion: reduce`, every animation and transition is cut
  to 0.01ms with no delay, so nothing waits to appear. An e2e test checks the
  ring's animation duration changes when reduced motion is switched on.
- The approval ring and the balance chart's end points are decoration. The ring
  is hidden from assistive technology because the percentage is always written
  beside it. The chart is a single image with a text description of where the
  balance starts and ends, and the repayment table below it holds every number.
- Numbers never count up. The text is final from the first render, so screen
  readers and tests read stable values.
- The axe scans wait for animations to finish first, so they judge the colours
  a user ends up seeing rather than a half-faded frame.

## Known limits and trade-offs

- **The dark mode choice is the one thing saved.** The page is light by
  default, whatever the system setting says. The header switch saves the
  chosen theme name (`light` or `dark`) in `localStorage`, so it is remembered.
  Nothing typed into the form is ever saved. Where storage is blocked, the
  choice still works for that visit. The chart and tiles were checked by
  screenshot and axe in dark mode on desktop and phone sizes, not on other
  devices.
- **No real assistive technology was used.** VoiceOver, NVDA, JAWS and TalkBack
  have not been run against the app. The checks above are about the semantics
  those tools read, not how they sound.
- **Chromium only.** The e2e tests do not run in Safari or Firefox.
- **Automated scans find only part of the problems.** Axe cannot judge whether
  labels, hints and error messages make sense. That was reviewed by reading the
  accessibility tree.
- **Table semantics on phones.** Below 768px the schedule's table elements are
  displayed as blocks so each month stacks. Chromium keeps the table roles in
  that mode (the mobile tests rely on them), but Safari may drop them. The
  months stay readable in order either way.
- **Several announcements at once on submit.** Each field error is an alert, and
  so is the error summary. After submitting an empty form a screen reader may
  read all of them. It is correct but chatty. The summary takes focus so it is
  read first.
- **Radio buttons are 20px.** Each sits in a labelled row that is 44px high and
  fully clickable, so the effective target is larger than the control.
- **Not checked:** text spacing overrides, 200% and 400% browser zoom beyond the
  320px reflow test, Windows forced-colours mode, and testing with disabled
  users.

## Rules for new work

- Use the design tokens. Add any new colour pair to `src/styles/contrast.test.ts`; it checks the light and the dark palette.
- Keep the focus ring: never set `outline: none` without an equal replacement.
- Build form controls from the shared field components so labels, hints and
  errors stay connected.
- Keep touch targets at least 44px (`--touch-min`).
- Add new screen states to `e2e/a11y.spec.ts`.
- Give any new animation a reduced-motion fallback; the global rule in `tokens.css` already covers CSS animations and transitions.
