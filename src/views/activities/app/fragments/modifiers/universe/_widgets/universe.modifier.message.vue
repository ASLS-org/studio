<template>
  <div
    class="universe_message"
    :class="level"
  >
    <slot />
  </div>
</template>

<script>
/**
 * @component UniverseMessage An error or a warning about a patch, shown in the patch and repatch
 * popups
 */
export default {
  name: 'UniverseModifierMessage',
  compatConfig: {
    MODE: 3,
  },
  props: {
    /**
     * 'error' (red) or 'warning' (gold)
     */
    level: {
      type: String,
      default: 'error',
    },
  },
};
</script>

<style scoped>
.universe_message {
  font-family: Roboto-Regular;
  font-size: var(--font-sm);
  line-height: 1.4;
  white-space: normal;
  padding: var(--space-3) var(--space-4);
  border-left: 3px solid;
  border-radius: var(--radius-sm);
  color: var(--secondary-lighter);
}
.universe_message.error {
  border-color: var(--accent-red);
  background: color-mix(in srgb, var(--accent-red) 14%, transparent);
}
.universe_message.warning {
  border-color: var(--accent-gold);
  background: color-mix(in srgb, var(--accent-gold) 10%, transparent);
}
</style>
