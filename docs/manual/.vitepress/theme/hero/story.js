/*
 * The home page story's show: four MAC Aura moving heads on one universe, the cues and the chase
 * the story's widgets display, and one program per chapter. Everything writes DMX bytes into one
 * frame, as Studio's engine does; the visualizer and the widgets both read that frame.
 *
 * Pure module (no DOM, no three.js), no allocation in the per-frame functions.
 */

/** 120 BPM */
export const BEAT = 0.5;
export const BAR = BEAT * 4;

/**
 * Length of each chapter's show, in seconds of show time
 * @type {Object<string, Number>}
 */
export const SHOW_SECONDS = {
  intro: 6,
  channels: 10.4,
  control: 14,
  cues: 16,
  chase: 16,
  output: 5,
};

/**
 * Share of a chapter's scroll that plays its show; the rest is the transition to the next
 * chapter (the camera travels, the copy and panels hand over)
 * @type {Number}
 */
export const SHOW_SHARE = 0.82;

/** MAC Aura, Standard mode: 14 channels per fixture */
export const CHANNELS = 14;
const CH = {
  SHUTTER: 0, DIMMER: 1, ZOOM: 2, PAN: 3, TILT: 5, RED: 9, GREEN: 10, BLUE: 11, WHITE: 12,
};
const SHUTTER_OPEN = 22;
const PAN_RANGE = 540;
const TILT_RANGE = 232;

/**
 * Fixtures: four heads hanging from a truss 6 m above the stage
 * @type {Array<Object>}
 */
export const FIXTURES = [-4.5, -1.5, 1.5, 4.5].map((x, index) => ({
  index,
  position: { x, y: 0, z: 6 },
  rotation: { x: Math.PI, y: 0, z: 0 }, // radians: hanging
}));

/**
 * How the channels widget shows the MAC Aura's channels (type → Studio channel icon)
 * @type {Array<Object>}
 */
export const CHANNEL_DEFS = [
  { type: 'Shutter' },
  { type: 'Dimmer' },
  { type: 'Zoom' },
  { type: 'Pan' },
  { type: 'Pan fine' },
  { type: 'Tilt' },
  { type: 'Tilt fine' },
  { type: 'Maintenance' },
  { type: 'Color Preset' },
  { type: 'Color', color: 'Red' },
  { type: 'Color', color: 'Green' },
  { type: 'Color', color: 'Blue' },
  { type: 'Color', color: 'White' },
  { type: 'Color Intensity' },
];

/**
 * The group's cues (as the cue pool widget lists them). Colours are Studio accent tokens.
 * @type {Array<Object>}
 */
export const CUES = [
  {
    id: 0, name: 'Warm wash', type: 0, token: '--accent-gold', duration: 1000, relative: true,
  },
  {
    id: 1, name: 'Rainbow', type: 1, token: '--accent-violet',
  },
  {
    id: 2, name: 'Ballyhoo', type: 1, token: '--accent-blue',
  },
  {
    id: 3, name: 'Sunset', type: 0, token: '--accent-orange',
  },
];

/** Each cue runs 2 bars in the chase: 8 bars, 4 beats per bar */
export const CHASE = {
  bars: 8,
  beatsPerBar: 4,
  items: CUES.map((cue, i) => ({ cueId: cue.id, tick: i * 8, length: 8 })),
};

/**
 * Writes a 16-bit value (0..1) into a coarse/fine byte pair
 * @param {Uint8Array} frame universe frame
 * @param {Number} index coarse byte index
 * @param {Number} value 0..1
 */
function write16(frame, index, value) {
  const v = Math.round(Math.min(Math.max(value, 0), 1) * 65535);
  frame[index] = v >> 8; // eslint-disable-line no-bitwise
  frame[index + 1] = v & 255; // eslint-disable-line no-bitwise
}

/**
 * Hue (0..1) to RGB bytes, full saturation and value
 * @param {Number} h hue
 * @param {Uint8Array} frame universe frame
 * @param {Number} base first byte of the fixture
 * @param {Number} level 0..1 brightness of the colour
 */
function writeHue(h, frame, base, level = 1) {
  const k = (n) => (n + h * 6) % 6;
  const f = (n) => 1 - Math.max(0, Math.min(k(n), 4 - k(n), 1));
  frame[base + CH.RED] = Math.round(255 * f(5) * level);
  frame[base + CH.GREEN] = Math.round(255 * f(3) * level);
  frame[base + CH.BLUE] = Math.round(255 * f(1) * level);
  frame[base + CH.WHITE] = 0;
}

/**
 * Sets a fixture's colour bytes
 * @param {Uint8Array} frame universe frame
 * @param {Number} base first byte
 * @param {Number} r 0..255
 * @param {Number} g 0..255
 * @param {Number} b 0..255
 * @param {Number} w 0..255
 */
