---
name: code-quality
description: ASLS Studio coding style, linting and cleanliness rules covering ESLint (airbnb-base + vue3-recommended), formatting, naming, JSDoc, error handling, dead code, and how to keep diffs minimal. Use before writing or reviewing code, when fixing lint, or when asked to clean up or refactor.
---

# Code quality

## Lint

- Check without writing: `npm run lint:check`, or faster, `npx eslint <changed files>`.
- `npm run lint` applies `--fix` to **all of `src/`**. Run it only when asked, because it rewrites
  unrelated files.
- A PostToolUse hook lints each `.js` / `.vue` file Claude edits and reports problems back. Fix
  what it reports in lines you touched.
- Baseline (2026-11-03): about 4 pre-existing errors (`vue/no-reserved-keys` in the colour picker,
  `no-use-before-define` in the chase timeline, the unresolved `@asls/wsc-client` link) and
  12 `no-console` warnings. Don't add to it. Fix pre-existing issues only in code you're already
  changing, or in a dedicated `style:` / `refactor:` commit.
- No new `eslint-disable`. If one is truly needed, use it on a single line with a reason:
  `// eslint-disable-next-line no-bitwise -- DMX fine channel packing`.

## Style (enforced or established)

- 2-space indent, single quotes, semicolons, trailing commas on multiline, max 100 columns
  (strings and template literals are exempt), final newline.
- `const`/`let`, never `var`. The singleton files use `var` with eslint-disable for hoisting; that
  is the one accepted exception.
- Classes: one main class per file, `export default`. Enums as frozen-style `UPPER_SNAKE` objects
  exported by name. Private-ish fields use a `_` prefix with getter/setter pairs.
- Constants: `UPPER_SNAKE` at module top with a JSDoc `@constant` block.
- Names: camelCase for methods and props, PascalCase for classes and components, snake_case for
  CSS classes, dot-separated kebab for file names (`group.model.js`,
  `uikit.input.range.fader.vue`).
- Imports: use the `@/` alias across folders, relative imports inside a folder (`./cue.model`).
  Keep `.vue` explicit and omit `.js`, except for `three/examples/jsm/*.js`, which needs it.

## Docs in code

- JSDoc on every class (`@class`, `@classdesc`), public method (`@public`, `@param`, `@return`),
  and accessor (`@type`). Vue props, data entries and emitted events get a one-line `/** */`.
- Comments explain **why**, not what. Remove commented-out code instead of keeping it.
- Mark debt with `@todo <what and why>`. Don't leave bare `TODO`s.

## Cleanliness

- Keep diffs minimal: no drive-by reformatting, renames or reordering in unrelated code.
- Delete dead code you make obsolete in the same change. Don't leave it disabled.
- No `console.*` in new code. Throw an `Error` with a useful message, or emit `app_error`.
- Don't swallow errors (`catch (err) {}`). Handle them, rethrow, or emit, and say why if one is
  intentionally ignored.
- Guard optional values explicitly (`?.`, `??`). Don't use `||` for numbers that can legitimately
  be `0` (DMX values, ids, BPM).
- Hot paths (per-tick engine, visualizer frame, pointer handlers): no allocations, closures,
  `JSON` clones or array spreads per call.
- Reuse existing helpers (pools, `Live`, uikit, `views/utils`) before writing new ones. If you
  duplicate something, extract it.
- Keep `@vue/compat`-era patterns consistent (`compatConfig: { MODE: 3 }`). Don't half-migrate a
  file to another style.

## Review checklist

- [ ] Lint clean on touched files.
- [ ] Save/load, undo and Live invariants hold (see root `CLAUDE.md` § Rules).
- [ ] No new globals, console calls, disabled rules or commented-out code.
- [ ] JSDoc present and accurate.
- [ ] The change is the smallest one that solves the problem.
