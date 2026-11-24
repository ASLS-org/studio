## 1. Engine (models/DMX)

- [x] 1.1 Remove `UniversePool.changeId()` and its mention in `models/DMX/CLAUDE.md` and the
  `Universe.id` JSDoc. Verify: `grep -rn changeId src` finds nothing; the demo show loads with
  universes 0 to 3.

## 2. UI (views)

- [x] 2.1 Universe settings: the ID field is a disabled `uk-num-input` showing `universe.id`;
  remove `setUniverseId`, `idFieldKey` and `$view.moveUniverse()`. Verify: open Universe 0, click
  the ID field and type 7: it stays 0, shown disabled.
- [x] 2.2 Add `--widget-width-xl: 400px` to `tokens.css`; the fixture pool is `fit-content`
  between `--widget-width-sm` and `--widget-width-xl`. Verify: open a universe: the pool is as
  wide as its widest row; rename a fixture to a very long name: the pool stops at 400 px and
  the name is cut.
- [x] 2.3 Effect tool: field columns size to their fields, clear of the canvas. Verify: select an
  effect channel, switch to PWM: *Waveform*, *Width*, *Phase start* and *Phase stop* show whole,
  and end at least 8 px before the canvas.
- [x] 2.4 Fade editor: the play dot is placed by `Fade.pointAt(t)` on the current curve
  (clamped, no `% 1` or aspect factor); the prop defaults to an idle `Fade`. Verify: start a
  scene with an EASE_IN fade in: the dot follows the curve and stays at its end; stop it
  halfway and switch to EASE_OUT: the dot is on the new curve.
- [x] 2.5 Delete `group.scene.modifier.widget.curve.vue`. Verify: `grep -rn
  scene.modifier.widget.curve src docs/manual/.vitepress` finds nothing but the preset updated in
  3.2.

## 3. Checks and docs

- [x] 3.1 `app:check`: new scenario `widgets` (ID field disabled and unchanged after typing;
  fixture pool width between 250 and 400 px and no cut row in the demo; effect fields clear of
  the canvas with PWM; fade dot on the curve mid-fade, after a curve edit, and at the end once
  done).
  Remove any check that changed a universe's ID. Verify: `npm run app:check` passes, and the new
  checks fail on the old code (stash and rerun `--only widgets`).
- [x] 3.2 Manual: `programming/patching` universe settings table (ID read-only, set at
  creation); the `scene-curve` preset in `presets.js` mounts `modifier.widget.curve.vue`.
  Verify: `npm run docs:manual:check` all clear; the patching and scenes pages read right in
  `npm run docs:manual:serve`.
- [x] 3.3 AI context: `src/views/CLAUDE.md` / skill `vue-ui-change` design scale table gets
  `--widget-width-xl`. Verify: the table lists it.
- [x] 3.4 `npx eslint` on all touched files is clean.
