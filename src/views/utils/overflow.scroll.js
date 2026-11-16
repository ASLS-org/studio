/** Hover time before cut text starts scrolling (ms) */
const DELAY = 400;
/** Scrolling speed (px per second) */
const SPEED = 40;
/** Pause at each end (ms) */
const PAUSE = 1000;
/** How far up from the hovered element to look for the text box that overflows */
const DEPTH = 4;

/**
 * Whether an element takes typed text (fields scroll on their own)
 *
 * @param {Element} el element
 * @returns {Boolean}
 */
const isField = (el) => el.isContentEditable
  || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName);

/** Inline tags that can sit inside a text box (anything else makes it UI) */
const TEXT_TAGS = new Set(['SPAN', 'B', 'STRONG', 'I', 'EM', 'SMALL', 'CODE', 'KBD', 'SUB', 'SUP',
  'MARK', 'ABBR', 'BR']);

/**
 * Whether an element is a box of text only: text, possibly in inline text tags, and nothing else
 * (no controls, icons, rows or other blocks inside). Panels and rows clip their content too, but
 * they aren't text and never scroll.
 *
 * @param {Element} el element
 * @returns {Boolean}
 */
const isTextOnly = (el) => {
  if (!el.textContent.trim()) return false;
  const walk = (node) => [...node.children].every((child) => TEXT_TAGS.has(child.tagName)
    && walk(child));
  return walk(el);
};

/**
 * Whether an element is text cut by its own width (clipped or ellipsised), and not a box holding
 * other elements
 *
 * @param {Element} el element
 * @returns {Boolean}
 */
const overflows = (el) => {
  if (el.scrollWidth <= el.clientWidth + 1) return false;
  if (!isTextOnly(el)) return false;
  const { overflowX } = getComputedStyle(el);
  return overflowX === 'hidden' || overflowX === 'clip';
};

/**
 * Makes text that doesn't fit its box (cut or ellipsised) readable: resting the pointer on it
 * scrolls it to its end, pauses, scrolls back, and so on while hovered. Leaving puts it back at
 * its start. Only boxes of text scroll (see isTextOnly): never panels, rows, widgets or controls,
 * whatever they clip. Nothing moves with the reduced-motion setting on. One delegated listener
 * per root; no work unless an overflowing text is hovered.
 *
 * @param {Element|Document} [root=document] where hovers are watched (a manual preview's element)
 * @returns {Function} removes the listeners
 */
export default function installOverflowScroll(root = document) {
  let el = null;
  let timer = null;
  let frame = null;
  let savedOverflow = '';
  let direction = 1;
  let last = 0;
  let pausedUntil = 0;

  const reducedMotion = () => window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /**
   * The text box under the pointer that overflows, if any
   *
   * @param {EventTarget} target hovered node
   * @returns {?Element}
   */
  const findTarget = (target) => {
    let node = target && target.nodeType === 1 ? target : target?.parentElement;
    for (let i = 0; node && i < DEPTH; i += 1, node = node.parentElement) {
      if (isField(node)) return null;
      if (overflows(node)) return node;
    }
    return null;
  };

  const stop = () => {
    clearTimeout(timer);
    cancelAnimationFrame(frame);
    timer = null;
    frame = null;
    if (el) {
      el.scrollLeft = 0;
      el.style.textOverflow = savedOverflow;
    }
    el = null;
  };

  const step = (now) => {
    if (!el || !el.isConnected) {
      stop();
      return;
    }
    const distance = el.scrollWidth - el.clientWidth;
    if (distance <= 1) {
      // fits now (its text changed): nothing to show
      el.scrollLeft = 0;
      frame = requestAnimationFrame(step);
      last = now;
      return;
    }
    if (now < pausedUntil) {
      last = now;
      frame = requestAnimationFrame(step);
      return;
    }
    const dt = Math.min(now - last, 100) / 1000;
    last = now;
    const next = el.scrollLeft + direction * SPEED * dt;
    if (direction > 0 && next >= distance) {
      el.scrollLeft = distance;
      direction = -1;
      pausedUntil = now + PAUSE;
    } else if (direction < 0 && next <= 0) {
      el.scrollLeft = 0;
      direction = 1;
      pausedUntil = now + PAUSE;
    } else {
      el.scrollLeft = next;
    }
    frame = requestAnimationFrame(step);
  };

  const start = () => {
    timer = null;
    if (!el || reducedMotion()) return;
    savedOverflow = el.style.textOverflow;
    el.style.textOverflow = 'clip';
    direction = 1;
    pausedUntil = 0;
    last = performance.now();
    frame = requestAnimationFrame(step);
  };

  const onOver = (e) => {
    const target = findTarget(e.target);
    if (target === el) return;
    stop();
    if (!target) return;
    el = target;
    timer = setTimeout(start, DELAY);
  };

  const onOut = (e) => {
    if (el && !el.contains(e.relatedTarget)) stop();
  };

  root.addEventListener('pointerover', onOver, true);
  root.addEventListener('pointerout', onOut, true);
  return () => {
    stop();
    root.removeEventListener('pointerover', onOver, true);
    root.removeEventListener('pointerout', onOut, true);
  };
}
