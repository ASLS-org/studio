import { toRaw } from '../utils/reactivity';

/**
 * A master at full, DMX
 *
 * @constant {Number} MAX_LEVEL
 */
const MAX_LEVEL = 255;

/**
 * A master's factor (0-1) from its level (DMX 0-255, clamped)
 *
 * @param {Number} level
 * @returns {Number}
 */
function factorOf(level) {
  const value = Number(level);
  if (!(value > 0)) return 0;
  return value >= MAX_LEVEL ? 1 : value / MAX_LEVEL;
}

/**
 * The master factor of a family slot: that of the group whose cue it shows, blended by the fade
 * while it crosses from another cue; a kept value follows the cue that left it
 *
 * @param {?Object} slot the channel's family slot (claims.js)
 * @returns {Number} 0-1
 */
function groupFactor(slot) {
  if (!slot) return 1;
  const { top, under, fader } = slot;
  if (!top) return slot.keptFrom && slot.keptFrom.output ? slot.keptFrom.output.factor : 1;
  const own = top.output.factor;
  if (!fader || !fader.alive || fader.factor >= 1 || !under) return own;
  const from = under.output.factor;
  return from + (own - from) * fader.factor;
}

/**
 * A level (or a dimmerless fixture's colour) as the masters let it through: the programmer's by
 * the grand master, playback's by its group's factor and the grand master. A coarse and fine pair
 * is scaled as one 16-bit value
 *
 * @param {Object} channel the channel sent (coarse or fine), not parked
 * @param {Number} value its unscaled value
 * @param {Number} grand the grand master's factor
 * @returns {Number} DMX 0-255
 */
export function scaledLevel(channel, value, grand) {
  const coarse = channel.coarse || channel;
  const programmed = coarse.programmed !== null;
  const factor = programmed ? grand : grand * groupFactor(coarse.slot);
  if (factor >= 1) return value;
  const fine = coarse.fineChannels[0];
  if (!fine) return Math.round(value * factor);
  let fineValue = fine.value.DMX;
  if (programmed) fineValue = fine.programmed !== null ? fine.programmed : 0;
  const coarseValue = programmed ? coarse.programmed : coarse.value.DMX;
  const v = (coarseValue + fineValue / MAX_LEVEL) * factor;
  return channel === coarse ? Math.floor(v) : Math.round((v % 1) * MAX_LEVEL);
}

/**
 * The level a coarse level or colour channel sends now (0-1): parked as is, else as the masters
 * let it through
 *
 * @param {Object} channel
 * @param {Number} grand the grand master's factor
 * @returns {Number}
 */
function sentLevel(channel, grand) {
  if (channel.parked !== null) return channel.parked / MAX_LEVEL;
  const value = channel.programmed !== null ? channel.programmed : channel.value.DMX;
  return scaledLevel(channel, value, grand) / MAX_LEVEL;
}

/**
 * @class Master
 * @classdesc The master column: plays chase rows across every group, and holds the masters
 * (grand master, DBO) and each group's factor from its knob, Isolate and Blackout
 */
class Master {
  /**
   * Creates an instance of Master.
   * @param {Object} groupPoolHandle handle to group pool instance to be mastered.
   * @param {Object} [fixturePoolHandle] the show's fixtures, for the rig's level
   * @todo This was rushed, it would make more sense to manage group definition though
   * a master instance that would be property of Show.
   */
  constructor(groupPoolHandle, fixturePoolHandle = null) {
    this.groupPool = groupPoolHandle;
    this.fixturePool = fixturePoolHandle;
    this.playingRow = -1;
    this.onEnd = () => {};
    /**
     * Grand master, DMX 0-255: scales every level sent, the programmer included. Never saved
     *
     * @type {Number}
     */
    this.level = MAX_LEVEL;
    /**
     * DBO: every level sent at 0 while on, the grand master kept. Never saved
     *
     * @type {Boolean}
     */
    this.blackout = false;
    /**
     * The grand master's factor (0-1), from level and DBO, computed by prepare()
     *
     * @type {Number}
     */
    this.grand = 1;
  }

  /**
   * Computes, once per tick before frames are packed, the grand master's factor and each group's
   * (its knob, Blackout, Isolate): Universe.packFrame scales levels with them. No allocation
   *
   * @public
   */
  prepare() {
    const { groups } = this.groupPool;
    let isolating = false;
    for (let i = 0; i < groups.length; i++) {
      if (groups[i].solo) isolating = true;
    }
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      if (group.output) {
        const off = group.disabled || (isolating && !group.solo);
        group.output.factor = off ? 0 : factorOf(group.master);
      }
    }
    this.grand = this.blackout ? 0 : factorOf(this.level);
  }

  /**
   * The highest level a group's playback asks for (its cues' dimmers, or colour on fixtures
   * without one, where they show) and the highest it sends after the masters, 0-1 each: its
   * activity dots read them
   *
   * @public
   * @param {Group} group
   * @returns {{asked: Number, sent: Number}}
   */
  groupLevels(group) {
    const raw = toRaw(group);
    const { grand } = toRaw(this);
    const own = raw.output;
    const levels = { asked: 0, sent: 0 };
    if (!own) return levels;
    raw.fixturePool.fixtures.forEach((fixture) => {
      toRaw(fixture).channels.forEach((channel) => {
        if (channel.scale === null || channel.isFine) return;
        if (channel.parked !== null || channel.programmed !== null) return;
        const { slot } = channel;
        const shows = slot && (slot.top ? slot.top.output === own
          : !!slot.keptFrom && slot.keptFrom.output === own);
        if (!shows) return;
        levels.asked = Math.max(levels.asked, channel.value.DMX / MAX_LEVEL);
        levels.sent = Math.max(levels.sent, sentLevel(channel, grand));
      });
    });
    return levels;
  }

  /**
   * The highest level the rig asks for and the highest it sends after the masters, 0-1 each,
   * whatever sends it: the master column's dots
   *
   * @public
   * @returns {{asked: Number, sent: Number}}
   */
  rigLevels() {
    const raw = toRaw(this);
    const levels = { asked: 0, sent: 0 };
    if (!raw.fixturePool) return levels;
    raw.fixturePool.fixtures.forEach((fixture) => {
      toRaw(fixture).channels.forEach((channel) => {
        if (channel.scale === null || channel.isFine) return;
        let asked = channel.value.DMX;
        if (channel.parked !== null) asked = channel.parked;
        else if (channel.programmed !== null) asked = channel.programmed;
        levels.asked = Math.max(levels.asked, asked / MAX_LEVEL);
        levels.sent = Math.max(levels.sent, sentLevel(channel, raw.grand));
      });
    });
    return levels;
  }

  cueRow(rowIndex) {
    let chaseCount = 0;
    const state = rowIndex !== this.playingRow;
    this.groupPool.groups.forEach((group) => {
      group.chasePool.chases.forEach((chase) => {
        chase.cue(false);
        chase.onEnd = () => {};
        // chaseCount++;
      });
      try {
        const chase = group.chasePool.getFromId(rowIndex);
        chaseCount++;
        chase.cue(state);
        chase.onEnd = () => {
          chaseCount--;
          if (chaseCount === 0) {
            this.onEnd();
          }
        };
        // eslint-disable-next-line
      }catch(err){}
    });
    this.playingRow = (state && chaseCount) ? rowIndex : -1;
    return this.playingRow;
  }
}

export default Master;
