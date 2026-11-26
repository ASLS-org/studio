# Design

## Context

See proposal.md for why. Where the code stands on `feat/add-cue-priorities` (uncommitted):

- **`src/models/DMX/claims.js`:** while a cue plays, `Fixture.setChannel` proposes values under
  `Claims.writer`. `Live.update` calls `Claims.beginFrame()` and `Claims.settle()` each tick.
  - The settle pass decides each channel by priority, then start. A channel stays with its
    owner on skipped ticks.
  - Colour and Pan/Tilt are grouped (`buildChannelGroups`).
  - Ended scenes and chase items hold their look (`held` tokens, `heldValue`).
  - A stopped cue with nothing underneath freezes (`restValue`).
- **Cues:**
  - `Cue.claim` and `Cue.itemClaim` are tokens.
  - `Cue.holding` and `releaseLook()` back the HELD tile, and `Show.releaseHeld()` backs the
    master's Release.
  - Scenes end once faded in (`endsAfterDuration`, `stopNow(hold)`).
- **What to keep from it:**
  - writes go through `Cue.play(token, t)` and a per-tick settle pass;
  - the colour group rule;
  - priority in `showData`;
  - fade factors computed by the cue;
  - fades blending with a live value underneath.
- **Data the rest of the design relies on:**
  - Channels carry a GDTF-style `attribute` (OFL and GDTF adapters alike).
  - `views/utils/channel.icons.js` already sorts attributes into icons.
  - The effect presets (`effect.preset.model.js`) are already grouped as Zoom, Dimmer, pan & tilt
    and Color.

## Goals / Non-Goals

**Goals:**
- A chip is lit exactly when something of its cue is on stage, and NOW names the source of every
  family.
- Family hand-overs are decided when a cue starts or stops, not per channel per tick.
- Per-tick work stays one pass over the channels of held families, with no allocation.

**Non-Goals:**
- Virtual intensity for fixtures without a dimmer (`wire-group-masters`). An Intensity cue doesn't
  reach their RGB channels.
- A channel-source display (`add-programmer`).
- Changing the demo showfile.

## Decisions

### 1. Families come from attributes, in the engine

A new `src/models/DMX/families.js` exports:
- `FAMILIES`: `INTENSITY`, `COLOUR`, `POSITION`, `BEAM`, as indexes 0 to 3 (a set of families is an
  array of four booleans: the lint rules forbid bitwise operators);
- `FAMILY_KEYS`: `'intensity'`, `'colour'`, `'position'`, `'beam'` (`LOOK_FAMILY`, `'custom'`,
  only to recognise the dropped Looks on load);
- `familyOf(channel)`, from an attribute regex table:

| Family | Attributes |
|---|---|
| Intensity | `^(Dimmer\|Intensity)`, `^(HSB\|CIE)_Brightness`, `^Shutter`, `^Strobe` |
| Colour | `^Color(Add\|Sub\|RGB)_`, `^Color\d`, `^(CTO\|CTC\|CTB\|Tint)`, `^HSB_(Hue\|Saturation)`, `^CIE_`, `^ColorMacro`, `^ColorMix` |
| Position | `^Pan`, `^Tilt`, `^XYZ_` (except `PanTiltSpeed`, `*MSpeed`) |
| Beam | `Zoom`, `^Focus`, `^Gobo`, `^Prism`, `^Iris`, `^Frost`, `^(BeamShaper\|Blade\|Shaper\|KeyStone)`, `^Animation`, `^Effects\d+(?!Rate\|Fade)` |

- Anything else is 0 (no family). It follows the newest writer, as the "Other" channels did
  before.
- Views import this module (views may import models; models never import views).
- `Fixture.setupFamilies()` replaces `setupChannelGroups()`. It sets `channel.family` and builds
  one **slot** per family present: `{ family, channels, top, under, live }`, stored in
  `fixture.slots[bit]`. Slots are runtime and raw, never saved.
- *Alternative:* derive the family from the channel `type`. Rejected: types are OFL names and
  aren't standard across fixtures, while attributes are.

### 2. The family a cue belongs to, and the families it uses

