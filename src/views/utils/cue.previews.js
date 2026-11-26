/**
 * What a cue's chip shows of its content: per family it sets, a picture (a colour swatch, a
 * gradient when fixtures or an effect's cycle have several colours; an intensity level; the first
 * fixture's aim; a beam cone as wide as its zoom; an effect's waves over one cycle, layered, or the
 * first fixture's pan/tilt path filling the picture),
 * and a value line saying it in words and numbers ("75%", "Red", "Pan 30° Tilt 45°",
 * "Zoom 40% · Gobo 3", "Dimmer · 1 bar"). Pure: called from computeds, so it runs again only when
 * the cue is edited (playback writes bypass Vue).
 *
 * @module cue.previews
 */
import { computed, effectScope, reactive } from 'vue';
import { FAMILIES, FAMILY_KEYS, familyIndex } from '@/models/DMX/families';
import { toRaw } from '@/models/utils/reactivity';
import { rangeLabel } from './channel.presets';
import {
  matchFixtures, mixColour, rangesOf, shapeKey, valueAt, viewAxis,
} from './effect.scope';

/**
 * Samples over an effect's pass
 *
 * @constant {Number} SAMPLES
 */
const SAMPLES = 16;

/**
 * Colours shown at most in a swatch
 *
 * @constant {Number} MAX_COLOURS
 */
const MAX_COLOURS = 6;

/**
 * Highest DMX value
 *
 * @constant {Number} MAX_DMX
 */
const MAX_DMX = 255;

/**
 * The margin a pan/tilt path keeps from the picture's edges, as a share of its size
 *
 * @constant {Number} PATH_MARGIN
 */
const PATH_MARGIN = 0.1;

/**
 * One cycle of a wave, in pass progress: an effect's waves are drawn over one cycle whatever their
 * frequency (cycles per pass), so a fast wave reads as well as a slow one
 *
 * @param {Object} wave FXChannel
 * @returns {Number}
 */
const cycleOf = (wave) => 1 / (Number(wave.frequency) > 0 ? Number(wave.frequency) : 1);

/**
 * Colour names by hue (degrees, upper bound): the name of the first bucket a hue is under
 *
 * @constant {Array<Array>} HUE_NAMES
 */
const HUE_NAMES = [
  [15, 'Red'], [35, 'Orange'], [50, 'Amber'], [70, 'Yellow'], [160, 'Green'], [200, 'Cyan'],
  [250, 'Blue'], [280, 'Purple'], [320, 'Magenta'], [345, 'Pink'], [360, 'Red'],
];

/**
 * Beam attributes drawn as a cone's width
 *
 * @constant {RegExp} ZOOM
 */
const ZOOM = /Zoom/;

/**
 * Intensity attributes read as the level
 *
 * @constant {RegExp} DIMMER
 */
const DIMMER = /^Dimmer|^Intensity/;

/**
 * CSS colour of an RGB triple
 *
 * @param {Array<Number>} rgb
 * @returns {String}
 */
const css = (rgb) => `rgb(${rgb.map((v) => Math.round(v)).join(',')})`;

/**
 * A swatch's background: one colour, or a gradient through several
 *
 * @param {Array<Array<Number>>} colours RGB triples
 * @returns {String}
 */
function swatch(colours) {
  if (colours.length === 1) return css(colours[0]);
  return `linear-gradient(90deg, ${colours.map(css).join(', ')})`;
}

/**
 * Up to MAX_COLOURS of the colours, evenly picked, in order
 *
 * @param {Array<Array<Number>>} colours
 * @returns {Array<Array<Number>>}
 */
function pickColours(colours) {
  if (colours.length <= MAX_COLOURS) return colours;
  const step = colours.length / MAX_COLOURS;
  return Array.from({ length: MAX_COLOURS }, (_, i) => colours[Math.floor(i * step)]);
}

/**
 * An SVG path through points in a 100 × 100 box (x and y from 0 to 1, y up)
 *
 * @param {Array<Array<Number>>} points
 * @returns {String}
 */
function pathOf(points) {
  return points
    .map(([x, y], i) => `${i ? 'L' : 'M'}${(x * 100).toFixed(1)},${(100 - y * 100).toFixed(1)}`)
    .join(' ');
}

/**
 * A scene's active coarse channels with a family, per fixture: `{ fixture, fixtureValue,
 * entries: [{ channel, value }] }`, fixtures with none left out. The one pass that reads the scene
 * reactively (a computed calling it follows
 * every edit); the rest reads the raw fixture values
 *
 * @param {Object} scene
 * @returns {Array<Object>}
 */
