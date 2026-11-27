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
`ls -R src/views/components/uikit | grep .vue`: buttons, inputs (checkbox, choice, color,
select, textbox num/str, range fader/knob/gauge/vumeter), lists, menus, popups, widgets, cues, containers
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
  Don't measure the DOM in render: `$forceUpdate` never reaches slot content of child components,
  so draw in a `viewBox` instead (the chase timeline's fade curves).
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
- **Design scale** (`tokens.css`): sizes come from steps, never raw pixels.
  | Group | Tokens |
  |---|---|
  | Spacing (padding, margin, gap) | `--space-1`…`--space-10` = 2, 4, 6, 8, 10, 12, 16, 20, 24, 32 px |
  | Type | `--font-xs/sm/md/lg/xl` = 10, 12, 14, 16, 24 px |
  | Icons | `--icon-xs/sm/md/lg` = 10, 14, 16, 24 px |
  | Roles | `--control-height` (fields, selects, buttons beside them), `--button-height`, `--row-height`, `--row-height-tall`, `--header-height` (toolbar, panels), `--widget-header-height` (widgets, popups), `--widget-width-sm/md/lg/xl` (250 to 400 px), `--channel-column-width` (64 px) |
  | Radius, border | `--radius-sm/md/lg`, `--radius-round` (circles), `--radius-pill`; `--border-width` |
  | Colour roles | `--on-color-text`, `--on-color-surface` (on cue/chase colours, both themes), `--curve-handle` |

  A new value snaps to the nearest step (ties go down). `uk-flex`'s `gap` prop maps scale pixels
  to their step. **Fixed values are never scale steps**: a size the code computes with has its own
  variable *and* a constant in `views/utils/geometry.js` (`--chase-row-height`,
  `--select-option-height`: change both together). A border or offset that is part of a pitch or an
  alignment (chase rows, the timeline grid, crosshairs, a button lined up with a labelled field)
  stays raw with a comment, and a one-off size used in one place stays raw: never pull it into a
  shared variable because another component happens to use the same number.
- **Resizable areas** use `<uk-resize-handle axis="x|y" />` placed right after the element it
  resizes (its right border, or the border below it); the element's own min/max apply. Never use
  CSS `resize` (corner grip only).
- **Cut text** scrolls on hover by itself (`views/utils/overflow.scroll.js`, installed in
  `main.js`): just let the text overflow with `overflow: hidden` (plus `text-overflow: ellipsis`).
- **Idle surfaces** (empty or resting areas: empty lists, the modifier strip, the group pool)
  use `background: var(--primary-light) var(--idle-stripes);` (or their own base colour). Don't
  copy the gradient.
- **Popups** (`uk-popup`) attach to the injected `popupHost` when a parent provides one (the
  manual's previews), else to the body; don't append popups to `document.body` yourself.
  Extra footer buttons go in its `#actions` slot (left of the footer, e.g. Arrange's *Apply*);
  *OK* is the one light button, every other `uk-button` is `--secondary-dark`.
- **Coloured actions** (`uk-button filled`, opt-in) always show their `color`, text in
  `--on-color-text`: for an action whose colour carries meaning (Outputs: Connect green,
  Disconnect red). Other buttons stay grey until toggled.
- **Dividers run their panel's full width.** Rows and headings pad themselves; the container
  doesn't (a padded panel leaves its lines short of the edges). A section opens with a header
  band (a line above and below its `h3`), as widget headers and list columns do. Some older
  popups still pad their dividers: fix them when touched.
- **Copy the closest screen.** A popup with a list and the selected item's settings follows the
  Arrange popup (`universe.modifier.popup.arrange.vue`): list left, heading (icon, title, one
  line), label/control rows right, actions in the footer. A log is a log: a dark console box, a
  line per event (time, text), never bare rows.
- **Toggle buttons** (`uk-button toggleable`) start from `modelValue` and light in `color`; for a
  button group showing a state (Position Tool mounts), bind `modelValue` and key each button by
  its state so a click on the lit one keeps it lit.
- **List rows** (`uk-list-item`): `tall` (40px) and `large` (40px, 16px padding, 14px labels,
  16px icons) are opt-in modes; defaults stay as in the app. `large` is for lists people read
  (the user manual's navigation). Extend components with opt-in props like these rather than
  restyling them from outside.
- **DMX addresses** are shown 1–512 through `views/utils/dmx.js` (`dmxAddress`, `chStartOf`);
  the engine stores them from 0.
- **Rows over idle stripes stay solid:** `--secondary-dark/-darker` are see-through tints, so a row
  or option lays its tint over a solid base (`linear-gradient(tint, tint), var(--primary-light)`),
  never at reduced opacity.
- **Lists** (`uk-list`): rows are keyed by item `id`, else `name`, and their selection, checks
  and unfolded state follow that key across item changes. So give items a stable `id` (or a
  unique `name`), and rebuild `items` freely (a getter like `pool.listable` is fine): the list
  never writes to them. Events send the caller's own item objects. Keys reach only the focused
  list; `draggable` rows get a grip handle (drag from it only) and emit
  `reorder({ original, final })`. `deletable` rows show a trash icon at their right (before the
  grip); clicking it confirms and deletes the row, or the highlighted rows when it's one of them.
  A list that handles Delete itself swallows it (the keyboard path skips handled keys): make it
  `deletable` rather than catching Delete around it. Rows needing their own content (the cue
  pool) use the `row` slot (`#row="{ item }"`): everything else of the row (border, hover,
  selection, keys, tools) stays the list's. Never hand-roll list-looking rows.
- **Icons in `icons/images/`** need a `viewBox` and no `width`/`height` attributes (the SVG loader
  drops the `viewBox` when both are there, so the icon is clipped when scaled).
- **Icons.** `<uk-icon name="...">` maps to `components/uikit/icons/images/*.svg`. Add new SVGs
  there. In dense places the live ticker re-renders (cue pool rows, chase lanes, list row tools),
  draw them as CSS masks on a plain element with `:class="maskClass(name)"`
  (`uikit/icons/icon.mask.js`, the element's `background-color` is the icon's colour): one
  component per item costs too much there, and a mask *style* object is set again key by key on
  every render (the older `maskIcon(name)` style is for one-off places only). A missing name shows `close.svg` (an "x"). Channel icons come only from
  `views/utils/channel.icons.js` (`channelIcon(channel)`: GDTF attribute families, then legacy
  type keys, then name words, then `channel`); it only returns existing files.
- **Number fields** (`uk-num-input`): `readonly` shows a value the operator can't change (the
  disabled look with the label not dimmed, like read-only text and selects); `relative` is for a
  field standing for several values: a `null` value shows the `placeholder` (`--`), and the arrows
  and arrow keys emit `step` (±1 precision unit) instead of changing the value (Position Tool).
- **Locked controls**: `uk-fader` and `uk-num-input` take `locked` (no input, colour kept; the
  universe view's parked channels). `disabled` greys them out instead.
- **Widget header actions**: `uk-widget`'s `actions` (array of `action`-like items plus
  `disabled`) puts square buttons right after the title, for actions that must stay in reach
  however wide the widget (the channels widget's Clear programmer, Unpark). The single `action`
  keeps its place at the right.
- **View switches** in a widget (the Pan/Tilt Scope's Deg, Fit) sit among its fields as square
  `uk-button toggleable color="var(--accent-blue)"`, keyed by state, never in the header.
- **Colour fields** (`uk-color-input`): `v-model` `#rrggbb`; a swatch opening the system picker
  (reports live while dragging) and an editable hex code (Enter or blur; anything else reverts).
  Use it for any colour a field sets, never a bare `<input type="color">`.
- **Lists' `selection` event** sends the selected items (the caller's objects), the `selection`
  prop takes ids: map `items.map((i) => i.id)` when storing what was picked.
- **Selects** (`uk-select-input`): options are HTML strings. The option list is teleported and
  built only while open. A `#trigger` slot replaces the text box (the list opens upwards from it,
  sized to its options), `#header` heads the list, whose body is then a real `uk-list` of `items`
  (`id` = option index; `searchable` turns on its search box, keys work from it; `emptyText` goes to
  its empty state; always 6 rows high and 200 to 360 px wide). Never hand-roll rows or a list:
  reuse `uk-list`. Trigger slots
  use the shared look `uikit_select_trigger_box` / `uikit_select_trigger_text` (styled by the
  select through `:slotted`): the channel box does. A plain select's options can carry inline SVG (the
  fade type shows each curve). and `reselect` makes it an action menu that emits on
  every pick, current option included, and follows `modelValue` silently. The channels widget's
  channel box uses all of them (`views/utils/channel.presets.js` caches options per capability
  array).
- **Keyboard.** One path, `views/keyboard.js` (`$keyboard`): the top popup, then the focused
  block, then global shortcuts. A widget that reacts to keys while focused uses
  `mixins/keys.mixin.js` (`handleKeys(e)` → true when handled; focusable element via
  `keysElement()`); app-wide shortcuts use `$keyboard.addShortcut(match, handler)` (Space
  play/pause in the toolbar; `uk-menu` items with a `shortcut` register theirs, modifiers matched
  exactly). Never add `window` keydown listeners. Fields keep their keys.
- **Selection and popups** go through `$view` (`views/view.state.js`, see `src/views/CLAUDE.md`):
  bind lists with `uk-list`'s `selection` prop/event, name popups with `modal(name, owner)`.
- **Check the flow** with `npm run app:check` after changing panels, selection, popups or keys.

## Finish

- [ ] `npx eslint <touched .vue files>` is clean.
- [ ] Verified in the browser (skill `run-studio`), including resize/dock behaviour if it's a widget.
- [ ] The interaction changed? Update the manual page for that screen (skill `user-manual`).
