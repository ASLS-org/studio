## 1. Fixture profiles (models/fixtures, models/DMX)

- [x] 1.1 Add `capability.labels.js` (`capabilityLabel(data, wheels)`) and `Capability.label`; the
  OFL and GDTF adapters pass their wheels. Verify: a Node bundle prints the labels of a strobe
  channel (*Strobe slow → fast*), a gobo wheel (slot names) and an effect channel of OFL fixtures,
  and the shutter, gobo and prism ranges of the GDTF bundle (channel set names); every range of
  every OFL and bundled GDTF fixture has a non-empty label.
- [x] 1.2 `Fixture.simplifiedChannels` adds `capabilities`. Verify: channel type, colour, fine and
  `qaIndex` are unchanged for every OFL and bundled GDTF fixture against the previous build.

## 2. UI (views)

- [x] 2.1 `views/utils/channel.icons.js` (`channelIcon`) and the new SVGs; the channels widget uses
  it. Verify: a Node run over every mode of every OFL and bundled GDTF fixture finds an existing
  icon for every channel, never `close`; one attribute per GDTF family gets a specific icon, not
  `channel`; open a universe with the demo MAC Aura and one with a GDTF spot: no "x".
- [x] 2.2 `uk-select-input`: `#trigger` and `#header` slots, `searchable`, `emptyText`, `reselect`;
  the list is built only while open and opens upwards from a trigger. Verify: existing selects look
  and behave the same (app:check `select` passes), panel switches stay under 50 ms.
- [x] 2.3 Channels widget: each column has a channel box under its value (icon, current range or name,
  ellipsis, tooltip `name: range`) opening the range list (header with icon and full name, search on
  every list, fixed size with idle stripes); columns 64 px; universe and scene rows (shared ranges only, picking activates);
  gizmo keys ignore fields. Verify: in a universe, open the dimmer (one range, header *Beam
  dimmer*), search the shutter for *strobe*, pick *Open*: the fader jumps to 20, the box shows
  *Open*; in a scene with two same-type fixtures, pick on an inactive channel: both get the value,
  the channel is active, `*` appears; Down/Enter/Escape work; typing *r* in the search leaves the
  gizmo alone.

## 3. Checks and docs

- [x] 3.1 `app:check`: new scenario `presets` (every OFL and bundled GDTF channel's icon exists and
  isn't `close`; one attribute per GDTF family gets its family icon; GDTF spot shutter ranges carry
  their channel set names; a dimmer has no menu; picking a shutter preset in a universe sets the
  range start and marks it; in a scene it sets both fixtures and activates the channel; keyboard
  pick). Verify: `npm run app:check` passes, and the new checks fail on the old code.
- [x] 3.2 Manual: channels sections of `programming/patching` and `programming/scenes` (icon menu,
  tooltip); check the `fixture-channels` preview shows the new icons. Verify: `npm run
  docs:manual:check` all clear.
- [x] 3.3 AI context: `models/DMX/CLAUDE.md` (capability labels), skill `fixture-library` (labels
  come from both adapters; `channelIcon` rules are keyed on GDTF attributes), skill `vue-ui-change`
  (`channelIcon`, `uk-select` trigger). Verify: each names the new piece.
- [x] 3.4 `npx eslint` on all touched files is clean.
