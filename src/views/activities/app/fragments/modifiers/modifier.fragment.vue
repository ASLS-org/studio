<template>
  <uk-flex class="modifier">
    <group-modifier v-show="$view.panel === 'group'" />
    <universe-modifier v-show="$view.panel === 'universe'" />
    <chase-modifier v-show="$view.panel === 'chase'" />
  </uk-flex>
</template>

<script>
import GroupModifier from '@/views/activities/app/fragments/modifiers/group/group.modifier.fragment.vue';
import UniverseModifier from '@/views/activities/app/fragments/modifiers/universe/universe.modifier.fragment.vue';
import ChaseModifier from '@/views/activities/app/fragments/modifiers/chase/chase.modifier.fragment.vue';

export default {
  name: 'ModifierFragment',
  compatConfig: {
    MODE: 3,
  },
  components: {
    GroupModifier,
    UniverseModifier,
    ChaseModifier,
  },
};
</script>

<style scoped>
.modifier {
  position: relative;
  flex: 1;
  width: 100%;
  background: var(--primary-light) var(--idle-stripes);
  border-top: 1px solid var(--primary-dark);
  overflow: hidden;
  overflow-x: auto;
  z-index: 20;
}
</style>
