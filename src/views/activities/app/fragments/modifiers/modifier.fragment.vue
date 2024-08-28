<template>
  <uk-flex class="modifier">
    <group-modifier v-show="modifier === 'Group'" />
    <universe-modifier v-show="modifier === 'Universe'" />
    <chase-modifier v-show="modifier === 'Chase'" />
  </uk-flex>
</template>

<script>
import GroupModifier from '@/views/activities/app/fragments/modifiers/group/group.modifier.fragment.vue';
import UniverseModifier from '@/views/activities/app/fragments/modifiers/universe/universe.modifier.fragment.vue';
import ChaseModifier from '@/views/activities/app/fragments/modifiers/chase/chase.modifier.fragment.vue';

export default {
  name: 'ModifierFragment',
  components: {
    GroupModifier,
    UniverseModifier,
    ChaseModifier,
  },
  data() {
    return {
      modifier: 'Universe',
    };
  },
  watch: {
    '$route.name': function routeNameWatcher(name) {
      this.modifier = name;
    },
  },
};
</script>

<style scoped>
.modifier {
  position: relative;
  max-height: 220px;
  min-height: 220px;
  height: 220px;
  width: 100%;
  background: var(--primary-light) repeating-linear-gradient(
    45deg,
    #1619130a,
    #1619130a 10px,
    #0c0e0a38 10px,
    #0c0e0a38 20px
  );
  border-top: 1px solid var(--primary-dark);
  overflow: hidden;
  overflow-x: auto;
  z-index: 20;
}
</style>
