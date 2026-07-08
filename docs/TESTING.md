---
title: Testing Guide
category: Development
folder: Engineering
version: 1.0
---

# Testing Guide

## Overview

This project is covered by automated tests on two layers that together exercise
the full chatbot-widget flow — *user question → widget.js → API → Knowledge Base
→ answer with sources → rendered reply*:

- **Frontend** — [Vitest](https://vitest.dev/) with a `jsdom` environment and
  Testing Library. Covers the widget data store, the `ModelCombobox`, and an
  integration test that loads the real `public/widget.js` and drives its DOM.
- **Backend** — Go's standard `testing` package. Covers the `widgets` module:
  Knowledge-Base resolution, the public per-widget chat endpoint (with a fake
  upstream), validation, and rate limiting.

Both layers are **hermetic**: no database, no network, and no running backend are
required to run them.

## Use Cases

- Confirm a code change does what it should before opening a PR.
- Guard the widget → API → Knowledge-Base pipeline against regressions.
- Verify the embedded widget renders answers (including sources) and shows a
  clear error when the chat endpoint rejects a request.
- Gate CI on `lint` + `build` + `test`.

## Getting Started

Run the suites locally from the repository root.

1. Install dependencies once: `npm install` (frontend) and `go mod download`
   inside `go-backend/` (backend).
2. Run the **frontend** tests: `npm test` (one-shot) or `npm run test:watch`
   (re-runs on change).
3. Run the **backend** tests: `cd go-backend && go test ./...`.
4. Read the summary — every suite must report all tests passing before you push.

## Options and Settings

Available commands and how to scope a run:

- `npm test`
    Runs the whole frontend suite once (`vitest run`).
- `npm run test:watch`
    Interactive watch mode; re-runs affected tests on save.
- `npm run test:coverage`
    Runs with a V8 coverage report.
- `npx vitest run src/widget/widget.integration.test.ts`
    Runs a single frontend file.
- `npx vitest run -t "Quellen"`
    Runs only tests whose name matches a pattern.
- `go test ./internal/widgets/... -v`
    Runs one backend package with per-test output.
- `go test ./... -run TestChat_ResolvesKB`
    Runs a single backend test by name.

## Notes

- **No live services needed.** Frontend tests mock `fetch`; backend tests use a
  fake store and an `httptest` server standing in for the Knowledge-Base
  endpoint. You do **not** need the go-backend, Postgres, or the widget portal
  running to execute the suites.
- **Test locations** are fixed by convention: frontend tests live next to the
  code as `*.test.ts` / `*.test.tsx` under `src/`; backend tests are `*_test.go`
  next to the package under `go-backend/internal/`.
- **jsdom does not implement `innerText`.** `widget.js` uses it for plain-text
  bubbles, so the widget integration test installs a small `innerText →
  textContent` shim. Keep it when adding tests that assert on plain-text nodes.
- **Type-checking for tests** is provided by `tsconfig.test.json` (referenced
  from the root `tsconfig.json`). It includes the test files and
  `src/test/setup.ts`, which loads the `@testing-library/jest-dom/vitest`
  matcher types — this is why `toBeInTheDocument` / `toHaveValue` resolve in the
  editor. `tsc -b` (run by `npm run build`) type-checks the tests too.
- **Async React updates** must be flushed inside `act(...)`. Prefer
  `findBy*` / `waitFor` / `userEvent`; for a fire-and-forget effect with no
  visible change, `await act(async () => {})` after `render`.

## Advanced Settings

Patterns to follow when writing new tests.

**Backend — pipeline integration (`go-backend/internal/widgets/chat_test.go`):**
- Implement the `widgets.Store` interface with an in-memory `fakeStore` — no
  Postgres.
- Stand up a fake Knowledge-Base with `httptest.NewServer` and point
  `modelproxy.NewHandler("test-key", server.URL)` at it. Record the request body
  to assert the backend sent the widget's KB as the model (not a client value)
  and the token cap from config.
- Route requests through a real `http.ServeMux` (`POST /api/widgets/{id}/chat`)
  so `r.PathValue("id")` is populated exactly as in production.
- Return answers with a `**Quellen:**` block in the `content` — that is how the
  upstream (justRAG) delivers sources — and assert they reach the client.

**Frontend — widget rendering (`src/widget/widget.integration.test.ts`):**
- Read `public/widget.js` from disk and evaluate it with `new Function(src)()`
  after the DOM placeholder and `fetch` mock are in place.
- Mock `fetch` for both calls: `GET /api/widgets/:id` (config) and
  `POST /api/widgets/:id/chat` (an SSE stream built from a `ReadableStream`).
- Drive the real DOM (click the FAB, type into the input, click send) and assert
  on the rendered message bubbles.

**Frontend — components/stores:** mock the data module (`vi.mock("../data/...")`)
or `apiFetch`, render with Testing Library, and assert on roles/text.

## Recommendation

Before pushing, run both suites plus lint from the repo root:

```bash
npm run lint && npm test && (cd go-backend && go test ./...)
```

For day-to-day work on a single area, use `npm run test:watch` for the frontend
and `go test ./internal/<pkg>/...` for the backend to get the fastest feedback,
then run the full command above as a final check. CI runs the same gates, so a
green local run means a green pipeline.
