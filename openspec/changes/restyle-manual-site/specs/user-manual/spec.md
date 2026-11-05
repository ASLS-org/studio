# Spec Delta

## Purpose

The end-user manual site for ASLS Studio: how it looks, how it presents the product, and how it
leads visitors to the demo, downloads and documentation.

## ADDED Requirements

### Requirement: Manual uses the Studio look
The manual SHALL use Studio's own design tokens for surfaces, text, borders and accents, and
Roboto for text. Its colours SHALL match those of the running app, with no separate brand palette.

#### Scenario: Dark surfaces match the app
- **WHEN** a visitor opens any manual page in dark mode
- **THEN** the page background, sidebar, text and accent colours are the same values Studio uses
  for its panels, text and highlights

#### Scenario: Token change propagates
- **WHEN** a design token value changes in the app's stylesheet and the manual is rebuilt
- **THEN** the manual shows the new value without any edit to the manual's own styles

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
Any `uk-*` control embedded in a manual page SHALL render with the app's colours and fonts in both
modes. The manual's styles SHALL NOT change how those controls look, and the controls SHALL NOT
change the manual's styles.

#### Scenario: Control on a page
- **WHEN** a page embeds a uikit button or fader
- **THEN** it shows the same colours, font and shape as in Studio, and the page's headings and
  body text keep the manual's typography

### Requirement: Home page presents the product
The home page SHALL show the product name, a one-line description of what Studio is, a real
screenshot of the app, and the main features as short cards: patching, groups and cues, effects,
chases, 3D visualizer, hardware output, web and desktop, and open source.

#### Scenario: Visitor lands on the home page
- **WHEN** a visitor opens the manual's root URL
- **THEN** they see the name, the description, an app screenshot and the feature cards without
  scrolling past more than one screen on a 1280×800 display

#### Scenario: Narrow screen
- **WHEN** the home page is viewed 375 px wide
- **THEN** every section stacks in a single column with no horizontal scrolling

### Requirement: Home page leads to the right resources
The hero SHALL offer three actions: try the live demo, download the desktop app, and read the
manual. The page SHALL also link the source repository, discussions and issues, release notes,
the developer documentation and the license.

#### Scenario: Calls to action
- **WHEN** a visitor clicks **Try the live demo**, **Download** or **Read the manual**
- **THEN** they reach the configured demo URL, the GitHub Releases page or the manual's
  introduction page respectively

### Requirement: Resource URLs are defined once
Every external Studio resource URL used by the manual (demo, website, developer docs, repository,
releases, discussions, issues) SHALL come from a single site configuration. A URL that is not yet
known SHALL be marked as a placeholder, and the build SHALL list the placeholders still in use.

#### Scenario: Changing the demo URL
- **WHEN** the demo URL is changed in the site configuration and the manual is rebuilt
- **THEN** every demo link in the hero, navigation and pages points to the new URL

#### Scenario: Placeholder left in place
- **WHEN** the manual is built while a resource URL is still a placeholder
- **THEN** the build output names that resource as unset, and the build still succeeds

### Requirement: Product presentation page
The introduction SHALL explain what Studio is and who it is for: lighting designers, operators,
installations, learners. It SHALL also cover what a typical show workflow looks like, how the
web and desktop versions differ, how hardware is reached through the gateway, the project's
open-source license and its beta status.

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
