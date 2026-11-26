/**
 * What a chase's items do to the stage, played by the playback rules (models/DMX/claims.js), for
 * the chase timeline: who holds each family when, which stretches of an item are covered (other
 * items hold all of its families), and where an item is turned off by a Replace item. Pure and
 * computed on edits only. It assumes each item covers the group's fixtures, ignores cues played
 * outside the chase, and starts from nothing at the chase's start.
 *
 * @module chase.outcome
 */
import { FAMILY_COUNT } from '@/models/DMX/families';
import { sharedContent } from './cue.previews';

/**
 * Whether a token outranks another: the one started last
 *
 * @param {Object} a
 * @param {Object} b
 * @returns {Boolean}
 */
const outranks = (a, b) => a.stamp > b.stamp;

/**
 * Adds a stretch to a list of stretches, merged with the last one when they touch and match
 *
 * @param {Array<Object>} list `{ from, to, ... }`
 * @param {Object} stretch
 * @param {Function} same whether two stretches are the same
 */
function addStretch(list, stretch, same) {
  const last = list[list.length - 1];
  if (last && last.to === stretch.from && same(last, stretch)) last.to = stretch.to;
  else list.push(stretch);
}

/**
 * The tokens a chase's items play, in start order (an item later in the chase's cue list starts
 * after one at the same tick, as playback runs them)
 *
 * @param {Object} chase
 * @returns {Array<Object>}
 */
function tokensOf(chase) {
  const tokens = [];
  (chase.cues || []).forEach((cueItemPool, index) => {
    const { cue } = cueItemPool;
    // The families it sets, from its cached content (one preview per family): reading them from
    // the cue itself walks every channel and made opening a chase block the main thread
    const { previews } = sharedContent(cue);
    const families = Array.from(
      { length: FAMILY_COUNT },
      (_, f) => previews.some((p) => p.family === f),
    );
    cueItemPool.items.forEach((item) => {
      const { lengthMS } = item;
      const fades = lengthMS > 0 && cue.itemFades
        ? cue.itemFades(lengthMS)
        : { fadeIn: 0, fadeOut: 0 };
      const toTicks = (ms) => (lengthMS > 0 ? (ms / lengthMS) * item.length : 0);
      const fadeOut = toTicks(fades.fadeOut);
      tokens.push({
        cue,
        item,
        index,
        families,
        layer: !!cue.relative,
        start: item.tick,
        end: item.tick + item.length,
        fadedIn: item.tick + toTicks(fades.fadeIn),
        // Faded out at its end: it hands back there; else it holds until displaced
        handsBack: fadeOut > 0,
        outStart: item.tick + item.length - fadeOut,
        stamp: 0,
        alive: false,
        offAt: null,
        offBy: null,
        covered: [],
      });
    });
  });
  return tokens.sort((a, b) => a.start - b.start || a.index - b.index);
}

/**
 * Whether a Replace token covers a token entirely (as claims.js decides): every family it uses is
 * held by a newer Replace token
 *
 * @param {Object} token
 * @param {Array<Array>} stacks
 * @returns {Boolean}
 */
function isReplaced(token, stacks) {
  let uses = false;
  for (let f = 0; f < FAMILY_COUNT; f++) {
    if (token.families[f]) {
      uses = true;
      const holder = stacks[f][0];
      if (holder === token || holder.layer || holder.stamp < token.stamp) return false;
    }
  }
  return uses;
}

/**
 * Plays a chase's items through
 *
 * @public
 * @param {Object} chase
 * @param {Number} end the chase's end, in ticks
 * @returns {Object} `{ families, items }`: per family index, the holders' stretches
 * (`{ from, to, cue }`); per item (a Map), `{ covered: [{ from, to, by }], offAt, offBy, cue }`
 */
export default function chaseOutcome(chase, end) {
  const tokens = tokensOf(chase);
  const stacks = Array.from({ length: FAMILY_COUNT }, () => []);
  const families = Array.from({ length: FAMILY_COUNT }, () => []);
  const remove = (token) => {
    token.alive = false;
    stacks.forEach((stack) => {
      const i = stack.indexOf(token);
      if (i > -1) stack.splice(i, 1);
    });
  };
  const times = new Set([0, end]);
  tokens.forEach((t) => [t.start, t.fadedIn, t.end, t.outStart].forEach((v) => {
    if (v >= 0 && v <= end) times.add(v);
  }));
  const ordered = [...times].sort((a, b) => a - b);
  // Start order, as Claims.stamp
  const clock = { stamp: 0 };
  for (let k = 0; k < ordered.length - 1; k++) {
    const t = ordered[k];
    const next = ordered[k + 1];
    // Items faded out at their end hand their families back
    tokens.forEach((token) => {
      if (token.alive && token.handsBack && token.end <= t) remove(token);
    });
    // Items starting: a new token, newest; the cue's previous item lets go
    tokens.forEach((token) => {
      if (token.start !== t || token.alive || token.offAt !== null) return;
      tokens.forEach((other) => {
        if (other !== token && other.alive && other.cue === token.cue) remove(other);
      });
      clock.stamp += 1;
      token.stamp = clock.stamp;
      token.alive = true;
      for (let f = 0; f < FAMILY_COUNT; f++) {
        if (token.families[f]) {
          stacks[f].push(token);
          stacks[f].sort((a, b) => (outranks(a, b) ? -1 : 1));
        }
      }
    });
    // Replace turns off what it covers entirely, once its covering holders have faded in (and
    // aren't fading out)
    tokens.forEach((token) => {
      if (!token.alive || !isReplaced(token, stacks)) return;
      const holders = [];
      for (let f = 0; f < FAMILY_COUNT; f++) {
        if (token.families[f]) holders.push(stacks[f][0]);
      }
      const ready = holders.every((h) => h.fadedIn <= t && !(h.handsBack && h.outStart <= t));
      if (!ready) return;
      token.offAt = t;
      token.offBy = [...new Set(holders.map((h) => h.cue.name))].join(', ');
      remove(token);
    });
    // Who holds each family until the next event, and which items show on none of theirs
    for (let f = 0; f < FAMILY_COUNT; f++) {
      const holder = stacks[f][0];
      if (holder) {
        addStretch(families[f], { from: t, to: next, cue: holder.cue }, (a, b) => a.cue === b.cue);
      }
    }
    tokens.forEach((token) => {
      if (!token.alive || t >= token.end) return;
      let shows = false;
      const by = new Set();
      for (let f = 0; f < FAMILY_COUNT; f++) {
        if (token.families[f]) {
          if (stacks[f][0] === token) shows = true;
          else by.add(stacks[f][0].cue.name);
        }
      }
      if (!shows && by.size) {
        addStretch(token.covered, {
          from: t, to: Math.min(next, token.end), by: [...by].join(', '),
        }, (a, b) => a.by === b.by);
      }
    });
  }
  const items = new Map();
  tokens.forEach((token) => {
    items.set(token.item, {
      cue: token.cue,
      covered: token.covered,
      offAt: token.offAt !== null && token.offAt < token.end ? token.offAt : null,
      offBy: token.offBy,
    });
  });
  return { families, items };
}
