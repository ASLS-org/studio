/*
 * Demo runner: plays a scripted interaction on a real Studio component, with a fake cursor, for
 * flows readers should watch rather than try (selecting, filtering, opening a popup). The
 * component is real and receives real DOM events; the reader's own input is blocked while a
 * demo plays (see LivePreview).
 *
 * A demo is a list of steps. Targets are CSS selectors inside the preview (component and its
 * popups), optionally narrowed by `has` (an element whose text contains it) and `nth`:
 *   { move: sel }                         glide the cursor to an element
 *   { click: sel, ctrl, shift }           glide, then press and release (with modifier keys)
 *   { dblclick: sel }                     glide, then double click
 *   { type: sel, text }                   glide, then type the text into the field, key by key
 *   { key: 'Delete' }                     press a key on the last element clicked (never past the
 *                                         preview)
 *
 * Demos never take the page's focus from the reader: only a key step focuses its target, and
 * only when focus isn't on something else of the page.
 *   { wait: ms }                          pause
 *   { caption: 'text' }                   show a hint next to the cursor (null clears it)
 */

const GLIDE_MS = 650;
const KEY_MS = 90;

const sleep = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

/**
 * Finds a step's target in the preview
 * @param {HTMLElement} stage preview root
 * @param {Object} step step
 * @param {String} selector CSS selector
 * @returns {?HTMLElement} element
 */
function find(stage, step, selector) {
  let list = [...stage.querySelectorAll(selector)].filter((el) => el.getClientRects().length);
  if (step.has) {
    list = list.filter((el) => el.textContent.includes(step.has));
    // Rows nest (a wrapper and the row itself match): the innermost is the one that reacts
    list = list.filter((el) => !list.some((other) => other !== el && el.contains(other)));
  }
  return list[step.nth || 0] || null;
}

/**
 * Sends a mouse event the way a real click does
 * @param {HTMLElement} el target
 * @param {String} type event type
 * @param {Object} at client position
 * @param {Object} step step (modifier keys)
 */
function mouse(el, type, at, step) {
  const init = {
    bubbles: true,
    cancelable: true,
    view: window,
    clientX: at.x,
    clientY: at.y,
    button: 0,
    buttons: type.endsWith('down') ? 1 : 0,
    detail: type === 'dblclick' ? 2 : 1,
    ctrlKey: Boolean(step.ctrl),
    metaKey: Boolean(step.ctrl),
    shiftKey: Boolean(step.shift),
  };
  const Ctor = type.startsWith('pointer') && typeof PointerEvent !== 'undefined' ? PointerEvent : MouseEvent;
  el.dispatchEvent(new Ctor(type, { ...init, pointerId: 1, isPrimary: true }));
}

/**
 * Plays a demo in a loop until stopped
 * @param {Object} options
 * @param {HTMLElement} options.root the preview (component, popups, overlay; cursor coordinates
 *   are relative to it, in CSS pixels)
 * @param {HTMLElement} options.cursor the fake cursor element
 * @param {HTMLElement} options.hint the hint bubble element
 * @param {Array<Object>} options.steps the demo
 * @param {Function} options.visible returns whether the preview is on screen
 * @param {Function} options.restart remounts the component between loops (async)
 * @returns {Function} stops the demo
 */
