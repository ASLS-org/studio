# Tasks

## 1. Setup

- [x] 1.1 Create `feat/add-cue-families` from the current head, keeping the working tree (the
  uncommitted `add-cue-priorities` work is the starting point). Verify: `git status` on the new
  branch shows that work.
- [x] 1.2 With the user's go-ahead:
  - delete `openspec/changes/add-cue-priorities/` (never archived, superseded);
  - point the epic doc's unit 2 at `add-cue-families`.
  Verify: `openspec list` no longer shows `add-cue-priorities`, and `openspec validate --all`
  passes.

## 2. Engine (models/DMX)

- [x] 2.1 Add `families.js` (`FAMILIES` bits, `FAMILY_KEYS`, `familyOf(channel)` from the
  attribute table in design.md). `Fixture.setupFamilies()` replaces `setupChannelGroups()`: it
  sets `channel.family` and the raw `fixture.slots`. Verify: in the app console, the demo MAC
  Aura's channels have these families:
  - Dimmer and Shutter: Intensity;
  - colour channels: Colour;
  - Pan and Tilt: Position;
  - Zoom: Beam.
- [x] 2.2 Cues:
  - `family` is saved (default `'custom'`); `priority` is kept (0 to 200, default 100);
  - `usedFamilies` getters on `Scene` (active channels) and `FX` (modulated types).
  Verify:
  - the demo show loads with every cue Custom at 100 and no unsaved `*`;
  - Cue 0 uses Intensity, Colour, Position and Beam; Cue 6 uses Colour.
- [x] 2.3 Rework `claims.js` into group stacks and fixture slots (design § 3):
  - tokens with a `values` Map, `layer`, `families` and `shown` counters;
  - `Group.familyStacks` and each cue's raw `stage` (set by `CuePool`);
  - `top` and `under` per slot, recomputed on start and stop;
  - the reused `liveSlots` array and the per-tick settle;
  - the newest-writer path for channels with no family;
  - remove owner protection and the per-channel proposals.
  Verify: the app check's main-thread probe shows no task over 50 ms with the four demo effects
  playing.
- [x] 2.4 Replace and Layer (design § 4):
  - a queue of cues to turn off once their replacer's fade-in ends;
  - Layer and Temporary tokens never turn a cue off.
  Verify in the app (real clock):
  - Cue 0, then Cue 4: Cue 0's tile goes off, and stopping Cue 4 doesn't bring it back;
  - Cue 6 (Layer) over Cue 0, then Cue 6 turned off: Cue 0's colour is back.
- [x] 2.5 Fades and rest (design § 5):
  - fade-in from `under`'s live value;
  - hand-back fade-out to `under` or to rest;
  - Intensity `restValue`;
  - resumed fades without `resumeFrom`.
  Verify: stopping the last demo effect takes the dimmers to 0 over its Fade Out, with pan
  unchanged.
- [x] 2.6 Scenes stay on and `cue(false)` stays the one stop. Remove:
  - `Claims.hold`, held tokens and `heldValue`;
  - `Cue.holding`, `releaseLook()` and `Show.releaseHeld()`;
  - `stopNow(hold)` and `fadesOutAtEnd`.
  Verify: a scene with a 2-bar Fade In still plays after 4 bars, and a click fades it out over its
  Fade Out.
- [x] 2.7 Chases:
  - item tokens take families in their cue's mode and priority;
  - an item ending with a Fade Out hands back; one ending without keeps its families;
  - a chase stopping, or a One Shot reaching its end, releases its item tokens.
  Verify in the app: in a chase of a red then a blue Replace Colour scene, only the blue tile is
  lit once the second item starts.
- [x] 2.8 Shared fixtures across groups and priority ordering in the stacks. Verify with a
  two-group show sharing fixtures:
  - group Left's newer blue scene wins only Left's fixtures;
  - an Intensity effect at 150 keeps the dimmers from a newer scene at 100.
- [x] 2.9 A raw `heldFamilies` set on each cue, set on events; `isPlaying` reads it. Verify:
  - after Cue 0 then Cue 6, Cue 0 holds Intensity, Position and Beam and Cue 6 holds Colour;
  - a cue played by a chase reads as playing (the uikit requirement still holds).
