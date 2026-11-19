/**
 * Maths for the effect scopes: an effect's waves sampled over one loop and matched per fixture,
 * the pan/tilt view in degrees or DMX, and the shapes, spreads and colour presets. Pure functions
 * on raw `FXChannel`s (pass `toRaw` ones when sampling: it reads wave fields many times); the
 * `apply*` functions write through the waves they are given (reactive ones, so views follow).
 *
 * @module views/utils/effect.scope
 */

/**
 * Samples per loop drawn by a scope
 *
 * @constant {Number}
 */
export const SCOPE_SAMPLES = 96;

/**
 * Colour channel types a Colour Scope mixes
 *
 * @constant {Array<String>}
 */
export const COLOUR_TYPES = ['Red', 'Green', 'Blue', 'Cyan', 'Magenta', 'Yellow', 'White', 'Amber'];

/**
 * Pan and tilt ranges (degrees) when a fixture's profile gives none
 *
 * @constant {Object}
 */
export const DEFAULT_RANGES = { pan: 540, tilt: 270 };

/**
 * Clamps a value
 *
 * @public
 * @param {Number} value
 * @param {Number} min
 * @param {Number} max
 * @returns {Number}
 */
export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Wraps degrees to 0-360, rounded
 *
 * @public
 * @param {Number} degrees
 * @returns {Number}
 */
export function wrap(degrees) {
  return Math.round(((degrees % 360) + 360) % 360) % 360;
}

/**
 * Value every item shares, or null when they differ
 *
 * @public
 * @param {Array<Number>} values
 * @returns {?Number}
 */
export function sharedValue(values) {
  if (!values.length) return null;
  return values.every((value) => Math.abs(value - values[0]) < 1e-6) ? values[0] : null;
}

/**
 * The effect's wave of a channel type, or null
 *
 * @public
 * @param {Object} effect FX cue
 * @param {String} type channel type (e.g. `Pan`)
 * @returns {?Object} FXChannel
 */
export function waveOf(effect, type) {
  return (effect?.channels || []).find((channel) => channel.type === type) || null;
}

/**
 * Index of an option by name in a wave's option list ('waveOptions' or 'directionOptions')
 *
 * @param {Object} wave FXChannel
 * @param {String} list option list getter name
 * @param {String} name option name (e.g. 'SINE', 'SYM')
 * @returns {Number}
 */
function optionIndex(wave, list, name) {
  return Math.max(0, (wave[list] || []).indexOf(name));
}

/**
 * Fixtures of several waves matched by fixture id, in the first wave's order: per fixture, its
 * entry (`FXFixture`) in each wave, null where a wave doesn't hold it
 *
 * @public
 * @param {Array<Object>} waves FXChannels (the first one sets the order)
 * @returns {Array<Object>} `{ id, name, handle, active, entries: [FXFixture|null] }`
 */
export function matchFixtures(waves) {
  if (!waves.length) return [];
  const maps = waves.map((wave) => new Map(wave.fixtures.map((f) => [f.handle.id, f])));
  return waves[0].fixtures.map((first) => {
    const entries = maps.map((map) => map.get(first.handle.id) || null);
    return {
      id: first.handle.id,
      name: first.handle.name,
      handle: first.handle,
      active: entries.some((entry) => entry && entry.active),
      entries,
    };
  });
}

/**
 * A wave's value at loop progress `t` for a fixture's entry (the wave's low end when it doesn't
 * hold the fixture or the fixture is off), flipped for a mirrored fixture
 *
 * @public
 * @param {Object} wave FXChannel
 * @param {?Object} entry FXFixture of that wave
 * @param {Number} t loop progress, 0-1
 * @returns {Number} DMX 0-255
 */
export function valueAt(wave, entry, t) {
  if (!entry || !entry.active) return Math.min(wave.min, wave.max);
  const raw = wave.getValue(t, entry.phase);
  // A mirrored fixture plays the wave flipped, as the engine does
  const value = entry.mirrored ? wave.min + wave.max - raw : raw;
  return Number.isFinite(value) ? clamp(value, 0, 255) : 0;
}

/**
 * RGB of colour channel values: Red/Green/Blue, minus Cyan/Magenta/Yellow, plus White (all
 * three) and Amber (red and three quarters of green)
 *
 * @public
 * @param {Object} values channel type → DMX 0-255 (a missing type counts as 0)
 * @returns {Array<Number>} `[r, g, b]`, 0-255
 */
