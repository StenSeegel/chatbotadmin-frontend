# Design System — Governance & Foundation

Status: **Phase 0 (Foundation) — in place.** This document is the contract for how
tokens and shared components are added, reviewed, and versioned. It exists *before*
migration begins so token/component sprawl cannot start on the first migrated screen.

---

## 1. Ownership

| Role | Owner | Responsibility |
|------|-------|----------------|
| Design system owner | _TODO: assign a name_ | Final say on tokens, component API, and variants. Reviews every PR touching `src/index.css`, `src/components/ui/`, `src/theme/`, or these docs. |
| Contributors | Whole frontend team | May propose tokens/components via the process below. |

The review gate is wired via [`.github/CODEOWNERS`](../.github/CODEOWNERS): edits to the
design-system paths auto-request the owner's review.

> **Action required:** replace `@design-system-owner` in `.github/CODEOWNERS` with a
> real GitHub username/team. Until then the gate documents intent but does not enforce.
> Without a named owner this governance is advisory only, and the plan warns sprawl will
> start within the first couple of migrated screens.

---

## 2. Token Architecture (two layers)

Tokens live in [`src/index.css`](../src/index.css) and are split into two layers so
themes change without touching component code.

### Layer 1 — Primitive tokens (`--p-*`)
Raw values with **no meaning** (e.g. `--p-blue-600`, `--p-gray-100`). Defined in the
plain `:root` block, deliberately **outside** `@theme` so Tailwind does *not* generate
`--p-*` utilities. **Never reference a primitive in a component.**

### Layer 2 — Semantic tokens (`--color-*`, `--radius-*`, `--spacing-*`, `--shadow-*`, …)
Describe **intent** and reference primitives via `var(--p-*)`. Defined in the `@theme`
block, which is what generates the Tailwind utilities (`bg-primary`, `text-on-surface`,
`bg-success`, `shadow-card`, …). **Application code uses only these.**

```
Component  ─uses→  Semantic (--color-primary)  ─references→  Primitive (--p-blue-600)
```

### What exists today
- **Brand/surface/text/outline** — Material-3 style semantic set (`primary`, `surface`,
  `surface-container-*`, `on-surface`, `outline`, …).
- **Status/feedback** — `success`, `warning`, `info` (+ `on-*` and `*-container`
  variants). These replace the scattered `green-*` / `teal-*` / `amber-*` utilities.
- **Interaction states** — `primary-hover`, `primary-active`, `focus-ring`, `disabled`,
  `on-disabled`.
