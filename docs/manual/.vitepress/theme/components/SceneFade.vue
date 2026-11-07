<template>
  <StudioFrame
    :caption="caption"
    :padding="0"
  >
    <div class="scene_fade">
      <div
        v-for="row in rows"
        :key="row.start"
        class="scene_fade_row"
      >
        <div class="scene_fade_label">
          <h3>Start: {{ row.start }}</h3>
          <p>{{ row.text }}</p>
        </div>
        <svg
          class="scene_fade_graph"
          viewBox="0 0 400 120"
          aria-hidden="true"
        >
          <!-- Beats of the bar -->
          <line
            v-for="beat in 5"
            :key="beat"
            class="grid"
            :x1="20 + (beat - 1) * 90"
            :x2="20 + (beat - 1) * 90"
            y1="10"
            y2="100"
          />
          <text
            v-for="beat in 4"
            :key="`b${beat}`"
            class="tick"
            :x="20 + (beat - 1) * 90 + 4"
            y="114"
          >beat {{ beat }}</text>
          <!-- The fade: from the start value to the scene's value, along the curve -->
          <path
            class="curve"
            :style="{ stroke: row.color }"
            :d="curvePath(row.from)"
          />
          <circle
            class="head"
            :cx="20 + progress * 360"
            :cy="valueY(row.from, progress)"
            r="5"
            :style="{ fill: row.color }"
          />
          <line
            class="playhead"
            :x1="20 + progress * 360"
            :x2="20 + progress * 360"
            y1="10"
            y2="100"
          />
        </svg>
        <div class="scene_fade_lights">
          <span
            v-for="i in 2"
            :key="i"
            class="light"
            :style="lightStyle(row.from)"
          />
        </div>
      </div>
    </div>
  </StudioFrame>
</template>

<script>
/** The scene's colour (Deep blue) and the look on stage before it (warm white) */
const SCENE = [40, 70, 255];
const BEFORE = [255, 200, 140];
/** Ease-in-out cubic-bezier(0.42, 0, 0.58, 1), as the scene's fade curve */
const ease = (x) => {
  // Solve the Bézier's x for t (Newton), return its y
  let t = x;
  for (let i = 0; i < 6; i++) {
    const bx = 3 * (1 - t) * (1 - t) * t * 0.42 + 3 * (1 - t) * t * t * 0.58 + t * t * t;
    const dx = 3 * (1 - t) * (1 - t) * 0.42 + 6 * (1 - t) * t * (0.58 - 0.42)
      + 3 * t * t * (1 - 0.58);
    if (Math.abs(dx) < 1e-6) break;
    t -= (bx - x) / dx;
  }
  return 3 * (1 - t) * t * t + t * t * t;
};

/**
 * Animated illustration of a scene's fade: the value moves from where it starts to the scene's
 * value along the fade curve, over the scene's duration (one bar here), and the lights follow.
 * Absolute starts from 0 (dark); Relative from the look already on stage.
 * @example <SceneFade />
 */
export default {
  name: 'SceneFade',
  data() {
    return {
      progress: 0.6,
      caption: 'A scene with a 1-bar duration, played twice: from 0 (Absolute) and from what\'s '
        + 'on stage (Relative)',
      rows: [
        {
          start: 'Absolute', from: 0, text: 'Fades from 0: the lights rise from dark to the scene\'s colour.', color: 'var(--accent-blue)',
        },
        {
          start: 'Relative', from: 1, text: 'Fades from the current values: the warm look on stage turns into the scene\'s colour.', color: 'var(--accent-gold)',
        },
      ],
    };
  },
  mounted() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
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
     * Loops the fade: 2 s for the bar (120 BPM), then a short hold
     */
    start() {
      if (this.frame) return;
      const begin = performance.now();
      const step = (now) => {
        const t = ((now - begin) / 1000) % 3;
        this.progress = Math.min(t / 2, 1);
        this.frame = requestAnimationFrame(step);
      };
      this.frame = requestAnimationFrame(step);
    },
    /**
     * Stops the loop
     */
    stop() {
      if (this.frame) cancelAnimationFrame(this.frame);
      this.frame = null;
    },
    /**
     * Height on the graph of the fade's value at a point of the bar
     * @param {Number} from 0 (from dark) or 1 (from the look on stage, drawn half way)
     * @param {Number} x position in the bar, 0..1
     * @returns {Number} y in the graph
     */
    valueY(from, x) {
      const start = from ? 0.45 : 0;
      const v = start + (1 - start) * ease(x);
      return 100 - v * 85;
    },
    /**
     * The fade's curve over the bar
     * @param {Number} from start (see valueY)
     * @returns {String} SVG path
     */
    curvePath(from) {
      const points = [];
      for (let i = 0; i <= 40; i++) points.push(`${20 + (i / 40) * 360},${this.valueY(from, i / 40)}`);
      return `M${points.join(' L')}`;
    },
    /**
     * A light's colour at the current point of the fade
     * @param {Number} from 0: from dark, 1: from the look on stage
     * @returns {Object} style
     */
    lightStyle(from) {
      const k = ease(this.progress);
      const start = from ? BEFORE : [0, 0, 0];
      const [r, g, b] = start.map((c, i) => Math.round(c + (SCENE[i] - c) * k));
      return { background: `rgb(${r}, ${g}, ${b})`, boxShadow: `0 0 18px rgba(${r}, ${g}, ${b}, 0.7)` };
    },
  },
};
</script>

<style scoped>
.scene_fade {
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: var(--primary-dark);
}

.scene_fade_row {
  display: grid;
  grid-template-columns: minmax(150px, 1fr) minmax(220px, 2fr) 90px;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: var(--primary-light);
}

.scene_fade_label h3 {
  font-family: Roboto-Bold, sans-serif;
  font-size: 12px;
  text-transform: uppercase;
}

.scene_fade_label p {
  display: block;
  margin-top: 6px;
  font-family: Roboto-Regular, sans-serif;
  font-size: 13px;
  line-height: 1.45;
  color: var(--secondary-lighter);
}

.scene_fade_graph {
  width: 100%;
  height: auto;
}

.grid {
  stroke: var(--primary-lighter);
  stroke-width: 1;
}

.tick {
  font-family: Roboto-Medium, sans-serif;
  font-size: 10px;
  fill: var(--secondary-light);
}

.curve {
  fill: none;
  stroke-width: 2;
}

.playhead {
  stroke: var(--secondary-lighter);
  stroke-width: 1;
  opacity: 0.5;
}

.scene_fade_lights {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.light {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid var(--primary-lighter);
}

@media (max-width: 640px) {
  .scene_fade_row {
    grid-template-columns: 1fr 70px;
  }

  .scene_fade_graph {
    grid-column: 1 / -1;
    grid-row: 2;
  }
}
</style>