export function mixColour(values) {
  const v = (type) => values[type] || 0;
  const white = v('White');
  const amber = v('Amber');
  const limit = (x) => Math.round(clamp(x, 0, 255));
  return [
    limit(v('Red') - v('Cyan') + white + amber),
    limit(v('Green') - v('Magenta') + white + amber * 0.75),
    limit(v('Blue') - v('Yellow') + white),
  ];
}

/**
 * Low and high value of a wave, whichever of Min and Max holds them
 *
 * @public
 * @param {Object} wave FXChannel (or `{ min, max }`)
 * @returns {Object} `{ low, high, lowKey, highKey }` (keys: 'min' or 'max')
 */
export function waveSpan(wave) {
  const inverted = wave.min > wave.max;
  return {
    low: inverted ? wave.max : wave.min,
    high: inverted ? wave.min : wave.max,
    lowKey: inverted ? 'max' : 'min',
    highKey: inverted ? 'min' : 'max',
  };
}

/**
 * Sets a wave's span from a centre and a size (DMX), within 0-255
 *
 * @public
 * @param {Object} wave FXChannel
 * @param {Number} centre
 * @param {Number} size
 */
export function setSpan(wave, centre, size) {
  const width = clamp(Math.round(size), 0, 255);
  const low = clamp(Math.round(centre - width / 2), 0, 255 - width);
  const span = waveSpan(wave);
  if (wave[span.lowKey] !== low) wave[span.lowKey] = low;
  if (wave[span.highKey] !== low + width) wave[span.highKey] = low + width;
}

/**
 * Wave fields that change how a scope draws a wave, as one string
 *
 * @public
 * @param {?Object} wave FXChannel (read reactively, so a change redraws)
 * @returns {String}
 */
export function shapeKey(wave) {
  if (!wave) return '';
  const fixtures = wave.fixtures.map((f) => `${f.handle.id}:${f.active ? 1 : 0}`).join(',');
  return [wave.waveform, wave.min, wave.max, wave.frequency, wave.phase, wave.width,
    wave.direction, wave.fixturePhaseStart, wave.fixturePhaseStop, wave.cellPhase, wave.mirror,
    fixtures]
    .join('|');
}

/* ------------------------------------------------------------------ Angles and view */

/**
 * Angle range (degrees) of a fixture's Pan or Tilt channel, from its profile's capabilities
 *
 * @public
 * @param {Object} fixture Fixture
 * @param {String} kind 'Pan' or 'Tilt'
 * @returns {?Number} null when the profile gives no angles
 */
export function angleRange(fixture, kind) {
  const channels = fixture?.mode?.channels || [];
  const channel = channels.find((c) => !c.isFine && (c.attribute === kind || c.type === kind));
  if (!channel) return null;
  const key = kind.toLowerCase();
  let min = Infinity;
  let max = -Infinity;
  (channel.capabilities || []).forEach((capability) => {
    const entity = capability.entities && capability.entities[key];
    if (!entity) return;
    [entity.start, entity.end, entity.value].forEach((v) => {
      if (Number.isFinite(v)) {
        min = Math.min(min, v);
        max = Math.max(max, v);
      }
    });
  });
  return max > min ? max - min : null;
}

/**
 * Pan and tilt ranges (degrees) of the first fixture of a list that has them
 *
 * @public
 * @param {Array<Object>} fixtures Fixtures
 * @returns {Object} `{ pan, tilt, known }` (`known`: false when the defaults were used)
 */
export function rangesOf(fixtures) {
  for (let i = 0; i < fixtures.length; i++) {
    const pan = angleRange(fixtures[i], 'Pan');
    const tilt = angleRange(fixtures[i], 'Tilt');
    if (pan || tilt) {
      return { pan: pan || DEFAULT_RANGES.pan, tilt: tilt || DEFAULT_RANGES.tilt, known: true };
    }
  }
  return { ...DEFAULT_RANGES, known: false };
}

/**
 * One axis of the pan/tilt view: DMX to view units (degrees centred on 0, or DMX)
 *
 * @public
 * @param {?Number} range degrees, or null for the DMX view
 * @returns {Object} `{ toView(dmx), toDmx(view), perDmx, min, max }`
 */
export function viewAxis(range) {
  if (!range) {
    return {
      toView: (v) => v, toDmx: (x) => x, perDmx: 1, min: 0, max: 255,
    };
  }
  const perDmx = range / 255;
  return {
    toView: (v) => v * perDmx - range / 2,
    toDmx: (x) => (x + range / 2) / perDmx,
    perDmx,
    min: -range / 2,
    max: range / 2,
  };
}

