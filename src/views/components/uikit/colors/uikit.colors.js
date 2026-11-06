/**
 * Accent token names, keyed by palette colour name.
 * @type {Object<string, string>}
 */
const TOKENS = {
  Maroon: '--accent-maroon',
  Pink: '--accent-pink',
  Violet: '--accent-violet',
  Purple: '--accent-purple',
  DarkPurple: '--accent-dark-purple',
  Blue: '--accent-blue',
  LightBlue: '--accent-light-blue',
  Teal: '--accent-teal',
  SeaGreen: '--accent-sea-green',
  Green: '--accent-green',
  LightGreen: '--accent-light-green',
  Gold: '--accent-gold',
  Orange: '--accent-orange',
  Red: '--accent-red',
};

const cache = {};

/**
 * Reads an accent token from the document on first access, then caches it. Returns an empty
 * string outside a browser (e.g. the manual's server-side build) without caching, so a later
 * read in the browser still resolves the value.
 * @param {String} name palette colour name
 * @returns {String} the token's value
 */
function read(name) {
  if (cache[name]) return cache[name];
  if (typeof document === 'undefined') return '';
  const value = getComputedStyle(document.documentElement).getPropertyValue(TOKENS[name]);
  if (value) cache[name] = value;
  return value;
}

/*
 * Full color palette. Enumerable lazy getters, so `Object.keys` order and the keys added at
 * runtime by color.mixin.js keep working.
 */
const palette = {};
Object.keys(TOKENS).forEach((name) => {
  Object.defineProperty(palette, name, {
    enumerable: true,
    configurable: true,
    get: () => read(name),
  });
});

export default palette;
