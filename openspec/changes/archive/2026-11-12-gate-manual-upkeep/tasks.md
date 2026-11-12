# Tasks

## 1. Preview check (tooling)

- [x] 1.1 Add `puppeteer-core` as a devDependency (`npm install -D puppeteer-core`); verify
      `npm ls puppeteer-core` lists it and no browser is downloaded.
- [x] 1.2 In `LivePreview.vue`, set a `data-demo-loops` attribute on the preview's frame each
      time a demo loop finishes (the `restart` callback); verify in `docs:manual:serve` that a
      demo's attribute counts up.
- [x] 1.3 Write `scripts/manual/check-previews.mjs` (design D3): start `vitepress dev` on a free
      port or use `--url`; find Chrome (`CHROME_PATH`, else the usual path per system); collect
      the pages' presets and the registry ids; run each preview and each demo through one loop;
      fail on fallback/unknown state, `[LivePreview …]` errors, page errors, demo warnings,
      unused presets and missing `#anchor` targets; print one line per preview and a summary;
      exit non-zero on failure. Verify it passes on the current manual (35 presets, 0 failures).
- [x] 1.4 Verify the check catches what it should: temporarily rename a demo step's target, add a
      preset no page uses, and break an anchor; each gives a failure line and a non-zero exit.
      Revert.
- [x] 1.5 Add `"docs:manual:check": "node scripts/manual/check-previews.mjs"` to `package.json`;
      verify `npm run docs:manual:check` runs and exits 0.
- [x] 1.6 Remove `docs/manual/_dev/previews.md` and its mentions; verify
      `grep -rn "_dev/previews" docs .claude CLAUDE.md` finds nothing.

## 2. Coverage map

- [x] 2.1 Add a coverage map to skill `user-manual`: each app area as `src/…` paths (fragments,
      modifiers, widgets, popups, toolbar, visualizer, output, engine features) → manual page(s)
      → preset id(s). Verify every preset id in `presets.js` appears in the map, and every
      `docs/manual/**/*.md` page (bar `_dev`, `CLAUDE.md`, the home) appears at least once.
- [x] 2.2 Replace the skill's preview-check instructions (`/_dev/previews`) with
      `npm run docs:manual:check`, and say when it's required; verify by reading the section.

## 3. Workflow gates

- [x] 3.1 `openspec/config.yaml` proposal rule: the Manual line names the pages (from the
      coverage map) or says "n/a" with a reason. Verify with `openspec validate --all` (no new
      config errors) and by reading `openspec instructions proposal --change gate-manual-upkeep`.
- [x] 3.2 Tasks rule: when user-facing, a docs task names the pages and presets to update,
      checked in `docs:manual:serve`, and runs `npm run docs:manual:check` when a preset's
      source is touched. Verify via `openspec instructions tasks --change gate-manual-upkeep`.
- [x] 3.3 Archive guidance (design D2): compare `git diff --name-only <base>...HEAD --
      docs/manual` with the proposal's Manual line, stop and ask on a mismatch; require a passing
      `docs:manual:check` (or a stated reason it couldn't run) when the diff touches a file the
      coverage map links to a preset. Verify via `openspec instructions archive --change
      gate-manual-upkeep`.
- [x] 3.4 `.github/pull_request_template.md`: the manual checkbox becomes "Pages updated: … /
      Previews checked (`npm run docs:manual:check`): … / n/a because …". Verify by reading it.

## 4. AI context

- [x] 4.1 `CLAUDE.md`: definition-of-done item 3 points to the coverage map and the check; add
      `docs:manual:check` to the commands table. Verify by reading it.
- [x] 4.2 Skill `ai-context-maintenance`: keep the coverage map current when views or presets
      are added, moved or renamed. `docs/manual/CLAUDE.md`: the check command. Verify by reading
      them.
- [x] 4.3 Epic doc `openspec/epics/manual-overhaul.md`: unit 5 status. Manual n/a (meta only:
      nothing a reader sees changes).
- [x] 4.4 `npx eslint` on all touched JS/Vue files (`scripts/manual/check-previews.mjs`,
      `LivePreview.vue`) is clean.

## Workflow follow-up

- Archive the change in this unit branch, then a PR into `epic/manual-overhaul`.
- Then the epic PR into `develop`, when the user asks.