/**
 * Smallest grid step that draws at most 12 lines across a view
 *
 * @public
 * @param {Number} size view width (view units)
 * @param {Boolean} degrees whether the view is in degrees
 * @returns {Number}
 */
export function gridStep(size, degrees) {
  const steps = degrees ? [1, 2, 5, 10, 15, 30, 45, 90] : [2, 4, 8, 16, 32];
  return steps.find((step) => size / step <= 12) || steps[steps.length - 1] * 2;
}

/**
 * Square view: the path's box with a margin (Fit), or the whole field (Full), kept inside it
 *
 * @public
 * @param {Object} box `{ left, right, bottom, top }` (view units)
 * @param {Object} field `{ x: [min, max], y: [min, max] }` (view units)
 * @param {Boolean} full
 * @returns {Object} `{ x, y, size }` (x, y: low corner)
 */
export function fitView(box, field, full) {
  const fieldSize = Math.max(field.x[1] - field.x[0], field.y[1] - field.y[0]);
  const fieldCentre = [(field.x[0] + field.x[1]) / 2, (field.y[0] + field.y[1]) / 2];
  if (full) {
    const half = fieldSize / 2;
    return { x: fieldCentre[0] - half, y: fieldCentre[1] - half, size: fieldSize };
  }
  const span = Math.max(box.right - box.left, box.top - box.bottom);
  const size = Math.min(fieldSize, Math.max(fieldSize / 8, span * 1.5));
  const keep = (centre, axis) => {
    const [min, max] = field[axis];
    if (max - min <= size) return (min + max) / 2 - size / 2;
    return clamp(centre - size / 2, min, max - size);
  };
  return {
    x: keep((box.left + box.right) / 2, 'x'),
    y: keep((box.bottom + box.top) / 2, 'y'),
    size,
  };
}

/* ------------------------------------------------------------------ Paths */

/**
 * A fixture's pan/tilt path over one loop (DMX)
 *
 * @public
 * @param {Object} pan Pan FXChannel
 * @param {Object} tilt Tilt FXChannel
 * @param {Array<?Object>} entries the fixture's FXFixture in each
 * @param {Number} [samples=SCOPE_SAMPLES]
 * @returns {Array<Array<Number>>} `[pan, tilt]` per sample, the first repeated at the end
 */
export function panTiltPath(pan, tilt, entries, samples = SCOPE_SAMPLES) {
  const points = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    points.push([valueAt(pan, entries[0], t), valueAt(tilt, entries[1], t)]);
  }
  return points;
}

/**
 * Loop progress (0-1) of the path point nearest a point
 *
 * @public
 * @param {Array<Array<Number>>} points a path from `panTiltPath`
 * @param {Number} x pan
 * @param {Number} y tilt
 * @returns {Number}
 */
export function nearestTime(points, x, y) {
  let best = 0;
  let distance = Infinity;
  points.forEach(([px, py], i) => {
    const d = (px - x) ** 2 + (py - y) ** 2;
    if (d < distance) {
      distance = d;
      best = i;
    }
  });
  return best / (points.length - 1);
}

/**
 * Whether two sampled paths draw the same shape, one ahead of the other in time: the second's
 * points, shifted by the sample nearest its start, all lie close to the first's
 *
 * @public
 * @param {Array<Array<Number>>} a a path from `panTiltPath`
 * @param {Array<Array<Number>>} b another, sampled the same way
 * @returns {Boolean}
 */
export function samePath(a, b) {
  const n = a.length - 1;
  if (n < 1 || b.length - 1 !== n) return false;
  // Tolerance: half the longest step between two samples, plus a rounding margin
  let longest = 0;
  for (let i = 0; i < n; i++) {
    longest = Math.max(longest, Math.hypot(a[i + 1][0] - a[i][0], a[i + 1][1] - a[i][1]));
  }
  const tolerance = longest / 2 + 0.5;
  const shift = Math.round(nearestTime(a, b[0][0], b[0][1]) * n) % n;
  for (let j = 0; j < n; j++) {
    const p = b[j];
    const k = (shift + j) % n;
    const near = [k, (k + 1) % n, (k - 1 + n) % n]
      .map((i) => Math.hypot(p[0] - a[i][0], p[1] - a[i][1]));
    if (Math.min(...near) > tolerance) return false;
  }
  return true;
}

