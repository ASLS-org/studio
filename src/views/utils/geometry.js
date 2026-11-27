/**
 * Fixed geometry: sizes the code computes positions with, in pixels. They are also CSS variables
 * in src/assets/styles/tokens.css (--chase-row-height, --select-option-height): change both
 * together. Never part of the design scale.
 *
 * @module views/utils/geometry
 */

/** Group pool: a chase row's height (px) */
export const CHASE_ROW_HEIGHT = 26;
/** uk-select: an option's height (px) */
export const SELECT_OPTION_HEIGHT = 25;
/** uk-select: options shown before the list scrolls */
export const SELECT_VISIBLE_OPTIONS = 4;
