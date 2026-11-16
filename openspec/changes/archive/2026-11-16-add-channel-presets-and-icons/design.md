# Design

## Context

See proposal.md (Why). What the code does today:

- `modifier.widget.fixture.channels.vue` renders one column per channel row: value field, icon,
  fader, and (in scenes) an active checkbox. `getIcon()` builds the icon name from `type` (`Color` +
  colour, else the type lowercased, first space removed, `fine` dropped). `uk-icon` falls back to
  `close.svg` when the file is missing.
- Rows come from `Fixture.simplifiedChannels` (universe) and the scene fragment's `channelValues`
  (merged across selected fixtures, each row with `targets`). Neither carries capabilities.
- A channel's `type` is its name unless a legacy rule matches (`channel.types.js`), so most library
  channels have name-based types (*Red 3*, *Color Temperature*, *Pan/Tilt Speed*). Each channel also
  has a standard `attribute` (`ColorAdd_R`, `CTO`, `PositionMSpeed`, `Unknown`…).
- Library survey (480 OFL fixtures, every mode): 35,503 channels, 24,869 with no icon file.
  Attributes cover all but 3,361 channels (`Unknown`). OFL attributes are a small subset of GDTF
  names (`deriveAttribute`).
- GDTF bundle (5 generic fixtures): 118 channels, one miss (*Gobo Wheel Rotation*). Imported GDTF
  files keep the file's attribute as is: any of the ~250 GDTF attribute definitions, mostly in
  numbered families (`Gobo<n>`, `Gobo<n>PosRotate`, `Color<n>WheelSpin`, `Shutter<n>Strobe*`,
  `Effects<n>Adjust<m>`, `Blade<n>A`, `Fog<n>`, `*MSpeed`, `*Reset`, `*Mode`). Their channel name is
  `CHANNEL_NAMES[attribute]` or the attribute's pretty name.
- `Capability` (capabilityManager.model.js) keeps `type`, `range`, entities and parameters, not the
  source text. OFL data has `comment` on 37% of ranges. The GDTF adapter sets `comment` from each
  channel set's name (wheel slots, prism in/out) or the channel function's name, and maps the
  function to an OFL-shaped capability (`type`, speeds, `wheel`, `slotNumber`). 2,060 of 4,917 OFL
  channels have more than one range.
- `uk-select` teleports its option list to the body, has keyboard navigation (unit 3) and marks the
  current option with the accent background.

## Goals / Non-Goals

**Goals:** range labels, a preset menu on the channel icon, an icon for every library channel.

**Non-Goals:** saved user presets; presets in the effect tool; swatches for colour wheel slots;
any change to channel `type` keys or `qaIndex`.

## Decisions

- **Labels in the model layer:** `Capability.label`, set in the constructor from a non-empty
  `capabilityData.comment` (OFL comment, GDTF channel set or function name), else built by a pure
  `capabilityLabel(data, wheels)` in `models/fixtures/capability.labels.js`. Both adapters already
  give OFL-shaped data, so one builder serves both. Each adapter passes its profile's `wheels` so a
  WheelSlot / WheelShake range reads its slot's `name` (or colour / gobo type), or `Slot n`. Rules
  by type: Effect → `effectName` / `effectPreset`; ShutterStrobe → `shutterEffect` plus `slow →
  fast` from speed start/end; ColorIntensity → `color`; NoFunction → *No function*; otherwise the
  type in words plus the first start/end pair (`Speed slow → fast`, `Time 0s → 5s`). Alternative:
  build labels in the widget; rejected, since the adapters own the source data and Node can test
  them.
- **Channel box (revised after review):** every channel column has, under its value, a `uk-select-input`
  whose `#trigger` slot is a box styled like a select: the channel icon, then the current range's
  label (several ranges) or the channel name, ellipsised; `title` = `name: range`. The standalone
  icon above the fader is gone. Columns are `--channel-column-width` (64 px, was 52). The box uses `--secondary-darker` (hover `--secondary-dark`) with `--space-3` padding and gap. Every channel
  has the list (fine and single-range ones too). The list's `#header` slot shows the icon and full
  name; `searchable` (every channel, for consistency) turns on the list's search box. `modelValue` is the
  index of the range holding the value. Picking sets `row.value` to `range[0]`, sets
  `row.active = true` in scenes, and emits `input` as the fader does: a preset is a deliberate
  choice of value. Hover uses the selects' neutral colours, never the accent.