/* ------------------------------------------------------------------ Speed */

/**
 * Greatest common divisor of whole numbers
 *
 * @param {Number} a
 * @param {Number} b
 * @returns {Number}
 */
function gcd(a, b) {
  return b ? gcd(b, a % b) : a;
}

/**
 * Greatest common divisor of whole numbers (1 for none)
 *
 * @public
 * @param {Array<Number>} numbers
 * @returns {Number}
 */
export function gcdOf(numbers) {
  const whole = numbers.map((n) => Math.max(1, Math.round(n)));
  return whole.reduce((a, b) => gcd(a, b), whole[0] || 1) || 1;
}

/**
 * The Freq multiplier every wave of a colour preset shares (Strobe: 8), so the speed shown is the
 * preset's own speed, not its multiplier
 *
 * @public
 * @param {?Object} preset a `COLOUR_PRESETS` item
 * @returns {Number}
 */
export function presetUnit(preset) {
  if (!preset) return 1;
  const settings = preset.waves({ a: { r: 0, g: 0, b: 0 }, b: { r: 0, g: 0, b: 0 }, count: 1 });
  return gcdOf(Object.values(settings).map((s) => s.ratio));
}

/**
 * Speed of waves: how many times their combined pattern repeats per loop (the greatest common
 * divisor of their Freq)
 *
 * @public
 * @param {Array<Object>} waves FXChannels
 * @returns {Number} 1 or more
 */
export function speedOf(waves) {
  const freqs = waves.map((wave) => Math.max(1, Math.round(Number(wave.frequency) || 1)));
  return freqs.reduce((a, b) => gcd(a, b), freqs[0] || 1) || 1;
}

/**
 * Sets the speed of waves, scaling every Freq together (each stays 1-100)
 *
 * @public
 * @param {Array<Object>} waves FXChannels
 * @param {Number} speed
 */
export function setSpeed(waves, speed) {
  const current = speedOf(waves);
  const target = Math.max(1, Math.round(speed));
  const ratios = waves
    .map((wave) => Math.max(1, Math.round(Number(wave.frequency) || 1)) / current);
  const top = Math.max(...ratios);
  const allowed = Math.min(target, Math.floor(100 / top));
  waves.forEach((wave, i) => {
    const frequency = ratios[i] * allowed;
    if (wave.frequency !== frequency) wave.frequency = frequency;
  });
}

/* ------------------------------------------------------------------ Spreads */

/**
 * How the fixtures are spread over a pattern: direction and Phase start/stop, and the channel
 * type mirrored on the second half of the fixtures (`mirror`)
 *
 * @constant {Array<Object>}
 */
export const SPREADS = [
  {
    name: 'Together', direction: 'LTR', start: 0, stop: 0,
  },
  {
    name: 'Wave', direction: 'LTR', start: 0, stop: 360,
  },
  {
    name: 'Reverse', direction: 'RTL', start: 0, stop: 360,
  },
  {
    // Both ends towards the middle, the second half mirrored left to right (its pan flipped)
    name: 'Mirror', direction: 'SYM', start: 0, stop: 360, mirror: 'Pan',
  },
  {
    name: 'Half', direction: 'LTR', start: 0, stop: 180,
  },
  {
    name: 'Bounce', direction: 'BOUNCELRT', start: 0, stop: 360,
  },
];

/**
 * Spreads waves' fixtures; each wave's offsets scaled by its Freq over the first wave's, so
 * waves at different speeds keep their fixtures on the same place of the pattern
 *
 * @public
 * @param {Array<Object>} waves FXChannels (the first one is the reference)
 * @param {Object} spread a `SPREADS` item
 */
export function applySpread(waves, spread) {
  const base = Number(waves[0]?.frequency) || 1;
  waves.forEach((wave) => {
    const ratio = (Number(wave.frequency) || 1) / base;
    wave.direction = optionIndex(wave, 'directionOptions', spread.direction);
    wave.fixturePhaseStart = clamp(Math.round(spread.start * ratio), -360, 360);
    wave.fixturePhaseStop = clamp(Math.round(spread.stop * ratio), -360, 360);
    const mirror = spread.mirror === wave.type;
    if (Boolean(wave.mirror) !== mirror) wave.mirror = mirror;
  });
}

/* ------------------------------------------------------------------ Shapes */

/**
 * A part of a shape: a waveform, a Freq ratio (× the speed) and a phase offset (degrees)
 *
 * @param {String} waveform 'SINE' or 'TRIANGLE'
 * @param {Number} ratio
 * @param {Number} [offset=0]
 * @returns {Object}
 */
