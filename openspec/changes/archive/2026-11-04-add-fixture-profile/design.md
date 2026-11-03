# Design

## Context

See proposal.md and the epic doc § Findings.

- Load path: `Show.prepareFixtures()` fetches `fixtures/<manufacturer>/<model>.json` per fixture
  (string cache per type) and calls `FixturePool.addRaw(fixtureData)` with `fixtureData.OFLData`.
  The universe patch popup fetches the same JSON itself, keeps `modes`, `modeNames`, `category`,
  and passes `JSON.parse(JSON.stringify(this.fixture))` (OFL data included) to `addRaw` with
  `mode` as an index.
- `Fixture` reads `data.mode` into `modeName`, so an index never matches and the first mode is
  used; `showData` writes `mode: this.modeNam` (undefined). `prepareChannels()` deep-copies the OFL
  data per instance, mutates `capability.type` for fine aliases, and builds `Channel`s.
- `Channel.setChannelTypes()` derives the channel `type` key from OFL capability types (last
  capability wins): `Shutter`, `Dimmer`, `Color` (+ `color` = Red/Green/Blue/...), `ColorPreset`,
  `ColorTemp`, `Pan`, `Tilt`, `PanContinuous`, `TiltContinuous`, `Zoom`, `Effect`, `Focus`,
  `Maintenance`, otherwise the OFL channel name; `Fine` suffix for fine channels. Quick accessors
  group channels by that key and number them (`qaIndex`).
- **That key is persisted**: scene `channelValues` store `{ id, type, value, active, color,
  qaIndex }`, and scenes, effects, the colour picker and pan/tilt widgets address channels through
  `setQuickAccessor({ type, qaIndex })`.
- `Fixture.setChannel()` clamps with `Math.ceil`, writes the fine companion from `value % 1`, finds
  the capability with `Array.find`, calls `Capability.getValue()` (new object, `Object.keys` twice)
  and pushes the result keys into `_3DModel` setters (`intensity`, `pan`, `strobeFrequency`, ...).

## Goals / Non-Goals

**Goals:**
- One profile shape that both OFL and GDTF adapters produce.
- Same channel type keys and `qaIndex` numbering as today, for every bundled OFL fixture.
- O(1), allocation-free value resolution per channel write.

**Non-Goals:**
- Changing the `_3DModel` setter names or how the visualizer consumes values (unit 2).
- Patch overlap validation and saved fixture ids (already fixed: quickwin `13a8d86`, hotfix PR #63).
  Note: with the overlap check now enforced, task 3.1 is what makes multi-fixture patching in a
  smaller-than-first mode work again.

## Decisions

1. **Module layout** (`src/models/fixtures/`):
   - `fixture.profile.js`: profile shape (JSDoc typedefs) and helpers.
   - `ofl.adapter.js`: OFL JSON → profile. Pure: no Vue, Three.js or `import.meta`, so it can run
     in Node for verification and in a worker later.
   - `fixture.library.js`: fetches the OFL index and files, builds and caches profiles by
     `source/manufacturer/model`, returns frozen, `markRaw` profiles. Replaces the fetch in
     `Show.prepareFixtures()` and in the patch popup.
2. **Profile shape** (one per fixture type, modes inside):
   `{ source, manufacturer, model, name, category, physical, wheels, modes: [{ name, channels:
   [{ name, attribute, type, color, fine: [offsets], capabilities, lookup }] }] }`.
   `type` is the legacy key computed exactly as `Channel.setChannelTypes()` does today; `attribute`
   is the GDTF attribute name (table below), unused by the UI in this unit.
3. **Capabilities precomputed**: the existing `CAPABILITY_TYPES` settings resolve entities once per
   profile channel; `lookup` is a `Uint8Array(256)` of capability indexes. `Capability.getValue()`
   writes into one reused output object per channel instead of allocating.
4. **`Fixture` takes a profile and a mode name** (`data.profile`, `data.mode`). It accepts a mode
   index too (normalised to the name) so older callers keep working. `Channel`s are built from
   profile channels; quick accessors stay keyed by `type`.
5. **Showfile**: fixture `showData` adds `mode` (name) and `source` (`'ofl'`). On load, a missing
   or unknown mode means the first mode; a missing source means `'ofl'`. No other keys change.
6. **16-bit split**: coarse = `Math.floor(v)`, fine = `Math.round((v % 1) * 255)`; channels without
   a fine companion use `Math.round(v)`; all clamped to 0-255.
7. **OFL → GDTF attribute map** (indicative; extend while implementing): Intensity → `Dimmer`;
   ShutterStrobe → `Shutter1`; ColorIntensity Red/Green/Blue/White/Amber/UV → `ColorAdd_R/G/B/W/A/UV`,
   Cyan/Magenta/Yellow → `ColorSub_C/M/Y`; ColorPreset → `ColorMacro1`; ColorTemperature → `CTO`;
   Pan/Tilt → `Pan`/`Tilt`; PanContinuous/TiltContinuous → `PanRotate`/`TiltRotate`;
   WheelSlot on a color/gobo wheel → `Color1`/`Gobo1`; WheelSlotRotation → `Gobo1PosRotate`;
   WheelShake → `Gobo1PosShake`; Zoom/BeamAngle → `Zoom`; Focus → `Focus1`; Prism → `Prism1`;
   Iris → `Iris`; Frost → `Frost1`; Effect* → `Effects1`; Maintenance → `Control1`; anything else
   → `Unknown`.

8. **Mode change remaps and re-patches** (decided with the user during apply). The fixture
   settings widget calls `Universe.changeFixtureMode(fixture, modeIndex)` instead of setting
   `fixture.modeIndex` directly. It checks the new range against the other patched fixtures
   (compared by id, since the widget holds a reactive proxy) and address 512, throws if it does not
   fit, otherwise clears the old address map entries, switches the mode and fills the new range.
   `Fixture`'s `modeIndex` setter keeps values by `type#qaIndex`, restoring coarse channels first
   and fine channels after (a coarse write resets its fine byte), and pushes every channel to the
   3D model. Live channel values (universe view faders) stay unsaved by design; only scenes store
   values (manual says so).

## Risks / Trade-offs

- [The adapter's `type` keys drift from today's for some fixture, breaking saved scenes] →
  a Node script (task 2.4) builds every bundled OFL fixture's modes with both the old derivation
  and the adapter and compares `type`, `color` and `qaIndex` per channel; zero differences
  required.
- [Rounding change alters output of running effects by one DMX step] → accepted; it is the fix.
- [Patch popup or widgets read OFL fields directly] → inventory done: popup reads `modes`,
  `modeNames`, `category`, `name`; it moves to profile fields.

## Migration Plan

Showfile keys are additive. Rollback is reverting the commits; files saved with `mode`/`source`
still load in older builds (unknown keys are ignored, first mode used).
