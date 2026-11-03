---
name: user-manual
description: Keep the end-user manual (docs/manual, VitePress) in sync with the app. Use after any change that alters what users see or how they use Studio (new feature, changed interaction, renamed control, new setting, removed behaviour), when writing or reviewing manual pages, or when archiving an OpenSpec change with user-facing impact.
---

# User manual (docs/manual)

The manual explains **how to use the app**: what each screen and control does, and how to get a
lighting job done. It is not developer documentation.

| Belongs in the manual | Does not belong |
|---|---|
| What a widget, setting or button does | Class names, files, APIs, code |
| Step-by-step workflows (patch → group → scene → chase → output) | Architecture, data flow, protocols on the wire |
| Units, ranges, defaults as the user sees them | Implementation limits users can't act on |
| Keyboard shortcuts, mouse gestures | Build, contribution, or AI notes |
| Known limitations that affect use ("only moving heads are visualized") | Internal TODOs |

Developer docs live elsewhere (JSDoc/docma, `CLAUDE.md`, OpenSpec specs).

## When to update

Update it in the **same PR** as the code whenever a change:
- adds, removes, or renames a visible control, setting, popup, or screen region,
- changes a workflow, gesture, shortcut, default, or unit,
- adds a capability users must learn (new output protocol, new effect type, file import…).

Pure refactors, perf work and invisible fixes need no manual update. Say so in the PR
("Manual: n/a").

## Structure

```
docs/manual/
  index.md                       landing (hero)
  introduction/                  about, installation, license
  interface/<area>/index.md      one page per screen region: toolbar, patchbay, grouppool, visualizer, modifier
  modifiers/<area>/index.md      one page per modifier: universe, group, chase
  workflow/<task>/index.md       task guides: environment, patching, grouping, scenes, effects, triggering
  public/interface/*.png|webm    screenshots and screen recordings
  .vitepress/config.js           nav + sidebar (add every new page here)
```

Gaps known on 2026-11-03: all `workflow/*` pages are "Documentation in progress", there is no
page for **outputs/connections (WSC)** or the **desktop app**, and `introduction/overview.md` is
empty. Fill these when touching the related feature.

Theme notes: `.vitepress/theme/index.js` registers the app's `uk-*` uikit globally, so pages can
embed real controls. `theme/components/video.vue` is **not** registered there, so check that
`<Video>` actually renders before adding more of them (registering it is a one-line fix).

## Page style (match `modifiers/universe/index.md`, `modifiers/chase/index.md`)

- `#` page title = the UI name. `##` per widget or feature, `###` per action ("Adding Fixtures",
  "Deleting Cue").
- Open with 1–2 sentences on what it is and why you'd use it, then show it:
  `<Video src="/interface/<name>.webm"/>` (global component) or
  `<img style="border-radius:5px" src="/interface/<name>.png" alt="..." width="300"/>`.
- Settings go in a `| Setting | Description |` table. Shortcuts use `<kbd>`, e.g. <kbd>`Ctrl`</kbd>.
- Use `> **Note:**` for behaviour that surprises users (BPM sync, quantization).
- Link related pages with absolute paths: `[cues](/modifiers/group/)`.
- Second person, present tense, short sentences, the UI's exact labels in **bold**.
- Media: name files `<area>_<widget>_<action>.<ext>` in `public/interface/`. If you can't capture
  media, put `<!-- TODO media: <what to record> -->` in its place and list it in the PR.

## Steps

1. Find the affected pages: `grep -rln "<feature words>" docs/manual --include=*.md`.
2. Edit them, or create a page and register it in `.vitepress/config.js` `sidebar`.
3. `npm run docs:manual:serve` and check rendering, links, and the sidebar entry.
4. Mention it in the PR's "Manual" section.
