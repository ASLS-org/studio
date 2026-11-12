# Proposal: add-manual-live-previews

Unit 2 of epic `manual-overhaul`. Depends on unit 1 (`restyle-manual-site`, archived: Studio
shell, tokens, `<StudioFrame>`, and the home page, which already mounts real widgets display-only).

## Why

The manual relies on 40+ screen recordings that are slow to capture, go stale with every UI
change and can't be interacted with. A preview built from the real component lets readers try
the control and can't drift from the app.

## What Changes

- A `<LivePreview preset="…">` component for manual pages. It mounts the **real** Studio widget
  or fragment named by a preset, fed by a small manual-only dummy show. Readers can click,
  drag, trigger cues and watch effects run. Nothing is saved, and a **Reset** button restores the
  preset.
- A manual showfile (one universe, a handful of fixtures including a moving head and an RGB bar
  with cells, two or three groups, scenes, effects and a chase) used by every preset.
- A preset registry: id → component, how its props come from the dummy show, optional route,
  height, caption, whether the Live clock runs.
- Previews load only in the browser and only when scrolled into view. They pause off-screen and
  never open a hardware connection.
- A fallback: when a preset can't run (no WebGL for the visualizer, an error), the preview plays
  the page's existing video for it, or shows a short message. Never a screenshot of the app.
  `<Video>` stays for multi-region flows that a single component can't show.
- First presets: the app's widgets and main panels that the current pages show on video (about
  25, including one orbitable visualizer). The existing pages swap those videos for previews,
  and media no page uses any more is deleted. Units 3–4 use the presets and add more.

## Capabilities

### New Capabilities
None (adds to `user-manual`, introduced by unit 1).

### Modified Capabilities
- `user-manual`: add the live preview, reset, isolation, performance and fallback requirements.

## Impact

- Code: `docs/manual/.vitepress/theme/` (LivePreview, preview host, preset registry),
  `docs/manual/public/presets/manual.showfile.json`, and the fixture profiles it uses served
  through the manual's static-file list. App code is read only. If a widget can't
  be mounted outside the app shell, the fix happens in that widget and stays minimal.
- Showfile format: none (the manual showfile is an ordinary showfile that must keep loading).
  Unsaved marker: none. Live playback/timing: none in the app. WSC output: none (previews never
  connect). Visualizer: one orbitable preset at Guides quality, on the visualizer page only. Web vs Electron: none.
- Manual: existing pages swap videos for previews where one exists. The full rewrite is
  units 3–4.

## Out of scope

- Writing the feature pages (units 3–4).
- Previews of the whole app shell or multi-panel drag flows.
- Saving reader edits, or sharing a preview state by URL.
- Automated checks that presets still mount (unit 5 decides whether a local check script is worth
  it).