function part(waveform, ratio, offset = 0) {
  return { waveform, ratio, offset };
}

/**
 * A wave held at its centre
 *
 * @constant {Object}
 */
const FLAT = { flat: true };

/**
 * Pan/Tilt shapes. `round`: equal size in degrees on both axes
 *
 * @constant {Array<Object>}
 */
export const PANTILT_SHAPES = [
  {
    name: 'Circle', pan: part('SINE', 1), tilt: part('SINE', 1, 90), round: true,
  },
  {
    name: 'Circle reverse', pan: part('SINE', 1), tilt: part('SINE', 1, 270), round: true,
  },
  { name: 'Ellipse', pan: part('SINE', 1), tilt: part('SINE', 1, 90) },
  { name: 'Eight', pan: part('SINE', 2), tilt: part('SINE', 1) },
  { name: 'Infinity', pan: part('SINE', 1), tilt: part('SINE', 2) },
  { name: 'Line horizontal', pan: part('SINE', 1), tilt: FLAT },
  { name: 'Line vertical', pan: FLAT, tilt: part('SINE', 1) },
  {
    name: 'Diagonal up', pan: part('SINE', 1), tilt: part('SINE', 1), round: true,
  },
  {
    name: 'Diagonal down', pan: part('SINE', 1), tilt: part('SINE', 1, 180), round: true,
  },
  {
    name: 'Diamond', pan: part('TRIANGLE', 1), tilt: part('TRIANGLE', 1, 90), round: true,
  },
  { name: 'Zigzag', pan: part('TRIANGLE', 1), tilt: part('TRIANGLE', 4) },
  { name: 'Wave', pan: part('TRIANGLE', 1), tilt: part('SINE', 4) },
  { name: 'Swing', pan: part('SINE', 1), tilt: part('SINE', 2, 90) },
  { name: 'Clover', pan: part('SINE', 3), tilt: part('SINE', 2, 90) },
  { name: 'Knot', pan: part('SINE', 3), tilt: part('SINE', 4, 90) },
  { name: 'Ballyhoo', pan: part('SINE', 2), tilt: part('SINE', 3, 90) },
  { name: 'Pretzel', pan: part('SINE', 5), tilt: part('SINE', 4, 90) },
];

/**
 * Gives a Pan and a Tilt wave a shape, fully: waveform, Freq (ratio × speed), Phase, width, a
 * size per axis (remembered sizes, equal in degrees for round shapes; a flat axis is 0); the
 * centre stays
 *
 * @public
 * @param {Object} pan Pan FXChannel
 * @param {Object} tilt Tilt FXChannel
 * @param {Object} shape a `PANTILT_SHAPES` item
 * @param {Object} options `{ speed, sizes: { pan, tilt } (DMX), ranges: { pan, tilt } (°) }`
 */
export function applyShape(pan, tilt, shape, { speed = 1, sizes, ranges = DEFAULT_RANGES }) {
  let size = { pan: sizes.pan, tilt: sizes.tilt };
  if (shape.round) {
    const degrees = Math.max(size.pan * (ranges.pan / 255), size.tilt * (ranges.tilt / 255));
    // As large as both axes allow
    const fit = Math.min(degrees, ranges.pan, ranges.tilt);
    size = { pan: (fit * 255) / ranges.pan, tilt: (fit * 255) / ranges.tilt };
  }
  const top = Math.max(...[shape.pan, shape.tilt].map((p) => (p.flat ? 1 : p.ratio)));
  const base = clamp(Math.round(speed), 1, Math.floor(100 / top));
  [['pan', pan], ['tilt', tilt]].forEach(([axis, wave]) => {
    const spec = shape[axis];
    const span = waveSpan(wave);
    const centre = (span.low + span.high) / 2;
    if (spec.flat) {
      setSpan(wave, centre, 0);
      return;
    }
    setSpan(wave, centre, size[axis]);
    wave.waveform = optionIndex(wave, 'waveOptions', spec.waveform);
    wave.frequency = spec.ratio * base;
    wave.phase = wrap(spec.offset);
    wave.width = 50;
  });
}

/* ------------------------------------------------------------------ Colour presets */

/**
 * A colour wave setting: waveform, low and high value, phase, Freq multiplier, PWM width
 *
 * @param {String} waveform
 * @param {Number} low
 * @param {Number} high
 * @param {Object} [more] `{ phase, ratio, width }`
 * @returns {Object}
 */
