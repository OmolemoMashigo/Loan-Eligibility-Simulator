# ADR 002: One screen, no router

## Status

Accepted.

## Context

The brief is a single estimate: collect details, show a result, maybe adjust
the amount. Putting those values in the URL would leak income, debt, and a
credit score through history, logs, and screenshots.

React Router would also imply more than one resource, which this app does not
have.

## Decision

There is no router. The form and the result are views of the same page.
Browser Back does not mean “previous step”; it is ignored while the simulator
is open, because steps are not routes. In-app Back and “Edit your details”
change React state only.

Financial values never land in the query string. The only stored value is the
theme.

## Consequences

- Shareable result links are impossible, which is the point.
- Deep-linking to a step is impossible. The wizard always starts on the first
  step.
- The Docker and Vite apps behave the same: one URL, one page.
