<template>
  <StudioFrame
    :caption="caption"
    :padding="0"
  >
    <div
      v-if="show"
      class="show_map"
    >
      <!-- Show -->
      <div class="show_map_show">
        <uk-icon
          name="bulb"
          class="show_map_icon"
        />
        <h3>Show: {{ show.name }}</h3>
        <span class="show_map_meta">{{ show.bpm }} BPM</span>
      </div>

      <!-- Universe and its fixtures -->
      <section
        v-for="universe in show.universes"
        :key="universe.id"
        class="show_map_block"
        :style="{ '--tint': universe.color }"
      >
        <header>
          <uk-icon
            name="universe"
            class="show_map_icon"
          />
          <h3>Universe {{ universe.id }}: {{ universe.name }}</h3>
          <span class="show_map_meta">512 addresses</span>
        </header>
        <ul class="show_map_rows">
          <li
            v-for="fixture in fixturesOf(universe)"
            :key="fixture.id"
          >
            <uk-icon
              name="movinghead"
              class="show_map_icon"
            />
            <span class="show_map_name">{{ fixture.name }}</span>
            <span class="show_map_meta">{{ fixtureMeta(fixture) }}</span>
          </li>
        </ul>
      </section>

      <!-- Groups: their fixtures, cues and chases -->
      <div class="show_map_groups">
        <section
          v-for="group in show.groups"
          :key="group.id"
          class="show_map_block"
          :style="{ '--tint': group.color }"
        >
          <header>
            <uk-icon
              name="grid"
              class="show_map_icon"
            />
            <h3>Group: {{ group.name }}</h3>
          </header>
          <h4>Fixtures</h4>
          <div class="show_map_chips">
            <span
              v-for="f in group.fixtures"
              :key="f.id"
              class="show_map_chip"
            >{{ fixtureName(f.id) }}</span>
          </div>
          <h4>Cues</h4>
          <div class="show_map_chips">
            <span
              v-for="cue in group.cues"
              :key="cue.id"
              class="show_map_chip cue"
              :style="{ '--cue': cue.color }"
            >
              <uk-icon
                :name="cue.type ? 'wave' : 'mixer'"
                class="show_map_icon"
              />
              {{ cue.name }}
              <small>{{ cueMeta(cue) }}</small>
            </span>
          </div>
          <template
            v-for="chase in group.chases"
            :key="chase.id"
          >
            <h4>Chase {{ chase.id }}: {{ chase.name }} · {{ chase.duration }} bars</h4>
            <div
              class="show_map_timeline"
              :style="{ '--bars': chase.duration }"
            >
              <template
                v-for="pool in chase.cues"
                :key="pool.cue"
              >
                <span
                  v-for="item in pool.items"
                  :key="`${pool.cue}-${item.id}`"
                  class="show_map_item"
                  :style="itemStyle(group, pool.cue, item, chase)"
                >{{ cueName(group, pool.cue) }}</span>
              </template>
            </div>
          </template>
        </section>
      </div>

      <!-- Master -->
      <section class="show_map_block master">
        <header>
          <uk-icon
            name="play"
            class="show_map_icon"
          />
          <h3>Master, row 0</h3>
          <span class="show_map_meta">starts chase 0 of every group</span>
        </header>
        <div class="show_map_chips">
          <span
            v-for="group in show.groups"
            :key="group.id"
            class="show_map_chip"
            :style="{ '--cue': group.color }"
          >{{ group.name }} → {{ (group.chases[0] || {}).name || '—' }}</span>
        </div>
      </section>
    </div>
    <p
      v-else
      class="show_map_loading"
    >
      Loading the demo show…
    </p>
  </StudioFrame>
</template>

<script>
// eslint-disable-next-line import/no-extraneous-dependencies
import { withBase } from 'vitepress';

/**
 * The manual's demo show drawn as a map: read from its showfile, so it always matches the show
 * the live previews run. Shows what owns what: universe → fixtures, group → fixtures, cues,
 * chases, and the master row.
 * @example <ShowMap />
 */