function colour(waveform, low, high, more = {}) {
  return {
    waveform, low, high, phase: 0, ratio: 1, width: 50, ...more,
  };
}

/**
 * A colour wave held at one value
 *
 * @param {Number} value
 * @returns {Object}
 */
function steady(value) {
  return colour('SINE', value, value);
}

/**
 * The same setting for red, green and blue, between two colours
 *
 * @param {String} waveform
 * @param {Object} low `{ r, g, b }`
 * @param {Object} high `{ r, g, b }`
 * @param {Object} [more]
 * @returns {Object} `{ Red, Green, Blue }`
 */
function between(waveform, low, high, more) {
  return {
    Red: colour(waveform, low.r, high.r, more),
    Green: colour(waveform, low.g, high.g, more),
    Blue: colour(waveform, low.b, high.b, more),
  };
}

/**
 * PWM width that lights one fixture at a time
 *
 * @param {Number} count fixtures
 * @returns {Number} percent
 */
function oneAtATime(count) {
  return clamp(Math.round(100 / count), 1, 99);
}

/**
 * Colour presets: each runs every colour wave from colour A (its Min) to colour B (its Max),
 * starting from its `defaults` (palette names; Colour A and B then read them back from the waves),
 * and spreads them
 *
 * @constant {Array<Object>} `{ name, about, defaults, spread, waves({ a, b, count }) }`
 */
export const COLOUR_PRESETS = [
  {
    name: 'Rainbow',
    about: 'Every hue between A and B in turn, travelling across the fixtures',
    defaults: { a: 'Black', b: 'White' },
    spread: 'Wave',
    waves: ({ a, b }) => ({
      Red: colour('SINE', a.r, b.r, { phase: 60 }),
      Green: colour('SINE', a.g, b.g, { phase: 180 }),
      Blue: colour('SINE', a.b, b.b, { phase: 300 }),
    }),
  },
  {
    name: 'Fade',
    about: 'From A to B and back, travelling across the fixtures',
    defaults: { a: 'Tomato Red', b: 'Dodger Blue' },
    spread: 'Wave',
    waves: ({ a, b }) => between('SINE', a, b),
  },
  {
    name: 'Fade together',
    about: 'From A to B and back, every fixture at once',
    defaults: { a: 'Tomato Red', b: 'Dodger Blue' },
    spread: 'Together',
    waves: ({ a, b }) => between('SINE', a, b),
  },
  {
    name: 'Pulse',
    about: 'B breathing out of A and back, every fixture at once',
    defaults: { a: 'Black', b: 'Dodger Blue' },
    spread: 'Together',
    waves: ({ a, b }) => between('SINE', a, b, { ratio: 2 }),
  },
  {
    name: 'Wave',
    about: 'B rising out of A, travelling across the fixtures',
    defaults: { a: 'Black', b: 'Dodger Blue' },
    spread: 'Wave',
    waves: ({ a, b }) => between('SINE', a, b),
  },
  {
    name: 'Chase',
    about: 'One fixture at a time in B, the others in A (Width: how long each stays lit)',
    defaults: { a: 'Black', b: 'Gold' },
    spread: 'Wave',
    waves: ({ a, b, count }) => between('PWM', a, b, { width: oneAtATime(count) }),
  },
  {
    name: 'Strobe',
    about: 'Every fixture flashing B over A together (Width: length of a flash)',
    defaults: { a: 'Black', b: 'White' },
    spread: 'Together',
    waves: ({ a, b }) => between('PWM', a, b, { ratio: 8, width: 10 }),
  },
  {
    name: 'Sparkle',
    about: 'Short flashes of B over A here and there',
    defaults: { a: 'Black', b: 'White' },
    spread: 'Wave',
    waves: ({ a, b }) => between('PWM', a, b, { ratio: 5, width: 5 }),
  },
  {
    name: 'Flip',
    about: 'Every fixture switching between A and B',
    defaults: { a: 'Tomato Red', b: 'Dodger Blue' },
    spread: 'Together',
    waves: ({ a, b }) => between('SQUARE', a, b, { ratio: 2 }),
  },
  {
    name: 'Police',
    about: 'A and B in fast turns, every fixture at once',
    defaults: { a: 'Blue', b: 'Tomato Red' },
    spread: 'Together',
    waves: ({ a, b }) => between('SQUARE', a, b, { ratio: 4 }),
  },
  {
    name: 'Fire',
    about: 'A flickering towards B, restless across the fixtures',
    defaults: { a: 'Tomato Red', b: 'Dark Orange' },
    spread: 'Wave',
    waves: ({ a, b }) => between('TRIANGLE', a, b, { ratio: 6 }),
  },
  {
    name: 'Ocean',
    about: 'A and B rolling slowly across the fixtures',
    defaults: { a: 'Blue', b: 'Turquoise' },
    spread: 'Wave',
    waves: ({ a, b }) => between('SINE', a, b, { ratio: 2 }),
  },
  {
    name: 'Sunset',
    about: 'A glowing into B, slowly, across the fixtures',
    defaults: { a: 'Orange-Red', b: 'Purple' },
    spread: 'Wave',
    waves: ({ a, b }) => between('SINE', a, b),
  },
];

