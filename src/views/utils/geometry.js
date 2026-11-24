/**
 * Fixed geometry: sizes the code computes positions with, in pixels. They are also CSS variables
 * in src/assets/styles/tokens.css (--cue-tile-width, --cue-tile-height, --chase-row-height,
 * --select-option-height): change both together. Never part of the design scale.
 *
 * @module views/utils/geometry
 */

/** Cue pool grid: a cue tile's width (px) */
export const CUE_TILE_WIDTH = 100;
/** Cue pool grid: a cue tile's height (px) */
export const CUE_TILE_HEIGHT = 81;
/** Cue pool grid: tiles per row */
export const CUE_TILES_PER_ROW = 4;
/** Group pool: a chase row's height (px) */
export const CHASE_ROW_HEIGHT = 26;
/** uk-select: an option's height (px) */
export const SELECT_OPTION_HEIGHT = 25;
/** uk-select: options shown before the list scrolls */
export const SELECT_VISIBLE_OPTIONS = 4;
