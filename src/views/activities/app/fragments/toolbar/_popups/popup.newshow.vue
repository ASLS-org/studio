<template>
  <uk-popup
    @submit="submit()"
    :validateTxt="isSaved ? 'create' : 'yes'"
    :cancelTxt="isSaved ? 'cancel' : 'no'"
    :onCancel="handleCancel"
    :valid="!isSaved || name != ''"
    backdrop
    :movable="false"
    @input="update()"
    v-model="state"
    :header="headerData"
  >
    <div class="body">
      <Transition name="slide">
        <span :key="0" v-if="!isSaved">
          <p>Modifications applied to the current project will be lost. Do you wish to export a copy of the current project's showfile ?</p>
        </span>
        <span :key="1" v-else>
          <uk-txt-input v-model="name" label="Project Name" placeholder="project name" />
        </span>
      </Transition>
    </div>
    <saveas-popup v-model="saveasPopupDisplayState" />
  </uk-popup>
</template>
<style scoped>
.slide-leave-active,
.slide-enter-active {
  transition: 0.25s;
}
.slide-enter {
  position: absolute;
  transform: translate(100%, 0);
}
.slide-leave-to {
  position: absolute;
  transform: translate(-100%, 0);
}
</style>
<script>
import SaveasPopup from "./popup.saveas.vue";
import PopupMixin from "@/views/mixins/popup.mixin.js"

export default {
  name: "ukPopupNewshow",
  components: {
    SaveasPopup,
  },
  mixins: [PopupMixin],
  props: {
    error: [Error, Object],
  },
  data() {
    return {
      /**
       * Popup header data
       */
      headerData: { title: "Save Project" },
      /**
       * New project name
       */
      name: "",
      /**
       * Show exported/saved flag.
       * Used to transition between save/export and create states
       */
      isSaved: false,
      /**
       * Save as popup display state
       */
      saveasPopupDisplayState: false,
    };
  },
  methods: {
    /**
     * Submit new project creation
     * 
       * @public
     */
    submit() {
      if (!this.isSaved) {
        this.saveasPopupDisplayState = true;
        this.isSaved = true;
        this.headerData = { title: "New Project" };
      } else {
        this.$show.setupNewProject(this.name);
        this.$router.push("/").then(() => {
          this.state = false;
          this.isSaved = false;
          this.name = "";
          this.update();
          this.$router.push("/universe/0");
        });
      }
    },
    /**
     * Handle cancellation. for both first and second phase
     * (save actual project or create new project)
     * 
       * @public
     */
    handleCancel() {
      if (!this.isSaved) {
        this.isSaved = true;
      } else {
        this.state = false;
        this.update();
      }
    },
  },
  watch: {
    value(state) {
      this.state = state;
      this.isSaved = false;
      this.name = "";
      this.saveasPopupDisplayState = false;
    },
  },
};
</script>

<style scoped>
.body {
  display: flex;
  flex-direction: column;
  width: 300px;
  padding: 16px;
}
</style>
