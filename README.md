# Loan Eligibility Simulator

[![Verify](https://github.com/OmolemoMashigo/Loan-Eligibility-Simulator/actions/workflows/verify.yml/badge.svg)](https://github.com/OmolemoMashigo/Loan-Eligibility-Simulator/actions/workflows/verify.yml)

A responsive web app that estimates Personal Loan eligibility from income,
expenses, and loan details. The result is an estimate, not a credit offer.
Nothing entered is stored.

There is no real loan service. A mock API (MSW) and a deterministic engine
run in the browser in development, tests, and the Docker image. See
[why the mock ships in the image](docs/adr/001-msw-in-the-image.md).

## Run with Docker

Needs Docker Desktop (or another Docker Engine). The first build runs lint,
unit tests, and a production build, so it takes a few minutes.

```bash
docker build -t loan-simulator .
```

Then, in a separate command:

```bash
docker run -p 8080:8080 loan-simulator
```

Open [http://localhost:8080](http://localhost:8080). Stop the container with
Ctrl+C in that terminal.

The image is `nginxinc/nginx-unprivileged` on port 8080, with security
headers. `/api/*` is answered in the browser, not by nginx.

## Local development

Needs **Node 22** (see `.nvmrc`) and npm.

```bash
npm ci
npm run dev
```

Open the printed local URL (Vite’s default is
[http://localhost:5173](http://localhost:5173)). The dev server also binds
the LAN address, so a phone on the same network can open it over HTTP. On an
insecure origin the mock API uses an in-memory `fetch` fallback instead of a
service worker.

### Try a sample

The form is three steps: **Loan details**, **Personal details**, then
**Results**.

| Field            | Sample value     |
| ---------------- | ---------------- |
| Amount           | R150,000         |
| Period           | 24 months        |
| Purpose          | Home improvement |
| Age              | 35               |
| Employment       | Employed         |
| Duration         | 24 months        |
| Monthly income   | R25,000          |
| Monthly expenses | R15,000          |
| Existing debt    | R5,000           |
| Credit score     | 650              |

That combination is eligible at **12.5%**. The monthly payment is the
standard annuity (**R7,096.10**), not the spec’s printed sample. Loan-to-income
is **50.0**, not 60.0. Credit score can be left blank (priced at 14.5%).
Unemployed is valid: duration is hidden, and a decline is based on cash flow,
not status.

After a result you can change the amount or period on the page. That re-runs
eligibility, then reloads the schedule. **Edit your details** brings the form
back with the values still there.

A light/dark switch is in the header. Only that choice is saved.

## Tests

```bash
npm run verify
```

That is lint, typecheck, unit tests, and a production build. GitHub Actions
runs the same checks on every pull request, plus coverage thresholds, a
production `npm audit`, and Playwright.

```bash
npm test                 # Vitest (jsdom)
npm run test:coverage    # same tests with coverage gates
npx playwright install chromium   # once
npm run test:e2e         # journeys, keyboard, mobile, axe, theme
```

End-to-end tests hit the production build via `vite preview`. They are not
part of `npm run verify`; run them before a release, as CI does.

Accessibility notes, including what was checked by hand, are in
[docs/accessibility.md](docs/accessibility.md).

## Spec and design notes

- [Spec assumptions](docs/spec-assumptions.md) — gaps in the API note, and
  the calls made in the engine (amortisation, ratios, unemployed, schedule).
- [ADR 001](docs/adr/001-msw-in-the-image.md) — mock API in the Docker image.
- [ADR 002](docs/adr/002-one-screen.md) — one page, no router, no financial
  data in the URL.
- [ADR 003](docs/adr/003-validation-rules-drive-the-form.md) — form schema
  from `GET /api/loans/validation-rules`.

## Stack

React 19, TypeScript (strict), Vite 6, React Hook Form, Zod, TanStack Query,
MSW, CSS Modules, Vitest, Testing Library, Playwright, ESLint, Prettier,
Husky. Node is pinned in `.nvmrc`. The lockfile is committed.

To point the UI at a real service instead of MSW:

```bash
VITE_ENABLE_MOCKS=false VITE_API_BASE_URL=https://example.invalid npm run build
```
