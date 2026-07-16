# Design System → umgezogen

Das JLU Design System (Tokens, Komponenten, Theming, ESLint-Plugin,
Governance-Doku) lebt seit v0.1.0 in einem eigenen Repository und wird hier
als Paket konsumiert:

- **Repo**: https://github.com/KI4JLU/JLU-Design-System
- **Paket**: `@ki4jlu/design-system` (GitHub Packages, siehe `.npmrc`)
- **Doku/Beispiele**: Storybook im Design-System-Repo (`npm run storybook`)
- **Governance**: `docs/DESIGN_SYSTEM.md` und `docs/COMPONENT_GUIDELINES.md`
  im Design-System-Repo

In dieser App gilt weiterhin: Komponenten aus `@ki4jlu/design-system`
importieren, Farben nur über semantische Tokens (ESLint erzwingt beides —
das Plugin kommt jetzt aus dem Paket, `@ki4jlu/design-system/eslint-plugin`).