export default function playDemo({
  root: stage, cursor, hint, steps, visible, restart,
}) {
  let stopped = false;
  let lastTarget = null;
  const position = { x: 40, y: 40 };
  // Scripted keys stay in this preview: Studio components also listen on window (the chase
  // timeline deletes on Delete), and other previews on the page must not react
  const contain = (e) => { if (!e.isTrusted) e.stopPropagation(); };
  stage.addEventListener('keydown', contain);
  stage.addEventListener('keyup', contain);

  const place = () => {
    cursor.style.transform = `translate(${position.x}px, ${position.y}px)`;
    hint.style.transform = `translate(${position.x + 22}px, ${position.y + 18}px)`;
  };
  // Waits while off screen; false once stopped
  const ready = async () => {
    while (!stopped && !visible()) await sleep(250); // eslint-disable-line no-await-in-loop
    return !stopped;
  };
  // Glides the cursor to an element's centre; returns its client position
  const glide = async (el) => {
    const box = el.getBoundingClientRect();
    const origin = stage.getBoundingClientRect();
    position.x = box.left + box.width / 2 - origin.left;
    position.y = box.top + box.height / 2 - origin.top;
    place();
    await sleep(GLIDE_MS);
    return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
  };

  const run = async (step) => {
    if (step.wait) {
      await sleep(step.wait);
      return;
    }
    if ('caption' in step) {
      hint.textContent = step.caption || '';
      hint.classList.toggle('shown', Boolean(step.caption));
      return;
    }
    if (step.key) {
      // Lists act on keys only when focused, as after a real click: focus the last element
      // clicked, unless the reader's focus is elsewhere on the page
      const focusable = lastTarget
        && lastTarget.closest('input, textarea, select, button, [tabindex]');
      const active = document.activeElement;
      const free = active === document.body || stage.contains(active);
      if (focusable && free && stage.contains(focusable)) focusable.focus({ preventScroll: true });
      const target = stage.contains(document.activeElement) ? document.activeElement : stage;
      const init = {
        key: step.key, code: step.key, bubbles: true, cancelable: true, ctrlKey: Boolean(step.ctrl),
      };
      target.dispatchEvent(new KeyboardEvent('keydown', init));
      target.dispatchEvent(new KeyboardEvent('keyup', init));
      cursor.classList.add('pressing');
      await sleep(180);
      cursor.classList.remove('pressing');
      return;
    }
    const selector = step.move || step.click || step.dblclick || step.type;
    const el = find(stage, step, selector);
    if (!el) throw new Error(`demo step target not found: ${selector}${step.has ? ` "${step.has}"` : ''}`);
    const at = await glide(el);
    mouse(el, 'pointerover', at, step);
    mouse(el, 'mouseover', at, step);
    mouse(el, 'mousemove', at, step);
    if (step.click || step.dblclick || step.type) {
      cursor.classList.add('pressing');
      const presses = step.dblclick ? 2 : 1;
      for (let i = 0; i < presses; i++) {
        mouse(el, 'pointerdown', at, step);
        mouse(el, 'mousedown', at, step);
        await sleep(90); // eslint-disable-line no-await-in-loop
        mouse(el, 'pointerup', at, step);
        mouse(el, 'mouseup', at, step);
        mouse(el, 'click', at, step);
      }
      if (step.dblclick) mouse(el, 'dblclick', at, step);
      lastTarget = el;
      await sleep(120);
      cursor.classList.remove('pressing');
    }
    if (step.type) {
      for (const char of step.text) { // eslint-disable-line no-restricted-syntax
        el.value += char;
        el.dispatchEvent(new InputEvent('input', { bubbles: true, data: char, inputType: 'insertText' }));
        el.dispatchEvent(new KeyboardEvent('keyup', { key: char, bubbles: true }));
        await sleep(KEY_MS); // eslint-disable-line no-await-in-loop
      }
    }
  };

  (async () => {
    place();
    while (!stopped) { // eslint-disable-line no-constant-condition
      for (const step of steps) { // eslint-disable-line no-restricted-syntax
        if (!(await ready())) return; // eslint-disable-line no-await-in-loop
        try {
          await run(step); // eslint-disable-line no-await-in-loop
        } catch (err) {
          console.warn('[LivePreview demo]', err.message); // eslint-disable-line no-console
          break;
        }
        await sleep(step.after || 350); // eslint-disable-line no-await-in-loop
      }
      if (stopped) return;
      hint.classList.remove('shown');
      // Leave the page's focus as it was
      if (stage.contains(document.activeElement)) document.activeElement.blur();
      await sleep(1600); // eslint-disable-line no-await-in-loop
      if (!(await ready())) return; // eslint-disable-line no-await-in-loop
      await restart(); // eslint-disable-line no-await-in-loop
    }
  })();

  return () => {
    stopped = true;
    stage.removeEventListener('keydown', contain);
    stage.removeEventListener('keyup', contain);
  };
}
