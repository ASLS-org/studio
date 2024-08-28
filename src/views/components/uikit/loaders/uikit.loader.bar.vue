<template>
  <div class="uikit_loader_bar" />
</template>

<script>
export default {
  name: 'UkLoaderBar',
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
      default: null,
    },
  },
};
</script>

<style scoped>
.uikit_loader_bar {
  width: 100%;
  height: 16px;
  border-radius: 8px;
}
</style>
