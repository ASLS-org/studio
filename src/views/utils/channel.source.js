/**
 * Where a fixture channel's output comes from, for the universe view's channels widget: parked,
 * the programmer, the cue holding its family, the cue it was kept from, or rest.
 *
 * @module views/utils/channel.source
 */
import { FAMILY_KEYS } from '@/models/DMX/families';
import { FAMILY_LOOKS } from './cue.families';

/**
 * Colour of each source, for the channel's menu box and fader: parked, the programmer and
 * playback (a cue, or the value a cue left) each have theirs; a channel at rest keeps the
 * widget's own look (null)
 *
 * @constant {Object} SOURCE_COLORS
 */
export const SOURCE_COLORS = {
  parked: 'var(--accent-red)',
  programmer: 'var(--accent-violet)',
  cue: 'var(--accent-blue)',
  kept: 'var(--accent-blue)',
  rest: null,
};

/**
 * What drives a channel's output now
 *
 * @public
 * @param {Object} channel a fixture channel (models/DMX/channel.model.js)
 * @returns {{kind: String, text: String, color: String}} kind: 'parked', 'programmer', 'cue',
 * 'kept' or 'rest'
 */
export function channelSource(channel) {
  const source = (kind, text) => ({ kind, text, color: SOURCE_COLORS[kind] });
  if (!channel) return source('rest', 'Rest');
  if (channel.parked !== null) return source('parked', `Parked at ${channel.parked}`);
  if (channel.programmed !== null) return source('programmer', 'Programmer');
  const { slot } = channel;
  if (slot?.top?.cue) {
    const family = FAMILY_LOOKS[FAMILY_KEYS[slot.family]]?.label;
    return source('cue', `${family ? `${family} cue` : 'Cue'}: ${slot.top.cue.name}`);
  }
  if (slot?.keptFrom) return source('kept', `Kept from: ${slot.keptFrom.name}`);
  // A channel of no family follows its newest writer
  if (!slot && channel.owner?.cue && channel.owner.alive) {
    return source('cue', `Cue: ${channel.owner.cue.name}`);
  }
  return source('rest', 'Rest');
}
