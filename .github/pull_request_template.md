<!-- Title: <type>(<scope>): <summary>   e.g. feat(models/DMX): add fade-out curve to scenes -->
<!-- Base branch: develop (hotfix: master, then a back-merge PR into develop) -->

## What & why

<!-- The user-facing problem and how this solves it. Link the issue / discussion. -->

Closes #

## OpenSpec

<!-- openspec/changes/<name> (or archived path), or "n/a (trivial fix)" -->

## How it was verified

- [ ] Web (`npm start`)
- [ ] Desktop (`npm run electron:start`), if Electron or output related
- Steps:

## Impact

- Showfile format: none / backward compatible / **breaking** (explain)
- Unsaved marker, live timing, WSC output, visualizer: none / describe

## Checklist

- [ ] Targets `develop` (hotfix: `master` + back-merge PR)
- [ ] `npx eslint` clean on touched files
- [ ] User manual (`docs/manual`), from the coverage map in skill `user-manual`:
  - Pages updated:
  - Previews checked (`npm run docs:manual:check`):
  - or n/a because:
- [ ] AI context (`CLAUDE.md`, `.claude/skills`, `openspec/config.yaml`) updated, or n/a
- [ ] Screenshots or recordings attached for UI changes (in the PR only, never in the manual)
