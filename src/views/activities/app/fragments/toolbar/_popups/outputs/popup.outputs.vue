<template>
  <uk-popup
    v-model="state"
    :header="headerData"
    movable
    backdrop
    :cancelable="false"
    validate-txt="Done"
    @submit="close()"
    @input="update()"
  >
    <uk-flex class="outputs">
      <outputs-flow
        :selection="selection"
        @select="select"
        @delete="remove"
        @add-gateway="addGateway"
        @add-route="addRoute"
      />
      <div class="outputs_side">
        <outputs-side-route
          v-if="page === 'route' && selectedRoute"
          :key="`route-${selectedRoute.id}`"
          :route="selectedRoute"
        />
        <outputs-side-gateway
          v-else-if="page === 'gateway' && selectedGateway"
          :key="`gateway-${selectedGateway.id}`"
          :gateway="selectedGateway"
        />
        <outputs-side-universe
          v-else-if="selectedUniverse"
          :key="`universe-${selectedUniverse.id}`"
          :universe="selectedUniverse"
          @select="select"
        />
      </div>
    </uk-flex>
  </uk-popup>
</template>

<script>
import PopupMixin from '@/views/mixins/popup.mixin';
import OutputsFlow from './outputs.flow.vue';
import OutputsSideGateway from './outputs.side.gateway.vue';
import OutputsSideRoute from './outputs.side.route.vue';
import OutputsSideUniverse from './outputs.side.universe.vue';

/**
 * @component The Outputs workspace: on the left, the signal flow from universes through gateways
 * to destinations, each list keeping its marked row; on the right, the page of the item clicked
 * last. Edits apply at once.
 */
export default {
  name: 'PopupOutputs',
  components: {
    OutputsFlow,
    OutputsSideGateway,
    OutputsSideRoute,
    OutputsSideUniverse,
  },
  mixins: [PopupMixin],
  compatConfig: {
    MODE: 3,
  },
  props: {
    /**
     * Item to open when the popup opens: `{ kind: 'universe' | 'gateway' | 'route', id }`
     */
    focus: { type: Object, default: null },
  },
  data() {
    return {
      headerData: { title: 'Outputs' },
      /**
       * The row marked in each list (the popup's own: these aren't panels)
       */
      selection: { universe: null, gateway: null, route: null },
      /**
       * Whose page shows: 'universe', 'gateway' or 'route'
       */
      page: 'universe',
    };
  },
  computed: {
    pool() {
      return this.$show.outputPool;
    },
    selectedRoute() {
      return this.pool.routes.find((r) => r.id === this.selection.route) || null;
    },
    selectedGateway() {
      return this.pool.outputs.find((g) => g.id === this.selection.gateway) || null;
    },
    selectedUniverse() {
      const { universes } = this.$show.universePool;
      return universes.find((u) => u.id === this.selection.universe) || universes[0] || null;
    },
  },
  watch: {
    state: {
      immediate: true,
      handler(open) {
        if (!open) return;
        if (this.focus) this.select(this.focus);
        // The chain starts marked: the first universe and the first gateway
        const { universe, gateway } = this.selection;
        this.selection = {
          ...this.selection,
          universe: universe ?? this.$show.universePool.universes[0]?.id ?? null,
          gateway: gateway ?? this.pool.outputs[0]?.id ?? null,
        };
      },
    },
  },
  methods: {
    /**
     * Marks an item in its list and opens its page. A route marks its universe and gateway too;
     * a universe or a gateway unmarks the route.
     *
     * @param {Object} item `{ kind, id }`
     */
    select({ kind, id }) {
      if (kind === 'route') {
        const route = this.pool.routes.find((r) => r.id === id);
        this.selection = route
          ? { universe: route.universeId, gateway: route.gatewayId, route: id }
          : { ...this.selection, route: null };
      } else {
        this.selection = { ...this.selection, [kind]: id, route: null };
      }
      this.page = kind;
    },
    /**
     * Adds a gateway (on this computer, port 4515) and opens it
     */
    addGateway() {
      const gateway = this.pool.addRaw({});
      this.select({ kind: 'gateway', id: gateway.id });
      this.$show.refreshSaveState();
    },
    /**
     * Adds an Art-Net route from the marked universe through the marked gateway (else the first
     * ones) and opens it
     */
    addRoute() {
      const gateway = this.selectedGateway || this.pool.outputs[0];
      const universe = this.selectedUniverse;
      if (!gateway || !universe) return;
      const route = this.pool.addRoute({ universe: universe.id, output: gateway.id });
      this.select({ kind: 'route', id: route.id });
      this.$show.refreshSaveState();
    },
    /**
     * Deletes gateways (with their routes) or routes, from the lists' bins
     *
     * @param {Object} what `{ kind, ids }`
     */
    remove({ kind, ids }) {
      if (kind === 'gateway') {
        ids.forEach((id) => {
          const gateway = this.pool.outputs.find((g) => g.id === id);
          if (gateway) this.pool.delete(gateway);
        });
      } else if (kind === 'route') {
        ids.forEach((id) => {
          const route = this.pool.routes.find((r) => r.id === id);
          if (route) this.pool.deleteRoute(route);
        });
      }
      const { route, gateway } = this.selection;
      this.selection = {
        ...this.selection,
        route: this.pool.routes.some((r) => r.id === route) ? route : null,
        gateway: this.pool.outputs.some((g) => g.id === gateway) ? gateway : null,
      };
      if (this.page !== 'universe' && this.selection[this.page] === null) this.page = 'universe';
      this.$show.refreshSaveState();
    },
  },
};
</script>

<style scoped>
.outputs {
  width: 1020px;
  max-width: calc(100vw - 2 * var(--space-8));
  height: calc(16 * var(--row-height));
}
.outputs_side {
  width: 340px;
  flex-shrink: 0;
  overflow-y: auto;
  border-left: var(--border-width) solid var(--primary-dark);
}
</style>
