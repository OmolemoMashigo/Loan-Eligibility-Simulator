# ADR 001: Mock the API in the browser, including the Docker image

## Status

Accepted.

## Context

There is no loan service to call. A static nginx image that 404s `/api/*`
would not be a runnable app. The brief still asks for a Dockerfile a reviewer
can build and run.

The same four endpoints have to work in local Vite, Vitest, Playwright, and
the image, or the engine and the UI will drift.

## Decision

MSW serves all four endpoints in the browser. The same handlers and the same
pure engine run in Node for unit tests. Mocks stay on unless
`VITE_ENABLE_MOCKS=false`.

The Docker image is still a static nginx box. Nginx does not implement `/api`.
The service worker (or the in-memory fetch fallback on plain HTTP) answers
those calls after the page loads. That is why the worker file ships in `dist`.

## Consequences

- One engine, one set of handlers, three runtimes.
- `docker build` / `docker run` is enough to demo the full form.
- A later Spring (or other) service can replace MSW without changing the UI,
  by turning the flag off and setting `VITE_API_BASE_URL`.
- Reviewers need a secure context (HTTPS or localhost) for the service
  worker. Localhost on port 8080 is one.
