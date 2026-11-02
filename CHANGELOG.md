# Changelog

## [1.0.0] — 2026-11-02

First complete release: a Personal Loan estimate you can run with Docker or
locally, with a mock API in the browser.

### Added

- Three-step form (loan, personal, money) built from the validation-rules API
- Eligibility result with likelihood, risk, reason, and rand figures
- Affordability breakdown and a full repayment schedule (first rows, then
  show all)
- What-if amount and term on the result (re-runs eligibility, then the
  schedule)
- Next steps after a decline, and Edit your details
- Optional credit score (blank uses the unknown rate band)
- Light and dark theme; only that choice is stored
- Docker image (`nginxinc/nginx-unprivileged` on port 8080) with security
  headers
- README (Docker first), spec assumptions, and architecture notes
- Playwright journeys, keyboard, mobile, axe, and coverage gates in CI
- Mock API on phone HTTP (in-memory fallback when there is no secure context)

### Changed

- Form is a locked wizard with a result view of its own, not one long page
- Third step is labelled Results
- Header colour is `#2E71EF`

## [0.1.0] — 2026-11-01

Mock engine, typed client, shared UI, and the eligibility form (no result
view yet).
