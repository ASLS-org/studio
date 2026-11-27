/**
 * Fixed geometry: sizes the code computes positions with, in pixels. They are also CSS variables
 * in src/assets/styles/tokens.css (--chase-row-height, --select-option-height, --output-*):
 * change both together. Never part of the design scale.
 *
 * @module views/utils/geometry
 */

/** Group pool: a chase row's height (px) */
export const CHASE_ROW_HEIGHT = 26;
/** uk-select: an option's height (px) */
export const SELECT_OPTION_HEIGHT = 25;
/** uk-select: options shown before the list scrolls */
export const SELECT_VISIBLE_OPTIONS = 4;
/** Outputs flow: a column's header height, a widget header's (px) */
export const OUTPUT_HEAD_HEIGHT = 30;
/** Outputs flow: the universes and gateways columns' width (px) */
export const OUTPUT_COLUMN_WIDTH = 170;
/** Outputs flow: the gap the wires cross between two columns (px) */
export const OUTPUT_WIRE_GAP = 48;
/** Outputs flow: a row's pitch, the uk-list row (--row-height, px) */
export const OUTPUT_ROW_PITCH = 30;
