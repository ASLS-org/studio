---
name: fixture-library
description: Add, update or debug fixture definitions: the built-in OFL library (public/fixtures, Open Fixture Library JSON, fixture_list.json, manufacturers.json), GDTF import (.gdtf files, the GDTF adapter, the local GDTF library) and the generic GDTF bundle (public/gdtf). Check that a fixture's capabilities are supported by the engine and visualizer. Use when a user wants a new fixture, a fixture or .gdtf file fails to import or patch, or channels behave wrongly.
---

# Fixture library

Format: [Open Fixture Library](https://open-fixture-library.org/) JSON
(`$schema: .../open-fixture-library/master/schemas/fixture.json`). Studio is a consumer only.
Prefer fixtures exported from OFL over hand-written ones.

```
public/fixtures/
  manufacturers.json                 { "<manufacturer-key>": { "name", "website"? } }
  fixture_list.json                  [ { "name": "<manufacturer-key>", "fixtures": ["<fixture-key>.json", ...] } ]
  <manufacturer-key>/<fixture-key>.json
```

Keys are kebab-case and match the OFL repo. A showfile stores `manufacturer: <manufacturer-key>`,
`model: <fixture-key>` (no `.json`), `mode: <mode name>` and `source: 'ofl'`.
`FixtureLibrary.getProfile()` (`src/models/fixtures/fixture.library.js`) fetches
`${VITE_STATIC_URL}fixtures/<manufacturer>/<model>.json`, so **renaming a file breaks every
showfile that uses it**.

The engine never reads OFL JSON directly: `ofl.adapter.js` turns it into a fixture profile
(modes, channels with a `type` key, a standard `attribute`, fine pairing, precomputed
capabilities). Channel `type` keys and their order are stored in showfile scenes, so the adapter
must keep deriving them exactly as before. To check the whole library after touching the
adapter, compare every fixture's channel `type`, `color`, fine pairing and `qaIndex` with the
previous build's output.

## Add a fixture

1. Get the OFL export (open-fixture-library.org → fixture → "Download as OFL JSON") or the file
   from the OFL GitHub repo `fixtures/<manufacturer>/<fixture>.json`.
2. Save it as `public/fixtures/<manufacturer-key>/<fixture-key>.json`.
3. New manufacturer: add it to `manufacturers.json` and add an entry to `fixture_list.json`.
   Keep both files sorted alphabetically.
4. Existing manufacturer: add `"<fixture-key>.json"` to its `fixtures` array (sorted).
5. Validate the JSON: `node -e "JSON.parse(require('fs').readFileSync(process.argv[1]))" <file>`.
6. Check support (below), then verify (skill `run-studio`): patch it into a universe, move every
   channel fader, and watch the visualizer.

## Support check

- **Category.** Any category patches. OFL fixtures get a body generated from category,
  `physical.dimensions` and `matrix` (`src/plugins/visualizer/fixture_shapes.js`); GDTF bodies use
  each model's PrimitiveType, else the node's role.
- **Modes.** A fixture with no `modes` is rejected by the library ("defines no modes").
- **Capabilities.** Channel type keys come from the rules in `src/models/fixtures/ofl.adapter.js`;
  value handling comes from `CAPABILITY_TYPES` in `capabilityManager.model.js` and the cases in
  `Fixture.setChannel()`. Unknown types load but do nothing in the visualizer. Check with:
  `node -e "const f=require('./public/fixtures/<m>/<f>.json');console.log([...new Set(Object.values(f.availableChannels).flatMap(c=>c.capabilities||[c.capability]).map(c=>c.type))])"`
- **Physical.** `physical.lens.degreesMinMax` sets the beam angle (defaults 10–25°), and
  `physical.bulb.colorTemperature` the default white. Colour and gobo wheels are read from
  `wheels`; OFL gobos use built-in patterns.
- **Fine channels.** They are detected by the `" fine"` suffix in mode channel names and paired
  through `fineChannelAliases`. Keep OFL naming. A coarse channel takes the integer part of a
  value and its fine channel the fraction (16-bit).

## GDTF

- **Operators import `.gdtf` files** in the patch popup into IndexedDB (`gdtf.store.js`).
  Showfiles store `source: 'gdtf'`, `manufacturer` and `model` = the GDTF fixture type ID.
- **The bundle (`public/gdtf/`) holds only generic fixtures written by
  `scripts/gdtf/generate-generic.mjs`, CC0.** Never add third-party GDTF files there: their
  meshes, gobo images and thumbnails are copyrighted by default, and GDTF Share has its own terms.
  To change the bundle, edit the generator and re-run `node scripts/gdtf/generate-generic.mjs`.
  Validate with `xmllint --schema gdtf.xsd` (from github.com/mvrdevelopment/tools).
- **`gdtf.adapter.js` maps channel functions to OFL-shaped capabilities.** Channel names follow
  OFL naming (`CHANNEL_NAMES`), so `type` keys match. Once released, GDTF channel names and OFL
  pixel channel names (`Red 3`, `type` = name) are frozen like OFL type keys.
- **Debug a file in Node:** bundle `readGDTF` + `profileFromGDTF` with esbuild (root CLAUDE.md,
  Known traps) and print each mode's channels. Real files mix GDTF 1.0–1.2, virtual channels
  (empty `Offset`) and geometry references; see design notes in the archived change
  `add-gdtf-fixtures`.

## Don't

- Don't hand-edit vendored OFL files to "fix" Studio bugs. Fix the adapter instead.
- Don't bulk-reformat the library. Diffs must stay reviewable (`refactor(fixtures)` only when
  asked).
- Commit scope is `fixtures`: `feat(fixtures): add <manufacturer> <model>`.
