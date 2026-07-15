---
name: kanban-doku
description: Tracks work progress, decisions, and milestones for CampusAgents as cards on this repo's kanban board (kanban-mcp). Use whenever a task is started, the status of an in-progress task changes (e.g. in progress, in review, done), or an interim result/decision should be recorded. Trigger phrases: "put it on the board", "kanban", "create/move a card", "track progress", completing a milestone.
---

# Kanban tracking (kanban-mcp)

This project tracks tasks and progress on a Kanban board in addition to the Markdown docs, so that
across sessions it stays visible what is open / in progress / done.

## Board coordinates (kanban-mcp tools)

- Workspace: `KI` — publicId `o8h0ip5s4bvv`
- Board: `JLU CampusAgents` — publicId `dag7v44umvdu` (slug `chatbot-widgets`)

**Lists** (in order) — use these publicIds directly:

| List | publicId | Meaning |
|---|---|---|
| `Backlog` | `99lb76g5bnxb` | Known future work, not scheduled yet |
| `Zu erledigen` | `6p5vgd8xd54k` | Scheduled, ready to pick up next |
| `In Bearbeitung` | `sgckgoabmv8l` | **Actively being worked right now** |
| `Code-Review` | `70g5qsx93sgh` | Finished, awaiting review/verification |
| `Fertig` | `9t94k7h88mgw` | Finished and verified |

**Labels** — publicIds:

| Label | publicId |
|---|---|
| `Bug` | `maarrysmdypb` |
| `Feature` | `ykbz5qy6cjcg` |
| `Refactor` | `sxfxizxr9c39` |
| `Plan` | `8nk47lyn6hoj` |
| `Test` | `fd8od7mlg8z6` |
| `Kritisch` | `e489xfxyi2hc` |
| `Dokumentation` | `vcw9l923lmlm` |
| `prio high` | `n4c4h5vzzdn3` |
| `prio medium` | `xkfhcjv5phvn` |
| `prio low` | `buf1avinm6rg` |

> If a call fails with a stale-id error (board recreated, lists renamed, etc.), re-resolve:
> `list_workspaces` → the workspace → `get_board` with the board publicId → read the current
> `lists`/`labels` ids, **and update the tables above in this file** so the next session is correct
> again. Do **not** use `find_board_by_name` (throws an internal error on a name mismatch instead of
> a clean "not found"); use `get_board` / `get_board_by_slug`.

## The core rule: `In Bearbeitung` must mirror reality

**Whenever you are actively working a milestone, exactly that card must be in `In Bearbeitung`.**
Concretely, on every substantive task:

1. **Before starting work** — make sure a card exists for it (create one if not) and move it to
   `In Bearbeitung` (`update_card` with the `In Bearbeitung` list publicId, `index: 0`). If a card
   is already in `In Bearbeitung` for the previous task, resolve it first (step 3) — don't leave
   two cards in `In Bearbeitung` unless both really are in flight.
2. **While working** — keep interim results/decisions on the card. Update the card **description** to
   capture the "why" of a decision. *(See caveat on comments below.)*
3. **When finishing** — move the card **out of `In Bearbeitung`**:
   - → `Code-Review` if someone should verify the result first (default for milestones that produce
     an artifact to inspect), **or**
   - → `Fertig` if it is a small, self-evidently complete step.

**Anti-patterns to actively avoid:**
- Working on something while `In Bearbeitung` is empty. If you catch this, move the right card in.
- Leaving a completed task sitting in `Zu erledigen`/`Backlog`. If work is done, it belongs in
  `Code-Review` or `Fertig`, never in a pre-start list.
- A card in `In Bearbeitung` that nobody is working on. Pausing mid-milestone is fine (it *is* in
  progress) — but a finished one must be moved.

At the start of a session, `get_board` and reconcile before doing new work.

## When to create a card

- A new milestone is started.
- A non-trivial bug or open uncertainty is found that should be tracked beyond this session.

Create in `Backlog` or directly in `Zu erledigen` (`create_card`). Title short and concrete
(conventional-commit style, e.g. `feat: ...`, `fix: ...`, matching the board's existing cards);
description with context and a reference to the related doc if any. Attach the right label
(`toggle_card_label`).

## Tooling caveats (verified on this kanban server)

- **`update_label`** may require `colourCode` even when you only want to rename a label.
- Use `update_card` `index: 0` to place a moved card at the **top** of its target list.

## What does not belong on the board

- No secrets/credentials/tokens in card text or comments.
- Nothing the repo's CLAUDE.md marks as off-limits for a hosted third-party service.
