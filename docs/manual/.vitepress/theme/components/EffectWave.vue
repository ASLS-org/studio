<template>
  <StudioFrame
    :caption="caption"
    :padding="0"
  >
    <div class="effect_wave">
      <div class="effect_wave_controls">
        <div
          v-for="control in controls"
          :key="control.key"
          class="effect_wave_control"
        >
          <h3>{{ control.label }}</h3>
          <div class="effect_wave_options">
            <button
              v-for="option in control.options"
              :key="option.value"
              type="button"
              :class="{ active: settings[control.key] === option.value }"
              @click="settings[control.key] = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
      </div>

      <svg
        class="effect_wave_graph"
        viewBox="0 0 420 130"
        aria-hidden="true"
      >
        <line
          class="axis"
          x1="20"
          x2="380"
          y1="105"
          y2="105"
        />
        <text
          class="tick"
          x="20"
          y="122"
        >0°</text>
        <text
          class="tick"
          x="190"
          y="122"
        >180°</text>
        <text
          class="tick"
          x="356"
          y="122"
        >360°</text>
        <text
          class="tick"
          x="384"
          y="18"
        >Max</text>
        <text
          class="tick"
          x="384"
          y="108"
        >Min</text>
        <path
          class="wave"
          :d="wavePath"
        />
        <!-- Each light is a point travelling along one cycle, offset by its phase -->
        <g
          v-for="(light, i) in lights"
          :key="i"
        >
          <circle
            class="marker"
            :cx="20 + light.position * 360"
            :cy="105 - light.level * 90"
            r="6"
          />
          <text
            class="marker_label"
            :x="20 + light.position * 360"
            :y="105 - light.level * 90 + 3.5"
          >{{ i + 1 }}</text>
        </g>
      </svg>

      <div class="effect_wave_lights">
        <div
          v-for="(light, i) in lights"
          :key="i"
          class="effect_wave_light"
        >
          <span
            class="light"
            :style="lightStyle(light)"
          />
          <p>MAC Aura {{ i + 1 }}<br><small>{{ Math.round(light.offset) }}°</small></p>
        </div>
      </div>
    </div>
  </StudioFrame>
</template>

<script>
const TAU = Math.PI * 2;

/**
 * The effect tool's waveforms, value 0..1 at a phase (radians)
 * @type {Object<string, Function>}
 */
const WAVES = {
  SINE: (a) => 0.5 + 0.5 * Math.sin(a),
  TRIANGLE: (a) => 0.5 + Math.asin(Math.sin(a)) / Math.PI,
  SQUARE: (a) => (Math.sin(a) >= 0 ? 1 : 0),
};

/**
 * Interactive illustration of an effect: the demo rig's four heads follow a waveform (Freq 1
 * over a 1-bar duration: one cycle every 2 s at 120 BPM). Each light is offset by its phase,
 * spread between Phase start (0°) and Phase stop, in the chosen direction, as Studio's effect
 * tool does.
 * @example <EffectWave />
 */