- [x] 2.10 (Superseded by 6.1.) Editing on stage: an edit token (`Claims.take(cue, { edit: true })`,
  Layer, priority 201) and `Cue.showForEdit(on)` with its own Live animation. Verify in the app:
  over a playing amber Look, showing a blue Colour scene for editing turns the fixtures blue, the
  scene isn't shown playing, and stopping it brings the amber back.
- [x] 2.11 Older cues get their family from their content in `CuePool.addRaw` (one family, else
  `'custom'`); `CuePool.genCueId()` returns the highest cue id + 1. Verify: the demo show loads
  with Cue 6 in Colour, Cue 9 and the effects in Looks, and no unsaved `*`.

## 3. UI (views)

- [x] 3.1 Add `uk-choice` (`uikit/inputs/choice/`) with a `@story`, and the
  `--opacity-dimmed` token in `tokens.css`. Verify in the app: Left and Right move the selection,
  and a disabled option is dimmed and can't be picked.
- [x] 3.2 Add Cue popup opened by a row's **+**: Type (`uk-choice`), Name ("<row> <n>",
  following the type until typed), Color; it sets the row's family and the Mode by type (scene
  Replace, effect Layer). Verify: the Colour row's **+**, Effect, OK adds "Colour N" at the end of
  the Colour row, selected, in Layer mode.
- [x] 3.3 (Layout superseded by 6.4.) Cue pool as family rows: Looks, Intensity, Colour, Position, Beam; label,
  NOW cell, chips sorted by id, **+**; click selects, the play button plays (held for Temporary);
  drag reorders within a row (ids reassigned, selection follows); lit, covered (idle stripes) and
  progress states; the type as a mask icon; the 120-slot grid and its mini-map removed; geometry
  tokens and constants. Verify in the app: five rows fit the strip, and after Cue 0 then Cue 6
  Cue 0 is lit and Cue 6 lit in the Colour row; dragging a chip reorders it and survives a
  save and load.
- [x] 3.4 Cue Settings:
  - columns: Name, Color, Family | Trigger Style, Mode, Priority | effects: Loop Style, Duration;
  - Family offers only compatible families;
  - Mode labels Replace and Layer;
  - hints rewritten.
  Verify: a scene's widget is two columns of three at 220 px, and no field overflows its widget.
- [x] 3.5 Scene editor follows the family: the channels widget is filtered, and the colour and
  pan/tilt pickers show by family. Verify: a Colour scene shows only colour channels and the
  colour picker.
- [x] 3.6 Effect editor follows the family: `availableChannels(fixtures, family)` (the scopes,
  which hold the presets, follow the channels). Verify on a Position effect: Add Modulated Channel
  lists Pan and Tilt only.
- [x] 3.7 Master column: remove Release and restore Isolate. Verify: the master column looks like
  the group columns.
- [x] 3.8 Rename Absolute/Relative to Replace/Layer in every view string, including the effect
  fade widgets' condition text. Verify: grep `src/views` finds no "Absolute" or "Relative" option
  label.
- [x] 3.9 Chip previews (`views/utils/cue.previews.js`, pure; a computed per cue): scene colour
  gradient, aim dot, level bar, zoom; effect colour gradient over one pass, wave or pan/tilt path;
  a Look's per-family previews. Verify: a Colour scene setting red shows a red preview whatever
  its accent colour, and the demo's Rainbow shows its hues.
- [x] 3.10 NOW cells: holder name ("from" a Look, "editing"), the group's live value per family,
  a click turns the holder off. Verify: a Look then Red reads "Red" with red in the Colour row and
  "from" the Look elsewhere; clicking it stops Red.
- [x] 3.11 (Superseded by 6.1.) Edit on stage in the cue pool: selecting shows the cue (`showForEdit`), the header's
  eye toggle (`$view.editOnStage`, on by default) edits blind, **Escape** and leaving the panel
  stop it. Verify: over a playing Look, selecting a Colour scene shows it at once; with the eye
  off nothing changes.
- [x] 3.12 Hovering a chip highlights the fixtures the cue drives (`$view.previewFixtures`),
  cleared on leave. Verify in the 3D view on the demo.
