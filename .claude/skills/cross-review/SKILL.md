---
name: cross-review
description: Independent cross-model review of pending changes via the antigravity MCP (Gemini 3.1 Pro). Use before merging any nontrivial PR or branch, and ALWAYS when a change touches openapi.yaml, internal/specmw, auth/token handling, or credential flows. Trigger phrases: "cross-review", "second opinion", "gemini review", "antigravity review".
---

# Cross-model review via Antigravity

Get an independent review from a non-Claude model family before merging. The reviewer is `mcp__antigravity__ask_antigravity` (default: Gemini 3.1 Pro High). It is advisory-only: it reads, you verify and act.

## Procedure

1. **Determine scope.** If an argument names a PR (`#N`), use `gh pr diff N --name-only`. Otherwise diff the current branch against `main` (`git diff main...HEAD --name-only`); fall back to staged/working-tree changes if the branch has none. Skip lockfiles and generated code (e.g. files produced by oapi-codegen / openapi-typescript).

2. **Collect context.** Convert the changed files to absolute paths. If more than ~15 files changed, pass the containing folders instead of individual files.

3. **Ask for the review.** Call `mcp__antigravity__ask_antigravity` with:
   - `paths`: the absolute paths from step 2, plus `openapi.yaml` whenever API code changed (it is the source of truth).
   - `prompt`: include the actual diff (`git diff main...HEAD` or `gh pr diff N`), a one-paragraph statement of intent, and ask specifically for: correctness bugs, edge cases, security issues (authn/authz gaps, injection, credential leaks), and contract drift between spec and implementation. Ask for concrete file:line findings, not style commentary.

4. **Escalate contested findings.** For security-critical changes or when a finding seems plausible but uncertain, run a second pass with a different `model` override (e.g. `"GPT-OSS 120B (Medium)"`) and compare.

5. **Verify before reporting.** Check each finding against the code yourself. Report only confirmed or credibly-plausible findings, marked as such; silently drop hallucinated ones (note the count). You own the verdict — the external review is input, not authority.

## Mandatory triggers

Run this skill without being asked whenever a pending merge touches:
- `openapi.yaml` or spec-generated wiring
- `internal/specmw` or any auth/token/credential handling
- security-sensitive connector code (e.g. the EWS e-mail connector)
