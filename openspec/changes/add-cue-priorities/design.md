# Design

## Context

- **One write path.** Every playback write ends in `Fixture.setChannel(id, value)`:
  - scenes go through `setQuickAccessor` and `cell.access`;
  - effects go through `FXFixture.writeTarget` / `writeTargetBlend`.
- **Order today.** `Live.update` runs the animations in registration order, then the frame
  callbacks; `UniversePool` packs the frames. The last write in a tick wins.
- **Fades** (from `add-cue-fades`):
  - each cue computes `fadeFactor`;
  - scenes blend from `startValue` (recorded at the start in Relative) or from 0;
  - effects blend from `target.start` (`recordStart`).
  The starting values are frozen when the cue starts.
- **Cue lifecycle:**
  - `cue()`, `stopNow()`, release (`releasing`);
  - `playItem` / `endItem` for chase items;
  - a scene ends once faded in (`endMS`, `fadesOutAtEnd`).
- **Dimmers** are the channels whose `attribute` is `Dimmer`. Profile home values are in
  `profileChannel.defaultValue` (GDTF; OFL has none).

## Goals / Non-Goals

**Goals:**
- A deterministic winner per channel.
- Fades and releases that blend with the live value underneath.
- Defaults.
- Held looks that come back when what covered them stops.
- No allocation per tick in steady playback.

**Non-Goals:** the programmer and Park (`add-programmer`), masters, HTP on colour.

## Decisions

**1. Tokens: one per play.** `claims.js` (models/DMX) exports `Claims`.
- A play (a standalone start, or a chase item entering) gets a token from `Claims.take(cue)`.
- Its fields:
  - `priority` and `htp`, copied from the cue;
  - `stamp`, from a counter that only goes up;
  - `factor`, `relative`, `releasing`, `held` and `released`;
  - `cue`;
  - `channels`, an array of the channels it owns.
- Tokens are made when a cue starts, never per tick. A channel is pushed to `token.channels`
  only when its ownership changes, which is rare. Steady playback allocates nothing.
- **Where tokens live:**
  - `cue.claim` for a standalone play;
  - `cue.itemClaim` for its current chase item.
- **Each tick,** the cue copies its fade state onto its token (`factor`, `releasing`, `relative`)
  before writing. Cues write their plain values: the blending moves out of the cues.
  - `Scene.update` writes `channelValue.value`;
  - `FXChannel.update` calls `writeTarget`.
  - `writeTargetBlend`, `recordStart`, `target.start`, `prepareStartValues` and `startValue` all
    go away.

**2. Writes propose, and the settle pass decides.**
- **The writer.** `Claims.writer` is set around each cue's `update`. With a writer,
  `setChannel` (coarse) proposes the value; without one, it writes directly, as today (loading,
  editing).
- **The frame.** `Claims.beginFrame()` runs at the top of `Live.update`.
- **The first proposal of a frame** on a channel resets its candidates: `top`/`topValue` and
  `under`/`underValue`. It also pushes the channel onto `Claims.dirty`, an array reused every
  frame (its length set back to 0).
- **Every proposal** is ranked against `top`, then `under`; the best two are kept.
  - **Rank:** priority first. Then, when both are HTP tokens on a Dimmer, the value that would be
    output (value × factor). Otherwise the later stamp.
- **The held owner.** `channel.owner` is the token the channel currently belongs to. If it is
  held (an ended scene, an ended item) and outranks the proposal, the proposal becomes `under`.
  The look stays.

**3. Settle pass.** `Claims.settle()` runs after the animations and before the frame callbacks
(`Live.update`). For each dirty channel:
- **The winner** is `top`, unless the held owner outranks it, in which case the channel is
  unchanged.
- **The base underneath** is the first of these that exists:
  1. `underValue`;
  2. `channel.heldValue`, the look of a held token this winner covered, when that token isn't
     released;
  3. for a fade-in only, `channel.restValue`, the channel's value when the winner took it;
  4. the default: `profileChannel.defaultValue`, else 128 for Pan/Tilt, else 0.
- **The value:**
  - fading out (`releasing`): `base + (topValue - base) × factor`;
  - fading in: `from + (topValue - from) × factor`, where `from` is the base in Relative and 0
    for an Absolute scene;
  - otherwise `topValue`.
  It is clamped to 0–255, and the fine channel follows.
- **A change of owner:**
  - when the winner covers a held token, that token's value goes into `heldValue` /
    `heldToken` (one level);
  - `restValue` is set to the current value;
  - `owner` becomes the winner, and the channel is pushed to `winner.channels`.
- Cost: a few operations per channel written this frame.

**4. Releasing.**
- **The fade-out.** A cue releasing with a Fade Out keeps playing (as in `add-cue-fades`). Its
  token says `releasing`, so the settle pass crossfades into what is underneath. When the fade
  ends, the cue stops.
- **`Claims.release(token)`.**
  - It sets `released`.
  - For each channel the token still owns:
    - when `heldToken` is set and not released, the channel goes back to `heldValue` and to that
      owner;
    - otherwise it goes to its default and has no owner.
  - Playing cues take it on the next tick.
- **Which plays release:**
  - `stopNow()` releases `claim`, except at a scene's natural end, where it holds it
    (`Claims.hold`);
  - `endItem()` holds `itemClaim`;
  - `Chase.cue(false)` and `CuePool.delete` release.
- **Release button.** The master column's Isolate becomes **Release**, which calls
  `Claims.releaseHeld()`. That releases every held token; the tokens are kept in a `Set`.

**5. Settings.**
- `Cue.priority`: 0 Low, 1 Normal (the default), 2 High, 3 Top.
- `Cue.intensityMode`: 0 HTP (the default), 1 LTP.
- Both are saved in `showData`; older shows load with the defaults.
- Cue Settings gets two selects, **Priority** and **Intensity**. For scenes, they take the free
  places left by Loop Style and Duration.
- A token copies both when it is taken. A change takes effect on the cue's next start.

## Risks / Trade-offs

- **A held look comes back** from one level only (`heldValue`). With deeper stacks (look A, look B
  over it, an effect over B, the effect stops), B comes back; A doesn't when B is released.
- **HTP ranking uses value × factor,** so an HTP cue fading in over an LTP holder ranks by its
  partial value.
- **Edits made with no writer** (the scene editor while not playing) still bypass claims.
- **Behaviour change:** Relative fades now follow a moving value underneath, where they used to
  start from a frozen one. Existing `fxfades` checks are updated to match.
- **Per tick:** the dirty array grows to the number of channels written in a frame once, then is
  reused.