- **Elevation** — `shadow-card`, `shadow-card-hover`, `shadow-overlay` (custom names so
  Tailwind's default `shadow-sm/md/lg` scale is not clobbered).
- **Typography / spacing / radius** — display/headline/label/stat/body scales,
  `spacing-gutter`/`stack-*`/`margin-page`, `radius-*`.

### Layering status — complete (Phase 1)
Every semantic color token (light **and** dark) now references a primitive via
`var(--p-*)`. **No literal hex remains in the `@theme` block or the dark-mode block** —
raw values live only in the `:root` primitive layer. Primitive ramps: `blue` (brand),
`slate` (secondary), `rose` (tertiary), `gray` (neutral surfaces/text/borders), `red`
(error), `green`/`amber`/`teal` (status). The relocation was value-exact — no visual
change versus Phase 0.

Guardrail for reviewers: `grep -nE '^\s*--(color|shadow)-[a-z-]+:\s*#' src/index.css`
must return nothing (a semantic token with a literal hex fails review).

### Accepted color exceptions (documented, not oversights)
Application code is otherwise token-only. These intentionally keep literal colors —
new ones need the same explicit justification in review:
- **Code/terminal viewer** — `CodeBlock` in `WidgetEmbedPage.tsx` (`bg-[#1e1e2e]`,
  `text-slate-100`, `text-emerald-400/80`): a deliberately editor-styled snippet that
  stays dark in both themes. Revisit if we adopt a syntax-highlight theme.
- **Chart SVGs** — donut/bar `fill`/`stroke` hex in `StatisticsPage.tsx`: SVG
  presentation attributes, no token vocabulary for chart series yet.
- **User-configured accent** — `StandaloneWidgetPage.tsx` applies the widget owner's
  runtime `accent` color via inline `style`; `text-white`/`bg-white/*` there are
  contrast-on-accent, not palette styling. This is data, not a design token.

---

## 3. Theming

- The active theme lives on `<html data-theme="light|dark">`. The dark block in
  `index.css` (`[data-theme="dark"]`) overrides the *semantic* tokens only.
- [`ThemeProvider`](../src/theme/ThemeContext.tsx) resolves the user's choice —
  **light / dark / system** — persists it to `localStorage` ("theme"), and tracks the OS
  setting while on "system". A no-flash inline script in `index.html` applies the same
  resolution **before first paint** (keep the two in sync). Users switch via
  [`ThemeToggle`](../src/components/ui/theme-toggle.tsx) (in the sidebar + top bar).
- No `@media (prefers-color-scheme)` in our CSS — "system" is resolved in JS, so there
  is a single dark block (no duplication).
- Every theme must define values for: default, **hover, active, focus, disabled**,
  borders, elevated surfaces, and shadows. Background + text alone is not sufficient —
  missing states are the most common source of visual bugs.
- Both themes require a **visual QA pass** before merge, not just code review.

---

## 4. Component Rules

- Application code uses **shared UI components** (`@/components/ui/*` from Phase 2). No
  raw `<button>` / form controls without a documented justification in the PR.
- **No hardcoded colors.** Every color goes through a semantic token. This includes
  `green-*` / `teal-*` — use `bg-success` / `text-info`, etc.
- Compose classes with `cn()` from [`@/lib/utils`](../src/lib/utils.ts).
- New component **variants require review** by the design system owner before merge.
- shadcn/ui is configured via [`components.json`](../components.json)
  (`npx shadcn@latest add <component>` drops into `src/components/ui/`). Components
  added this way ship with shadcn's own token names (`bg-background`,
  `text-primary-foreground`, …) — **re-point them to our semantic tokens**
  (`bg-surface`, `text-on-primary`, …) before merge, so there is one vocabulary.
- `cva` variant maps live in a sibling `*-variants.ts` file (see
  [`button-variants.ts`](../src/components/ui/button-variants.ts)), not in the
  component file, to satisfy react-refresh's "only export components" rule.

### Shared component inventory (`src/components/ui/`)
| Component | File | Notes |
|-----------|------|-------|
| `Button` (+ `buttonVariants`) | `button.tsx` / `button-variants.ts` | variants: default/secondary/outline/ghost/destructive/link; sizes: default/sm/lg/icon; `asChild` via Radix Slot |
| `Card` (+ Header/Title/Description/Content/Footer) | `card.tsx` | surface + border + `shadow-card` |
| `Input` | `input.tsx` | honors `aria-invalid` styling |
| `Label` | `label.tsx` | Radix Label |
| `Dialog` (+ parts) | `dialog.tsx` | Radix — focus trap, Esc-to-close, ARIA, scroll lock |
| Form field primitives | `form.tsx` | `FormItem/FormLabel/FormControl/FormDescription/FormMessage`; a11y label + `aria-describedby`/`aria-invalid` wiring; **no** react-hook-form (add later if forms need schema validation) |

### Tooling & enforcement
- **Lint gate** — a local ESLint plugin
  ([`tools/eslint-plugin-design-system.js`](../tools/eslint-plugin-design-system.js))
  runs in CI (`npm run lint`):
  - `design-system/no-hardcoded-colors` (**error**) — blocks raw Tailwind palette
    utilities (`bg-blue-500`, `dark:text-green-400`) and hex classes (`bg-[#1e1e2e]`).
    Genuine exceptions need an `// eslint-disable-next-line` **with a reason**.
  - `design-system/no-raw-ui-elements` (**warn**) — surfaces raw `<button>`/`<input>`
    that should be `Button`/`Input`. Warn, not error, because some low-level controls
    (dropdown internals, range/color inputs, textareas) legitimately stay raw.
