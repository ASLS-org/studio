<template>
  <uk-widget
    class="universe_view"
    :header="{ title: 'Universe 0 · DMX output', icon: 'universe' }"
  >
    <div class="universe_view_body">
      <div
        v-for="(row, fixture) in rows"
        :key="fixture"
        class="universe_view_row"
      >
        <h4 class="universe_view_fixture">
          MAC Aura {{ fixture + 1 }}
        </h4>
        <div
          v-for="cell in row"
          :key="cell"
          class="universe_view_cell"
          :title="`Channel ${cell + 1}: ${values[cell]}`"
        >
          <span
            class="universe_view_bar"
            :style="{ transform: `scaleY(${values[cell] / 255})` }"
          />
          <span class="universe_view_value">{{ values[cell] }}</span>
        </div>
      </div>
    </div>
  </uk-widget>
</template>

<script>
/**
 * Live view of the story's universe: one row of channels per fixture, each with its DMX value
 * (0–255) as a bar and a number, in a Studio widget.
 */
export default {
  name: 'UniverseView',
  props: {
    /**
     * DMX values of the universe's first channels (0–255)
     * @type {Array<Number>}
     */
    values: {
      type: Array,
      default: () => [],
    },
    /**
     * Channels per fixture
     * @type {Number}
     */
    channels: {
      type: Number,
      default: 14,
    },
  },
  computed: {
    /**
     * Channel indexes grouped by fixture
     * @type {Array<Array<Number>>}
     */
    rows() {
      const rows = [];
      for (let i = 0; i < this.values.length; i += this.channels) {
        rows.push(Array.from({ length: this.channels }, (_, k) => i + k));
      }
      return rows;
    },
  },
};
</script>

<style scoped>
.universe_view {
  height: 100%;
}

.universe_view_body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  height: 100%;
  padding: 10px 12px;
}

.universe_view_row {
  display: flex;
  flex: 1;
  align-items: stretch;
  gap: 4px;
  min-height: 0;
}

.universe_view_fixture {
  flex: 0 0 88px;
  align-self: center;
  opacity: 0.7;
}

.universe_view_cell {
  position: relative;
  flex: 1;
  min-width: 26px;
  overflow: hidden;
  border-radius: 2px;
  background: var(--primary-dark);
}

.universe_view_bar {
  position: absolute;
  inset: 0;
  background: var(--accent-blue);
  opacity: 0.55;
  transform-origin: bottom;
}

.universe_view_value {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 2px;
  font-family: Roboto-Regular, sans-serif;
  font-size: 10px;
  text-align: center;
  color: var(--secondary-lighter);
}
</style>
