# Design

## Context

- **Tokens:** `src/assets/styles/tokens.css` holds colours only, plus two unused tokens (`--test`,
  `--some`).
- **Hard-coded values across 63 styled components** (counts from a sweep of `src/views` and
  `global.css`):

  | Property | Occurrences |
  |---|---|
  | padding | 71 |
  | margin | 36 |
  | font-size | 27 (10/12/14/16/24 px) |
  | border-radius | 14 (2/5/8/10 px, 50 %) |
  | `:gap` props | 51 (8 and 16) |
  | borders | ~100 (almost all 1 px) |
  | width/height | ~280 |
  | hex colours (one-offs) | ~40 |

- **Fixed geometry, coupled to JavaScript:**
  - cue pool tiles of 100 × 81 px (`computeCueStyle`);
  - group pool chase rows of 26 px (`chase.id * 26`);
  - `uk-select` options of 25 px (`computeOptionListStyle`);
  - the chase timeline grid.
- **Ellipsis:** `h4` ellipsises globally (`global.css`); other components set `text-overflow`
  themselves.
- **`uk-select`:** clicks only. No marking of the current option, no keys.

## Goals / Non-Goals

**Goals:**
- One scale for spacing, sizes, type and radii.
- Readable cut text.
- A select usable from the keyboard.
- Fixed geometry protected from the scale.

**Non-Goals:**
- Restyling widgets.
- New colours.
- The manual theme's own CSS.
- Canvas and WebGL drawing.

## Decisions

### 1. The scale (tokens.css)

Names are steps, not pixel values, so a value can change without renaming every use.

```
spacing   --space-0 0 | --space-1 2px | --space-2 4px | --space-3 6px | --space-4 8px
          --space-5 10px | --space-6 12px | --space-7 16px | --space-8 20px | --space-9 24px
          --space-10 32px
type      --font-xs 10px | --font-sm 12px | --font-md 14px | --font-lg 16px | --font-xl 24px
icons     --icon-xs 10px | --icon-sm 14px | --icon-md 16px | --icon-lg 24px
controls  --control-height 24px (fields, selects, buttons paired with them) | --button-height 20px
          --row-height 30px (list rows) | --row-height-tall 40px
          --header-height 40px (toolbar, panels) | --widget-header-height 30px (widgets, popups)
radius    --radius-sm 2px | --radius-md 4px | --radius-lg 8px | --radius-round 50% | --radius-pill
border    --border-width 1px
widths    --widget-width-sm 250px | --widget-width-md 300px | --widget-width-lg 350px
```

- **Snapping:** a value takes the nearest step. Ties go down, because Studio is dense: 5 px
  becomes 4 px, 25 px becomes 24 px, 14 px of spacing becomes 12 px, 18 px becomes 16 px, 30 px
  becomes 32 px.
- **10 px stays a step:** it is common (69 uses) and snapping it would move most paddings.
- **Font sizes are already on the type scale.**
- **Alternative rejected:** pixel-exact variables, which would make an irregular scale and wasn't
  chosen.

### 2. Fixed geometry keeps its own variables

A value the layout computes with, or that must keep its size for another reason, is never mapped
to a scale step:

```
--cue-tile-width 100px | --cue-tile-height 81px      (cue pool grid; computeCueStyle)
--chase-row-height 26px                              (group pool; chase.id * 26)
--select-option-height 25px                          (uk-select; computeOptionListStyle)
```

- Each is defined once in `tokens.css`, next to a comment naming the code that reads the same
  number.
- That code reads the same value from one exported JS constant (`views/utils/geometry.js`), so
  the CSS and the JS can't drift apart.
- A border or offset that is part of a pitch or an alignment stays raw, with a comment:
  - the 1 px borders of chase rows and of the chase timeline's grid;
  - the crosshair lines of the colour picker and pan/tilt pad;
  - the 22 px offset that lines a button up with a labelled field.
