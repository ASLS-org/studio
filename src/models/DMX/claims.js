/**
 * Claims: how playing cues share the stage (the merge engine).
 *
 * Channels with a family (families.js) are decided per fixture and family, in a slot:
 * - each play of a cue (a standalone start, a chase item entering) holds a token;
 * - in a group, each family has a stack of the tokens using it, newest first: the first one holds
 *   the family in the group, the others are covered;
 * - a slot follows, among the group holders reaching its fixture, the newest; a group whose
 *   holder doesn't reach the fixture leaves it to rest;
 * - while a cue writes (between open and close), Fixture.setChannel stores its values in its
 *   token; after the tick's cues, settle() writes each live slot from its top token, blended with
 *   what is under it while the top fades in or out (its fade factor).
 *
 * Holders change only on events: a token placed (its first write, or what it drives changed) or
 * released. A Replace token turns off the cues it covers entirely once its fade-in ends; Layer and
 * flash tokens never do. A family nobody holds rests: Intensity goes back to its level from before
 * playback took it, the others keep their values. Channels with no family follow the newest
 * writer.
 *
 * Per tick: one Map write per value a cue writes, one pass over the live slots' channels. Tokens,
 * Map keys and stack changes are made only on events.
 *
 * @module Claims
 */
import { FAMILIES, FAMILY_COUNT } from './families';
import { markRaw } from '../utils/reactivity';

/**
 * Highest DMX value
 *
 * @constant {Number} MAX_DMX
 */
const MAX_DMX = 255;

/**
 * @class ClaimToken
 * @classdesc One play of a cue: its start order, its mode, the values it wrote last, the slots it
 * reaches and its fade state
 */
class ClaimToken {
  /**
   * @param {Object} cue the cue playing (raw)
   * @param {Number} stamp start order
   * @param {Object} options
   * @param {Boolean} options.layer plays over what it covers, never turning it off
   * @param {Boolean} options.temporary a flash (held down)
   */
  constructor(cue, stamp, options) {
    this.cue = cue;
    // The family stacks of the cue's group (a cue outside a group gets its own)
    this.stage = cue.stage || [[], [], [], []];
    this.stamp = stamp;
    this.layer = !!options.layer;
    this.temporary = !!options.temporary;
    // Last value written per channel: { v, pass }
    this.values = new Map();
    // Write pass bookkeeping: the pass number, values written in it, whether a channel was new
    this.pass = 0;
    this.written = 0;
    this.added = false;
    this.placed = false;
    this.alive = true;
    // Families it uses, slots it reaches, and how many slots it shows on, per family
    this.families = [false, false, false, false];
    this.slots = [];
    this.shown = [0, 0, 0, 0];
    // Fade state, copied from the cue each pass
    this.factor = 1;
    this.releasing = false;
    this.wasReleasing = false;
  }
}

/**
 * Whether a token outranks another: the one started last
 *
 * @param {ClaimToken} a
 * @param {ClaimToken} b
 * @returns {Boolean}
 */
function outranks(a, b) {
  return a.stamp > b.stamp;
}

/**
 * A channel's current value, its fine channel as the fraction
 *
 * @param {Object} channel
 * @returns {Number}
 */
function current(channel) {
  const fine = channel.fineChannels[0];
  return channel.value.DMX + (fine ? fine.value.DMX / MAX_DMX : 0);
}

/**
 * Writes a value to a channel and its fine channel (as Fixture.setChannel does)
 *
 * @param {Object} channel
 * @param {Number} value
 */
function writeChannel(channel, value) {
  const v = Math.min(Math.max(value, 0), MAX_DMX);
  const fine = channel.fineChannels[0];
  if (fine) {
    fine.value = Math.round((v % 1) * MAX_DMX);
    channel.value = Math.floor(v);
  } else {
    channel.value = Math.round(v);
  }
}

/**
 * A token's value for a channel of a slot it holds: what it wrote; else 0 for colour (the colour
 * is exactly the cue's), else the channel's value when the slot last changed hands
 *
 * @param {ClaimToken} token
 * @param {Object} channel
 * @returns {Number}
 */
function valueOf(token, channel) {
  const entry = token.values.get(channel);
  if (entry) return entry.v;
  return channel.family === FAMILIES.COLOUR ? 0 : channel.fromValue;
}

/**
 * Removes an item from an array, if there
 *
 * @param {Array} list
 * @param {*} item
 */
function removeFrom(list, item) {
  const index = list.indexOf(item);
  if (index > -1) list.splice(index, 1);
}

