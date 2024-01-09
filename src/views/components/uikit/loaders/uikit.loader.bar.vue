<template>
  <div class="uikit_loader_bar" />
</template>

<script>
export default {
  name: "ukLoaderBar",
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  props: {
    value: Number,
    color: String,
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
