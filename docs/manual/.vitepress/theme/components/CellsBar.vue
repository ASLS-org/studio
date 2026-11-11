<template>
  <StudioFrame
    :caption="caption"
    :padding="0"
  >
    <div class="cells_bar">
      <div class="cells_bar_controls">
        <h3>Show</h3>
        <div class="cells_bar_options">
          <button
            v-for="option in modes"
            :key="option.value"
            type="button"
            :class="{ active: mode === option.value }"
            @click="mode = option.value"
          >
            {{ option.label }}
          </button>
        </div>
        <p>{{ current.text }}</p>
      </div>

      <div class="cells_bar_body">
        <div class="cells_bar_fixture">
          <div
            v-for="(cell, i) in cells"
            :key="i"
            class="cells_bar_cell"
          >
            <span
              class="light"
              :style="{ background: cell.color, boxShadow: `0 0 14px ${cell.color}` }"
            />
            <b>Cell {{ i + 1 }}</b>
            <small>{{ i * 3 }}–{{ i * 3 + 2 }}</small>
          </div>
        </div>
        <p class="cells_bar_master">
          <b>Dimmer</b> <small>36</small> · <b>Strobe</b> <small>37</small>:
          the whole bar, no cell
        </p>
      </div>
    </div>
  </StudioFrame>
</template>

<script>
const CELLS = 12;
/** One cycle every 4 s (Freq 1 over a 2-bar effect at 120 BPM) */
const PERIOD = 4000;

/**
 * Interactive illustration of cells: a pixel bar of 12 cells, each with its own red, green and
 * blue (addresses 0–35), and two channels for the whole bar. A scene gives each cell a value; an
 * effect spread over cells travels along the bar, spread over fixtures moves the bar as one.
 * @example <CellsBar />
 */
export default {
  name: 'CellsBar',
  data() {
    return {
      time: 0,
      mode: 'scene',
      caption: 'A 12-pixel bar, 38 channels: three per cell (red, green, blue), plus a dimmer and '
        + 'a strobe for the whole bar',
      modes: [
        { value: 'scene', label: 'Scene', text: 'A scene sets each cell on its own: here alternating Sunset reds and golds.' },
        { value: 'cells', label: 'Effect · over cells', text: 'A hue effect spread over cells: each cell is a step behind the one before, so the colours travel along the bar.' },
        { value: 'fixtures', label: 'Effect · over fixtures', text: 'The same effect spread over fixtures: every cell of the bar gets the same colour, the bar changes as one light.' },
      ],
    };
  },
  computed: {
    /**
     * The selected mode
     * @type {Object}
     */
    current() {
      return this.modes.find((m) => m.value === this.mode);
    },
    /**
     * Each cell's colour now
     * @type {Array<Object>}
     */
    cells() {
      return Array.from({ length: CELLS }, (_, i) => {
        if (this.mode === 'scene') {
          return { color: i % 2 ? 'hsl(42, 100%, 58%)' : 'hsl(8, 100%, 52%)' };
        }
        const spread = this.mode === 'cells' ? i / CELLS : 0;
        const hue = Math.round(((this.time - spread + 1) % 1) * 360);
        return { color: `hsl(${hue}, 100%, 55%)` };
      });
    },
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
     * Runs the clock
     */
    start() {
      if (this.frame) return;
      const begin = performance.now() - this.time * PERIOD;
      const step = (now) => {
        this.time = ((now - begin) / PERIOD) % 1;
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
.cells_bar {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1px;
  background: var(--primary-dark);
}

.cells_bar > * {
  background: var(--primary-light);
}

.cells_bar_controls {
  padding: 12px 16px;
}

.cells_bar_controls h3 {
  margin-bottom: 6px;
  font-family: Roboto-Bold, sans-serif;
  font-size: 12px;
  text-transform: uppercase;
}

.cells_bar_controls p {
  margin: 10px 0 0;
  font-size: 13px;
  color: var(--secondary-light);
}

.cells_bar_options {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.cells_bar_options button {
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

.cells_bar_options button.active {
  background: var(--accent-gold);
  color: var(--primary-dark);
}

.cells_bar_body {
  padding: 16px;
  overflow-x: auto;
}

.cells_bar_fixture {
  display: grid;
  grid-template-columns: repeat(12, minmax(34px, 1fr));
  gap: 4px;
  min-width: 440px;
  padding: 8px;
  border-radius: 4px;
  background: var(--primary-dark);
}

.cells_bar_cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-family: Roboto-Medium, sans-serif;
  font-size: 9px;
  color: var(--secondary-light);
}

.cells_bar_cell b {
  font-weight: normal;
  color: var(--secondary-lighter);
}

.cells_bar_cell .light {
  width: 100%;
  height: 18px;
  border-radius: 2px;
}

.cells_bar_master {
  margin: 10px 0 0;
  font-size: 12px;
  color: var(--secondary-light);
}

.cells_bar_master b {
  font-family: Roboto-Medium, sans-serif;
  font-weight: normal;
  color: var(--secondary-lighter);
}
</style>
