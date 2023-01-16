<template>
  <uk-popup :valid="fixture.loaded && !patchError && !loading" @submit="patchFixtures" @input="update()" v-model="state" :header="headerData">
    <uk-flex class="patch_popup">
      <uk-list class="fixture_list" @select="loadFixture" :items="fixtures" filterable />
      <uk-flex col class="patch_form">
        <div style="padding: 10px">
          <uk-flex :gap="8" class="patch_form_section">
            <uk-txt-input :disabled="!fixture.loaded || loading" style="flex: 1" label="Name" v-model="fixture.name" />
            <uk-num-input disabled class="field" label="Universe" v-model="fixture.universe" @input="autoPatch" />
          </uk-flex>
          <uk-flex :gap="8" class="patch_form_section">
            <uk-select-input
              :disabled="!fixture.loaded || loading"
              style="flex: 1"
              label="Fixture mode"
              :options="fixture.modeNames"
              v-model="fixture.mode"
            />
            <uk-num-input
              :disabled="!fixture.loaded || loading"
              class="field"
              label="Address"
              :min="0"
              :max="512"
              v-model="chStart"
              @input="checkPatch"
            />
            <uk-num-input
              :disabled="!fixture.loaded || loading"
              class="field"
              label="Amount"
              v-model="amount"
              :min="1"
              :max="512"
              @input="autoPatch"
            />
            <uk-num-input disabled class="field" label="Stop" v-model="chStop" />
          </uk-flex>
          <uk-flex :gap="8" class="patch_form_section">
            <uk-txt-input
              readonly
              :disabled="!fixture.loaded || loading"
              class="field"
              style="flex: 1"
              label="Fixture type"
              v-model="fixture.category"
            />
          </uk-flex>
          <uk-flex :gap="8" class="patch_form_section">
            <div style="margin-right: 16px">
              <uk-flex :gap="8" class="patch_form_subsection">
                <uk-num-input
                  label="Pos X"
                  :min="-1000"
                  :max="1000"
                  :disabled="!fixture.loaded || loading"
                  class="field"
                  v-model="fixture.position.x"
                />
                <uk-num-input
                  label="Pos Y"
                  :min="-1000"
                  :max="1000"
                  :disabled="!fixture.loaded || loading"
                  class="field"
                  v-model="fixture.position.y"
                />
                <uk-num-input
                  label="Pos Z"
                  :min="-1000"
                  :max="1000"
                  :disabled="!fixture.loaded || loading"
                  class="field"
                  v-model="fixture.position.z"
                />
              </uk-flex>
            </div>
            <div>
              <uk-flex :gap="8" class="patch_form_subsection">
                <uk-num-input
                  label="Offset X"
                  :min="-1000"
                  :max="1000"
                  :disabled="!fixture.loaded || loading || amount <= 1"
                  class="field"
                  v-model="positionOffsets.x"
                />
                <uk-num-input
                  label="Offset Y"
                  :min="-1000"
                  :max="1000"
                  :disabled="!fixture.loaded || loading || amount <= 1"
                  class="field"
                  v-model="positionOffsets.y"
                />
                <uk-num-input
                  label="Offset Z"
                  :min="-1000"
                  :max="1000"
                  :disabled="!fixture.loaded || loading || amount <= 1"
                  class="field"
                  v-model="positionOffsets.z"
                />
              </uk-flex>
            </div>
          </uk-flex>
          <uk-flex :gap="8" class="patch_form_section">
            <div style="margin-right: 16px">
              <uk-flex :gap="8" class="patch_form_subsection">
                <uk-num-input label="°Rot X" :max="360" :disabled="!fixture.loaded || loading" class="field" v-model="fixture.rotation.x" />
                <uk-num-input label="°Rot Y" :max="360" :disabled="!fixture.loaded || loading" class="field" v-model="fixture.rotation.y" />
                <uk-num-input label="°Rot Z" :max="360" :disabled="!fixture.loaded || loading" class="field" v-model="fixture.rotation.z" />
              </uk-flex>
            </div>
            <div>
              <uk-flex :gap="8" class="patch_form_subsection">
                <uk-num-input
                  label="°Offset X"
                  :max="360"
                  :disabled="!fixture.loaded || loading || amount <= 1"
                  class="field"
                  v-model="rotationOffsets.x"
                />
                <uk-num-input
                  label="°Offset Y"
                  :max="360"
                  :disabled="!fixture.loaded || loading || amount <= 1"
                  class="field"
                  v-model="rotationOffsets.y"
                />
                <uk-num-input
                  label="°Offset Z"
                  :max="360"
                  :disabled="!fixture.loaded || loading || amount <= 1"
                  class="field"
                  v-model="rotationOffsets.z"
                />
              </uk-flex>
            </div>
          </uk-flex>
          <uk-spacer />
          <p class="patch_error" v-show="patchError">Patch error: The provided fixture settings are out of universe's range</p>
        </div>
        <uk-spacer />
      </uk-flex>
    </uk-flex>
  </uk-popup>
</template>

<script>
import PopupMixin from "@/views/mixins/popup.mixin.js";

const NO_FIXTURE_STR = "No fixture model selected";
const DEFAULT_FIXTURE_AMOUNT = 1;
const DEFAULT_FIXTURE_DATA = {
  name: NO_FIXTURE_STR,
  modeNames: [NO_FIXTURE_STR],
  category: NO_FIXTURE_STR,
  modes: [{}],
  chStart: 0,
  universe: 0,
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  mode: 0,
  loaded: false,
};

