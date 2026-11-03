---
name: fixture-library
description: Add, update or debug fixture definitions in the built-in library (public/fixtures, Open Fixture Library JSON, fixture_list.json, manufacturers.json), and check that a fixture's capabilities and category are supported by the engine and visualizer. Use when a user wants a new fixture, a fixture fails to patch, or channels behave wrongly.
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

- **Category.** Only fixtures whose `categories[0]` is `"Moving Head"` can be patched today.
  Others throw `This fixture type is not supported yet.` in `Fixture.prepare3DModelInstance()`.
  Supporting a new category is an engine and visualizer feature (OpenSpec change), not a library
  task.
- **Modes.** A fixture with no `modes` is rejected by the library ("defines no modes").
- **Capabilities.** Channel type keys come from the rules in `src/models/fixtures/ofl.adapter.js`;
  value handling comes from `CAPABILITY_TYPES` in `capabilityManager.model.js` and the cases in
  `Fixture.setChannel()`. Unknown types load but do nothing in the visualizer. Check with:
  `node -e "const f=require('./public/fixtures/<m>/<f>.json');console.log([...new Set(Object.values(f.availableChannels).flatMap(c=>c.capabilities||[c.capability]).map(c=>c.type))])"`
- **Physical.** `physical.lens.degreesMinMax` sets the beam angle (defaults 10–25°), and
  `physical.bulb.colorTemperature` the default white. Colour and gobo wheels are read from
  `wheels` ("Color Wheel" is rendered; gobos aren't yet).
- **Fine channels.** They are detected by the `" fine"` suffix in mode channel names and paired
  through `fineChannelAliases`. Keep OFL naming. A coarse channel takes the integer part of a
  value and its fine channel the fraction (16-bit).

## Don't

- Don't hand-edit vendored OFL files to "fix" Studio bugs. Fix the adapter instead.
- Don't bulk-reformat the library. Diffs must stay reviewable (`refactor(fixtures)` only when
  asked).
- Commit scope is `fixtures`: `feat(fixtures): add <manufacturer> <model>`.
