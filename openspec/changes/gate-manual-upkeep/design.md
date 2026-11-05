# Design (draft): gate-manual-upkeep

Draft written with the epic plan on 2026-11-05. Refine in the unit branch before writing the tasks.

## Context

`openspec/config.yaml` already requires the proposal to say whether the manual needs updating,
and the tasks to include a manual task or "Manual n/a". The archive guidance asks for
confirmation that the manual tasks are done or n/a. The PR template has one checkbox. None of
these name pages, and nothing checks the preview presets.

## Decisions (draft)

### D1. The coverage map lives in the skill, keyed by source paths
Agents load skill `user-manual` whenever they touch the UI (its description already triggers on
user-facing changes). A table there (`src/views/...` glob → page → presets) is found exactly
when it's needed. A separate data file would need its own discovery.
*Alternative:* `docs/manual/coverage.json` read by a script. Revisit if the table grows past
about 40 rows.

### D2. Archive gate compares diff with the proposal
`git diff --name-only <base>...HEAD -- docs/manual` against the pages named in the proposal's
Manual line. If they don't match, the agent stops and asks. It doesn't auto-fix. This is guidance
the archive workflow follows, not a hook.

### D3. Preview check is a Node script, run locally
It bundles the preset registry with esbuild (per `CLAUDE.md` § Known traps), mounts each preset
in happy-dom or jsdom against the manual showfile, and collects errors. Presets with
`clock: 'on'` mount but don't tick. Visualizer presets are skipped. It isn't wired to CI, per the
user's choice.
*Risk:* jsdom can't run some widgets (canvas). Those presets are marked `check: false` with a
reason.

### D4. Keep the gates light
One extra line in the proposal, one named task, one archive comparison. Anything heavier gets
skipped under time pressure, which is how the manual fell behind in the first place.