export default {
  name: 'EffectWave',
  data() {
    return {
      time: 0,
      caption: 'A dimmer effect on the four MAC Auras: the waveform sets each light\'s level over '
        + 'time; the phase spread offsets each light along it',
      settings: { waveform: 'SINE', stop: 360, direction: 'LTR' },
      controls: [
        {
          key: 'waveform',
          label: 'Waveform',
          options: ['SINE', 'TRIANGLE', 'SQUARE'].map((v) => ({ value: v, label: v })),
        },
        {
          key: 'stop',
          label: 'Phase stop',
          options: [0, 90, 180, 360].map((v) => ({ value: v, label: `${v}°` })),
        },
        {
          key: 'direction',
          label: 'Direction',
          options: ['LTR', 'RTL', 'SYM'].map((v) => ({ value: v, label: v })),
        },
      ],
    };
  },
  computed: {
    /**
     * Each light's phase offset, its position on the cycle and its level
     * @type {Array<Object>}
     */
    lights() {
      const { waveform, stop, direction } = this.settings;
      const count = 4;
      return Array.from({ length: count }, (_, i) => {
        let k = i / count;
        if (direction === 'RTL') k = -k;
        if (direction === 'SYM') {
          const n = i / (count - 1);
          k = n <= 0.5 ? n * 2 : (1 - n) * 2;
        }
        const offset = stop * k;
        const angle = TAU * this.time + (offset * Math.PI) / 180;
        const position = (((angle % TAU) + TAU) % TAU) / TAU;
        return { offset: ((offset % 360) + 360) % 360, position, level: WAVES[waveform](angle) };
      });
    },
    /**
     * One cycle of the waveform
     * @type {String}
     */
    wavePath() {
      const points = [];
      for (let i = 0; i <= 120; i++) {
        const x = i / 120;
        points.push(`${20 + x * 360},${105 - WAVES[this.settings.waveform](x * TAU) * 90}`);
      }
      return `M${points.join(' L')}`;
    },
  },
  mounted() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.time = 0.15;
      return;
    }
    this.observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) this.start();
      else this.stop();
    });
    this.observer.observe(this.$el);
  },
  beforeUnmount() {
    this.stop();
    if (this.observer) this.observer.disconnect();
  },
  methods: {
    /**
     * A light's glow at its level
     * @param {Object} light light (level 0..1)
     * @returns {Object} style
     */
    lightStyle(light) {
      const glow = 6 + light.level * 22;
      return {
        opacity: 0.08 + light.level * 0.92,
        boxShadow: `0 0 ${glow}px rgba(226, 199, 83, ${light.level})`,
      };
    },
    /**
     * Runs the clock: one cycle every 2 s (Freq 1, Duration 1 bar, 120 BPM)
     */
    start() {
      if (this.frame) return;
      const begin = performance.now() - this.time * 2000;
      const step = (now) => {
        this.time = ((now - begin) / 2000) % 1;
        this.frame = requestAnimationFrame(step);
      };
      this.frame = requestAnimationFrame(step);
    },
    /**
     * Stops the clock
     */
    stop() {
      if (this.frame) cancelAnimationFrame(this.frame);
      this.frame = null;
    },
  },
};
</script>

<style scoped>
.effect_wave {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1px;
  background: var(--primary-dark);
}

.effect_wave > * {
  background: var(--primary-light);
}

.effect_wave_controls {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 12px 16px;
}

.effect_wave_control h3 {
  margin-bottom: 6px;
  font-family: Roboto-Bold, sans-serif;
  font-size: 12px;
  text-transform: uppercase;
}

.effect_wave_options {
  display: flex;
  gap: 4px;
}

.effect_wave_options button {
  padding: 0 10px;
  border: none;
  border-radius: 4px;
  background: var(--primary-lighter);
  font-family: Roboto-Medium, sans-serif;
  font-size: 11px;
  line-height: 24px;
  color: var(--secondary-light);
  cursor: pointer;
}

.effect_wave_options button.active {
  background: var(--accent-gold);
  color: var(--primary-dark);
}

.effect_wave_graph {
  display: block;
  width: 100%;
  height: auto;
  padding: 8px 16px;
}

.axis {
  stroke: var(--primary-lighter);
}

.tick {
  font-family: Roboto-Medium, sans-serif;
  font-size: 10px;
  fill: var(--secondary-light);
}

.wave {
  fill: none;
  stroke: var(--accent-gold);
  stroke-width: 2;
  opacity: 0.6;
}

.marker {
  fill: var(--primary-dark);
  stroke: var(--accent-gold);
  stroke-width: 2;
}

.marker_label {
  font-family: Roboto-Bold, sans-serif;
  font-size: 8px;
  text-anchor: middle;
  fill: var(--secondary-lighter);
}

.effect_wave_lights {
  display: flex;
  justify-content: space-around;
  padding: 14px 16px;
}

.effect_wave_light {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.light {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--accent-gold);
}

.effect_wave_light p {
  display: block;
  font-family: Roboto-Medium, sans-serif;
  font-size: 11px;
  line-height: 1.3;
  text-align: center;
  color: var(--secondary-light);
}

.effect_wave_light small {
  color: var(--secondary-light);
}
</style>
