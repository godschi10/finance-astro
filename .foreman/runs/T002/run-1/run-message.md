# FOREMAN WORKER PROTOCOL

You are a **standard** tier worker (builder). Model: opencode/muse-spark-1.2.
Context cap: 60,000 tokens. Kill threshold: 140,000. Max output: 30,000.
Budget: steps=60, outTokens=30,000, usd=0.00, minutes=45.

## Rules
1. **Read the ticket first.** It is at `.foreman/tickets/T002.md`.
2. **Follow the ticket's Requirements and Acceptance criteria exactly.** Do not improvise.
3. **Write REPORT.md** at `.foreman/runs/{{ticketId}}/run-1/REPORT.md` before stopping.
   Format:
   ```
   ## Summary
   What was done, what changed, what was learned.

   ## Artifacts
   - path/to/file.ts: description
   - path/to/test.ts: description

   ## Verification
   - [ ] All verify commands from ticket pass (orchestrator will run them)
   - [ ] No regressions introduced

   ## Blockers / Risks
   - Any issues, unknowns, or decisions needed.

   ## Next steps (if --continue)
   What the next run should tackle.
   ```
4. **Stop when:** Requirements met, budget exhausted, or blocker hit.
5. **Never run verify commands.** The orchestrator runs them.
6. **Token discipline:** Think before you tool. Batch reads. Summarize before writing.
7. **Same-session discipline:** If you receive `--continue`, you are in the SAME opencode session.
   Pick up from REPORT.md's "Next steps". Do not re-read the whole codebase.


---

## Ticket: T002

# A4: Fix recovery, discovery, fatigue on 50-30-20

## Goal
Implement all A4 findings on the 50-30-20 budget calculator: fatigue consolidation (F-P1..F-P5), recovery soft spots, pre-boot edge, Reset pre-action line, and discovery bottom-3 fixes.

## Context
A4 audit (`a4-503020-2026-10-07.md`) found: no recovery MAJORs, but 3 discovery failures (tap-rows affordance, receipt-feet weight, copy-button visibility), fatigue proposal F-P1..F-P5 (census held at 11 lines), pre-boot keystroke edge, Reset one-way door, and 3 recovery soft spots.

## Requirements
1. F-P1: Hide `#al-actuals` mirror on untouched-seed cold load.
2. F-P2: Merge double empty rail (sumnote + offer) into one union sentence at offer.
3. F-P3: Hide blank `#bg-sumnote` (shown-but-empty).
4. F-P4: Cap further gloss — no new explanatory clauses; any new sentence replaces old.
5. F-P5: Gate mirror on plan-complete (same guard as copy refusal) to kill Clear-examples scold.
6. Recovery soft spot 1: Add honest rail for absurd `999999999` input.
7. Recovery soft spot 2: 200%-split line names the fix, not just the fact.
8. Pre-boot edge: Keystrokes before spine boots update figures but don't save — replay/flush on boot or honest mark.
9. Reset one-way door: Surface what Reset will do before tap (page-ownable label/line near button).
10. Discovery fix 1: Tap-rows get visible affordance (existing classes, tabindex/role already in E3, ensure visible cue).
11. Discovery fix 2: Receipt feet restructure for reading weight (dim → clear hierarchy).
12. Discovery fix 3: Copy button reads as button with cold honesty visible pre-tap.

## Acceptance criteria
1. `npm run build` exits 0, outputs "79 page(s) built".
2. `npm run check` outputs "6/6 gates green" (article 147/147, vectors 95/95).
3. `npm run test:calc` outputs "128 pass / 0 fail / 7 skip" (exit 0).
4. Fatigue census: overspend state line count ≤ 9 (down from 11).
5. Cold load: `#al-actuals` hidden, empty rails merged, blank sumnote hidden.
13. Clear-examples: mirror gate withholds scold (no "You spent ₦95,000 vs ₦0 plan").
14. Tap-rows: visible affordance at 390px both themes.
14. Receipt feet: restructured, readable.
15. Copy button: visible button affordance, cold text visible.
16. `npm run test:calc` exits 0 within 600s (bounded).

## Out of scope
- Fleet-wide confirm/undo for Reset (proposal only, briefed separately).
- Stylesheet changes for tap-target sizing (F5 from A1, proposal recorded).
- Stylesheet changes for receipt-feet visual redesign (proposal recorded).

