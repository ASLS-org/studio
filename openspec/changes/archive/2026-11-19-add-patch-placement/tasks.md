# Tasks

## 1. UI (views)

- [x] 1.1 `patchPoses(count, category, others)` in `views/utils/placement.js`: line along X, 1 m
  apart, hung 4 m up or on the floor by category, first free row, else right of the first row.
  Verified in Node (esbuild bundle): empty stage, second patch, smoke, every row taken.
- [x] 1.2 The patch popup places new fixtures with `patchPoses` (fixtures of every universe as
  obstacles); its unused default position and rotation are removed. Verified in the running app:
  two PARs land at (−0.5, −3, 4) and (0.5, −3, 4), hung.

## 2. Checks

- [x] 2.1 `npm run app:check` `repatch` scenario checks the poses of two patched fixtures.
  Verified: `--only repatch --only position` 20/20.

## 3. Docs

- [x] 3.1 Manual: `programming/patching.md` (step 6, preview text) and
  `getting-started/first-show.md` describe the placement; the `patch-add` demo no longer sets Y,
  Height and Mount by hand. Its pre-existing "Bundled (GDTF)" failure in `docs:manual:check` is
  unrelated.
- [x] 3.2 AI context: `src/views/CLAUDE.md` names `patchPoses`; the epic row 7 marks the follow-up
  done.
- [x] 3.3 `npx eslint` on all touched files is clean.
