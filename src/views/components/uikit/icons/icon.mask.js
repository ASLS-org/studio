/**
 * Icons as CSS masks: a uikit icon drawn on a plain element (no component instance), for dense
 * places the live ticker re-renders (cue rows, chase lanes). The element's background colour is
 * the icon's colour; its size comes from its own CSS.
 *
 * Prefer `maskClass`: a class is cheap to patch, while a style object is set again, key by key,
 * on every render of its element.
 *
 * @module icon.mask
 */

/**
 * URL of every icon of `./images`, by path
 *
 * @constant {Object} ICON_URLS
 */
const ICON_URLS = import.meta.glob('./images/*.svg', { query: '?url', import: 'default', eager: true });

/**
 * Icons whose class rule is written, by name
 *
 * @constant {Set<String>} WRITTEN
 */
const WRITTEN = new Set();

/**
 * URL of an icon (`close` when the name is unknown, as uk-icon does)
 *
 * @param {String} name icon name
 * @returns {String}
 */
const urlOf = (name) => ICON_URLS[`./images/${name}.svg`] || ICON_URLS['./images/close.svg'];

/**
 * Inline style drawing an icon as a mask
 *
 * @param {String} name icon name, as for uk-icon
 * @returns {Object} style: mask image, size, position and repeat
 */
export default function maskIcon(name) {
  const image = `url("${urlOf(name)}")`;
  return {
    maskImage: image,
    WebkitMaskImage: image,
    maskSize: 'contain',
    WebkitMaskSize: 'contain',
    maskRepeat: 'no-repeat',
    WebkitMaskRepeat: 'no-repeat',
    maskPosition: 'center',
    WebkitMaskPosition: 'center',
  };
}

/**
 * Classes drawing an icon as a mask: `uk_mask` (size, position, repeat) and `uk_mask_<name>` (the
 * image), whose rules are written once in a shared stylesheet (none outside a browser)
 *
 * @param {String} name icon name, as for uk-icon
 * @returns {String} class names
 */
export function maskClass(name) {
  const className = `uk_mask_${name.replace(/[^\w-]/g, '_')}`;
  if (!WRITTEN.has(name) && typeof document !== 'undefined') {
    WRITTEN.add(name);
    let sheet = document.getElementById('uk-mask-icons');
    if (!sheet) {
      sheet = document.createElement('style');
      sheet.id = 'uk-mask-icons';
      sheet.textContent = '.uk_mask{-webkit-mask-size:contain;mask-size:contain;'
        + '-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;'
        + '-webkit-mask-position:center;mask-position:center}';
      document.head.appendChild(sheet);
    }
    const image = `url("${urlOf(name)}")`;
    sheet.textContent += `.${className}{-webkit-mask-image:${image};mask-image:${image}}`;
  }
  return `uk_mask ${className}`;
}