/**
 * Sets an effect's colour waves from a preset, fully: Red, Green and Blue are added when missing,
 * every other colour wave goes to 0; Freq is the preset's multiplier × the speed
 *
 * @public
 * @param {Object} effect FX cue (reactive)
 * @param {Object} preset a `COLOUR_PRESETS` item
 * @param {Object} options `{ a, b, speed }` (a, b: `{ r, g, b }`)
 */
export function applyColourPreset(effect, preset, { a, b, speed = 1 }) {
  ['Red', 'Green', 'Blue'].forEach((type) => {
    if (!waveOf(effect, type)) effect.addChannel({ type });
  });
  const waves = effect.channels.filter((wave) => COLOUR_TYPES.includes(wave.type));
  const count = Math.max(1, (waves[0]?.fixtures || []).filter((f) => f.active).length);
  const settings = preset.waves({ a, b, count });
  const top = Math.max(...Object.values(settings).map((s) => s.ratio));
  const base = clamp(Math.round(speed), 1, Math.floor(100 / top));
  waves.forEach((wave) => {
    const s = settings[wave.type] || steady(0);
    wave.waveform = optionIndex(wave, 'waveOptions', s.waveform);
    wave.min = s.low;
    wave.max = s.high;
    wave.phase = wrap(s.phase);
    wave.width = s.width;
    wave.frequency = s.ratio * base;
  });
  applySpread(waves, SPREADS.find((spread) => spread.name === preset.spread));
}

/* ------------------------------------------------------------------ Channels */

/**
 * Colour-mixing attribute (GDTF), whose channel an effect drives by its colour
 *
 * @constant {RegExp}
 */
const MIXING = /^Color(Add|Sub|RGB)_/;

/**
 * Channel types an effect can modulate on its fixtures: each fixture channel that isn't fine,
 * by its colour for colour mixing, else by its kind; in the fixtures' order, once each
 *
 * @public
 * @param {Array<Object>} fixtures Fixtures (with their runtime `channels`)
 * @returns {Array<Object>} `{ type, channel }` (channel: one that has it, for its icon)
 */
export function availableChannels(fixtures) {
  const seen = new Map();
  fixtures.forEach((fixture) => {
    (fixture.channels || []).forEach((channel) => {
      if (channel.isFine) return;
      const type = channel.color && MIXING.test(channel.attribute || '')
        ? channel.color : channel.kind || channel.type;
      if (type && !seen.has(type)) seen.set(type, { type, channel });
    });
  });
  return [...seen.values()];
}

/* ------------------------------------------------------------------ What the waves are */

/**
 * Whether two angles (degrees) are the same, modulo a turn
 *
 * @param {Number} a
 * @param {Number} b
 * @returns {Boolean}
 */
function sameAngle(a, b) {
  const d = (((a - b) % 360) + 360) % 360;
  return d < 1 || d > 359;
}

/**
 * Name of a wave's waveform
 *
 * @param {Object} wave FXChannel
 * @returns {String}
 */
function waveformName(wave) {
  return (wave.waveOptions || [])[wave.waveform];
}

/**
 * Index of the shape a Pan and a Tilt wave draw, or -1 for none (custom)
 *
 * @public
 * @param {Object} pan Pan FXChannel
 * @param {Object} tilt Tilt FXChannel
 * @param {Object} [ranges=DEFAULT_RANGES] `{ pan, tilt }` degrees (round shapes)
 * @param {?Number} [preferred=null] index to keep when it matches (several shapes can)
 * @returns {Number}
 */
