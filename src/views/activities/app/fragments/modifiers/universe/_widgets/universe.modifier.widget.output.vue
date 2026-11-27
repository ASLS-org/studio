<template>
  <uk-widget
    class="universe_output"
    :header="{ title: 'Output', icon: 'connection' }"
    :action="{
      icon: 'connection',
      text: 'outputs',
      title: 'Opens Outputs: gateways and routes',
      callback: () => openOutputs(null),
    }"
    dockable
  >
    <uk-list
      v-if="universe"
      :items="rows"
      toggleable
      no-highlight
      empty-text="Not sent anywhere"
      @toggle="setEnabled"
      @select="(item) => openOutputs(item.id)"
    />
    <outputs-popup
      v-model="outputsPopupState"
      :focus="focus"
    />
  </uk-widget>
</template>

<script>
import modal from '@/views/mixins/modal.mixin';
import { PROTOCOL_LABELS, universeLabel } from '@/models/DMX/route.model';
import OutputsPopup from '@/views/activities/app/fragments/toolbar/_popups/outputs/popup.outputs.vue';

/**
 * @component A universe's routes (where it is sent): each with its On check; a route opens
 * Outputs on it, and the header's OUTPUTS opens Outputs on the universe.
 */
export default {
  name: 'UniverseModifierWidgetOutput',
  compatConfig: {
    MODE: 3,
  },
  components: {
    OutputsPopup,
  },
  props: {
    /**
     * The universe in view
     */
    universe: { type: Object, default: null },
  },
  data() {
    return {
      /**
       * What the Outputs popup selects when it opens
       */
      focus: null,
    };
  },
  computed: {
    /**
     * Outputs popup display state
     */
    outputsPopupState: modal('universe.outputs', 'universe'),
    pool() {
      return this.$show.outputPool;
    },
    routes() {
      return this.universe ? this.pool.routesOf(this.universe.id) : [];
    },
    rows() {
      return this.routes.map((r) => {
        const gateway = this.pool.outputs.find((g) => g.id === r.gatewayId);
        return {
          id: r.id,
          name: `${PROTOCOL_LABELS[r.protocol]} ${universeLabel(r.protocol, r.universeNumber)}`,
          more: `${r.destinationLabel} · ${gateway?.name ?? 'no gateway'}`,
          active: r.enabled,
        };
      });
    },
  },
  methods: {
    /**
     * Turns the routes on or off from their checks
     *
     * @param {Object[]} checked the checked rows
     */
    setEnabled(checked) {
      const on = new Set(checked.map((row) => row.id));
      this.routes.forEach((route) => {
        if (route.enabled !== on.has(route.id)) route.enabled = on.has(route.id);
      });
      this.$show.refreshSaveState();
    },
    /**
     * Opens Outputs on a route, else on this universe
     *
     * @param {?Number} routeId
     */
    openOutputs(routeId) {
      this.focus = routeId !== null
        ? { kind: 'route', id: routeId }
        : { kind: 'universe', id: this.universe.id };
      this.outputsPopupState = true;
    },
  },
};
</script>

<style scoped>
.universe_output {
  min-width: var(--widget-width-md);
}
</style>
