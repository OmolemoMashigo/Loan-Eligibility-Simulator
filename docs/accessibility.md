# Accessibility

The target is **WCAG 2.2 level AA**. This page records what was checked, how to
re-run it, what was fixed, and what has _not_ been verified.

## How it is tested

| Check                | What it covers                                                                                                                                        | Where                         | Run                |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ------------------ |
| Automated scan (axe) | WCAG 2.0 to 2.2 A/AA rules in a real browser, for six screen states, on a desktop and a 320px phone screen                                            | `e2e/a11y.spec.ts`            | `npm run test:e2e` |
| Keyboard             | Tab order matches reading order, every stop has a visible focus ring, the skip link works, a whole journey and error recovery work with no mouse      | `e2e/keyboard.spec.ts`        | `npm run test:e2e` |
| Colour contrast      | Every text and control colour pair in the design tokens, computed from `tokens.css`                                                                   | `src/styles/contrast.test.ts` | `npm test`         |
| Roles and names      | Component and journey tests find things by role and accessible name (banner, alerts, status, table, groups), so the semantics are asserted throughout | `src/**/*.test.tsx`           | `npm test`         |
| Mobile layout        | No sideways scroll at 320px, touch targets at least 44px, schedule rows stacked                                                                       | `e2e/mobile.spec.ts`          | `npm run test:e2e` |

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

Text needs 4.5:1 and the edge of a control or the focus ring needs 3:1.

| Pair                                                                  |      Ratio |
| --------------------------------------------------------------------- | ---------: |
| Text on white card                                                    |       15.6 |
| Muted text on white card                                              |        5.9 |
| Muted text on page background                                         |        5.2 |
| Muted text on muted surface                                           |        4.8 |
| White text on brand button                                            |        7.8 |
| Error text on white                                                   |        7.5 |
| Success, warning, danger and info colours on their tinted backgrounds | 5.1 to 6.8 |
| Focus ring (brand) on white                                           |        7.8 |
| Focus ring on tinted banners                                          | 6.5 to 6.9 |
| **Input border on white (after fix)**                                 |    **3.7** |

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
  token, `--color-border-control` (`#80868d`, 3.7:1), now outlines every input.
  Cards and dividers keep the soft border because they are decorative.

The automated scan found no violations in any state, so nothing else needed
fixing. The scan was confirmed to be able to fail: making the muted text colour
too light makes it report a contrast violation.

## Known limits and trade-offs

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

- Use the design tokens. Add any new colour pair to `src/styles/contrast.test.ts`.
- Keep the focus ring: never set `outline: none` without an equal replacement.
- Build form controls from the shared field components so labels, hints and
  errors stay connected.
- Keep touch targets at least 44px (`--touch-min`).
- Add new screen states to `e2e/a11y.spec.ts`.