- **Lists built only while open:** `uk-select-input` renders its teleported list with `v-if`, so
  a strip of 14+ channel selects with dozens of ranges each mounts cheaply (with `v-show`, panel
  switches blocked the main thread past 50 ms). A trigger's list opens upwards from its box, is
  `max-content` wide (200 to 360 px, nowrap options cut with an ellipsis) and always 6 option rows
  high. Its body is a real `uk-list` (revised after review: rows, separators, search box, empty
  state and selected style are the list's own): items `{ id: range index, name: label, more: span }`
  (`presetItems`), `filterable`, `no-highlight`, controlled `selection` = the marked range. Keys
  typed in its search box (which stops them bubbling) are caught on capture: Up/Down move the mark,
  Enter picks, Escape closes; a row click picks through the list's `select`. Rows it doesn't fill
  show the idle stripes; an empty list says *Ranges differ between fixtures* (`uk-list`'s new
  `emptyText`), a search with no match *Nothing to display*. Rows and options lay their tint over
  a solid base, so the stripes never show through.
- **Gizmo keys ignore fields:** `visualizer/controls.js` listens on `window` for T/R/H/Escape and
  switched the gizmo while typing in any field (the search, a fixture name). It now skips keys whose
  target is a field.
- **`reselect` follows the value silently:** `uk-select-input` re-chose (and emitted) on every
  `modelValue` change. For an action menu that would snap the channel to a range start whenever
  the fader crossed into another range, so with `reselect` a new `modelValue` only moves the mark.
  Its list is `max-content` wide (nowrap options), kept inside the window.
- **Rows carry ranges:** `simplifiedChannels` adds `capabilities` (the frozen profile array). Scene
  rows add it from the first target and drop it when another target's ranges differ (same spans and
  labels, compared once per computed row).
- **Icons:** a pure `channelIcon(channel)` in `views/utils/channel.icons.js`, one ordered list of
  `[RegExp, icon]` rules on the GDTF attribute, so OFL and GDTF share it and numbered families
  match: `ColorAdd_R|ColorRGB_Red` → red, `ColorAdd_(A|RY)` → amber, `ColorSub_C` → cyan…,
  `^Gobo\d+(Pos)?Rotate|Gobo\d+WheelSpin` → gobo rotation, `^Gobo\d+` → gobo wheel, `^Color\d+` →
  colour wheel, `^Shutter\d+Strobe|^Strobe` → strobe, `^Shutter\d+$` → shutter,
  `^(CTO|CTC|CTB|Tint)` → colour temperature, `^HSB_Hue` → hue, `MSpeed$|Rate$` → speed,
  `Reset$|^Control` → maintenance, `Mode$` → control, `^Blade` → shaper, `^(Fog|Haze)` → fog, and so
  on. Then the legacy `type` keys that have files, then regexes on the name (`amber`, `uv`,
  `strobe`, `speed`, `macro`…), then `channel`. The widget's `getIcon` calls it. `uk-icon` keeps its
  `close` fallback for other callers.
- **New SVGs** (300 viewBox, one even-odd path, `fill` from CSS), revised after review to match
  the existing set: letter icons `colorintensityamber` (A), `colorintensityuv`, `colorintensitylime`
  (L), `colorintensitywarmwhite` (WW), `colorintensitycoldwhite` (CW) are Roboto Bold glyphs
  (`src/assets/fonts`, matched against the existing R) cut out of the same rounded square at the
  same cap height; the others are bold silhouettes scaled to fill the box, no ticks or thin
  details: `colortemperature`, `saturation` (half-filled drop: the half disc is the dimmer),
  `speed`, `strobe`, `iris` (ring and pupil: the aperture is the shutter), `shake`, `macro`,
  `shaper`, `animation`, `fan`, `channel` (two faders). Hue reuses `hueshift`; rotation reuses
  `goborotation`.

## Risks / Trade-offs

- [A label built from data can read awkwardly for rare types] → Comments and GDTF names cover the
  common cases; the span is always shown next to it.
- [A GDTF attribute outside every family gets the generic icon] → The check runs one attribute of
  every GDTF family through `channelIcon` and expects a specific icon.
- [Regexes on names can pick a wrong icon] → They run only after attribute and type; a wrong icon is
  cosmetic, and the check lists what each rule catches.
- [Scene rows with mixed fixture types list no ranges] → Deliberate: one value can mean different
  ranges on different fixtures; the list says so.
- [Columns grow from 52 to 64 px] → The strip already scrolls sideways; the name and range need it.

## Migration Plan

None: nothing is saved.

## Open Questions

None.