function writeColor(frame, base, r, g, b, w = 0) {
  frame[base + CH.RED] = r;
  frame[base + CH.GREEN] = g;
  frame[base + CH.BLUE] = b;
  frame[base + CH.WHITE] = w;
}

/**
 * Pan/tilt bytes from angles (degrees from the rest position)
 * @param {Uint8Array} frame universe frame
 * @param {Number} base first byte
 * @param {Number} pan degrees
 * @param {Number} tilt degrees
 */
function writePanTilt(frame, base, pan, tilt) {
  write16(frame, base + CH.PAN, 0.5 + pan / PAN_RANGE);
  write16(frame, base + CH.TILT, 0.5 + tilt / TILT_RANGE);
}

/**
 * Aims a hanging fixture at a point (calibrated against the visualizer: pan 0 swings towards +y,
 * pan 90 towards +x)
 * @param {Uint8Array} frame universe frame
 * @param {Number} i fixture index
 * @param {Number} x target x (m)
 * @param {Number} y target y (m)
 * @param {Number} z target z (m)
 */
function aim(frame, i, x, y, z = 0) {
  const { position } = FIXTURES[i];
  const dx = x - position.x;
  const dy = y - position.y;
  const dz = z - position.z;
  const heading = (Math.atan2(dy, dx) * 180) / Math.PI;
  const tilt = (Math.atan2(Math.hypot(dx, dy), -dz) * 180) / Math.PI;
  let pan = 90 - heading;
  if (pan > 180) pan -= 360;
  if (pan < -180) pan += 360;
  writePanTilt(frame, i * CHANNELS, pan, tilt);
}

/**
 * Common bytes: shutter open, dimmer, zoom
 * @param {Uint8Array} frame universe frame
 * @param {Number} i fixture index
 * @param {Number} dimmer 0..1
 * @param {Number} zoom 0..255 (0 wide, 255 narrow)
 */
function prime(frame, i, dimmer, zoom = 200) {
  const b = i * CHANNELS;
  frame[b + CH.SHUTTER] = SHUTTER_OPEN;
  frame[b + CH.DIMMER] = Math.round(255 * Math.min(Math.max(dimmer, 0), 1));
  frame[b + CH.ZOOM] = zoom;
}

const smooth = (x) => {
  const c = Math.min(Math.max(x, 0), 1);
  return c * c * (3 - 2 * c);
};

/* ── Cues ─────────────────────────────────────────────────────────────── */

/** Sunset scene: one colour per fixture, deep red to gold */
const SUNSET = [[255, 20, 10], [255, 70, 0], [255, 130, 10], [255, 190, 40]];

/**
 * Plays one cue on all four fixtures
 * @param {Number} id cue id
 * @param {Number} t seconds since the cue started
 * @param {Uint8Array} frame universe frame
 * @param {Number} level master level 0..1
 */
export function playCue(id, t, frame, level = 1) {
  for (let i = 0; i < 4; i++) {
    const b = i * CHANNELS;
    switch (id) {
      case 0: // Warm wash: amber pools, slow breathing
        prime(frame, i, level * (0.85 + 0.15 * Math.sin(t * 1.4 + i)), 60);
        writeColor(frame, b, 255, 140, 30);
        aim(frame, i, FIXTURES[i].position.x * 0.8, -1.5);
        break;
      case 1: // Rainbow: hue chase across the fixtures, fan
        prime(frame, i, level, 170);
        writeHue((t * 0.25 + i * 0.25) % 1, frame, b);
        aim(frame, i, FIXTURES[i].position.x * 1.6, -2 + Math.sin(t + i) * 1.5);
        break;
      case 2: // Ballyhoo: fast crossing circles in blue
        prime(frame, i, level, 220);
        writeColor(frame, b, 40, 110, 255);
        aim(frame, i, Math.sin(t * 2.2 + i * 1.6) * 5, Math.cos(t * 2.2 + i * 1.6) * 3 - 1);
        break;
      default: { // Sunset: deep red to gold across the rig, beams crossed in a wide fan
        const [r, g, bl] = SUNSET[i];
        prime(frame, i, level, 150);
        writeColor(frame, b, r, g, bl);
        aim(frame, i, -FIXTURES[i].position.x * 1.3, -2.5 + (i % 2) * 2);
        break;
      }
    }
  }
}

/* ── Crossfades ───────────────────────────────────────────────────────── */

/** Show time over which an effect cue fades in from the previous cue (seconds) */
export const CUE_FADE = 0.6;

/** Scratch frame for the previous cue's values */
const fading = new Uint8Array(512);

