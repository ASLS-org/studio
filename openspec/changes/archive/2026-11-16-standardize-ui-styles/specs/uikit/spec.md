## ADDED Requirements

### Requirement: Overflowing text scrolls on hover
Any text in Studio that doesn't fit its box (cut or ellipsised) SHALL, while the pointer rests on
it for about 400 ms, scroll smoothly to show its end, pause about 1 s, and scroll back. Leaving it
SHALL put it back at its start at once. Text that fits SHALL not move. Only text scrolls: panels,
rows, widgets and controls that clip their content SHALL never move. Text fields keep their own
scrolling. With the system's reduced-motion setting on, text SHALL not scroll.

#### Scenario: Long fixture name in the patch bay
- **GIVEN** a fixture row whose name is cut by the patch bay's width
- **WHEN** the operator rests the pointer on the name
- **THEN** the name scrolls until its last letters show, pauses, and scrolls back

#### Scenario: Panels stay put in a small window
- **GIVEN** a window small enough that the patch bay and group pool are cut on the right
- **WHEN** the operator rests the pointer on the patch bay header
- **THEN** nothing slides sideways

#### Scenario: Pointer leaves
- **GIVEN** a name scrolling on hover
- **WHEN** the pointer leaves it
- **THEN** it shows from its first letter again, ellipsised as before

### Requirement: Select inputs show and move the selection
An open select input SHALL mark its current value in the option list and keep it in view. With the
select focused:
- Up and Down SHALL open the list, then move the marked option.
- Enter SHALL choose the marked option and close the list.
- Escape SHALL close the list without changing the value.
- Typing a letter SHALL mark the next option that starts with it.

Choosing with the pointer SHALL work as before.

#### Scenario: Change a chase's quantize with the keyboard
- **GIVEN** a chase's **Quantize** select showing 1/4, focused
- **WHEN** the operator presses Down, Down, then Enter
- **THEN** the list opened with 1/4 marked, the mark moved to 1/1, and the chase's quantize is
  1/1

#### Scenario: Escape keeps the value
- **GIVEN** an open select with another option marked by the arrows
- **WHEN** the operator presses Escape
- **THEN** the list closes and the value is unchanged

### Requirement: Panels resize from their whole border
The border between the top panels and the modifier strip, the patch bay's right border and the right
border of the group pool's groups SHALL resize them when dragged from any point along the border. The border SHALL show a
resize cursor and light up while hovered or dragged. Each area SHALL keep its size limits.

#### Scenario: Make the modifier strip taller
- **WHEN** the operator drags the top border of the modifier strip up by 60 px, from near its right
  end
- **THEN** the strip is 60 px taller and the panels above are 60 px shorter

#### Scenario: Limits hold
- **WHEN** the operator drags the groups' right border far to the left, then far to the right
- **THEN** the groups stop at 240 px wide, then at the window width minus 920 px

#### Scenario: Widen the patch bay
- **WHEN** the operator drags the patch bay's right border far to the right
- **THEN** the patch bay stops at 400 px, twice its starting width, and the group pool's widest
  setting shrinks by the same 200 px so the visualizer keeps its room

#### Scenario: Visualizer hidden
- **GIVEN** the groups resized to 580 px
- **WHEN** the operator hides the visualizer, then shows it again
- **THEN** the groups fill the width while it is hidden, with no resize border, and are 580 px
  wide again once it shows

### Requirement: One design scale
Spacing, control and icon sizes, font sizes, corner radii and border widths across Studio's panels,
widgets, lists and popups SHALL come from one shared scale, so the same kind of gap or control
has the same size everywhere. Sizes that the layout computes with SHALL keep their values:
- cue pool tiles of 100 × 81 px;
- group pool chase rows of 26 px;
- the chase timeline's grid.

#### Scenario: Widgets side by side
- **WHEN** the operator looks at the group view (settings, fixture pool, cue pool, scene widgets)
- **THEN** the widgets' headers, paddings and gaps between controls are the same sizes in each
  widget

#### Scenario: Cue pool layout unchanged
- **WHEN** the operator drags a cue to another slot of the cue pool
- **THEN** it lands on the slot's grid exactly as before
