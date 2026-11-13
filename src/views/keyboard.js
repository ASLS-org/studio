/**
 * Whether an element takes typed text (its keys are never shortcuts)
 *
 * @param {?Element} el element
 * @returns {Boolean}
 */
const isField = (el) => !!el && (el.isContentEditable
  || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));

/**
 * @class Keyboard
 * @classdesc The app's one keyboard path. A key goes to exactly one place, the first of:
 * 1. the top popup (the view state's layers): Escape closes it, Enter submits it, and keys aimed
 *    outside it are dropped (typing in a field still works);
 * 2. the focused block: the innermost registered element holding the focus (lists and fields
 *    handle their own keys on their elements first);
 * 3. the global shortcuts.
 */
export default class Keyboard {
  /**
   * Installs the keyboard path on a target (the window, or a manual preview's element)
   *
   * @param {Object} view the view state (its top layer is the top popup)
   * @param {EventTarget} [target=window] where keys are listened to
   */
  constructor(view, target = window) {
    this.view = view;
    this.target = target;
    /** Registered blocks: { el, handler } */
    this.blocks = [];
    /** Registered global shortcuts: { match, handler } */
    this.shortcuts = [];
    this.onCapture = this.onCapture.bind(this);
    this.onBubble = this.onBubble.bind(this);
    target.addEventListener('keydown', this.onCapture, true);
    target.addEventListener('keydown', this.onBubble);
  }

  /**
   * Capture phase: the top popup gets Escape and Enter, and nothing outside it gets a key
   *
   * @param {KeyboardEvent} e keydown event
   */
  onCapture(e) {
    const top = this.view.topLayer;
    if (!top) return;
    const inside = !!top.el && top.el.contains(e.target);
    if (e.key === 'Escape' && !e.repeat) {
      e.preventDefault();
      e.stopPropagation();
      top.close();
      return;
    }
    if (e.key === 'Enter' && !e.repeat && !isField(e.target)) {
      e.preventDefault();
      e.stopPropagation();
      top.submit();
      return;
    }
    if (!inside && !isField(e.target)) {
      // A popup is open: lists, panels and shortcuts behind it don't react
      e.stopPropagation();
    }
  }

  /**
   * Bubble phase: the focused block, then the global shortcuts, for keys nothing else handled
   *
   * @param {KeyboardEvent} e keydown event
   */
  onBubble(e) {
    if (e.defaultPrevented || this.view.topLayer || isField(e.target)) return;
    const active = document.activeElement;
    const block = this.blocks
      .map((b) => ({ el: typeof b.el === 'function' ? b.el() : b.el, handler: b.handler }))
      .filter((b) => b.el && b.el.nodeType === 1 && b.el.contains(active))
      .sort((a, b) => (a.el.contains(b.el) ? 1 : -1))[0];
    if (block && block.handler(e) === true) {
      e.preventDefault();
      return;
    }
    const shortcut = this.shortcuts.find((s) => s.match(e));
    if (shortcut) {
      e.preventDefault();
      shortcut.handler(e);
    }
  }

  /**
   * Registers a block: its handler gets the keys while the focus is inside its element
   *
   * @public
   * @param {Element|Function} el the block's element, or a function returning it (read on
   *   each key, for elements that come and go)
   * @param {Function} handler called with the keydown event; returns true when it handled it
   * @returns {Function} unregisters the block
   */
  addBlock(el, handler) {
    const entry = { el, handler };
    this.blocks.push(entry);
    return () => {
      const index = this.blocks.indexOf(entry);
      if (index > -1) this.blocks.splice(index, 1);
    };
  }

  /**
   * Registers a global shortcut
   *
   * @public
   * @param {Function} match called with the keydown event; true when it is this shortcut
   * @param {Function} handler runs the shortcut
   * @returns {Function} unregisters the shortcut
   */
  addShortcut(match, handler) {
    const entry = { match, handler };
    this.shortcuts.push(entry);
    return () => {
      const index = this.shortcuts.indexOf(entry);
      if (index > -1) this.shortcuts.splice(index, 1);
    };
  }

  /**
   * Removes the listeners (a manual preview unmounting)
   *
   * @public
   */
  dispose() {
    this.target.removeEventListener('keydown', this.onCapture, true);
    this.target.removeEventListener('keydown', this.onBubble);
    this.blocks = [];
    this.shortcuts = [];
  }
}