- [x] 3.13 Family labels: `'custom'` shows as **Look** (Cue Settings' Family, names) and the row
  as **Looks**. Verify: a Custom cue's Family field reads Look.

## 4. App check (scripts/app/check-app.mjs)

- [x] 4.1 Replace the `priorities` scenario with `families`. It checks that chips and NOW match
  the stage in the real app, with the real clock:
  - the demo walk-through: Cue 0, Cue 6, Cue 4, then stops (lit and covered chips, NOW, dimmers
    at rest, pan kept);
  - the rules: cross-group, priority, flashes, Layer hand-back, Mode by type;
  - the rows: placement by family, **+**, reorder saved, editing on stage and blind, hover.
  Update every scenario's cue tile selectors to the rows.
  Update the `fxfades` and `curves` expectations. Verify: `app:check` with `--only
  families,fxfades,curves --url http://localhost:5180` passes, then the full check passes when
  run alone.
- [x] 4.2 Play the demo by hand in headless Chrome, taking screenshots after each click. Compare
  each lit or covered chip and each NOW cell with the stage values. Verify: NOW names the right
  cue for every row, and no stage value comes from an unlit cue except a resting family.

## 5. Docs

- [x] 5.1 Manual:
  - `concepts/timing.md` and `concepts/index.md` (What Plays Together, the Cue);
  - `programming/playback.md` (rows, NOW, play buttons);
  - `programming/scenes.md` (the cue pool rows, **+**, editing on stage, Cue Settings);
  - `programming/effects.md` (Mode by type, channels by family);
  - `programming/chases.md` (items take families);
  - `getting-started/first-show.md` (the rows' **+**);
  - `reference/glossary.md` (Family, Look, Replace, Layer, Rest, NOW; Held removed) and
    `reference/limitations.md`;
  - previews `group-cuepool`, `cuepool-add` (a row's **+**), `scene-stage`, `effect-stage`,
    `cue-settings`, `effect-channel-add`: selectors and steps updated to the rows.
  Verify: review in `npm run docs:manual:serve`, then `npm run docs:manual:check` passes (run
  alone).
- [x] 5.2 AI context:
  - `src/models/DMX/CLAUDE.md` § Merge (families, stacks, slots, the edit token);
  - root `CLAUDE.md` rule 6;
  - the `user-manual` skill coverage map (`claims.js`, `families.js`, `cue.previews.js`,
    `uk-choice`);
  - `src/views/CLAUDE.md` (the cue pool rows, `cue.previews.js`, `maskIcon`) and the
    `vue-ui-change` skill (`maskIcon` for dense re-rendered places).
  Verify: grep finds no stale "HELD", "Release", "owner protection" or "held look" in AI files.
- [x] 5.3 `npx eslint` on all touched files is clean.

## 6. Second review: columns, play on click, kept values, the timeline

- [x] 6.1 Play on click (design § 8):
  - `Cue.cue(true, { now: true })` skips the Fade In (also for a cue fading out);
  - `Claims.raise(token)` and `Cue.raise()` put a playing cue back on top without restarting it;
  - remove the edit token, `showForEdit`, `playEdit`, `editClaim`, `editAnimationId`,
    `editStart`;
  - `$view.onStage` replaces `editOnStage`.
  Verify in the app (real clock): on stage, clicking Red, Full and a Position effect plays all
  three; clicking Red under a playing Layer colour effect shows Red at once, the effect still
  playing; blind, a click changes nothing.
- [x] 6.2 Chase items turned off stay off (`Cue.itemCut`); `Chase.update` tags `cue.itemChase`.
  Verify with the probe from this review: two overlapping Replace colour items turn the fixtures
  blue at the second item and they stay blue (no swap) until red's next item.
- [x] 6.3 Kept values and reset (design § 5): `slot.rested`, `restValue` recorded only from rest,
  `slot.keptFrom`, `Claims.restore(fixtures, family)`. Verify: Red stopped keeps red with
  `keptFrom` Red; Blue played and stopped over it; a reset brings back the colour from before
  Red, not red.
- [x] 6.4 Cue pool as family columns (design § 9): sticky heads (darker) with the family icon,
  name, **+** and NOW; lighter bodies; chips stacked and dragged up and down; the Add Cue popup
  from a head's **+**; adding opens the cue like a click. Verify in the app at the default strip
  height and with the strip enlarged; the main-thread probe stays under 50 ms on a panel switch.
- [x] 6.5 Chips: the two-line layout, the pictures (dots per fixture, cone), the value lines
  (`cueSummary`), a Look's family icons. Verify on the demo and on Red, Full, a Position scene at
  pan 30° tilt 45°, and a Beam scene.
- [x] 6.6 Edits show at once: `FixtureValue` colour and pan/tilt access through the instance the
  editor calls; check every effect editor. Verify: changing a scene's colour in the colour
  picker updates its chip at once; same for the Pan/Tilt picker and an effect's wave.
- [x] 6.7 NOW (`views/utils/cue.now.js`): the cue, "from" a Look, cue and chase, `kept:`, `rest`;
  a click stops, lets go of an item, or resets. Verify each form in the app, and that a reset
  leaves NOW on `rest`.
- [x] 6.8 Chase timeline: lanes grouped by family, family head rows, priority on lane heads,
  Fold Cues hiding empty families; `views/utils/chase.outcome.js`; holders' segments, covered
  stretches striped, turned-off stretches dimmed, tooltips. Verify the three timeline scenarios
  of the chases spec in the app, and that drag, resize, double-click add and delete still work.
- [x] 6.9 App check: update the `families` scenario and every selector to the columns and
  play-on-click; add the overlap (no swap), kept/reset, value lines, preview refresh and the
  timeline outcome. Verify: `--only families,fxfades,curves` passes on 5182, then the full check
  run alone.
- [x] 6.10 Manual: the pool's columns, on stage / blind (a click plays), NOW's forms and reset,
  the value lines, the timeline's families and outcome (`programming/scenes.md`,
  `programming/playback.md`, `programming/chases.md`, `concepts/timing.md`,
  `getting-started/first-show.md`, `reference/glossary.md` for Kept and On stage / Blind,
  `reference/shortcuts.md` without Escape); previews and demos updated (`group-cuepool`,
  `cuepool-add`, `scene-stage`, `effect-stage`, `chase-modifier`, `timeline-add`). Verify:
  `npm run docs:manual:check` passes for every touched preview, run alone.
- [x] 6.11 AI context: `src/models/DMX/CLAUDE.md` § Merge (raise, now, rested and kept, item cut,
  no edit token), `src/views/CLAUDE.md` (columns, `cue.now.js`, `chase.outcome.js`), the
  `user-manual` coverage map (`chase.outcome.js`, the timeline presets). Verify: grep finds no
  `showForEdit`, `editOnStage` or "editing" NOW in code or AI files.
- [x] 6.12 `npx eslint` on all touched files is clean.

## 7. Third review: list rows, no cue colour, the timeline's items

- [x] 7.1 `uk-list` `row` slot and `uk-list-item` default slot (opt-in); `uk-cue-picture`
  (`uikit/cues/`). Verify: every other list renders as before (app check), and the slot rows keep
  hover, selection, focus, keys and the grip.
- [x] 7.2 Cue pool rows as `uk-list` rows (design § 9): one surface colour, border between rows,
  list hover and selection, the grip drag; `select` opens, `reorder` reassigns ids; the playing
  fill and blinking stop icon; covered stripes; no accent. Verify in the app: hover, click (on
  stage and blind), Up/Down, a grip drag saved, a scene's fill over its fade in.
- [x] 7.3 Heads: icon and name in `--secondary-lighter`, an **add** `uk-button`. Verify: the add
  button opens Add Cue for its column.
- [x] 7.4 No cue colour in Add Cue and Cue Settings (Name, Family, Trigger Style | Mode,
  Priority). Verify: neither offers a colour; a saved colour stays in the show data.
- [x] 7.5 Chase timeline: 40 px lanes with the pool's row look in lane heads; neutral items with
  picture and name over the fade curve; foldable family heads; neutral holder segments with
  pictures. Verify the chases spec's scenarios in the app, and drag, resize, add and delete.
- [x] 7.6 App check, manual (pages and previews that mention cue colours, chips or +), AI context
  (`uk-list` row slot, `uk-cue-picture`), lint; full app check and manual check run alone.

## 8. Fourth review: no Looks, blind, read-only NOW, kept rows

- [x] 8.1 One family per cue: `FAMILY_KEYS` without `'custom'` (`LOOK_FAMILY` kept for loading);
  `familyData(keeps)` on scenes and effects; `Group.loadCues` splits a cue without a family or
  saved as a Look, `Group.addChase(data, parts)` copies its lanes; Cue Settings offers
  every family while the cue is empty, else its own. Verify in the app: the demo loads with no
  Looks, each part plays its family only, a split cue's chase lanes have the same items, the show
  isn't marked unsaved; save and reload keep the parts.
- [x] 8.2 Channels of no family in every editor (scene channels widget, Add Modulated Channel).
  Verify: a Position scene lists Pan/Tilt Speed when its fixtures have it.
- [x] 8.3 Blind only: remove `$view.onStage`, the header toggle, `Cue.raise`, `Claims.raise` and
  `cue(true, { now })`; a click or Up/Down only opens. Verify: clicking a row changes nothing on
  stage; the play button plays with fades.
- [x] 8.4 NOW read-only, a list row high; `applyNow`, the Looks NOW and `Claims.restore` go (no
  reset). Verify: clicking NOW does nothing; a kept family stays until another cue takes it.
- [x] 8.5 Rows: the play button always shown (on the picture, on hover, since 9.4); the list's selection and the playing fill as
  before; a kept cue's fill stays where it stopped (`Cue.progress`, `Cue.stopProgress`). Verify: a
  scene stopped halfway through its Fade In keeps a half fill until another cue takes its family.
- [x] 8.6 Timeline and pool without the Looks column and family icons; the hero's mock cues get
  families. Verify: four family heads in the timeline.
- [x] 8.7 App check (families scenario: four columns, the split, blind clicks, read-only NOW, the
  kept fill), manual (Looks, on stage / blind, NOW clicks and reset, kept rows), AI context, lint;
  full app check and manual check run alone.

## 9. Fifth review: no priority, Replace by default, readable pictures, play on the picture

- [x] 9.1 No priority: `CUE_PRIORITY`, `Cue.priority` and its `showData` key, the claims' rank by
  priority (stacks and slots by start alone, the Replace check), the chase outcome's, Cue Settings'
  Priority field and hint, the timeline's `P150`. Verify: a cue started last takes its family; a
  saved priority is ignored on load; Cue Settings shows Name, Family, Trigger Style | Mode.
- [x] 9.2 New cues Replace (effects too). Verify: Add Cue's effect is Replace; its fade widgets
  hide until Mode is Layer.
- [x] 9.3 Pictures: waves over one cycle, layered and fainter (`paths`); positions first fixture
  only, an effect's path filling the picture. Verify on the demo: a fast dimmer effect draws one
  cycle; Ballyhoo's path fills its picture.
- [x] 9.4 Play button over the picture: shown on row hover (picture dimmed), the stop always shown
  while playing; no hover highlight. Verify: hover shows it, a playing row shows the stop, the 3D
  highlight doesn't change on hover.
- [x] 9.5 App check, manual (priority, Mode by type, play button, hover), AI context, lint; full app
  check and manual check run alone.

## 10. Sixth review: two columns, fades for every cue, family colours in chases

- [x] 10.1 Cue Settings in two columns (effects too: Loop Style and Duration at their foot).
  Verify: an effect's settings show two columns.
- [x] 10.2 Every cue fades: `fades` goes; effect fade widgets always shown. Verify: a Replace
  effect with a Fade In blends in, then turns off what it covers; its chase item fades.
- [x] 10.3 Family accents in the chase timeline (items, curves, holders, head edges). Verify: items
  of different families read apart.
- [x] 10.4 No forced layouts on a panel switch: the colour picker places its ticks once per frame;
  the Effect Tool's canvas takes its first size from its `ResizeObserver`. Verify with a CPU profile
  of Group 0's open while two cues play: no layout reads left.
- [x] 10.5 App check (fade widgets in Replace, settings columns), manual (fades of every effect,
  Cue Settings, timeline colours), AI context, lint; full app check and manual check run alone.

## Workflow follow-up

- The user retests on 5182 (or 5180) after a full reload; archive only on their approval.
- Archive: sync the `playback`, `scenes`, `effects`, `chases` and `uikit` specs, commit on
  `feat/add-cue-families`, and update the epic's status table.