/**
 * Blends two frames into `out`: out = a·(1−k) + b·k, for the four fixtures. Pan and tilt are
 * blended as 16-bit values (coarse + fine) so heads swing smoothly
 * @param {Uint8Array} out result (may be a or b)
 * @param {Uint8Array} a frame at k = 0
 * @param {Uint8Array} b frame at k = 1
 * @param {Number} k 0..1
 */
export function blendFrames(out, a, b, k) {
  for (let f = 0; f < FIXTURES.length; f++) {
    const base = f * CHANNELS;
    for (let c = 0; c < CHANNELS; c++) {
      const i = base + c;
      if (c === CH.PAN || c === CH.TILT) {
        const va = a[i] * 256 + a[i + 1];
        const vb = b[i] * 256 + b[i + 1];
        const v = Math.round(va + (vb - va) * k);
        out[i] = v >> 8; // eslint-disable-line no-bitwise
        out[i + 1] = v & 255; // eslint-disable-line no-bitwise
        c += 1;
      } else if (c !== CH.SHUTTER) {
        out[i] = Math.round(a[i] + (b[i] - a[i]) * k);
      } else {
        out[i] = b[i];
      }
    }
  }
}

/**
 * Cubic ease-in-out: a slow start, a steep middle, a soft landing
 * @param {Number} x 0..1
 * @returns {Number} 0..1
 */
const easeInOutCubic = (x) => {
  const c = Math.min(Math.max(x, 0), 1);
  return c < 0.5 ? 4 * c * c * c : 1 - ((-2 * c + 2) ** 3) / 2;
};

/** The control chapter's last frame: where the cue pool's first scene fades from */
const entry = new Uint8Array(512);
const entryState = { fade: 1 };

/**
 * Plays a cue from where the previous one left off. A scene fades in as a relative Studio scene
 * does: from the previous cue's last values to its own, with an ease-in across its whole
 * duration, so heads travel and colours drift for the length of the cue. An effect runs at once,
 * with a short crossfade (CUE_FADE) so nothing jumps
 * @param {Uint8Array} frame universe frame
 * @param {Number} id cue id
 * @param {Number} time seconds since the cue started
 * @param {Number} length how long this cue plays (seconds)
 * @param {?Number} previousId cue playing before (null: fade from `from`, or no fade)
 * @param {Number} previousLength how long the previous cue played (seconds)
 * @param {?Uint8Array} from values to fade from when there is no previous cue
 */
function playCueFaded(frame, id, time, length, previousId, previousLength, from = null) {
  playCue(id, time, frame);
  if (previousId === null && !from) return;
  if (CUES[id].type === 0) {
    let start = from;
    if (previousId !== null) {
      playCue(previousId, previousLength, fading);
      start = fading;
    }
    blendFrames(frame, start, frame, easeInOutCubic(time / length));
  } else if (time < CUE_FADE) {
    if (previousId !== null) playCue(previousId, previousLength + time, fading);
    else fading.set(from);
    blendFrames(frame, fading, frame, easeInOutCubic(time / CUE_FADE));
  }
}

/* ── Chapters ─────────────────────────────────────────────────────────── */

/**
 * Channel walk-through on fixture 0 (the others stay dark): one channel at a time
 * Steps: [start, end, label] within a 10 s loop
 * @type {Array<Array>}
 */
export const CHANNEL_STEPS = [
  [0, 1.4, 'Shutter + dimmer'],
  [1.4, 2.8, 'Zoom'],
  [2.8, 4.6, 'Pan'],
  [4.6, 6.4, 'Tilt'],
  [6.4, 7.4, 'Red'],
  [7.4, 8.4, 'Green'],
  [8.4, 9.4, 'Blue'],
  [9.4, 10.4, 'White'],
];
const CHANNEL_LOOP = 10.4;

/**
 * Writes the frame for a chapter
 * @param {String} chapter chapter id
 * @param {Number} t seconds
 * @param {Uint8Array} frame universe frame
 * @param {Object} state story state, updated in place: { cueId, cueTime, chase, step, fade }
 */