function sceneEntries(scene) {
  const items = [];
  (scene.fixtureValues || []).forEach((fixtureValue) => {
    const { fixture } = fixtureValue;
    const channels = fixture.channels || [];
    const entries = [];
    fixtureValue.channels.forEach((entry) => {
      if (!entry.active) return;
      const channel = entry.isFine ? null : channels[entry.id - 1];
      if (!channel || channel.family < 0) return;
      entries.push({ channel, value: Number(entry.value) || 0 });
    });
    if (entries.length) {
      items.push({
        fixture, fixtureValue: toRaw(fixtureValue), entries,
      });
    }
  });
  return items;
}

/**
 * Average of numbers
 *
 * @param {Array<Number>} values
 * @returns {Number}
 */
function average(values) {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * A fixture's intensity level in a scene (0-1): its dimmers, else its intensity channels
 *
 * @param {Array<Object>} entries the fixture's active entries
 * @returns {?Number} null when it sets no intensity
 */
function levelOf(entries) {
  const intensity = entries.filter((e) => e.channel.family === FAMILIES.INTENSITY);
  if (!intensity.length) return null;
  const dimmers = intensity.filter((e) => DIMMER.test(e.channel.attribute || ''));
  return average((dimmers.length ? dimmers : intensity).map((e) => e.value)) / MAX_DMX;
}

/**
 * A fixture's aim in a scene, 0-1 per axis (fine bytes included)
 *
 * @param {Object} fixtureValue
 * @returns {Array<Number>} [pan, tilt]
 */
function aimOf(fixtureValue) {
  const {
    pan, panFine, tilt, tiltFine,
  } = fixtureValue.getPanTilt();
  return [(pan + panFine / MAX_DMX) / MAX_DMX, (tilt + tiltFine / MAX_DMX) / MAX_DMX];
}

/**
 * Previews of a scene, per family
 *
 * @param {Array<Object>} items the scene's entries per fixture (sceneEntries)
 * @returns {Array<Object>}
 */
function scenePreviews(items) {
  const colours = [];
  const levels = [];
  const dots = [];
  let beam = null;
  items.forEach(({ fixtureValue, entries }) => {
    const families = [false, false, false, false];
    entries.forEach((e) => { families[e.channel.family] = true; });
    if (families[FAMILIES.COLOUR]) colours.push(fixtureValue.getColor());
    if (families[FAMILIES.INTENSITY]) levels.push(levelOf(entries));
    // The first fixture's aim only: several dots read as a smudge
    if (families[FAMILIES.POSITION] && !dots.length) {
      const [x, y] = aimOf(fixtureValue);
      dots.push({ x, y });
    }
    if (families[FAMILIES.BEAM] && beam === null) {
      // The cone's width: its zoom, else half open
      const zoom = entries.find((e) => ZOOM.test(e.channel.attribute || ''));
      beam = zoom ? zoom.value / MAX_DMX : 0.5;
    }
  });
  const previews = [];
  if (levels.length) {
    previews.push({ family: FAMILIES.INTENSITY, kind: 'level', level: average(levels) });
  }
  if (colours.length) {
    previews.push({ family: FAMILIES.COLOUR, kind: 'swatch', background: swatch(pickColours(colours)) });
  }
  if (dots.length) previews.push({ family: FAMILIES.POSITION, kind: 'dots', dots });
  if (beam !== null) {
    // A cone from the bottom centre, its top 15% to 100% wide
    const half = (15 + beam * 85) / 2;
    const path = `M50,100 L${(50 - half).toFixed(1)},0 L${(50 + half).toFixed(1)},0 Z`;
    previews.push({ family: FAMILIES.BEAM, kind: 'cone', path });
  }
  return previews;
}

/**
 * The family an effect channel drives (from its first fixture's targets)
 *
 * @param {Object} wave FXChannel
 * @returns {Number} family index, or -1
 */
function waveFamily(wave) {
  const entry = wave.fixtures.find((f) => f.targets && f.targets.length);
  if (!entry) return -1;
  const channels = entry.handle.channels || [];
  const target = entry.targets[0];
  const index = target.direct.length ? target.direct[0] : target.inverted[0];
  const channel = channels[index];
  return channel ? channel.family : -1;
}

/**
 * An effect's waves, raw for sampling (it reads wave fields many times), each read once
 * reactively first (shapeKey) so a computed calling this follows every edit
 *
 * @param {Object} effect
 * @returns {Array<Object>} raw FXChannels
 */
function trackedWaves(effect) {
  return (effect.channels || []).map((wave) => {
    shapeKey(wave);
    return toRaw(wave);
  });
}

/**
 * Points of a pan/tilt path scaled to fill a 1 × 1 box (the same scale on both axes, centred, a
 * margin kept), so a small shape reads as well as a wide one
 *
 * @param {Array<Array<Number>>} points `[pan, tilt]`
 * @returns {Array<Array<Number>>}
 */
function filling(points) {
  const pans = points.map(([p]) => p);
  const tilts = points.map(([, t]) => t);
  const [minP, maxP, minT, maxT] = [Math.min(...pans), Math.max(...pans),
    Math.min(...tilts), Math.max(...tilts)];
  const size = Math.max(maxP - minP, maxT - minT);
  if (!(size > 0)) return points.map(() => [0.5, 0.5]);
  const scale = (1 - 2 * PATH_MARGIN) / size;
  return points.map(([p, t]) => [
    0.5 + (p - (minP + maxP) / 2) * scale,
    0.5 + (t - (minT + maxT) / 2) * scale,
  ]);
}

/**
 * Previews of an effect, per family: its colours over one cycle, its waves over one cycle each
 * (layered), the first fixture's pan/tilt path over one cycle of its slower axis, filling the
 * picture
 *
 * @param {Array<Object>} waves its raw waves (trackedWaves)
 * @returns {Array<Object>}
 */
function effectPreviews(waves) {
  const byFamily = [[], [], [], []];
  waves.forEach((wave) => {
    const family = waveFamily(wave);
    if (family > -1) byFamily[family].push(wave);
  });
  const previews = [];
  const waveLine = (wave) => {
    const fixture = matchFixtures([wave])[0];
    const entry = fixture ? fixture.entries[0] : null;
    const cycle = cycleOf(wave);
    const points = [];
    for (let i = 0; i <= SAMPLES; i++) {
      points.push([i / SAMPLES, valueAt(wave, entry, (i / SAMPLES) * cycle) / MAX_DMX]);
    }
    return pathOf(points);
  };
  const wavesOf = (family) => ({ family, kind: 'wave', paths: byFamily[family].map(waveLine) });
  if (byFamily[FAMILIES.INTENSITY].length) previews.push(wavesOf(FAMILIES.INTENSITY));
  if (byFamily[FAMILIES.COLOUR].length) {
    const colourWaves = byFamily[FAMILIES.COLOUR];
    const fixture = matchFixtures(colourWaves)[0];
    const cycle = Math.max(...colourWaves.map(cycleOf));
    const colours = [];
    for (let i = 0; i < SAMPLES; i++) {
      const values = {};
      colourWaves.forEach((wave, k) => {
        const entry = fixture ? fixture.entries[k] : null;
        values[wave.type] = valueAt(wave, entry, (i / SAMPLES) * cycle);
      });
      colours.push(mixColour(values));
    }
    previews.push({ family: FAMILIES.COLOUR, kind: 'swatch', background: swatch(pickColours(colours)) });
  }
  if (byFamily[FAMILIES.POSITION].length) {
    const positionWaves = byFamily[FAMILIES.POSITION];
    const pan = positionWaves.find((w) => w.type === 'Pan');
    const tilt = positionWaves.find((w) => w.type === 'Tilt');
    const fixture = pan && tilt ? matchFixtures([pan, tilt])[0] : null;
    if (fixture) {
      const cycle = Math.max(cycleOf(pan), cycleOf(tilt));
      const points = [];
      for (let i = 0; i <= SAMPLES * 2; i++) {
        const t = (i / (SAMPLES * 2)) * cycle;
        points.push([valueAt(pan, fixture.entries[0], t), valueAt(tilt, fixture.entries[1], t)]);
      }
      previews.push({ family: FAMILIES.POSITION, kind: 'path', path: pathOf(filling(points)) });
    } else {
      previews.push(wavesOf(FAMILIES.POSITION));
    }
  }
  if (byFamily[FAMILIES.BEAM].length) previews.push(wavesOf(FAMILIES.BEAM));
  return previews;
}

/**
 * Name of a colour (RGB 0-255): White for a pale one, Off for a dark one, else its hue's name
 *
 * @param {Array<Number>} rgb
 * @returns {String}
 */
export function colourName(rgb) {
  const [r, g, b] = rgb.map((v) => v / MAX_DMX);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max < 0.1) return 'Off';
  if ((max - min) / max < 0.2) return 'White';
  let hue;
  if (max === r) hue = ((g - b) / (max - min) + 6) % 6;
  else if (max === g) hue = (b - r) / (max - min) + 2;
  else hue = (r - g) / (max - min) + 4;
  const degrees = hue * 60;
  return HUE_NAMES.find(([bound]) => degrees < bound)[1];
}

