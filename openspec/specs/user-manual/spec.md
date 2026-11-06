# user-manual Specification

## Purpose

The end-user manual site for ASLS Studio: how it looks, how it presents the product, and how it
leads visitors to the demo, downloads and documentation.

## Requirements

### Requirement: Manual is presented in Studio's interface
Manual pages SHALL be framed by Studio's own interface elements: a top bar laid out like
Studio's toolbar, a navigation panel in the patch bay's place built from Studio list rows, and
an outline panel titled like the navigation. Icons, fonts and colours SHALL be Studio's; accent
colours SHALL mark meaning (sections, callout types), not decoration.

#### Scenario: Opening a manual page
- **WHEN** a visitor opens any manual page other than the home page
- **THEN** they see Studio's toolbar across the top (search, theme, source code), the manual's
  sections (each with its accent colour) and pages as Studio list rows on the left with the
  current page highlighted in its section's colour, and the page content in the middle

#### Scenario: Following the outline
- **WHEN** the visitor picks an entry in "On this page"
- **THEN** the page scrolls to that section

#### Scenario: Footer
- **WHEN** a visitor reaches the bottom of any manual page other than the home page
- **THEN** a footer shows the product name, the released version, the license and the author

### Requirement: Readable body text inside Studio density
Navigation, menus, headers, labels, tables and embedded controls SHALL use Studio's sizes
(12px uppercase labels and headers). Running prose SHALL be set at a reading size of at least
15px with a line height of at least 1.6.

#### Scenario: Long page
- **WHEN** a visitor reads a page with several paragraphs
- **THEN** paragraphs are at least 15px with comfortable line spacing, while the surrounding
  chrome keeps Studio's compact look

### Requirement: Colours come from Studio's tokens
Every colour in the manual's interface SHALL come from Studio's design tokens. A token change in
the app SHALL reach the manual on its next build without edits to the manual.

#### Scenario: Token change propagates
- **WHEN** a design token value changes in the app's stylesheet and the manual is rebuilt
- **THEN** the manual shows the new value

### Requirement: Dark by default with a light mode
The manual SHALL open in dark mode for visitors with no saved preference. It SHALL offer a light
mode built from Studio's light-theme tokens and SHALL remember the visitor's choice.

#### Scenario: First visit
- **WHEN** a visitor with no saved preference opens the manual
- **THEN** it renders in dark mode

#### Scenario: Switching to light
- **WHEN** the visitor turns on light mode and reloads the page
- **THEN** the manual renders with Studio's light-theme colours

### Requirement: Embedded controls render as in the app
Any `uk-*` control embedded in a manual page SHALL render with the app's colours and fonts in
both modes. The manual's styles SHALL NOT change how those controls look, and the controls SHALL
NOT change the manual's styles.

#### Scenario: Control on a page
- **WHEN** a page embeds a uikit button or fader
- **THEN** it shows the same colours, font and shape as in Studio, and the page's prose keeps the
  manual's typography

### Requirement: Live 3D hero
The home page SHALL be a scroll story. It SHALL open on a 2D hero (logo, name, pitch, an
invitation to scroll) that dissolves into a stage rendered live by Studio's visualizer: four
moving heads drawn as beam guides. Each following chapter SHALL explain one part of Studio next to
the real Studio widget for it, displayed in the 3D scene and fed by the show playing on the stage.
The story SHALL end on a final hero with the calls to action.

#### Scenario: Scroll drives the show
- **WHEN** the visitor scrolls through a chapter
- **THEN** that chapter's show plays forward at a steady pace in step with the scroll, plays
  backwards when scrolling up, and holds still when scrolling stops

#### Scenario: Cues fade like Studio's
- **WHEN** the show moves from one cue to the next
- **THEN** a scene cue fades in from the rig's current values across its whole duration, and an
  effect cue takes over with a short crossfade, so no value jumps

