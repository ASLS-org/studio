<template>
  <uk-flex class="modifier">
    <!-- <keep-alive> -->
      <router-view ref="modifier"/>
    <!-- </keep-alive> -->
  </uk-flex>
</template>

<script>
export default {
  name: "modifierFragment",
};
</script>

<style scoped>
.modifier {
  position: relative;
  max-height: 220px;
  min-height: 220px;
  height: 220px;
  width: 100%;
  background: var(--primary-light) repeating-linear-gradient(45deg, #1619130a, #1619130a 10px, #0c0e0a38 10px, #0c0e0a38 20px);
  border-top: 1px solid var(--primary-dark);
  overflow: hidden;
  overflow-x: auto;
  z-index: 20;
}
</style>