/**
 * A level in %, rounded
 *
 * @param {Number} level 0-1
 * @returns {Number}
 */
const percent = (level) => Math.round(level * 100);

/**
 * Value line of a scene, for one family
 *
 * @param {Array<Object>} items the scene's entries per fixture (sceneEntries)
 * @param {Number} family family index
 * @returns {String}
 */
function sceneSummary(items, family) {
  const fixtures = items
    .map((item) => ({
      ...item,
      entries: item.entries.filter((e) => e.channel.family === family),
    }))
    .filter((item) => item.entries.length);
  if (!fixtures.length) return 'Empty';
  if (family === FAMILIES.INTENSITY) {
    const levels = fixtures.map((item) => percent(levelOf(item.entries)));
    const low = Math.min(...levels);
    const high = Math.max(...levels);
    return low === high ? `${low}%` : `${low}–${high}%`;
  }
  if (family === FAMILIES.COLOUR) {
    const names = new Set(fixtures.map((item) => colourName(item.fixtureValue.getColor())));
    return names.size === 1 ? [...names][0] : `${names.size} colours`;
  }
  if (family === FAMILIES.POSITION) {
    const ranges = rangesOf(fixtures.map((item) => item.fixture));
    const pan = viewAxis(ranges.pan);
    const tilt = viewAxis(ranges.tilt);
    const aims = new Set(fixtures.map((item) => {
      const [x, y] = aimOf(item.fixtureValue);
      return `Pan ${Math.round(pan.toView(x * MAX_DMX))}° Tilt ${Math.round(tilt.toView(y * MAX_DMX))}°`;
    }));
    return aims.size === 1 ? [...aims][0] : `${aims.size} aims`;
  }
  // Beam: the first fixture's functions, a one-range channel in %, the others by range name
  return fixtures[0].entries.slice(0, 3).map(({ channel, value }) => {
    const capabilities = channel.capabilities || [];
    const name = channel.kind || channel.type;
    if (capabilities.length > 1) return rangeLabel(capabilities, value) || name;
    return `${name} ${percent(value / MAX_DMX)}%`;
  }).join(' · ');
}