- A one-off fixed size used in a single place (a fader track, a knob diameter, the colour
  picker's wheel) stays a raw value in that component. It is never pulled into a shared variable
  just because another component happens to use the same number.
- Widths and heights in general are only mapped when they are one of the shared roles above
  (rows, headers, controls, widget widths, icons).

### 3. Colours

- Each hard-coded hex maps to the existing palette token with the same role when its value is
  equal or visibly the same:
  - near-palette shades (`#161913`, `#22251f`, `#232620`, `#1f221a`) → `--primary-light` or
    `--primary-lighter-alt`;
  - error and stop reds (`#ce3d3db3`, `#ce2d5e`) → `--accent-red`.
- Colours with a real role and no token get a named token (found in the code):
  - `--on-color-text` and `--on-color-surface`: content on cue tiles and chase cells, the same in
    both themes;
  - `--curve-handle`: the curve editors' control points.
- Drawing colours stay raw: the fader gradient, the colour picker's hue wheel, the effect wave,
  the splash gradient.
- Data colours stay where they are: group and cue colours, the uikit palette.
- `--test` and `--some` are removed.

### 4. Hover scroll (views/utils/overflow.scroll.js)

- One delegated `pointerover` / `pointerout` listener on the document, installed by `main.js` and
  by the manual's preview host.
- **When it scrolls:** on hover, it walks up from the target (at most 3 levels) to the first
  element whose text overflows (`scrollWidth > clientWidth + 1`, with `overflow-x` hidden or clip).
  It skips inputs, textareas and contenteditable elements.
- **Only text:** the element must hold text only, possibly inside inline text tags (`span`,
  `b`, `em`…). An element holding any other element (a panel, a row, a widget, a control) never
  scrolls, whatever it clips. Without that rule, a smaller window made the container of the patch
  bay and group pool slide sideways when its header was hovered.
- **The motion:** after 400 ms it sets `text-overflow: clip` and animates `scrollLeft` with
  `requestAnimationFrame` at 40 px/s, pauses 1 s at the end, comes back, and repeats while
  hovered.
- **On leave:** it resets `scrollLeft` and the inline style.
- **Cost:** no DOM wrapping, and no work unless something is hovered. With
  `prefers-reduced-motion`, it does nothing.
- **Alternative rejected:** a marquee component around every label, which would touch every
  template and miss text in third-party markup (`v-html` options).

### 5. Select keyboard (uikit.input.select.vue)

- **State:** `marked` (index), set to `selected` when the list opens.
- **Keys, on the focused select box:**
  - ↑/↓ open the list or move `marked`, wrapping at the ends;
  - Enter chooses `marked`;
  - Escape closes (and stops propagation);
  - a printable letter marks the next option whose text (HTML stripped) starts with it.
- **In the list:** the current value has the selected style, and the marked one the hover style.
  The marked option scrolls into view.
- **Keyboard path:** keys are handled on the select's own element, which the app's keyboard path
  already lets through. The select isn't a popup layer: Escape on an open select reaches it
  first, because no popup is open behind it.

## Risks / Trade-offs

- **Snapping moves things by 1 to 2 px,** and a list row or header could reflow.
  → Before/after screenshots of the main screens (patch bay, universe, group, chase, a popup)
  are compared.
  → `npm run app:check` and `npm run docs:manual:check` run after each batch of files.
- **A fixed value mistaken for spacing would move a layout.**
  → Only paddings, margins, gaps, font sizes, radii, borders and the listed roles are mapped.
  Other sizes are left raw unless they're one of the named fixed variables.
- **Hover scroll on elements that change while hovered** (live values).
  → It re-measures each frame and stops when nothing overflows.
- **The light theme only overrides colours.** The scale is shared by both themes, so nothing
  changes there.

## Migration Plan

Pure styling: no data and no showfile change. Batches by folder (uikit first, then fragments).
Each batch is verified before the next, so any visual regression can be pinned to one batch.