export function program(chapter, t, frame, state) {
  switch (chapter) {
    case 'intro': {
      // The rig wakes up: open white beams sweep across the stage in a wave, one head a little
      // behind the next, the zoom breathing and each head pulsing on the beat
      const fade = smooth(state.fade);
      for (let i = 0; i < 4; i++) {
        const phase = t * 1.5 - i * 0.7;
        const beat = Math.max(0, Math.cos(((t / BEAT) - i * 0.25) * Math.PI * 2));
        prime(frame, i, fade * (0.62 + 0.38 * beat), Math.round(150 + 70 * Math.sin(t * 1.1 + i)));
        writeColor(frame, i * CHANNELS, 0, 0, 0, 255);
        const x = FIXTURES[i].position.x * 0.5 + Math.sin(phase) * 3;
        aim(frame, i, x, -1.2 + Math.cos(phase * 0.8) * 1.6);
      }
      break;
    }
    case 'channels': {
      const lt = t % CHANNEL_LOOP;
      let step = 0;
      while (step < CHANNEL_STEPS.length - 1 && lt >= CHANNEL_STEPS[step][1]) step += 1;
      const [start, end] = CHANNEL_STEPS[step];
      const k = smooth((lt - start) / (end - start));
      state.step = step;
      for (let i = 1; i < 4; i++) prime(frame, i, 0.06, 120);
      const b = 0;
      frame[b + CH.SHUTTER] = SHUTTER_OPEN;
      frame[b + CH.DIMMER] = step === 0 ? Math.round(255 * k) : 255;
      frame[b + CH.ZOOM] = step === 1 ? Math.round(240 - 200 * k) : 160;
      const pan = step === 2 ? Math.sin(k * Math.PI * 2) * 60 : 0;
      const tilt = step === 3 ? Math.sin(k * Math.PI) * 45 : 20;
      writePanTilt(frame, b, pan, tilt);
      const on = (s) => (step === s ? Math.round(255 * Math.sin(k * Math.PI)) : 0);
      const white = step <= 3 ? 255 : on(7);
      writeColor(frame, b, on(4), on(5), on(6), white);
      break;
    }
    case 'control': {
      const b = 0;
      prime(frame, 0, 1, 170);
      writeHue((t * 0.12) % 1, frame, b);
      writePanTilt(frame, b, Math.sin(t * 0.9) * 50, 25 + Math.sin(t * 1.8) * 14);
      for (let i = 1; i < 4; i++) {
        prime(frame, i, 0.25, 170);
        writeHue((t * 0.12) % 1, frame, i * CHANNELS, 0.6);
        aim(frame, i, FIXTURES[i].position.x, -1.5);
      }
      break;
    }
    case 'cues': {
      // One cue every 2 bars, unless the reader picked one in the cue pool
      if (state.pickedCue !== null) {
        state.cueId = state.pickedCue;
        state.cueTime = t - state.pickedAt;
      } else {
        state.cueId = Math.floor(t / (BAR * 2)) % CUES.length;
        state.cueTime = t % (BAR * 2);
      }
      // The first cue fades in from where the control chapter left the rig
      const first = state.pickedCue === null && t < BAR * 2;
      if (first) program('control', SHOW_SECONDS.control, entry, entryState);
      playCueFaded(
        frame,
        state.cueId,
        state.cueTime,
        BAR * 2,
        first ? null : (state.cueId + CUES.length - 1) % CUES.length,
        BAR * 2,
        first ? entry : null,
      );
      break;
    }
    case 'chase': {
      const length = CHASE.bars * BAR;
      const lt = t % length;
      state.chase = lt / length;
      const beat = Math.floor(lt / BEAT);
      let index = CHASE.items.findIndex((it) => beat >= it.tick && beat < it.tick + it.length);
      if (index < 0) index = 0;
      const item = CHASE.items[index];
      // The chase loops, and the cue pool chapter before it ends on the last cue too: its first
      // cue always fades in from the last one
      const previous = CHASE.items[(index + CHASE.items.length - 1) % CHASE.items.length];
      state.cueId = item.cueId;
      state.cueTime = lt - item.tick * BEAT;
      playCueFaded(
        frame,
        item.cueId,
        state.cueTime,
        item.length * BEAT,
        previous.cueId,
        previous.length * BEAT,
      );
      break;
    }
    default: { // output
      for (let i = 0; i < 4; i++) {
        prime(frame, i, 1, 190);
        writeHue((t * 0.15 + i * 0.25) % 1, frame, i * CHANNELS);
        aim(frame, i, Math.sin(t * 0.7 + i) * 4, Math.cos(t * 0.5 + i) * 2 - 1);
      }
    }
  }
}

/**
 * Reads fixture `i`'s colour from the frame as [r, g, b] (white mixed in)
 * @param {Uint8Array} frame universe frame
 * @param {Number} i fixture index
 * @param {Array<Number>} out reused output array
 * @returns {Array<Number>} out
 */
export function colorOf(frame, i, out) {
  const b = i * CHANNELS;
  const w = frame[b + CH.WHITE];
  out[0] = Math.min(255, frame[b + CH.RED] + w);
  out[1] = Math.min(255, frame[b + CH.GREEN] + w);
  out[2] = Math.min(255, frame[b + CH.BLUE] + w);
  return out;
}

/**
 * Byte offsets of the pan and tilt coarse/fine pairs within a fixture
 * @type {Object}
 */
export const PAN_TILT = { PAN: CH.PAN, TILT: CH.TILT };
