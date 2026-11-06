# Spec Delta

## ADDED Requirements

### Requirement: Live previews of Studio components
A manual page SHALL be able to show any Studio widget or panel from the preset list as a live
preview: the real component, working against a small demo show. Readers SHALL be able to use it
as in Studio: move faders, pick colours, aim pan/tilt, trigger cues, and watch effects and
chases run in time with the show's BPM.

#### Scenario: Trying a widget
- **WHEN** a reader drags a channel fader in a fixture channels preview
- **THEN** the value changes as it would in Studio, and any other preview on the page that shows
  the same fixture follows

#### Scenario: Triggering a cue
- **WHEN** a reader clicks a cue in a cue pool preview
- **THEN** the cue plays, its play indicator shows, and the page's other previews of that group
  reflect it

#### Scenario: Visualizer
- **WHEN** a reader drags inside the visualizer preview
- **THEN** the 3D view orbits around the demo rig, as in Studio

### Requirement: Previews keep Studio's proportions
A preview SHALL show its widget or panel at the size it has in Studio (the modifier strip's
height and the widget's own width; the patch bay's and group pool's height), on Studio's idle
striped surface. A preview wider than the page SHALL be scaled down whole, keeping its aspect
ratio; a full modifier panel SHALL scroll sideways as Studio's strip does. Popups a preview
opens SHALL stay within the preview, scaled to fit, and SHALL NOT dim or blur the page.

#### Scenario: Narrow widget
- **WHEN** a page shows the Group Settings widget
- **THEN** it is 150 by 239 px as in Studio, centred on the idle surface, not stretched to the
  page width

#### Scenario: Popup in a preview
- **WHEN** a reader opens a popup from a preview (e.g. **Add** in a fixture pool)
- **THEN** the popup appears over that preview only, whole, and the rest of the page stays as it was

### Requirement: Demonstrated flows
Flows a reader should watch rather than try (selecting with modifier keys, filtering, opening a
popup, starting a chase, browsing the toolbar's menus) SHALL be shown as demos: a cursor plays
the flow on the real component, in a loop, while the reader's own input on it is blocked. A
demo SHALL close what it opens, SHALL leave the demo show as it found it, SHALL NOT take the
page's keyboard focus from the reader, and SHALL pause while off screen.

#### Scenario: Patch bay selection
- **WHEN** the patch bay selection demo is on screen
- **THEN** a cursor clicks a fixture, then Ctrl+clicks two more, with a hint naming the keys,
  and the rows highlight as in Studio

#### Scenario: Demo leaves things as they were
- **WHEN** a delete demo opens Studio's deletion popup
- **THEN** it closes the popup without deleting, and no other preview on the page changes

### Requirement: Previews reset to their preset
Each interactive preview SHALL offer a **Reset** action, available once the reader has changed
something in a preview of the page, that restores the demo show to its initial state for every
preview on the page. Leaving a page and coming back SHALL also start from the initial state.

#### Scenario: Nothing to reset
- **WHEN** a reader opens a page and hasn't used any preview yet
- **THEN** **Reset** is shown unavailable

#### Scenario: Reset after edits
- **WHEN** a reader changes values in a preview and clicks **Reset**
- **THEN** every preview on the page shows the demo show's initial values, no cue is playing, and
  **Reset** is unavailable again

### Requirement: Previews are isolated from the reader's Studio and hardware
A preview SHALL NOT save anything, SHALL NOT read or change the reader's Studio show, and SHALL
NOT connect to a gateway or send DMX to hardware.

#### Scenario: Reader with a show in Studio
- **WHEN** a reader who has a show saved in Studio uses previews in the manual
- **THEN** their Studio show is unchanged the next time they open Studio

#### Scenario: No connections
- **WHEN** a reader uses any preview
- **THEN** no network connection to a WSC gateway is opened

### Requirement: Previews load on demand and pause off screen
A page's text SHALL render without waiting for its previews. A preview SHALL load only when it
comes near the screen. Animations, the show clock and 3D rendering SHALL stop while no preview
needing them is visible, and while the tab is hidden. Pages without previews SHALL NOT load the
show engine.

#### Scenario: Long page
- **WHEN** a reader opens a page with several previews and reads its first section
- **THEN** the text is readable immediately, and only the previews near the screen have loaded

#### Scenario: Scrolled away
- **WHEN** every preview with a running show or 3D view has scrolled off screen
- **THEN** the show clock and rendering stop until one is visible again

### Requirement: Previews fall back without screenshots
When a preview cannot run (an error, or the browser lacks WebGL or Web Workers), it SHALL play
the video recorded for it if one exists, or else show a short message saying why. A preview
SHALL NOT show a static image of the app at any time, including while loading. A failing
preview SHALL NOT affect the rest of the page.

#### Scenario: No WebGL
- **WHEN** a reader without WebGL opens the visualizer page
- **THEN** the visualizer preview plays its video, and the page's other content works

#### Scenario: Loading
- **WHEN** a preview is still loading
- **THEN** its frame shows the component's title and an empty body, with no picture of the app

### Requirement: Unknown presets are reported
A page that names a preset that doesn't exist SHALL show a visible error in place of the
preview while the manual is developed, and the manual build SHALL report that page and preset
name.

#### Scenario: Typo in a preset name
- **WHEN** an author writes a preset name that isn't in the preset list and builds the manual
- **THEN** the build output names the page and the unknown preset
