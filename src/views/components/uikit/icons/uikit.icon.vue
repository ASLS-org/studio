<template>
<span></span>
  <!-- <component class="icon" :is="svgData"/> -->
</template>

<script>
/**
 * @component Icon A quick shortcut component that is able to display css-customisable SVG icons from a list of pre-defined icons.
 * @namespace uikit/icons
 * @story Default {"name":"new"}
 */
export default {
  name: "ukIcon",
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  props: {
    /**
     * Name of the icon as declared within the image folder.
     * @see /images
     */
    name: String,
  },
  computed:{
    /**
     * Dynamically requires SVG asset from local "./images" list.
     * 
     * @property svgData
     */
    svgData(){
      try{
        return require(`./images/${this.name}.svg`);
      }catch(err){
        return require('./images/close.svg');
      }
    }
  }
};
</script>

<style scoped>

.icon {
  width: 16px;
  height: 16px;
}
</style>
