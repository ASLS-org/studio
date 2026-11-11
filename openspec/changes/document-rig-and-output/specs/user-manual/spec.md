# Spec Delta

## MODIFIED Requirements

### Requirement: Manual follows the reader's path
The manual's navigation SHALL be organised as **Getting started**, **Concepts**, **Programming a
show**, **Rig & output** and **Reference**. Programming pages SHALL each cover one task (patching,
groups, scenes, effects, chases, playing a show), in the order a show is built. Rig & output
pages SHALL each cover one part of getting a show to real lights and keeping it (fixtures,
outputs, the visualizer, showfiles, the desktop app). Reference pages SHALL be for looking things
up (shortcuts, glossary, troubleshooting, known limitations).

#### Scenario: New reader
- **WHEN** a reader opens the manual's navigation
- **THEN** they see Getting started first, then Concepts, then Programming a show with its pages
  in the order a show is built, then Rig & output, then Reference

#### Scenario: Looking something up
- **WHEN** a reader wants a shortcut, a term or a fix for a problem
- **THEN** the Reference section has a page for it, reachable from the navigation and the search

## ADDED Requirements

### Requirement: Fixtures and fixture files are documented
The manual SHALL explain where fixtures come from and how to bring in new ones: the built-in
Open Fixture Library (finding a fixture, its modes), importing GDTF files and the local GDTF
library (where it is kept, what removes it), the generic GDTF fixtures bundled with Studio, what
happens when a show uses fixtures a device doesn't have, and how fixtures, their 3D models and
their cells appear in the visualizer. It SHALL state which channel types the visualizer draws and
which it only sends.

#### Scenario: A fixture that isn't in the library
- **WHEN** a reader's light is missing from the fixture list
- **THEN** the manual tells them how to get its GDTF file, import it, and where it then appears

#### Scenario: Opening a show on another computer
- **WHEN** a reader opens a show that uses GDTF fixtures this device hasn't imported
- **THEN** the manual explains the missing-fixtures prompt, both of its choices, and what the
  fixtures do until the files are imported

### Requirement: Getting output to real lights is documented
The manual SHALL explain, in user terms, how Studio's output reaches lights: what the gateway is,
that the desktop app starts it and that the browser version needs it running, how to add and
connect an output, and how to send a universe through it (protocol, interface, address), with
every option under its exact label. It SHALL say which setups have been verified and which
haven't, and SHALL NOT present known output problems as working.

#### Scenario: First connection
- **WHEN** a reader with a USB interface or an Art-Net or sACN node follows the outputs page
- **THEN** they can add the connection, assign a universe to it, and check that their lights
  answer, step by step

#### Scenario: Something doesn't work
- **WHEN** the lights don't respond
- **THEN** the troubleshooting page lists what the reader sees, the likely cause and the fix, and
  points to known limitations where the problem is Studio's

### Requirement: Showfiles and the desktop app are documented
The manual SHALL explain how a show is created, opened, saved in Studio, exported to a file and
opened again, what the unsaved marker means, what loads on first run, and whether older
showfiles open. It SHALL explain how to get the desktop app for each operating system from the
releases page, what to expect on first launch, and how it differs from the browser version.

#### Scenario: Not losing work
- **WHEN** a reader wants to keep a show
- **THEN** the manual says Studio doesn't save on its own, what **Save Showfile Locally** keeps
  and where, and that **Export Showfile** gives a file to keep or move to another computer

#### Scenario: Choosing a version
- **WHEN** a reader wonders whether to use the browser or the desktop app
- **THEN** the manual lists what each needs and what only the desktop app does

### Requirement: Reference pages
The Reference section SHALL hold: every keyboard and mouse shortcut Studio responds to, checked
in the app, with where it applies; a glossary of the terms the manual uses (DMX, universe,
address, mode, cell, group, cue, scene, effect, chase, bar, BPM, quantize, GDTF, OFL, gateway,
Art-Net, sACN…); troubleshooting as symptom → cause → fix; and known limitations, listing the
Studio behaviour the manual doesn't present as working.

#### Scenario: A shortcut
- **WHEN** a reader looks up how to save, delete a selection, or switch the visualizer's
  transform controls
- **THEN** the shortcuts page gives the keys and where they work, and only lists keys Studio
  actually responds to

#### Scenario: A term
- **WHEN** a reader meets a term they don't know on any page
- **THEN** the glossary defines it in one or two sentences and links the page that explains it
