---
name: design-import-audit
description: Offload token-heavy reading/mapping work for a large design-system import or migration to the antigravity MCP (Gemini 3.1 Pro's separate context/quota), then execute the resulting checklist in Claude. Use when starting an import of an external design system, or auditing a large unfamiliar codebase before a migration. Trigger phrases: "design system import", "migrate to design system", "audit this design system", "large import audit".
---

# Design-system import audit via Antigravity

Large design-system imports (reading an entire unfamiliar source project, diffing it against the target system, and enumerating every call site to change) are read-heavy, not judgment-heavy. That read pass is exactly what to hand to `mcp__antigravity__ask_antigravity`: it has its own context window and its own Ultra-plan quota, separate from this session's, so it can hold two whole trees in memory without spending Claude's budget on files that mostly need to be *read*, not *decided on*.

The tool is advisory-only — no file edits, no shell, no git. The pattern is: **agy reads and maps → Claude executes and edits → `cross-review` verifies.**

## Procedure

1. **Bulk inventory of the source.** Call `ask_antigravity` with `paths` pointing at the source project's component/token folders (or the whole repo if small enough). Ask for a structured extraction: component list, prop APIs, styling/token conventions, naming patterns, anything DS-specific (variants, composition patterns, accessibility conventions).

2. **API diff against the target.** Call `ask_antigravity` again with `paths` covering BOTH the source project and the target design system (e.g. `JLU-Design-System`). Ask for a component-by-component / prop-by-prop compatibility map: renamed props, removed variants, changed defaults, structural differences. Ask it to flag anything ambiguous rather than guess.

3. **Usage-site scan of the consumer app.** Call `ask_antigravity` with `paths` at the consuming app's `src/` (this repo, or wherever the import lands). Ask it to enumerate every call site that would need touching for each change identified in step 2 — a mechanical checklist, file:line, not a judgment call.

4. **Verify before executing.** Spot-check a sample of the returned findings (inventory entries, diff claims, call sites) against the actual code before treating the checklist as ground truth — Gemini reviews hallucinate here same as anywhere else (see `cross-review`'s verification step).

5. **Execute.** Work the verified checklist directly — Claude does the actual edits; `ask_antigravity` cannot.

6. **Cross-review the result.** Once edits are made, run the `cross-review` skill on the diff as normal.

## When NOT to use this

For small, single-file, or judgment-heavy changes, just read the files directly — the overhead of round-tripping through another model isn't worth it. This skill earns its keep specifically when the source material is too large to comfortably fit in Claude's own context alongside the target codebase.