/**
 * Inserts a token in a family stack, by rank
 *
 * @param {Array<ClaimToken>} stack
 * @param {ClaimToken} token
 */
function insertRanked(stack, token) {
  let index = 0;
  while (index < stack.length && !outranks(token, stack[index])) index += 1;
  stack.splice(index, 0, token);
}

const Claims = {
  /**
   * Token of the cue writing now, null outside playback (writes then go straight to channels)
   *
   * @type {?ClaimToken}
   */
  writer: null,
  /**
   * Start order counter
   *
   * @type {Number}
   */
  stamp: 0,
  /**
   * Slots written each tick: held, or fading to rest (reused array)
   *
   * @type {Array<Object>}
   */
  liveSlots: [],
  /**
   * Tokens covered entirely by Replace tokens, turned off once those have faded in
   *
   * @type {Set<ClaimToken>}
   */
  pendingOff: new Set(),
  /**
   * Tokens in force
   *
   * @type {Set<ClaimToken>}
   */
  tokens: new Set(),

  /**
   * A new token for a cue starting (or a chase item entering). It takes its families on its first
   * write
   *
   * @public
   * @param {Object} cue the cue (raw)
   * @param {Object} [options]
   * @param {Boolean} [options.layer] plays over what it covers (Layer mode, or a flash)
   * @param {Boolean} [options.temporary] a flash held down
   * @returns {ClaimToken}
   */
  take(cue, options = {}) {
    this.stamp += 1;
    // Raw: read through a reactive cue (cue.claim), it stays the same object for the stacks
    const token = markRaw(new ClaimToken(cue, this.stamp, options));
    this.tokens.add(token);
    return token;
  },

  /**
   * Starts a token's writes: Fixture.setChannel stores values in it until close()
   *
   * @public
   * @param {ClaimToken} token
   */
  open(token) {
    token.pass += 1;
    token.written = 0;
    token.added = false;
    this.writer = token;
  },

  /**
   * Stores a value written by the current writer (Fixture.setChannel, coarse channels; the fine
   * channel follows the fraction when the slot is written). A channel with no family is written
   * at once if the writer is its owner, outranks it, or it has none
   *
   * @public
   * @param {Object} channel
   * @param {Number} value
   */
  write(channel, value) {
    const w = this.writer;
    if (channel.isFine) return;
    const v = Number(value) || 0;
    if (!channel.slot) {
      const { owner } = channel;
      if (!owner || owner === w || !owner.alive || outranks(w, owner)) {
        channel.owner = w;
        writeChannel(channel, v);
      }
      return;
    }
    const entry = w.values.get(channel);
    if (entry) {
      entry.v = v;
      if (entry.pass !== w.pass) {
        entry.pass = w.pass;
        w.written += 1;
      }
    } else {
      w.values.set(channel, { v, pass: w.pass });
      w.written += 1;
      w.added = true;
    }
  },

  /**
   * Ends a token's writes: places it when what it drives changed (first pass included), and
   * aims its slots at what they hand back to when it starts fading out
   *
   * @public
   * @param {ClaimToken} token
   */
  close(token) {
    this.writer = null;
    if (!token.alive) return;
    if (!token.placed || token.added || token.written < token.values.size) this.place(token);
    if (token.releasing !== token.wasReleasing) {
      token.wasReleasing = token.releasing;
      if (token.releasing) this.handBack(token);
    }
  },

  /**
   * Puts a token in its group's family stacks and its slots, from what it wrote last pass
   * (values it no longer writes are dropped)
   *
   * @private
   * @param {ClaimToken} token
   */
  place(token) {
    const { values } = token;
    if (token.written < values.size) {
      values.forEach((entry, channel) => {
        if (entry.pass !== token.pass) values.delete(channel);
      });
    }
    token.added = false;
    const slots = new Set();
    values.forEach((entry, channel) => {
      if (channel.slot) slots.add(channel.slot);
    });
    const families = [false, false, false, false];
    slots.forEach((slot) => { families[slot.family] = true; });
    const affected = new Set();
    token.slots.forEach((slot) => {
      if (slots.has(slot)) return;
      removeFrom(slot.cands, token);
      affected.add(slot);
    });
    slots.forEach((slot) => {
      if (slot.cands.indexOf(token) < 0) slot.cands.push(token);
      affected.add(slot);
    });
    for (let f = 0; f < FAMILY_COUNT; f++) {
      const stack = token.stage[f];
      if (token.families[f] && !families[f]) removeFrom(stack, token);
      else if (!token.families[f] && families[f]) insertRanked(stack, token);
      if (token.families[f] || families[f]) this.stackSlots(stack, f, affected);
    }
    token.families = families;
    token.slots = [...slots];
    token.placed = true;
    this.refresh(affected, token.stage);
  },

  /**
   * Releases a token: its families go to what still plays, else rest
   *
   * @public
   * @param {?ClaimToken} token
   */
  release(token) {
    if (!token || !token.alive) return;
    token.alive = false;
    this.tokens.delete(token);
    this.pendingOff.delete(token);
    const affected = new Set(token.slots);
    for (let f = 0; f < FAMILY_COUNT; f++) {
      if (token.families[f]) {
        removeFrom(token.stage[f], token);
        this.stackSlots(token.stage[f], f, affected);
      }
    }
    token.slots.forEach((slot) => {
      removeFrom(slot.cands, token);
      // A slot fading from it fades on from where it is
      if (slot.under === token) {
        slot.under = null;
        for (let j = 0; j < slot.channels.length; j++) {
          slot.channels[j].fromValue = current(slot.channels[j]);
        }
      }
    });
    this.refresh(affected, token.stage);
    token.slots = [];
    this.updateHeld(token.cue);
  },

  /**
   * Forgets every token (a show is loaded or cleared)
   *
   * @public
   */
  reset() {
    this.tokens.forEach((token) => { token.alive = false; });
    this.tokens.clear();
    this.pendingOff.clear();
    this.liveSlots.forEach((slot) => { slot.live = false; });
    this.liveSlots.length = 0;
    this.writer = null;
  },

  /**
   * Writes the live slots, once the tick's cues ran; turns off the cues Replace tokens covered
   * entirely once those have faded in
   *
   * @public
   */
  settle() {
    if (this.pendingOff.size) this.turnOffReplaced();
    const slots = this.liveSlots;
    for (let i = slots.length - 1; i >= 0; i--) {
      const slot = slots[i];
      const { top, under, fader } = slot;
      const k = fader && fader.alive ? fader.factor : 1;
      const releasing = !!top && top.releasing;
      const { channels } = slot;
      for (let j = 0; j < channels.length; j++) {
        const channel = channels[j];
        const rest = channel.family === FAMILIES.INTENSITY ? channel.restValue : channel.fromValue;
        const target = top ? valueOf(top, channel) : rest;
        let value = target;
        if (k < 1) {
          let base = channel.fromValue;
          if (under) base = valueOf(under, channel);
          else if (releasing) base = rest;
          value = base + (target - base) * k;
        }
        writeChannel(channel, value);
      }
      if (!top && k >= 1) {
        // At rest: free for edits until a cue takes it again
        slot.live = false;
        slot.fader = null;
        slots[i] = slots[slots.length - 1];
        slots.pop();
      }
    }
  },

  /**
   * Adds the slots of a family stack's tokens, for that family, to a set
   *
   * @private
   * @param {Array<ClaimToken>} stack
   * @param {Number} family
   * @param {Set<Object>} affected
   */
  stackSlots(stack, family, affected) {
    stack.forEach((token) => {
      token.slots.forEach((slot) => {
        if (slot.family === family) affected.add(slot);
      });
    });
  },

  /**
   * Decides the slots an event touched, then the tiles' held families and the Replace check
   *
   * @private
   * @param {Set<Object>} affected
   * @param {Array<Array>} stage the group's family stacks
   */
  refresh(affected, stage) {
    const touched = new Set();
    affected.forEach((slot) => this.refreshSlot(slot, touched));
    touched.forEach((token) => this.updateHeld(token.cue));
    this.checkReplaced(stage);
  },

  /**
   * Decides which token a slot follows: among the tokens reaching it that hold the family in their
   * group, the newest
   *
   * @private
   * @param {Object} slot
   * @param {Set<ClaimToken>} touched tokens whose shown counts changed
   */
  refreshSlot(slot, touched) {
    const f = slot.family;
    const { cands, channels } = slot;
    let best = null;
    for (let i = 0; i < cands.length; i++) {
      const token = cands[i];
      if (token.stage[f][0] === token && (!best || outranks(token, best))) best = token;
    }
    const prev = slot.top;
    if (best === prev) return;
    // A holder that ended its fade-out landed on what it handed back to: keep that value (the
    // stage may not have been written at the fade's end yet)
    const handedBack = !!prev && !prev.alive && prev.releasing;
    // Taken from rest: the family goes back here at rest (Intensity) or on a reset (the others)
    const fromRest = !slot.live && slot.rested;
    for (let j = 0; j < channels.length; j++) {
      const channel = channels[j];
      const value = current(channel);
      if (fromRest) channel.restValue = value;
      if (!handedBack) channel.fromValue = value;
    }
    slot.top = best;
    if (prev) {
      prev.shown[f] -= 1;
      touched.add(prev);
    }
    if (best) {
      best.shown[f] += 1;
      touched.add(best);
      slot.rested = false;
      slot.keptFrom = null;
      slot.under = prev && prev.alive ? prev : null;
      slot.fader = best;
      if (best.releasing) this.retarget(slot, best);
    } else {
      // Its group's family went to a cue that doesn't reach this fixture: it rests along that
      // cue's fade-in
      const taker = prev && prev.alive ? prev.stage[f][0] : null;
      slot.under = null;
      slot.fader = taker && taker !== prev ? taker : null;
      // Intensity goes back to rest; the other families keep the value of the cue that left
      if (f === FAMILIES.INTENSITY) slot.rested = true;
      else if (prev) slot.keptFrom = prev.cue;
    }
    if (!slot.live) {
      slot.live = true;
      this.liveSlots.push(slot);
    }
  },

  /**
   * A token starts fading out: each slot it holds blends into what it hands back to (the next
   * holder reaching it, else rest)
   *
   * @private
   * @param {ClaimToken} token
   */
  handBack(token) {
    token.slots.forEach((slot) => {
      if (slot.top === token) this.retarget(slot, token);
    });
  },

  /**
   * Aims a slot held by a fading-out token at the token that takes it after
   *
   * @private
   * @param {Object} slot
   * @param {ClaimToken} token the fading-out holder
   */
  retarget(slot, token) {
    const f = slot.family;
    const { cands, channels } = slot;
    let best = null;
    for (let i = 0; i < cands.length; i++) {
      const candidate = cands[i];
      const stack = candidate.stage[f];
      const holder = stack[0] === token ? stack[1] : stack[0];
      if (candidate !== token && holder === candidate && (!best || outranks(candidate, best))) {
        best = candidate;
      }
    }
    slot.under = best;
    slot.fader = token;
    for (let j = 0; j < channels.length; j++) channels[j].fromValue = current(channels[j]);
  },

  /**
   * Queues the tokens of a group that Replace tokens cover entirely
   *
   * @private
   * @param {Array<Array>} stage the group's family stacks
   */
  checkReplaced(stage) {
    for (let f = 0; f < FAMILY_COUNT; f++) {
      const stack = stage[f];
      for (let i = 1; i < stack.length; i++) {
        if (this.isReplaced(stack[i])) this.pendingOff.add(stack[i]);
      }
    }
  },

  /**
   * Whether every family a token uses is held in its group by a Replace token started after it
   * (not a flash)
   *
   * @private
   * @param {ClaimToken} token
   * @returns {Boolean}
   */
  isReplaced(token) {
    let uses = false;
    for (let f = 0; f < FAMILY_COUNT; f++) {
      if (token.families[f]) {
        uses = true;
        const holder = token.stage[f][0];
        if (holder === token || holder.layer || holder.temporary
          || holder.stamp < token.stamp) return false;
      }
    }
    return uses;
  },

  /**
   * Turns off the queued tokens still covered entirely, once their replacers have faded in
   *
   * @private
   */
  turnOffReplaced() {
    this.pendingOff.forEach((token) => {
      if (!token.alive || !this.isReplaced(token)) {
        this.pendingOff.delete(token);
        return;
      }
      for (let f = 0; f < FAMILY_COUNT; f++) {
        const holder = token.stage[f][0];
        if (token.families[f] && (holder.factor < 1 || holder.releasing)) return;
      }
      this.pendingOff.delete(token);
      token.cue.letGo(token);
    });
  },

  /**
   * Sets a cue's held families (the tile's lit icons): those one of its tokens shows on a fixture
   *
   * @private
   * @param {Object} cue the cue (raw)
   */
  updateHeld(cue) {
    const held = cue && cue.heldFamilies;
    if (!held) return;
    const { claim, itemClaim } = cue;
    for (let f = 0; f < FAMILY_COUNT; f++) {
      held[f] = !!((claim && claim.alive && claim.shown[f] > 0)
        || (itemClaim && itemClaim.alive && itemClaim.shown[f] > 0));
    }
  },
};

export default Claims;
