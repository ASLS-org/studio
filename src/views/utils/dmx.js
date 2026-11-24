/**
 * DMX addresses as people read them. The engine and showfiles count a universe's addresses from 0
 * (`Fixture.chStart`); desks and fixture displays count 1 to 512: every address shown goes through
 * these.
 */

/**
 * Address shown for a 0-based start (0 → 1)
 *
 * @public
 * @param {Number} chStart 0-based address
 * @returns {Number} DMX address, 1 to 512
 */
export function dmxAddress(chStart) {
  return Number(chStart) + 1;
}

/**
 * 0-based start of a typed DMX address (1 → 0)
 *
 * @public
 * @param {Number} address DMX address, 1 to 512
 * @returns {Number} 0-based address
 */
export function chStartOf(address) {
  return Number(address) - 1;
}
