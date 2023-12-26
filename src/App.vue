<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<script>
export default {
  name: 'App',
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  components: {}
}
</script>

<style>
 .v-application--wrap{
     min-height: 100%!important;
     position: relative;
 }
</style>
