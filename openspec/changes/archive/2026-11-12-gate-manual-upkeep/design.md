# Design: gate-manual-upkeep

Draft written with the epic plan on 2026-11-05, refined in the unit branch on 2026-11-12 with
what units 2–4 taught.

## Context

`openspec/config.yaml` already requires the proposal to say whether the manual needs updating,
and the tasks to include a manual task or "Manual n/a". The archive guidance asks for
confirmation that the manual tasks are done or n/a. The PR template has one checkbox. None of
these name pages, and nothing checks the preview presets.

Units 2–4 checked previews by hand with throwaway headless-Chrome scripts in the session
scratchpad (puppeteer-core plus the local Chrome), and with the dev page `_dev/previews.md`.
That page lists 18 of the 35 presets today: hand-kept lists go stale too. What broke during
those units was rarely "the component doesn't mount". It was a demo that stopped halfway (a step
target renamed or teleported), a preset nothing used any more, and anchors that moved when a
page was reorganised.

## Decisions

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

### D3. Preview check drives the real manual in headless Chrome (revised)
The draft planned jsdom or happy-dom. That doesn't work for these presets: they fetch the demo
show and fixture profiles, the demo cursor needs real layout (`getBoundingClientRect`), and stage
presets drive the WebGL visualizer card. So `scripts/manual/check-previews.mjs`:

- starts `vitepress dev ./docs/manual` on a free port (or uses `--url` for a running one);
- finds every `<LivePreview preset="…">` in `docs/manual/**/*.md` (not `_dev/`, not
  `CLAUDE.md`), and the registry ids in `previews/presets.js`;
- per page, scrolls to each preview, runs it (as a reader's click does), and waits for it to be
  ready. **Fails** on: the fallback or unknown state, an `[LivePreview <id>]` console error, an
  uncaught page error, or, for a demo, a `[LivePreview demo]` warning (a step it couldn't do)
  before the demo's first loop ends;
- **fails** on a registry preset that no page uses, and on an internal `#anchor` link whose
  target doesn't exist (the anchor check from unit 4);
- prints one line per preview and a summary; exits non-zero on any failure.

To see the end of a demo's loop, `LivePreview` sets a `data-demo-loops` attribute on its frame
each time a loop finishes (one line in the existing restart callback). It costs nothing at run
time.

Chrome: `puppeteer-core` becomes a devDependency (no browser download). The script finds Chrome
from `CHROME_PATH`, else the usual install path per system, and says how to set it if none is
found. Launch flags `--use-angle=swiftshader --enable-unsafe-swiftshader` let WebGL run headless.

It runs locally (`npm run docs:manual:check`), not in CI, per the user's choice. The archive
guidance requires it when a change touches a file the coverage map links to a preset.

`_dev/previews.md` is removed: the check covers every preset that a page uses, and a preset no
page uses is an error. `_dev/behaviour.md` and `_dev/visualizer.md` stay (they test harness
behaviour, not presets).

### D4. Keep the gates light
One extra line in the proposal, one named task, one archive comparison, one command. Anything
heavier gets skipped under time pressure, which is how the manual fell behind in the first place.

## Risks

- **A slow machine times out a demo.** Timeouts are per preview (ready: 30 s; demo loop: 90 s)
  and the failure line says which wait ran out.
- **Chrome missing** (a contributor without Chrome): the script stops with a message on how to set
  `CHROME_PATH`. The check is local and the archive guidance says to report when it couldn't run.
- **The check misses visual regressions** (a preview that mounts but looks wrong). That still
  needs a look in `docs:manual:serve`, which the tasks rule keeps.
