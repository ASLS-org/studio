<div align="center">

<img src="https://raw.githubusercontent.com/ASLS-org/studio/develop/src/assets/images/studio_logo_textual.svg" alt="ASLS Studio" width="320"/>

**Open-source, web-based DMX lighting control software and visualizer**

[![License: GPL v3](https://img.shields.io/github/license/asls-org/studio)](https://github.com/ASLS-org/studio/?tab=GPL-3.0-1-ov-file)
[![Version](https://img.shields.io/github/v/tag/asls-org/studio?include_prereleases&sort=semver&style=flat&label=version)](https://github.com/ASLS-org/studio/releases)
[![Made with Vue.js](https://madewithvuejs.com/storage/repo-shields/4381-shield.svg)](https://madewithvuejs.com/p/asls-studio/shield-link)

[Live Demo](https://demo.studio.asls.timekadel.com) · [Issues](https://github.com/ASLS-org/studio/issues) · [Discussions](https://github.com/ASLS-org/studio/discussions)

</div>

---

> **Beta Notice:** ASLS Studio is in active beta development. All features are provided as-is. Please report any bugs or unexpected behaviour on the [issue tracker](https://github.com/ASLS-org/studio/issues).

---
- [What is ASLS Studio?](#what-is-asls-studio)
- [Features](#features)
  - [Lighting](#lighting)
    - [Universe \& Fixture Patching](#universe--fixture-patching)
    - [Fixture Grouping](#fixture-grouping)
    - [Scene Composition](#scene-composition)
    - [Parametric Effect Engine](#parametric-effect-engine)
    - [Chase Sequencer](#chase-sequencer)
  - [Common](#common)
    - [Real-Time 3D Visualizer](#real-time-3d-visualizer)
    - [Desktop App](#desktop-app)
- [Requirements](#requirements)
- [Getting Started](#getting-started)
  - [1. Clone the repository](#1-clone-the-repository)
  - [2. Install dependencies](#2-install-dependencies)
  - [3. Start the development server](#3-start-the-development-server)
  - [Production build (web)](#production-build-web)
  - [Desktop distribution](#desktop-distribution)
- [Streaming to Hardware](#streaming-to-hardware)
- [Tech Stack](#tech-stack)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)

___

## What is ASLS Studio?

ASLS Studio is a self-contained show control environment and DMX lighting control platform that covers the full workflow: patching fixtures into universes, grouping them, composing scenes and effects, sequencing cues into chases, and visualising everything in real time inside a 3D WebGL viewport. Studio can run entirely in the browser as a static web app, or be packaged as a native desktop application for Linux, macOS, and Windows via Electron.

Live show data can be streamed out to physical hardware via the **WSC (Web Show Control)** protocol — a compact binary protocol with a gateway that translates to industry-standard downstream protocols.

---

## Features

### Lighting

#### Universe & Fixture Patching
Create and manage DMX universes, patch fixtures from a built-in library (XML fixture definitions parsed via `xml2js`), assign DMX addresses and operating modes, and adjust per-fixture settings at any time through the Universe Modifier. Channel faders allow live manipulation of any patched fixture's output including color, pan/tilt, zoom, intensity, strobe, and more.

#### Fixture Grouping
Fixtures from different universes can be combined into logical groups. Groups are the unit of cue programming: scenes and effects are defined at the group level and can span the show's entire rig.

#### Scene Composition
Scenes are snapshot-style cues that drive a set of fixtures to predefined channel values. Each scene supports configurable fade in/out curves based on Bézier easing (linear, ease, ease-in, ease-in-out, or fully custom), relative or absolute start points, loop and trigger modes, and precise multi-fixture editing — including a unified channel view when multiple fixtures are selected simultaneously.

#### Parametric Effect Engine
Effects modulate fixture channels over time using waveforms (sine, triangle, square). Per-channel and per-fixture parameters include frequency, min/max boundaries, phase shift, and directional spread across the fixture group — enabling smooth fan-like animations with minimal setup.

#### Chase Sequencer
Chases are timeline-based compositions of group cues (scenes and effects) arranged across a bar grid. They support independent quantization, BPM-synced durations, loop and single-shot modes, and parallel cue lanes per group. The timeline editor supports drag-to-resize cue blocks, vertical zoom, and fold-to-hide empty lanes.

### Common

#### Real-Time 3D Visualizer
A WebGL 2.0 viewport powered by [Three.js](https://threejs.org/) r170 and the `postprocessing` library renders the full rig in three dimensions. Fixtures respond to live channel data — position, color, beam angle, zoom, strobe, and color wheel slots are all emulated in real time. The visualizer includes volumetric beam rendering, simulated atmospheric fog with turbulence, physically-accurate or simplified light attenuation, in-viewport fixture transform controls (translate, rotate, discrete), and adjustable global scene illumination.

#### Desktop App
In addition to running as a static web app, Studio can be packaged as a native desktop application via Electron. Distribution targets are configured for Linux (arm64), macOS (arm64), and Windows (x64).

---

## Requirements

| | Minimum | Recommended |
|---|---|---|
| **RAM** | 4 GB | 8 GB or more |
| **GPU** | WebGL 1.0 support | Dedicated GPU with WebGL 2.0 |
| **Node.js** | v16.15.1 | Latest LTS |
| **Browser** | Chrome, Firefox, Opera (latest) | Chrome |
| **OS** | Any OS with Node.js support | — |

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/ASLS-org/studio
cd studio
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm start
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

### Production build (web)

```bash
npm run build
```

Built files are placed in `./dist` and can be served by any static file host.

### Desktop distribution

```bash
# Linux (arm64)
npm run dist:linux

# macOS (arm64)
npm run dist:mac

# Windows (x64)
npm run dist:win
```

---

## Streaming to Hardware

Studio sends live show data using the **[WSC (Web Show Control)](https://github.com/ASLS-org/WSC)** protocol — a compact, binary, transport-agnostic protocol designed for real-time control of performance and show systems.

WSC carries multiple message types over a single connection: bulk channel data (DMX universes), linear timecode (SMPTE/MTC), cue lifecycle commands (GO, STOP, PAUSE…), typed parameter writes, and opaque binary tunnels to downstream systems. Every packet includes a Transport Descriptor that tells the gateway which downstream protocol to use — so the browser never needs to know about the physical layer.

The reference gateway (`@asls/wsc-server`) runs as a Node.js process alongside Studio and translates incoming WSC packets to the appropriate downstream protocol. Forwarding targets include Art-Net, sACN, DMX512, MIDI, MIDI Show Control, MIDI Timecode, OSC, and others.

Refer to the [WSC repository](https://github.com/ASLS-org/WSC) and its JavaScript implementation guide for gateway setup instructions.

---


## Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | [Vue 3](https://vuejs.org/) |
| 3D Visualizer | [Three.js](https://threejs.org/) r170 + WebGL 2.0 + GLSL + [postprocessing](https://github.com/pmndrs/postprocessing) |
| Build Tool | [Vite](https://vitejs.dev/) |
| Desktop Shell | [Electron](https://www.electronjs.org/) v41 via `electron-vite` + `electron-builder` |
| Show Output | [WSC](https://github.com/ASLS-org/WSC) via `@asls/wsc-client` / `@asls/wsc-sdk` |
| Fixture Definitions | XML parsing via `xml2js` |
| Event Bus | `mitt` |

---

## Contributing

Contributions of all kinds are welcome — bug reports, feature requests, fixture library additions, documentation improvements, and code.

1. **Fork** the repository and create a branch off `develop`.
2. Make your changes and test them locally (`npm start`).
3. Open a **Pull Request** against `develop` with a clear description of the change and why.

For larger changes or new features, opening a [Discussion](https://github.com/ASLS-org/studio/discussions) first is encouraged to align on direction before writing code.

---

## License

ASLS Studio is released under the **GNU General Public License v3.0**. See the [`COPYING`](./COPYING) file for full terms.

---

## Acknowledgements

ASLS Studio grew out of the ASLS research project and was made freely available to the lighting and open-source communities. Third-party library credits are listed in [`CREDITS.html`](./CREDITS.html).