#### Scenario: Autoplay and Next
- **WHEN** the visitor turns on Autoplay under any chapter
- **THEN** the chapters play one after the other at real speed up to the final hero, until the
  visitor scrolls or turns it off; **Next** skips to the following chapter

#### Scenario: Pointer
- **WHEN** a visitor moves the pointer over the stage
- **THEN** the stage camera tilts slightly towards it, and the widgets in the scene don't react
  to the pointer

#### Scenario: Final hero
- **WHEN** the visitor reaches the end of the last chapter
- **THEN** the stage dissolves back while the final hero appears with Download, Try the live
  demo (when configured), Read the manual, and Replay, which returns to the top

### Requirement: Hero stays light on weak devices
The hero SHALL keep the page responsive on modest hardware. It SHALL draw beams as guides only
(no volumetric light, no light on surfaces), stop rendering while off screen or in a hidden tab,
and show a still image of the scene, with no animation, when the visitor prefers reduced motion
or WebGL is unavailable.

#### Scenario: Off screen
- **WHEN** the visitor scrolls past the hero or switches tabs
- **THEN** the hero stops drawing frames until it is visible again

#### Scenario: Reduced motion
- **WHEN** the visitor's system asks for reduced motion
- **THEN** the hero shows a still frame of the rig and the text, with no camera or beam movement

#### Scenario: No WebGL
- **WHEN** the browser cannot create a WebGL context
- **THEN** the hero shows a static backdrop with the text and calls to action, and no error is
  shown

### Requirement: No static screenshots of the app
The manual SHALL NOT use static screenshots of the app as product imagery on the home page or in
the introduction. Product visuals SHALL be live: the 3D hero, or real Studio components.

#### Scenario: Home and introduction
- **WHEN** a visitor views the home page or the introduction pages
- **THEN** no image of the app's interface is shown, and every product visual is rendered live

### Requirement: Home page leads to the right resources
The final hero SHALL offer three actions: try the live demo, download the desktop app, and read
the manual. The toolbar SHALL link the source repository, the live demo and the download on
every page.

#### Scenario: Calls to action
- **WHEN** a visitor clicks **Try the live demo**, **Download** or **Read the manual**
- **THEN** they reach the configured demo URL, the GitHub Releases page or the manual's
  introduction page respectively

### Requirement: Resource URLs are defined once
Every external Studio resource URL used by the manual (demo, website, developer docs, download,
repository, releases, discussions, issues) SHALL come from a single site configuration. A URL
that is not yet known SHALL be hidden wherever it would appear, and the build SHALL list the
unset resources.

#### Scenario: Changing the demo URL
- **WHEN** the demo URL is changed in the site configuration and the manual is rebuilt
- **THEN** every demo link in the hero, navigation and pages points to the new URL

#### Scenario: Unset resource
- **WHEN** the manual is built while a resource URL is unset
- **THEN** the build output names that resource as unset, the build still succeeds, and no
  broken link to it appears

### Requirement: Product presentation page
The introduction SHALL explain what Studio is and who it is for, what a typical show workflow
looks like, how the web and desktop versions differ, how hardware is reached through the
gateway, the project's open-source license and its beta status.

#### Scenario: Reading the introduction
- **WHEN** a visitor opens the introduction from the hero's **Read the manual** action
- **THEN** the page answers what Studio is, who it is for, what it can do, how to try it and how
  to install it, with links to each feature's manual page

### Requirement: Manual builds and publishes
The manual SHALL build from a clean checkout with the project's documented install and build
commands. The deployment pipeline SHALL publish the built manual and nothing else.

#### Scenario: Clean build
- **WHEN** dependencies are installed in a fresh checkout and the manual build command runs
- **THEN** it finishes without errors and produces the static site

#### Scenario: Deployment
- **WHEN** the docs deployment workflow runs
- **THEN** it installs dependencies, builds only the manual and uploads the manual's build output

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
