## 1. Engine (models/DMX)

- [x] 1.1 `canPatchMany` checks `!= null` and the end of the universe. Verify: with a fixture at
  address 0, `canPatchMany(0, 14, 1)` is false; `canPatchMany(500, 14, 1)` is false.
- [x] 1.2 `UniversePool.repatch(moves)`: validate all, then unpatch and patch. Verify (app:check): swapping two fixtures' addresses works; an overlapping move
  throws and changes nothing; a move to another universe keeps the fixture's groups and scenes.
- [x] 1.3 `Fixture.invertPan/invertTilt/swapPanTilt` (saved, default off), per-channel
  `outputSource` / `outputInvert`, used by `packFrame`. Verify: pan 64 / fine 0 inverted outputs
  191 / 255 in the universe frame; swap outputs tilt on pan; save/reload keeps the options; the demo
  show loads with them off and its frame is unchanged.

## 2. UI (views)

- [x] 2.1 Addresses shown 1–512: patch bay rows, Fixture Settings, patch popup *Address* and
  *Stop*. Verify: demo first fixture reads `U0-CH1` and *Address* 1; patching at *Address* 1
  stores 0.
- [x] 2.2 Map component (`universe.modifier.map.vue`). Verify: the demo universe 0 shows four
  14-channel blocks from 1, labelled, wrapping rows where they cross one.
- [x] 2.3 Repatch popup (*Edit* button, universe and selection selects, drag clamped to 1–512
  and never onto another fixture, *Move to free range*, *Remove gaps*, *Reset*, changes before/after, overlap
  messages, 3D highlight of the selection, *OK* / *Cancel*). Verify: drag a fixture to 321 and
  OK: it outputs there; Cancel leaves everything; a drag onto a fixture stops where it fitted;
  a drag past the grid stops at 512; Remove gaps packs.
- [x] 2.4 Patch popup map with the fixtures to patch as ghost blocks (red when taken). Verify: *Address*
  1 over the demo's first fixture shows red and the popup can't be submitted.
- [x] 2.5 Fixture Settings: *Ch Start*, *Ch Stop*, *Ch Count* disabled fields, *Edit* header button (no
  invert/swap controls yet). Patch popup: no position/offset fields, numbered identical fixtures,
  error message naming what holds the range, map without row numbers. Verify (app:check): the
  fields read 1 / 14 / 14 for the demo's first fixture; patching 2 names them `<name> 1`, `2`.

## 3. Checks and docs

- [x] 3.1 `app:check` scenario `repatch` (1-based display, map blocks, drag + OK, cancel,
  overlap, optimize, another universe, swap of two fixtures, patch popup highlight, address-0
  bug, invert/swap output). Verify: passes; the address-0 and stale-map checks fail on the old
  code.
- [x] 3.2 Manual: `programming/patching` (addresses 1–512, the note about counting from 0 goes,
  Fixture Settings table, a *Repatching* section, the patch popup map), `getting-started/
  interface` (patch bay address example); previews that show addresses. Verify: `npm run
  docs:manual:check` all clear.
- [x] 3.3 AI context: `models/DMX/CLAUDE.md` (repatch through `UniversePool.repatch`, output
  remap in `packFrame`, addresses 0-based in storage / 1-based on screen); skill `vue-ui-change`
  (`dmxAddress`). Verify: each says so.
- [x] 3.4 `npx eslint` on all touched files is clean.
