# Spec assumptions

The attached API note is incomplete in places and inconsistent in others. This
page records the calls made in the mock engine and the UI, so a reviewer can
see why the sample figures are not copied blindly. Constants live in
`src/mocks/engine/config.ts`. Tests lock the arithmetic.

## Product and form

**SI-1 Personal Loan only.** The products list includes Vehicle Finance
(R50k–R1.5m, 12–72 months), but the validation rules cap amount at R300k and
term at 60 months. The simulator prices Personal Loan only. Products are still
fetched, so the name, purposes, and bounds come from the API. Vehicle Finance
is listed and then ignored.

**SI-2 `loanPurpose` vs `loanType`.** Eligibility sends a purpose. The rate
calculator expects `loanType`. Every calculate-rate call sends
`loanType: "personal_loan"`. Purposes are the personal product list:
debt consolidation, home improvement, education, medical, other.

**SI-3 Employment duration.** The rules require at least 3 months, which
cannot apply to `unemployed` or `retired`. Duration is shown and required only
for `employed` and `self_employed`. It is hidden and omitted from the request
otherwise.

**SI-4 Age and retired.** Age 18–65 is enforced for every status, including
retired. A retired applicant of 70 is invalid here even though that would be
odd in a real book. The spec gave one age rule; it is applied as written.

**SI-5 Units are months.** The spec never says “months” on duration or term.
Product `minTerm` / `maxTerm` and the sample value `24` only make sense as
months. Fields are labelled in months, with a live echo such as
“24 months = 2 years”.

**SI-9 Gaps in validation-rules.** The endpoint omits `existingDebt`,
`loanPurpose`, and upper bounds on income, expenses, and duration. The form
uses the endpoint where it speaks, and documented local defaults otherwise.
Mock handlers re-validate every request. Existing debt is required; `0` is
valid.

**SI-16 Credit-score scale.** The spec uses 300–850 (FICO-like), not a typical
South African bureau scale. The form follows the spec.

**SI-17 Estimate, not an offer.** The spec has no disclaimer. A persistent
note says this is an estimate, not a credit offer, and that nothing entered is
stored.

**SI-18 Existing debt.** The email one-liner does not mention it. The API
does. The field is on the form, labelled as an outstanding balance.

## Money and the sample figures

**SI-6 Sample amortisation.** At 12.5% over 24 months on R150,000, a standard
monthly annuity is **R7,096.10** (total R170,306.40). The spec sample is
R7,089.50 / R170,148.00. Month-1 interest should be R1,562.50; the sample is
R1,562.33. The sample is internally consistent, just not with 12.5% / 12.
**Decision:** standard monthly annuity, round to cents, last payment absorbs
the remainder so the balance is exactly 0. Tests use an independent PMT, not
the printed sample rows.

**SI-7 Ratios and existing debt.** Disposable income in the sample is
`25000 - 15000 = 10000`. Existing debt is **not** subtracted, so it is a
balance, not a monthly instalment. The field is labelled “Total existing debt
(outstanding balance)”.

- DTI = `existingDebt / monthlyIncome * 100` (sample **20.0**).
- LTI = `requestedAmount / (monthlyIncome * 12) * 100`. That is **50.0** for
  the sample, not the printed **60.0**. 60.0 happens to be
  `maxAmount / annualIncome` (180000 / 300000), which is not a standard LTI
  definition and is treated as another placeholder, in the same class as
  SI-6.

**Max affordable amount.** Inverse-PMT at 85% of the sample disposable
(~R10,000) is about R179,676. Rounding **down** to R5,000 would give
R175,000. Rounding to the **nearest** R5,000, then clamping to product
min/max, reproduces the sample **R180,000**. A request is declined when the
payment would exceed 85% of disposable (the sample payment is about 71%, so
it stays eligible).

**Unemployed is not an automatic decline.** The spec lists `unemployed` as a
valid status and still requires income of at least R5,000. Auto-declining on
status alone would fight the form. Unemployment (and short tenure) raises
risk and lowers likelihood. Hard declines are only: no disposable income,
requested payment above 85% of disposable, or amount outside product bounds.

**SI-8 Optional credit score.** Blank means omit the field. Never send `0` or
`null`. The engine uses the unknown band (**14.5%**). The result asks the
user to add a score for a more accurate estimate.

**SI-12 Percents.** Values such as 12.5 and 20.0 are already percentages, not
fractions. Format them; do not multiply by 100 again.

**SI-13 Currency is ZAR.** Error strings use “R5,000”. All money goes through
one `en-ZA` / `ZAR` formatter.

## API shape and results

**SI-10 Error envelope.** The spec does not define one. Failures use
`{ error: { code, message, fieldErrors? } }` for 400/500. The client turns
every failure into one `ApiError`.

**SI-11 / SI-14 / SI-15 Schedule.** The sample shows two schedule rows as an
example, not a limit. The full schedule is returned. The UI shows the first
rows, then “Show all”. Eligibility has **no** `paymentSchedule`; that body
exists only on `POST /api/loans/calculate-rate`. After a successful
eligibility call, the app loads the schedule from calculate-rate for the
recommended amount. If the user later changes amount or term, eligibility
runs again (the decision can change), then the schedule refreshes.
Calculate-rate is never used alone for a what-if on amount or term.

## What is stored

Only the light/dark theme is saved (`localStorage` key `theme`). Inputs,
results, and other financial data are not written to storage, the URL, or
logs.

## Out of scope

Auth, a real credit bureau, saving applications, Vehicle Finance maths, i18n,
analytics, and any backend other than the mock API. Swap MSW for a real
service by setting `VITE_ENABLE_MOCKS=false` and pointing
`VITE_API_BASE_URL` at that service.