- **`Cue.family`** is saved as a key, one of the four families: a cue sets one family. It decides
  the cue's column in the cue pool, its editor's channels and its default name. Combining families
  is a chase's job (the user dropped Looks in the fourth review: they blended what chases already
  do, and made NOW say "from").
  - A new cue takes the family of the column whose **add** created it.
  - An older cue (no saved family, or `'custom'`, the dropped Look) is split on load (§ 10).
- **`Cue.usedFamilies`** is a getter returning a set of families from the cue's content:
  - scenes: the families of their active channels;
  - effects: the family of each channel their targets drive on active fixtures.
  - The engine places tokens by what they write, so the stage always matches what a cue drives,
    whatever its saved family.
- **Cue Settings** offers every family while `usedFamilies` is empty, else only the cue's own
  (spec: A cue's family), so changing the family never drops data; the cue then moves to that
  column.
- **Channels of no family** (speeds, control) show in every cue's editor and follow the newest
  writer, as before; they don't count in `usedFamilies`.
- *Alternative:* keep Looks for multi-family effects (a ballyhoo: Position + Intensity). Rejected:
  two concepts for one column; two effects fired by one chase item stay in phase.

### 3. Engine: group stacks, fixture slots, tokens

`claims.js` is reworked in place and keeps its name and entry points (`take`, `release`,
`beginFrame`, `settle`, `writer`, `reset`).

```
 per group, per family: stack (newest first)
   stack[0] = holder;   the rest are covered (Layer, flashes)
 per fixture, per family: slot
   top   = among the group holders that cover this fixture: the newest
   under = the next candidate on this fixture (fades blend with it), else rest
 per token: values Map(channel -> last proposed value), fade state, shown[f] counters
```

- **A token per play**, as now (`cue(true)`, a chase item entering). It gets:
  - `stage`: the group's stacks;
  - `layer`: true for Layer mode or a Temporary cue;
  - `families`: `usedFamilies` at take, refreshed when an edit changes it;
  - `values`: one Map, whose keys are added on first write and updated in place afterwards.
- **Group stacks:** `Group` creates `familyStacks` (one array per family, raw), and `CuePool`
  gives each cue a raw `stage` reference to them when it adds the cue. A cue belongs to one
  group, so a chase item uses its cue's stage.
- **Writes:** while `Claims.writer` is set, `Fixture.setChannel` stores the value in
  `writer.values` and nothing else. Skipped ticks keep the last value, so owner protection is no
  longer needed.
- **Events, on start and stop only:**
  - insert the token into or remove it from its stacks;
  - recompute `top` and `under` for the slots of the fixtures involved (the new token's and the
    displaced holders'), and update the `shown` counters;
  - add slots to or remove them from `Claims.liveSlots`, a reused array;
  - allocation happens only here.
- **Settle, per tick:** for each live slot and each coarse channel in it:
  - take the top token's value; the channels it doesn't drive are 0 for Colour and their current
    value otherwise, which is the colour rule of the spec "Colour and position move whole";
  - blend with `under` while the top fades in or out (Decision 5);
  - write with the existing `write()` (clamp, fine split).
- **Other channels** (no family) keep the old path: the newest writer this tick writes, else the
  value stays.
- *Alternative:* keep per-channel proposals and owner protection (the current claims.js).
  Rejected: it decides per channel per tick, so a family can split across cues. That was the
  root of the mush and of the HELD edge cases (a cue held but holding nothing).

### 4. Replace and Layer

- The stored `relative` field doesn't change: 0 is **Replace**, 1 is **Layer**. Only the labels
  change, to **Mode: Replace / Layer**.
- A token in Replace mode, once its fade-in ends, turns off every cue it covers entirely. That
  check runs on start; the cue is queued until the fade-in ends, then `Cue.letGo(token)`. A cue is
  covered entirely when, for every family it uses, its group's holder is newer, Replace and not
  Temporary, and it shows on no fixture.
- A Layer or Temporary token never turns anything off. When it leaves the stacks, the covered
  token is on top again.
- *Alternative:* every cue replaces. Rejected: a Layer effect over a scene must fade back to it,
  which the archived `add-effect-fades` asked for.

### 5. Fades and rest

- **Fade in:** at take, for each slot it becomes top of, the token blends from `under`'s live
  value. That is the covered token's current value, so it follows a moving effect. With nothing
  under, it blends from the channel's value when it took it.
  - Replace effects don't fade, as before (`fades` stays Layer-only for effects; scenes always
    fade).
  - The old Absolute "from 0" for scenes goes. A Replace scene crossfades from what is shown, so
    heads don't swing through pan 0.
- **Fade out (hand-back):** a token turned off with a Fade Out stays top while `releasing`. It
  blends toward `under`, or toward rest when there is none, then leaves the stacks. With no
  Fade Out, it leaves at once.
- **Rest:** a slot starts `rested` (its channels hold their rest values). When a rested slot gains
  a top, it records each channel's value (`restValue`) and is no longer rested. When the slot
  loses its last top, Intensity blends to `restValue` and the slot is rested again; the other
  families keep the last written value (the slot stays unrested, so a later take doesn't record
  the kept value as rest) and the slot remembers the cue that left it (`keptFrom`). Values set by
  hand in the universe view while nothing plays are therefore the rest.
- **Kept is what the stage shows** when the last holder leaves: an effect's last frame, or the
  mix a scene's Fade In had reached when it was stopped. It stays until another cue takes the
  family. The user chose this over keeping the last scene that finished fading in, and over
  always resting.
- **The kept cue's row** keeps its fill where it was when it stopped: `Cue.stopProgress`
  (runtime) records `Cue.progress` (a scene's fade factor, an effect's pass) when a play stops
  being shown: a stop, a fade-out's start, a One Shot's end, an item let go.
- **No reset** (fourth review): the column reset button was dropped with `Claims.restore`; the
  user doesn't expect to reset during a show. `restValue` stays for Intensity's rest.
- A **resumed fade** (cued again while fading out) keeps the current behaviour: the cue's own
  fade factor runs from where it was (`fadeFrom`). The token blends with `under` as in a fade-in.
  The `resumeFrom` bookkeeping goes, because the blend base is always `under`.

### 6. Scenes stay on

- `Scene.endsAfterDuration` becomes false. A scene stays on, and keeps ticking, until it is turned
  off, taken by Replace, or deleted.
  - Ticking keeps live edits of a playing scene on stage (uikit spec: Operator edits show
    immediately).
  - It costs the same as a playing scene costs today.
- `fadesOutAtEnd`, `stopNow(hold)`, `Claims.hold`, `held` tokens, `heldValue`, `Cue.holding`,
  `releaseLook()` and `Show.releaseHeld()` are removed.
- `cue(false)` stays the one way to stop: Fade Out, then hand-back. A playing row's stop button
  calls it (`releaseItem()` for a cue on stage through an ended chase item). A cue a Replace cue
  covers entirely is let go without a fade (`Cue.letGo(token)`): the newcomer's fade-in is the
  crossfade.

### 7. Chases

- An item entering takes an item token in its cue's mode (spec: Chase items take families).
- At the item's end, a cue with a Fade Out has faded (`itemOut` marks the token releasing). Its
  token then leaves the stacks, handing back.
- Without a Fade Out, the token stays until displaced: a later item's Replace takes it, the chase
  stops, or NOW naming it is clicked. `Chase.cue(false)` and a One Shot end release item tokens after
  their fade-outs, as now.
- **An item turned off stays off.** A Replace cue turning off an item's token (`Cue.letGo`)
  releases it and sets `Cue.itemCut`, keeping `itemActive`. While cut, `playItem` doesn't play;
  entering another item of the cue clears it. Before, the next tick re-entered the item with a new,
  newest token, which turned its replacer off in turn: two overlapping Replace items swapped the
  stage every tick (seen in the app: red and blue alternating about 25 times a second).
- `Chase.update` tags the cue it plays (`cue.itemChase`, raw, runtime), so NOW can name the chase.
- The chip shows these tokens as lit, because chip state comes from tokens.

### 8. Blind programming

- **A click opens, never plays.** A click on a row, or Up/Down in a column, only selects the cue
  (opens its editor). Its play button plays and stops it with its fades; a Temporary cue's play
  button flashes while held. Editing a cue that isn't playing changes nothing on stage; a playing
  cue's edits show because playing cues tick (scenes stay on).
- **Removed with on stage (fourth review):** `$view.onStage` and the header toggle, `Cue.raise()`,
  `Claims.raise(token)` and `cue(true, { now: true })`. Putting a covered cue back on top was a
  click on a playing cue; now one stops what covers it.
- **Removed earlier:** the edit token (`edit` option, `EDIT_PRIORITY`), `Cue.showForEdit`,
  `playEdit`, `editClaim`, `editAnimationId`, `editStart`, the pool's `editCueId`, its watcher,
  Escape, and NOW's "editing".
- *Alternatives tried:* a preview layer (one cue with two states, dropped by any play), then
  playing on click with an on stage / blind toggle (a selected cue and a playing cue looked alike,
  and a click changed the stage while programming). Both rejected by the user.

### 9. UI

- **Cue pool as family columns** (`group.modifier.widget.cuepool.vue`):
  - four columns side by side: Intensity, Colour, Position, Beam, each a one-off width (raw,
    commented). The whole cue pool is `--primary-light`, heads and rows alike;
  - **head**: the family's mask icon and name in `--secondary-lighter` and an **add** `uk-button`
    (icon `new`, as the widgets' add actions); under it the NOW line, a list row's height; a border
    below it;
  - **rows**: each column is a `uk-list` (`draggable`, `deletable`, `no-highlight`, `tall`,
    controlled `selection` = the selected cue) whose rows take the cue's content through the
    list's `row` slot: they are list rows (border between rows, hover, selection, blue when
    focused, Up/Down, the filler's idle stripes, the grip with rows sliding apart and Escape). The
    list's `select` (a click or a key) opens the cue (§ 8); `reorder` reassigns the column's ids in
    the new order. Each column scrolls its own rows under its head;
  - hover: `$view.previewFixtures(ids of the fixtures the cue drives)`, cleared on leave.
- **Row content** (the `row` slot): the picture (`uk-cue-picture`, a new uikit component in
  `uikit/cues/`, plain elements and inline SVG); the type as a mask icon, the name (`h4`, as list
  labels) and the play button, always shown; the value line. No cue colour.
  - **Playing** is shown as the group pool's playing chase cells show it: a `--secondary-light`
    fill growing across the row with `Cue.progress` (a scene's fade factor, then full; an effect's
    pass) and the stop icon blinking. **Kept** (NOW's `kept` is the cue): the fill stays at
    `stopProgress`, with the play icon. **Covered**: `var(--idle-stripes)` over the row. A
    thinner progress bar and an outlined selection were tried in the fourth review and dropped.
- **Pictures and value lines** (`views/utils/cue.previews.js`: `cuePreviews(cue)` and
  `cueSummary(cue)`, pure, computed per cue in a computed, recomputed on edits only):

| Content | Picture | Value line |
|---|---|---|
| Intensity scene | level bar (average of dimmers) | `75%`, `20–100%` when they differ |
| Colour scene | swatch (gradient of the fixtures' colours) | nearest colour name (a small hue/lightness table: Red, Orange, Amber, Yellow, Green, Cyan, Blue, Purple, Magenta, Pink, White), else `3 colours` |
| Position scene | one dot per fixture (up to 16) over a crosshair | `Pan 30° Tilt 45°` from centre (`angleRange` of the first fixture), else `4 aims` |
| Beam scene | a cone as wide as its zoom (else a disc) | each beam channel of the first fixture: `Zoom 40%` for a one-range channel, its range's name (`rangeLabel`) otherwise, joined by ` · ` |
| Effect | its wave, pan/tilt path, or colour gradient over one pass | the kinds it moves (two at most, then `+N`) and its duration: `Dimmer · 1 bar` |

- **Edits show at once.** The colour and pan/tilt pickers wrote through `FixtureValue`'s
  constructor closures, which hold the raw instance, so Vue never saw those writes and chips
  lagged. `setColor`, `setPanTilt`, `getColor` and `getPanTilt` now read and write through the
  instance they are called on (the editors call them on the reactive scene); the closures stay for
  playback. Effect editors are checked the same way.
- **NOW line** (per column, through the live ticker; `views/utils/cue.now.js`, shared with the
  chase timeline):
  - text, from the group's stack top (`familyStacks[f][0]`) else the fixtures' slots: the cue's
    name; the cue's and the chase's names (`Cue 4 · Verse`) when the holder is an item token;
    `kept: <cue>` (a slot of the group's fixtures with no top and a `keptFrom`); `rest`;
  - value: the group's fixtures read from their channels: Intensity level, colour swatch
    (`readColor`), aim dot (`readPanTilt`), zoom;
  - read-only: a click does nothing. Its click used to stop the holder, stop a whole Look, let go
    of a chase item or reset, depending on the state: five actions behind one small label.
    Stopping is the rows' play button (an item's cue: it lets go of the item).
- **Add Cue popup** (`group.modifier.popup.cuepool.vue`), opened by a column's **add**: **Type**
  (`uk-choice`: Scene `mixer`, Effect `waveform`) and **Name** (default "<family> <n>", n = the
  column's count + 1, following the type until typed); no Color (a new cue keeps the group's
  colour in its data, unused). It sets `family` and
  `relative` 0 (new cues Replace, scenes and effects alike), and the id from a fixed
  `CuePool.genCueId()` (highest cue id + 1; it read a `chases` list cue pools don't have).
- **Chase timeline** (`chase.modifier.widget.timeline.vue`):
  - lanes grouped under family heads (a 24 px row each, the family's arrow, icon and name, in
    the pool's order; a click folds or unfolds the family's lanes, kept in the widget for the
    session), lanes sorted by cue id and 40 px tall (`--row-height-tall`, the pool's rows); a lane
    head shows its cue as the pool's row does (picture, type, name, value line)
    **Fold Cues** also hides families with no items. The
    drag and resize refs keep each lane's index in `pool.cues`;
  - items are neutral (`--primary-light`, a `--secondary-light` border), with the cue's picture
    and name over the fade curve;
  - **outcome** (`views/utils/chase.outcome.js`, pure, computed on edits): a pass over the
    chase's items by the playback rules (stacks by start, Replace turning off what
    it covers entirely once faded in, items without a Fade Out holding until displaced or the
    chase's end, an item turned off staying off until its cue's next item). It assumes each item
    covers the group's fixtures, ignores cues played outside the chase, and starts from nothing at
    the chase's start. It returns, per family, the holders' segments, and per item its covered
    stretches (it holds none of its families) and where it was turned off, with who did it;
  - each family head row draws its holders' segments, neutral, each with its cue's picture and
    name when they fit;
    an item's covered stretches are striped (`--idle-stripes`), its stretch after a turn-off is
    dimmed (`--opacity-dimmed`); its tooltip gives Mode and what covers or turned it
    off, from when.
- **`uk-choice`** (`uikit/inputs/choice/`), a new uikit input: props `label`, `options` (`{ key,
  label, icon, title, disabled }`), `modelValue`; drawn like toggled buttons (`--accent-blue`);
  Left and Right while focused; a `@story`. `--opacity-dimmed` is a new token.
- **Icons as mask classes** (`uikit/icons/icon.mask.js`): `maskClass(name)` writes one rule per
  icon in a shared stylesheet and returns its class, for places the live ticker re-renders (cue
  rows, chase lanes, the list rows' trash and grip): a component per icon, or a mask *style*
  object (set again key by key on every render), made panel switches block over 50 ms.
  `maskIcon(name)` (the style) stays for one-off places; `uk-icon` uses a loaded icon's component
  directly.
- **Panel switches stay under 50 ms:**
  - each cue's content (`sharedContent`) is one cached `computed` per cue, shared by the cue pool
    and the chase timeline: opening a panel recomputes nothing, an edit recomputes its cue only;
  - the chase outcome takes each cue's families from that content: reading `usedFamilies` walked
    every channel through reactive proxies and blocked a chase's opening by itself;
  - the timeline's fade curves are drawn in a `viewBox` (the item's width in pixels, 100 units
    high, stretched to the lane) instead of measuring each lane: they draw on the first render,
    with no remount of every lane and item after mounting. A forced re-render doesn't reach
    them: they sit in a child component's slot, which Vue 3 doesn't re-render.
- **Cue Settings:** Name, Family, Trigger Style | Mode | (effects) Loop Style, Duration; no Color
  or Priority; 220 px for scenes, `--widget-width-lg` for effects; hints on Family and Mode.
- **`uk-list` `row` slot** (opt-in): a list given a `row` slot renders it (scoped with the item)
  as each top-level row's content, in place of the icon, label and detail; `uk-list-item` takes it
  as its default slot. Everything else of the row stays (classes, tools, drag).
- **Editors:** the scene editor shows its family's channels and those of no family, and its
  family's picker; `availableChannels(fixtures, family)` filters Add Modulated Channel the same
  way. Presets live in the scopes,
  which follow the channels.
- **Master column:** Release goes, Isolate is back (not wired yet: `wire-group-masters`).
- **Labels:** "Start: Absolute/Relative" becomes "Mode: Replace/Layer".

### 9b. Fifth review

- **No priority.** It came for held looks; with one cue per family and flashes it hid why a cue
  didn't take over. `CUE_PRIORITY`, `Cue.priority`, the token's rank by priority and the timeline's
  `P150` go: stacks and slots rank by start (`stamp`) alone, and a Replace token turns off what it
  covers whatever was saved. Lost: a cue played by hand over a running chase lasts only until the
  chase's next item in that family (a held flash, or stopping the chase, covers it).
- **New cues Replace,** effects too; Layer stays settable. Saved modes stay.
- **Pictures:** an effect's waves are sampled over one cycle of each (t in `[0, 1/frequency]`), a
  pan/tilt path over one cycle of its slower axis, colours over one cycle of the slowest colour
  wave; several waves of a family are layered (`paths`), each fainter (`uk-cue-picture`). A
  position shows the first fixture only: a scene's aim as one dot, an effect's path scaled to
  fill the picture (its bounds, same scale on both axes).
- **The play button** sits over the picture's centre, shown on row hover with the picture dimmed
  and blurred; while playing, the blinking stop stays shown.
- **No hover highlight:** `previewFixtures` from the cue pool and the content's fixture ids go;
  highlighting a cue's fixtures may come back later.
- **Presets** (standard cues per group: blackout, colours, positions, the rest cue first in each
  column; export, import, clear) are a separate change after this one.

### 9c. Sixth review

- **Every cue fades**, scenes and effects in either Mode: `Effect.fades` (Layer only) and the
  `fades` checks go; the effect modifier shows its Fade In and Fade Out widgets always. A Replace
  effect fades in from what it covers, then turns it off, as a Replace scene does. New effects
  still start with 0-bar fades (a new scene fades in over a bar).
- **Cue Settings in two columns** for every cue: Name, Family, (effects) Loop Style | Trigger
  Style, Mode, (effects) Duration; 220 px.
- **Family colours in the chase timeline:** each family has an accent token (`cue.families.js`:
  Intensity `--accent-gold`, Colour `--accent-pink`, Position `--accent-blue`, Beam
  `--accent-green`), set as `--family` on its head, lane heads and rows. Items are tinted with it
  (`color-mix` over `--primary-light`), their fade curve drawn in it, holder bars tinted, lane and
  family heads given a 3 px edge and the family icon in it. Neutral items blended together and
  felt cold; cues themselves keep no colour of their own.
- **Two forced layouts gone** (found by the panel-switch budget once Group 0 opened on an effect
  with its fade widgets): the colour picker placed its ticks by measuring on every colour change
  (a colour effect on the selected fixture changes it each tick, the picker shown or not); it now
  places them once per frame (`schedulePosition`). The Effect Tool's wave canvas measured itself
  while mounting; its `ResizeObserver` now gives the first size, after layout.

### 10. Showfile and load

- `Cue.showData` adds `family` (key string). `priority` is no longer saved; a saved one is
  ignored.
- **Split on load** (`Group.loadCues`, called by `Show.prepareGroups`): a cue with no `family`, or
  `'custom'`, is built once to read its families (`usedFamilies`). One family: it takes it. None:
  Intensity. Several: one cue per family, in family order, each from the cue's `showData` with only
  that family's content (`familyData(keeps)`: a scene's other entries made inactive,
  fine channels following their coarse one; an effect's other waves left out), the same name and
  settings; the first keeps the id and the channels of no family, the others get new ids.
  `Group.addChase(data, parts)` copies a split cue's lane for each part with the same items.
  Loading takes the save snapshot after building, so older shows aren't marked unsaved.
- Column order is cue id order, so older shows keep their cues' relative order within each
  column. No
  other saved field changes; `relative` keeps its values (older effects stay Replace).

### 11. Per-tick cost

- **Writes:** one Map set per proposed channel. Map keys are created on the token's first tick
  only.
- **Settle:** one pass over `liveSlots`' coarse channels, with a few arithmetic operations each.
  It touches no more channels than the current settle pass.
- **Events:** start and stop sort a stack of a few tokens and recompute the slots of the fixtures
  involved. That is O(fixtures × families) per event, never per tick.
- **Replace check:** a pending list, usually empty, checked each tick.
- **Chip state:** a set of four booleans per cue, set on events, polled at the live ticker's 25 Hz.
- **Previews:** computed on edits only. **NOW:** one pass over the group's fixtures per ticker
  refresh (25 Hz), reading channel values.
- **Chases:** one pointer write per playing cue per tick (`itemChase`). The timeline's outcome is
  computed on edits, never per tick.

## Risks / Trade-offs

- **[A Replace cue on half the group rests the other half]** That is intended (one cue per family
  in a group).
  - Mitigation: the manual shows it with groups for independent fixture sets, as busking pages
    do.
- **[Cross-group partial play]** Each group's chip stays lit while it shows on some fixtures.
  This is the one partial case left.
  - Mitigation: documented. The family icon dims when the cue shows on none.
- **[Demo scenes are Relative, so they stay Layer]** Older cues keep their saved mode, so demo
  scenes layer over each other instead of replacing.
  - Mitigation: covered chips and NOW show it. Changing the demo is left to a separate decision
    (open question).
- **[Families from attributes misfile an exotic channel]** Its family is wrong.
  - Mitigation: one table in `families.js`. The app check lists every library channel's family,
    to review once.
- **[Effects that don't fade in Replace mode]** A Replace effect over a scene cuts.
  - Mitigation: unchanged from today. Layer is the fading mode, and the hint says so.
- **[Splitting older Looks]** A Look becomes one cue per family with the same name, and its chase
  lanes are copied; two effects from one Look start together only through a chase.
  - Mitigation: done once on load (saved locally at once, the show file when saved), each part
    keeps the Look's settings; the first part keeps the id, so links to it stay.
- **[A kept value can be arbitrary]** An effect's last frame, or a half-faded scene, stays on
  stage until another cue takes the family; there is no reset.
  - Mitigation: the user's choice; NOW says "kept:" and which cue, and its row's fill shows where
    it stopped.
- **[The timeline's outcome is the chase alone]** Cues played outside the chase, other groups and
  partial fixture coverage aren't drawn.
  - Mitigation: documented in the tooltip's wording ("in this chase"); NOW shows the truth while
    it plays.
- **[Columns end free placement]** Cues can't sit anywhere any more (a song layout).
  - Mitigation: order within a column is free; chases carry song structure; the live view will
    have its own layout.
- **[An older show's cues move to columns by content]** A user's grid layout is not kept.
  - Mitigation: their order within each column follows their old slot order.

## Migration Plan

- Branch `feat/add-cue-families` from the current `feat/add-cue-priorities` head (unit 1's
  commits plus this working tree). The uncommitted engine is reworked there.
- `openspec/changes/add-cue-priorities/` is deleted once this change is applied (never
  archived). The epic doc's unit 2 becomes `add-cue-families`.
- The epic doc changes only on the user's go-ahead.
- Rollback: older shows load split per family. A show saved by this change keeps `family`, which
  older builds ignore.

## Open Questions

- Should the demo showfile's scenes move to Replace and get typed families, so the first run
  shows the model? That is a data change only, and can follow.
