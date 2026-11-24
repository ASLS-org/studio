# Design

## Context

See proposal.md (Why). What the code does today:

- `universe.modifier.widget.settings.vue` binds the ID field to `setUniverseId`, which calls
  `UniversePool.changeId()` then `$view.moveUniverse()`. `Universe.setupConnection()` passes
  `this.id` to `setupStream()` once, so a running stream keeps the old number. Nothing else calls
  `changeId` or `moveUniverse`.
- `modifier.widget.fixture.pool.vue` has `min-width: var(--widget-width-sm)` (250 px) and no
  width of its own, so its strip column sizes it.
- In `group.effect.modifier.widget.wave.vue`, the two field columns are a fixed 120 px. The
  right column's *Phase start* / *Phase stop* need 65 + 63 px plus an 8 px gap, so they end 2 px
  from the canvas (measured at 1600×1000). The PWM *Width* field (44 px) squeezes *Waveform*.
- `modifier.widget.curve.vue` `cp3Style` places the dot with
  `bottom: (min(value, 1) % 1) * 100%` and `left: (min(x, 1) % 1) * (width / height) * 100%`.
  `% 1` turns 1 into 0 (the dot jumps back at the end), and the aspect factor shifts it sideways.
  The curve is drawn in canvas pixels from the same control points (`fade.getValue` computes `x`
  and `value` from them).
- `group.scene.modifier.widget.curve.vue` is used only by the manual's `scene-curve` preset.

## Goals / Non-Goals

**Goals:** the four fixes and the dead-code removal named in the proposal.

**Non-Goals:** a separate output universe number; any change to how universes get their ID at
creation (`UniversePool` next id) or load.

## Decisions

- **ID field:** `uk-num-input` with `disabled`, bound one way to `universe.id`. Remove
  `setUniverseId`, `idFieldKey`, `UniversePool.changeId()` and `ViewState.moveUniverse()`, and
  the line in `models/DMX/CLAUDE.md` about `changeId`. Alternative considered: keep `changeId`
  for a future renumber tool; rejected, since dead code goes, and it can return with its use.
- **Fixture pool width:** `width: fit-content` with `min-width: var(--widget-width-sm)` and
  `max-width: var(--widget-width-xl)`, a new role size of 400 px in `tokens.css` next to the
  other widget widths. A list row's max-content width is its full text plus tools, so
  `fit-content` follows the widest row. It gets `flex-shrink: 0`: the strip is a flex row that
  otherwise shrinks it back to its minimum (the strip scrolls instead). A row's detail (address)
  doesn't shrink, so the name is cut first.
- **Effect columns:** drop the fixed 120 px. Each column is `width: min-content` with a 120 px
  minimum, so its fields' labels decide (`max-content` would follow the selects' long option
  text). The canvas stays 380 px; the widget grows by the difference.
- **Fade dot:** placed from the fade's progress `t` on the current control points
  (`Fade.pointAt(t)`, clamped, display only), not from the last played `x` and `value`: after a
  curve edit, the old point was on the old curve, which is the misalignment users see. No `% 1`,
  no aspect factor. The canvas fills `.widget_curve_modifier`, so percentages of that box match
  canvas coordinates (checked at 900 to 1600 px wide). The prop's default becomes an idle
  `Fade`, so the widget always has `pointAt`.
- **Dead copy:** delete `group.scene.modifier.widget.curve.vue`; the `scene-curve` preset imports
  `modifier.widget.curve.vue` with the same `fade` prop.

## Risks / Trade-offs

- [The fixture pool takes up to 150 px more of the modifier strip] → The strip scrolls
  sideways already; the cap keeps it bounded.
- [Locking the ID removes the only way to choose the output universe number] → Accepted by the
  user; a separate output number is listed as an epic candidate.

## Migration Plan

None: showfiles keep their IDs.

## Open Questions

None.