- **Component workbench** — [Ladle](https://ladle.dev): `npm run ladle` (dev) /
  `npm run ladle:build`. Stories live next to components as `*.stories.tsx`; the global
  provider ([`.ladle/components.tsx`](../.ladle/components.tsx)) loads the tokens + theme
  so stories render on real surfaces and the ThemeToggle story flips themes live.
- **Review gate** — [`.github/CODEOWNERS`](../.github/CODEOWNERS) requests the owner's
  review on any design-system path.

---

## 5. Accessibility (requirement, not follow-up)

Minimum bar for every shared component:
- WCAG-compliant contrast (both themes)
- Full keyboard navigation
- Visible focus indicator (use `focus-ring` token)
- Accessible dialog behaviour: focus trap, escape to close, correct ARIA roles
- Proper form labels + validation messaging (`aria-invalid` / `aria-describedby`)

---

## 6. Contribution Process

**Adding/changing a token**
1. Add the primitive (if a new raw value) to the `:root` block.
2. Add/point the semantic token in `@theme` at that primitive.
3. Provide the dark-mode value in the `prefers-color-scheme` block.
4. Note it in the Changelog. PR requires owner approval.

**Adding a component / variant**
1. Prefer `npx shadcn@latest add <component>`; style with tokens only.
2. Meet the accessibility bar (§5). Add a test where behaviour is non-trivial.
3. New variants need explicit owner review.

---

## 7. Versioning & Changelog

The design system is versioned with the app for now (no separate package until Phase 5
extraction). Record every token/component change here.

### Changelog
- **Phase 4** — Added the enforcement layer: local ESLint plugin
  (`no-hardcoded-colors` = error, `no-raw-ui-elements` = warn) wired into CI lint;
  Ladle component workbench with stories for Button/Card/Input/Form/Dialog/ThemeToggle;
  `.github/CODEOWNERS` review gate for design-system paths. Documented the CodeBlock
  color exception inline with disable comments.
- **Phase 3** — Shipped theme switching (light/dark/system via `ThemeProvider` +
  `ThemeToggle`, `data-theme` on `<html>`, no-flash script; CSS moved off
  `prefers-color-scheme`). Migrated the remaining screens (dashboard, widget config
  forms, embed, widget dashboard, conversations, statistics, standalone chat widget,
  search toolbar, cards) to shared components + semantic tokens; removed scattered
  `green/teal/amber` literals. Wrote [COMPONENT_GUIDELINES.md](./COMPONENT_GUIDELINES.md).
  Build/lint/test green. Accepted exceptions logged below.
- **Phase 2** — Built shared UI components on shadcn/ui patterns in
  `src/components/ui/` (Button, Card, Input, Label, Dialog, Form field
  primitives), styled with our semantic tokens; installed Radix primitives
  (`react-slot`, `react-dialog`, `react-label`). Migrated the authentication
  screens (`LoginPage`, `AuthCallbackPage`) and an app-shell control
  (`TopAppBar`) onto them. Build/lint/test green.
- **Phase 1** — Completed the two-layer refactor: all light + dark semantic color
  tokens now reference primitives (`var(--p-*)`); zero literal hex left in the semantic
  layer. Added full `slate`, `rose`, and neutral `gray` primitive ramps plus
  `green/amber/teal-200`. Value-exact — no visual change.
- **Phase 0** — Introduced primitive/semantic token layering; added status
  (`success`/`warning`/`info`), interaction-state, and elevation tokens; installed
  shadcn/ui foundation (`cn()`, `@/` alias, `components.json`, `clsx`/`tailwind-merge`/
  `class-variance-authority`); authored this governance doc.

---

## Roadmap (from the implementation plan)

| Phase | Scope |
|-------|-------|
| **0 — Foundation & Governance** *(done)* | Token layering, missing state/status/elevation tokens, shadcn/ui scaffolding, ownership & process. |
| **1 — Foundation cleanup** *(done)* | All semantic tokens (light + dark) backed by primitives; minimal token set finalized. |
| **2 — Core components + first migration** *(done)* | Button, Card, Input, Label, Dialog, Form built on shadcn/ui; auth screens + app-shell control migrated. |
| **3 — Full migration + theming** *(done)* | Remaining screens migrated to shared components + tokens; light/dark/system theme toggle shipped; usage guidelines written. |
| **4 — Governance + tooling** *(done)* | ESLint enforcement (hardcoded colors + raw controls), Ladle workbench, CODEOWNERS review gate. Owner name still to be assigned. |
| 5 — Extraction (deferred) | Only once a 2nd app needs it: extract tokens + component lib to packages; add Style Dictionary if multi-target. |