export function matchShape(pan, tilt, ranges = DEFAULT_RANGES, preferred = null) {
  const size = (wave) => waveSpan(wave).high - waveSpan(wave).low;
  const matches = (shape) => {
    const parts = [[pan, shape.pan], [tilt, shape.tilt]];
    if (parts.some(([wave, spec]) => (spec.flat ? size(wave) !== 0 : size(wave) === 0))) {
      return false;
    }
    const moving = parts.filter(([, spec]) => !spec.flat);
    if (moving.some(([wave, spec]) => waveformName(wave) !== spec.waveform)) return false;
    if (moving.length === 2) {
      const [[w1, s1], [w2, s2]] = moving;
      if (Math.abs(w1.frequency * s2.ratio - w2.frequency * s1.ratio) > 1e-6) return false;
      if (!sameAngle(w2.phase - w1.phase, s2.offset - s1.offset)) return false;
    }
    if (shape.round) {
      const degrees = (wave, range) => size(wave) * (range / 255);
      if (Math.abs(degrees(pan, ranges.pan) - degrees(tilt, ranges.tilt)) > 2) return false;
    }
    return true;
  };
  if (preferred != null && PANTILT_SHAPES[preferred] && matches(PANTILT_SHAPES[preferred])) {
    return preferred;
  }
  return PANTILT_SHAPES.findIndex(matches);
}

/**
 * Index of the spread of waves, or -1 for none (custom): the first wave's direction and Phase
 * start/stop, the others' scaled by their Freq
 *
 * @public
 * @param {Array<Object>} waves FXChannels
 * @param {?Number} [preferred=null] index to keep when it matches
 * @returns {Number}
 */
export function matchSpread(waves, preferred = null) {
  if (!waves.length) return -1;
  const base = Number(waves[0].frequency) || 1;
  const matches = (spread) => waves.every((wave) => {
    const ratio = (Number(wave.frequency) || 1) / base;
    const direction = (wave.directionOptions || [])[wave.direction];
    return direction === spread.direction
      && Boolean(wave.mirror) === (spread.mirror === wave.type)
      && wave.fixturePhaseStart === clamp(Math.round(spread.start * ratio), -360, 360)
      && wave.fixturePhaseStop === clamp(Math.round(spread.stop * ratio), -360, 360);
  });
  if (preferred != null && SPREADS[preferred] && matches(SPREADS[preferred])) return preferred;
  return SPREADS.findIndex(matches);
}

/**
 * Index of the colour preset the colour waves follow, or -1 for none (custom): each red, green
 * and blue wave as the preset builds it from the waves' own colours A and B (waveform, low and
 * high, phase, width, Freq relative to the others), the other colour waves at 0, and its spread
 *
 * @public
 * @param {Array<Object>} waves the effect's colour FXChannels
 * @param {?Number} [preferred=null] index to keep when it matches
 * @returns {Number}
 */
export function matchColourPreset(waves, preferred = null) {
  const byType = Object.fromEntries(waves.map((wave) => [wave.type, wave]));
  if (!byType.Red || !byType.Green || !byType.Blue) return -1;
  const a = { r: byType.Red.min, g: byType.Green.min, b: byType.Blue.min };
  const b = { r: byType.Red.max, g: byType.Green.max, b: byType.Blue.max };
  const count = Math.max(1, byType.Red.fixtures.filter((f) => f.active).length);
  const unit = speedOf(waves);
  const matches = (preset) => {
    const settings = preset.waves({ a, b, count });
    const ratioUnit = gcdOf(Object.values(settings).map((s) => s.ratio));
    const ok = waves.every((wave) => {
      const s = settings[wave.type];
      if (!s) return wave.min === 0 && wave.max === 0;
      const steadyWave = s.low === s.high;
      return wave.min === s.low && wave.max === s.high
        && (steadyWave || (waveformName(wave) === s.waveform
          && sameAngle(wave.phase, s.phase)
          && (s.waveform !== 'PWM' || wave.width === s.width)
          && Math.abs(wave.frequency / unit - s.ratio / ratioUnit) < 1e-6));
    });
    const spread = SPREADS.find((item) => item.name === preset.spread);
    // Spread as the preset applies it: over every colour wave, the first one as reference
    return ok && matchSpread(waves, SPREADS.indexOf(spread)) === SPREADS.indexOf(spread);
  };
  if (preferred != null && COLOUR_PRESETS[preferred] && matches(COLOUR_PRESETS[preferred])) {
    return preferred;
  }
  return COLOUR_PRESETS.findIndex(matches);
}
