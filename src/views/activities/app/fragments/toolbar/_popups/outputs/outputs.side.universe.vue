<template>
  <outputs-page
    icon="patch"
    :title="universe.name"
    :text="summary"
    flush
  >
    <!-- Its routes right under the heading, then how to add one -->
    <uk-list
      v-if="rows.length"
      class="outputs_side_list"
      :items="rows"
      colored
      no-highlight
      @select="(item) => $emit('select', { kind: 'route', id: item.id })"
    />
    <outputs-row
      class="outputs_side_hint"
      :label="hint"
      muted
    />
  </outputs-page>
</template>

<script>
import { PROTOCOL_LABELS, universeLabel } from '@/models/DMX/route.model';
import OutputsPage from './outputs.page.vue';
import OutputsRow from './outputs.row.vue';

/**
 * @component The Outputs side page of a universe: where it is sent.
 */
export default {
  name: 'OutputsSideUniverse',
  compatConfig: {
    MODE: 3,
  },
  components: {
    OutputsPage,
    OutputsRow,
  },
  props: {
    /**
     * The universe
     */
    universe: { type: Object, required: true },
  },
  emits: ['select'],
  computed: {
    pool() {
      return this.$show.outputPool;
    },
    routes() {
      return this.pool.routesOf(this.universe.id);
    },
    hint() {
      return 'To send it somewhere: pick a gateway in the middle list, then press Add above '
        + 'Destinations.';
    },
    summary() {
      const n = this.routes.length;
      if (!n) return 'Not sent anywhere yet.';
      return `Sent through ${n} route${n > 1 ? 's' : ''}.`;
    },
    rows() {
      return this.routes.map((r) => {
        const gateway = this.pool.outputs.find((g) => g.id === r.gatewayId);
        return {
          id: r.id,
          name: `${PROTOCOL_LABELS[r.protocol]} ${universeLabel(r.protocol, r.universeNumber)}`,
          color: this.universe.color,
          more: r.enabled ? `${r.destinationLabel} · ${gateway?.name ?? ''}` : 'not forwarding',
        };
      });
    },
  },
};
</script>

<style scoped>
.outputs_side_list {
  height: auto;
  flex: none;
}
.outputs_side_hint {
  margin-top: var(--space-5);
}
</style>
