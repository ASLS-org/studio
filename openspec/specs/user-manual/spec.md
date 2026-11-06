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
