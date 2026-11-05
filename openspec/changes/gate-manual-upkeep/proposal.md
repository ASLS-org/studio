# Proposal: gate-manual-upkeep

Unit 5 of epic `manual-overhaul`. Depends on units 3 and 4 (the final page structure and preset
registry).

## Why

The manual fell behind because updating it was a soft checklist item. "Manual updated, or n/a"
is ticked in the PR template, and nothing tells the author *which* pages or previews a change
affects. After units 1–4 the manual is complete, and without a stronger habit it will drift
again by the next epic. The user chose workflow gates (2026-11-05): no CI drift check, no
generated pages, no scheduled routine.

## What Changes

- **Coverage map**: a table in skill `user-manual` mapping each app area (fragment, popup,
  widget, engine feature) to its manual page(s) and preview preset(s). An agent or contributor
  touching `src/views/…/chase` finds the Chases page and the `chase-timeline` preset at once.
- **OpenSpec gates** in `openspec/config.yaml`:
  - proposal rule: the "Manual" line names the pages (from the coverage map) or says "n/a" with a
    reason;
  - tasks rule: when user-facing, a docs task names the pages and previews to update, verified
    in `docs:manual:serve`;
  - archive guidance: before archiving, compare the branch diff against the proposal's Manual
    line. If the proposal names pages and `docs/manual` is untouched, stop and ask.
- **PR template**: the Manual checkbox becomes "Pages updated: … / Previews checked: … / n/a
  because …".
- **Preview check** (local, optional to run, required before archive when previews are listed):
  `npm run docs:manual:check-previews` mounts every preset headless against the manual showfile
  and reports the ones that fail. The archive guidance runs it when a change touches a widget
  that has a preset.
- `CLAUDE.md` definition-of-done item 3 and skill `ai-context-maintenance` point to the coverage
  map.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
None. This is process and tooling. The change sets `skip_specs: true` unless refinement finds a
user-observable manual behaviour to specify.

## Impact

- Code: `openspec/config.yaml`, `.github/pull_request_template.md`,
  `.claude/skills/user-manual/SKILL.md`, `.claude/skills/ai-context-maintenance/SKILL.md`,
  `CLAUDE.md`, `docs/manual/CLAUDE.md`, `package.json` (one script), a small check script under
  `scripts/`.
- Showfile format: none. Unsaved marker: none. Live playback/timing: none. WSC output: none.
  Visualizer: none. Web vs Electron: none.
- Manual: none (meta only).

## Out of scope

- CI enforcement in GitHub Actions, generated reference pages, and scheduled AI routines (set
  aside on 2026-11-05; listed in the epic backlog).
- Re-auditing manual content (units 3–4 did that).