/**
 * Value line of an effect: the channels it moves (two at most) and its length in bars
 *
 * @param {Object} effect
 * @param {Array<Object>} waves its raw waves (trackedWaves)
 * @returns {String}
 */
function effectSummary(effect, waves) {
  const kinds = [];
  waves.forEach((wave) => {
    const family = waveFamily(wave);
    let kind = wave.type;
    if (family === FAMILIES.COLOUR) kind = 'Colour';
    else if (family === FAMILIES.POSITION) kind = 'Pan/Tilt';
    if (!kinds.includes(kind)) kinds.push(kind);
  });
  if (!kinds.length) return 'Empty';
  const moved = kinds.length > 2 ? `${kinds.slice(0, 2).join(', ')} +${kinds.length - 2}` : kinds.join(', ');
  const bars = Number(effect.duration) || 0;
  return `${moved} · ${bars} ${bars === 1 ? 'bar' : 'bars'}`;
}

/**
 * Previews in family order, keyed by family
 *
 * @param {Array<Object>} previews
 * @returns {Array<Object>}
 */
function ordered(previews) {
  return previews
    .sort((a, b) => a.family - b.family)
    .map((preview) => ({ ...preview, key: FAMILY_KEYS[preview.family] }));
}

/**
 * What a cue's chip shows, in one pass over its content: one preview per family it sets, in
 * family order (`{ family, key, kind: 'swatch'|'level'|'dots'|'cone'|'wave'|'path', background,
 * level, dots, path, paths }`), and its value line for its family
 *
 * @param {Object} cue scene or effect
 * @returns {Object} `{ previews, summary }`
 */
export default function cueContent(cue) {
  const family = familyIndex(cue.family);
  if (cue.type) {
    const waves = trackedWaves(cue);
    return {
      previews: ordered(effectPreviews(waves)),
      summary: family < 0 ? '' : effectSummary(cue, waves),
    };
  }
  const items = sceneEntries(cue);
  return {
    previews: ordered(scenePreviews(items)),
    summary: family < 0 ? '' : sceneSummary(items, family),
  };
}

/**
 * Each cue's content, computed once and kept up to date by Vue (recomputed on its edits only),
 * by raw cue: the cue pool and the chase timeline share it, so opening a panel computes nothing
 *
 * @constant {WeakMap<Object, Object>} CONTENTS
 */
const CONTENTS = new WeakMap();

/**
 * The scope the shared computeds live in (detached: no component owns them)
 *
 * @constant {Object} SCOPE
 */
const SCOPE = effectScope(true);

/**
 * A cue's content (see cueContent), shared and cached until the cue is edited
 *
 * @public
 * @param {Object} cue scene or effect (reactive or raw)
 * @returns {Object} `{ previews, summary }`
 */
export function sharedContent(cue) {
  const raw = toRaw(cue);
  let content = CONTENTS.get(raw);
  if (!content) {
    // Read through the cue's reactive proxy, so its edits are followed
    const proxy = reactive(raw);
    content = SCOPE.run(() => computed(() => cueContent(proxy)));
    CONTENTS.set(raw, content);
  }
  return content.value;
}
