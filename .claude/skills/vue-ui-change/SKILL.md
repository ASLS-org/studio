---
name: vue-ui-change
description: How to build or change UI in ASLS Studio. Covers uk-* uikit components, activity fragments, modifier widgets, and popups under src/views, plus Options API with @vue/compat, global registration, styling variables, naming, and JSDoc/story tags. Use for any .vue file work.
---

# UI changes (src/views)

Read `src/views/CLAUDE.md` for the folder map.

## Pick the right place

| You need | Put it in | Name |
|---|---|---|
| Reusable control used in 2+ places | `components/uikit/<family>/` | `uikit.<family>.<variant>.vue`, `name: 'Uk<Family><Variant>'` |
| Panel inside a modifier | `activities/app/fragments/modifiers/<area>/_widgets/` | `<area>.modifier.widget.<thing>.vue` |
| Widget shared by several modifiers | `fragments/modifiers/_widgets/` | `modifier.widget.<thing>.vue` |
| Modal | the owning fragment's `_popups/` | `popup.<thing>.vue` or `<area>.modifier.popup.<thing>.vue` |
| New screen region | `activities/app/fragments/<area>/` | `<area>.fragment.vue` |

Reuse before creating. List the existing kit with
`ls -R src/views/components/uikit | grep .vue`: buttons, inputs (checkbox, select, textbox
num/str, range fader/knob/gauge/vumeter), lists, menus, popups, widgets, cues, containers
(`uk-flex`, `uk-spacer`), icons, loaders.

## Component skeleton (match existing files)

```vue
<template>
  <uk-widget :header="{ title: 'Cue Settings', icon: 'settings' }" dockable>
    ...
  </uk-widget>
</template>

<script>
/**
 * @component Short description of what the component does.
 * @namespace uikit/inputs/<family>        (uikit only)
 * @story Default {"label":"default"}      (uikit only: one per notable prop combo)
 */
export default {
  name: 'GroupModifierWidgetCueSettings',
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  props: {
    /**
     * Handle to the edited cue instance
     */
    cue: { type: Object, default: null },
  },
  emits: ['update:modelValue', 'select'],
  data() {
    return {
      /**
       * Currently selected tab index
       */
      tab: 0,
    };
  },
  methods: {
    /**
     * Selects ...
     *
     * @public
     */
    select() {},
  },
};
</script>

<style scoped>
.cue_settings { background: var(--primary-light); }
</style>
```

## Rules

- **Registration.** A new uikit component must be exported from its family `index.js`, and a new
  family added to `components/uikit/index.js`. `main.js` registers recursively by `name`, so a
  missing `name` means it isn't registered. Fragment-local widgets are imported and listed in
  `components` instead.
- **State.** Read and mutate show state through `this.$show` and the model instances passed as
  props. Call model methods; don't reimplement engine logic in components. Mutating a model
  instance passed as a prop is allowed (`vue/no-mutating-props` is shallow-only). Reassigning the
  prop is not.
- **v-model.** Use `modelValue` + `update:modelValue`. Popups use `mixins: [PopupMixin]`, which
  provides `state`, `update()` and `close()`.
- **Events.** Prefer props/emits. Use `EventBus` (`@/plugins/eventbus`) only for app-wide signals
  (`app_error`, `app_ready`, `visualizer_*`), and remove listeners in `beforeUnmount`.
- **Errors.** Throwing in a handler reaches `app.config.errorHandler`, which shows the error popup.
  Don't swallow errors silently.
- **Hot paths.** Faders, knobs, timelines and colour pickers fire at pointer rate. Throttle with
  `requestAnimationFrame`, and don't create reactive data for values written every frame.
- **Live values.** Playback writes bypass Vue (raw channels, raw cue/chase callbacks), so a widget
  showing channel values, cue state or progress, chase playheads or activity uses
  `views/mixins/live.mixin.js`: read them through `live(value)` (template) or a computed that calls
  `this.live(...)`, and call `this.$liveTicker.bump()` after an operator edit. A plain reactive
  binding to those fields stops updating during playback.
- **Style.** Scoped plain CSS, snake_case class names, CSS variables (design tokens) from
  `src/assets/styles/tokens.css` (`:root` dark values, `[data-theme="light"]` overrides),
  imported by `global.css`. The user manual reuses the same file, so a new or changed token
  shows up there too; keep `tokens.css` custom properties only. No inline hard-coded colours
  except data-driven ones (group/universe/cue colours).
- **Idle surfaces** (empty or resting areas: empty lists, the modifier strip, the group pool)
  use `background: var(--primary-light) var(--idle-stripes);` (or their own base colour). Don't
  copy the gradient.
- **Popups** (`uk-popup`) attach to the injected `popupHost` when a parent provides one (the
  manual's previews), else to the body; don't append popups to `document.body` yourself.
- **List rows** (`uk-list-item`): `tall` (40px) and `large` (40px, 16px padding, 14px labels,
  16px icons) are opt-in modes; defaults stay as in the app. `large` is for lists people read
  (the user manual's navigation). Extend components with opt-in props like these rather than
  restyling them from outside.
- **Lists** (`uk-list`): rows are keyed by item `id`, else `name`, and their selection, checks
  and unfolded state follow that key across item changes. So give items a stable `id` (or a
  unique `name`), and rebuild `items` freely (a getter like `pool.listable` is fine): the list
  never writes to them. Events send the caller's own item objects. Keys reach only the focused
  list; `draggable` rows get a grip handle (drag from it only) and emit
  `reorder({ original, final })`. `deletable` rows show a trash icon at their right (before the
  grip); clicking it confirms and deletes the row, or the highlighted rows when it's one of them.
- **Icons in `icons/images/`** need a `viewBox` and no `width`/`height` attributes (the SVG loader
  drops the `viewBox` when both are there, so the icon is clipped when scaled).
- **Icons.** `<uk-icon name="...">` maps to `components/uikit/icons/images/*.svg`. Add new SVGs
  there.
- **Keyboard.** Reuse the existing patterns: Ctrl/Shift multi-select in lists, Del/Backspace
  delete, and Space play/pause (global, in `toolbar.fragment.vue` `handleKeydownEvent`). The
  menu's Ctrl+Z / Ctrl+Y labels aren't bound yet. Bind new global shortcuts there, and don't fire
  them while a text input has focus.

## Finish

- [ ] `npx eslint <touched .vue files>` is clean.
- [ ] Verified in the browser (skill `run-studio`), including resize/dock behaviour if it's a widget.
- [ ] The interaction changed? Update the manual page for that screen (skill `user-manual`).