export default {
  name: "ukPopupPatch",
  mixins: [PopupMixin],
  props: {
    universe: Object,
  },
  data() {
    return {
      headerData: { title: "Patch fixture" },
      fixtures: [],
      fixture: JSON.parse(JSON.stringify(DEFAULT_FIXTURE_DATA)),
      amount: DEFAULT_FIXTURE_AMOUNT,
      positionOffsets: { x: 0, y: 0, z: 0 },
      rotationOffsets: { x: 0, y: 0, z: 0 },
      chStop: 0,
      chStart: 0,
      patchError: false,
      loading: false,
    };
  },
  methods: {
    init() {
      this.fixtures = this.prepareFixtures();
      this.fixture = JSON.parse(JSON.stringify(DEFAULT_FIXTURE_DATA));
      this.amount = DEFAULT_FIXTURE_AMOUNT;
      this.positionOffsets = { x: 0, y: 0, z: 0 };
      this.rotationOffsets = { x: 0, y: 0, z: 0 };
      this.chStop = 0;
      this.state = this.value;
      this.patchError = false;
    },
    patchFixtures() {
      if (this.fixture.loaded && !this.patchError) {
        this.loading = true;
        let fixtures = [];
        if (this.checkPatch()) {
          try {
            let position_tmp = {};
            let rotation_tmp = {};
            let chCount = this.fixture.modes[this.fixture.mode].channels.length;
            Object.assign(position_tmp, this.fixture.position);
            Object.assign(rotation_tmp, this.fixture.rotation);
            for (let i = 0; i < this.amount; i++) {
              this.fixture.chStart = i * chCount + this.chStart;
              this.fixture.position = {
                x: position_tmp.x + this.positionOffsets.x * i,
                y: position_tmp.y + this.positionOffsets.y * i,
                z: position_tmp.z + this.positionOffsets.z * i,
              };
              this.fixture.rotation = {
                x: rotation_tmp.x + this.rotationOffsets.x * i,
                y: rotation_tmp.y + this.rotationOffsets.y * i,
                z: rotation_tmp.z + this.rotationOffsets.z * i,
              };
              let fixture = this.$show.fixturePool.addRaw(JSON.parse(JSON.stringify(this.fixture)));
              this.universe.patchFixture(fixture);
            }
            this.loading = false;
            this.close();
            return fixtures;
          } catch (err) {
            this.loading = false;
            throw err;
          }
        } else {
          this.loading = false;
          throw new Error("Out of universe bounds");
        }
      }
    },
    async loadFixture(item) {
      let manufacturer = item.manufacturer;
      let fixture = item.fixture;
      let res = await this.$http.get(`/fixtures/${manufacturer.name}/${fixture}`);
      Object.assign(this.fixture, {
        OFLData: res.data,
        modes: res.data.modes,
        modeNames: res.data.modes.map((mode) => mode.name),
        name: res.data.name,
        model: fixture,
        manufacturer: manufacturer.name,
        category: res.data.categories[0],
        loaded: true,
      });
      this.patchError = false;
      this.autoPatch();
    },
    checkPatch() {
      let chCount = this.fixture.modes[this.fixture.mode].channels.length;
      if (this.universe.canPatchMany(this.chStart, chCount, this.amount)) {
        this.patchError = false;
        this.chStop = chCount * this.amount + this.chStart;
        return true;
      } else {
        this.patchError = true;
        return false;
      }
    },
    autoPatch() {
      let chCount = this.fixture.modes[this.fixture.mode].channels.length;
      let chStart = this.universe.findChStartAutoPatch(chCount, this.amount);
      this.chStop = chCount * this.amount + chStart;
      if (chStart > -1) {
        this.patchError = false;
        this.chStart = chStart;
      } else {
        this.patchError = true;
      }
    },
    prepareFixtures() {
      return this.$show.rawOFLFixtures.map((manufacturer) => {
        return {
          name: manufacturer.name,
          icon: "folder",
          unfold: manufacturer.fixtures.map((fixture) => {
            return {
              name: fixture,
              icon: "wave",
              manufacturer: manufacturer,
              fixture: fixture,
            };
          }),
        };
      });
    },
  },
  computed: {
    count() {
      if (this.fixture.modes[this.fixture.mode]) {
        return this.fixture.modes[this.fixture.mode].length - 1;
      } else {
        return 0;
      }
    },
  },
  mounted() {
    this.prepareFixtures();
  },
  watch: {
    state(state) {
      if (state) {
        this.init();
      }
    },
  },
};
</script>

<style scoped>
.patch_popup {
  height: 100%;
}
.patch_form {
  min-width: 340px;
}
.patch_form_subsection {
  margin-bottom: unset;
}
.fixture_list {
  height: 350px;
  width: 300px;
  max-height: 350px;
  overflow: hidden;
  border-right: 1px solid var(--primary-dark);
}
.field {
  display: flex;
  flex-direction: column;
  margin-bottom: 8px;
  width: 55px;
}
.field_label {
  margin-bottom: 8px;
}
.patch_button {
  margin-left: 8px;
}
.patch_error {
  color: #ce3d3db3;
}
h4 {
  margin-bottom: 8px;
}
.form_validation {
  display: flex;
  border-top: 1px solid var(--primary-dark);
  padding: 8px;
  width: 100%;
}
</style>
