<template>
  <div id="app">
    <!-- <router-view /> -->
    <app-activity />
  </div>
</template>

<script>
import AppActivity from './views/activities/app/app.activity.vue';

export default {
  name: 'App',
  components: {
    AppActivity,
  },
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
};
</script>

<style>
 .v-application--wrap{
     min-height: 100%!important;
     position: relative;
 }
</style>