export default {
  name: 'ShowMap',
  data() {
    return {
      show: null,
      caption: 'The manual\'s demo show, as Studio stores it: one universe, five fixtures, three '
        + 'groups with their cues and chases, and the master',
    };
  },
  async mounted() {
    try {
      const res = await fetch(withBase('/presets/manual.showfile.json'));
      this.show = await res.json();
    } catch (err) {
      console.error('[ShowMap]', err); // eslint-disable-line no-console
    }
  },
  methods: {
    /**
     * A fixture's addresses and mode
     * @param {Object} fixture fixture data
     * @returns {String} e.g. "address 0–13 · Standard (14 ch)"
     */
    fixtureMeta(fixture) {
      const last = fixture.chStart + fixture.channelCount - 1;
      return `address ${fixture.chStart}–${last} · ${fixture.mode} (${fixture.channelCount} ch)`;
    },
    /**
     * A cue's kind and duration
     * @param {Object} cue cue data
     * @returns {String} e.g. "scene · 1 bar"
     */
    cueMeta(cue) {
      return `${cue.type ? 'effect' : 'scene'} · ${cue.duration} bar${cue.duration > 1 ? 's' : ''}`;
    },
    /**
     * Fixtures patched in a universe
     * @param {Object} universe universe data
     * @returns {Array<Object>} fixtures
     */
    fixturesOf(universe) {
      return this.show.fixtures.filter((f) => f.universe === universe.id);
    },
    /**
     * A fixture's name by id
     * @param {Number} id fixture id
     * @returns {String} name
     */
    fixtureName(id) {
      return (this.show.fixtures.find((f) => f.id === id) || {}).name;
    },
    /**
     * A group cue's name by id
     * @param {Object} group group data
     * @param {Number} id cue id
     * @returns {String} name
     */
    cueName(group, id) {
      return (group.cues.find((c) => c.id === id) || {}).name;
    },
    /**
     * A cue item placed on its chase's bars (64 ticks per bar)
     * @param {Object} group group data
     * @param {Number} cueId the item's cue
     * @param {Object} item cue item
     * @param {Object} chase chase data
     * @returns {Object} style
     */
    itemStyle(group, cueId, item, chase) {
      const total = chase.duration * 64;
      const cue = group.cues.find((c) => c.id === cueId) || {};
      return {
        left: `${(item.tickStart / total) * 100}%`,
        width: `${(item.tickDuration / total) * 100}%`,
        '--cue': cue.color,
      };
    },
  },
};
</script>

<style scoped>
.show_map {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  background: var(--primary-light) var(--idle-stripes);
}

.show_map h3 {
  font-family: Roboto-Bold, sans-serif;
  font-size: 12px;
  text-transform: uppercase;
}

.show_map h4 {
  display: block;
  margin: 10px 0 6px;
  font-family: Roboto-Bold, sans-serif;
  font-size: 11px;
  color: var(--secondary-light);
}

.show_map_show,
.show_map_block header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.show_map_show {
  padding: 10px 12px;
  border-radius: 4px;
  background: var(--primary-dark);
}

.show_map_block {
  padding: 10px 12px 12px;
  border-top: 3px solid var(--tint, var(--secondary-dark));
  border-radius: 4px;
  background: var(--primary-dark);
}

.show_map_block.master {
  --tint: var(--secondary-light);
}

.show_map_groups {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
}

.show_map_icon {
  width: 14px !important;
  height: 14px !important;
  flex: none;
}

.show_map_meta {
  margin-left: auto;
  font-family: Roboto-Regular, sans-serif;
  font-size: 11px;
  color: var(--secondary-light);
}

.show_map_rows {
  margin: 8px 0 0;
  padding: 0;
  list-style: none;
}

.show_map_rows li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 0;
  border-top: 1px solid var(--primary-light);
  font-family: Roboto-Medium, sans-serif;
  font-size: 12px;
}

.show_map_name {
  color: var(--secondary-lighter);
}

.show_map_chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.show_map_chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  border-left: 3px solid var(--cue, var(--secondary-dark));
  border-radius: 3px;
  background: var(--primary-light);
  font-family: Roboto-Medium, sans-serif;
  font-size: 11px;
  color: var(--secondary-lighter);
}

.show_map_chip small {
  color: var(--secondary-light);
}

.show_map_timeline {
  position: relative;
  height: 22px;
  border-radius: 3px;
  --bar: calc(100% / var(--bars));
  background: repeating-linear-gradient(
    90deg,
    var(--primary-light) 0 calc(var(--bar) - 1px),
    var(--primary-lighter) calc(var(--bar) - 1px) var(--bar)
  );
}

.show_map_item {
  position: absolute;
  top: 2px;
  bottom: 2px;
  overflow: hidden;
  padding: 0 6px;
  border-radius: 2px;
  background: var(--cue);
  font-family: Roboto-Bold, sans-serif;
  font-size: 10px;
  line-height: 18px;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--primary-dark);
}

.show_map_loading {
  padding: 24px;
  font-size: 13px;
  text-align: center;
  color: var(--secondary-dark);
}
</style>
