<template>
  <uk-flex
    :style="{background: color}"
    class="uikit_vumeter"
  />
</template>

<script>
export default {
  name: 'UkVumeter',
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  props: {
    value: {
      type: Number,
      default: 0,
    },
    color: {
      type: String,
      default: 'var(--accent-maroon)',
    },
  },
  data() {
    return {
      content: this.value,
    };
  },
  watch: {
  },
  mounted() {
  },
  methods: {
  },
};
</script>

<style scoped>

.uikit_vumeter {
  align-items: center;
  justify-content: center;
  width: 12px;
  height: 100%;
  background: var(--primary-dark);
  background-image:
    linear-gradient(
      var(--primary-dark) 0%,
      var(--primary-dark) 50%,
    rgba(43, 43, 189, 0.774) 50%,
    rgba(43, 43, 189, 0.774) 100%
    );
  border-radius: 8px;
  box-shadow: inset 2px 2px 2px black;
}
</style>
