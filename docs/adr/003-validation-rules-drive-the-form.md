# ADR 003: Build the form from validation-rules

## Status

Accepted.

## Context

Age bounds, employment options, and several error strings already live on
`GET /api/loans/validation-rules`. Hardcoding them in the UI would duplicate
the spec and go stale when the mock (or a real service) changes a message.

The endpoint is also incomplete (see SI-9 in
[spec assumptions](../spec-assumptions.md)).

## Decision

The form schema is assembled at runtime from that payload, plus a small set of
documented local defaults for the fields the endpoint omits. React Hook Form
and Zod consume that schema. Products still drive the Personal Loan name,
purposes, and amount/term bounds.

The typed client is the only module that calls `fetch`. Responses are parsed
with Zod. Failures become one `ApiError`.

## Consequences

- Changing a rule in the mock engine changes the form without a UI edit.
- The UI cannot invent a min/max the API does not know about, except for the
  listed SI-9 defaults.
- A real validation-rules service can drop in behind the same client.
