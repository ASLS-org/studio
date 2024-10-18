<template>
  <uk-popup
    v-model="state"
    :valid="fixture.loaded && !patchError && !loading"
    :header="headerData"
    @submit="patchFixtures"
    @input="update()"
  >
    <uk-flex class="patch_popup">
      <uk-list
        class="fixture_list"
        :items="fixtures"
        filterable
        @select="loadFixture"
      />
      <uk-flex
        col
        class="patch_form"
      >
        <div style="padding: 10px">
          <uk-flex
            :gap="8"
            class="patch_form_section"
          >
            <uk-txt-input
              v-model="fixture.name"
              :disabled="!fixture.loaded || loading"
              style="flex: 1"
              label="Name"
            />
            <uk-num-input
              v-model="fixture.universe"
              disabled
              class="field"
              label="Universe"
              @input="autoPatch"
            />
          </uk-flex>
          <uk-flex
            :gap="8"
            class="patch_form_section"
          >
            <uk-select-input
              v-model="fixture.mode"
              :disabled="!fixture.loaded || loading"
              style="flex: 1"
              label="Fixture mode"
              :options="fixture.modeNames"
            />
            <uk-num-input
              v-model="chStart"
              :disabled="!fixture.loaded || loading"
              class="field"
              label="Address"
              :min="0"
              :max="512"
              @input="checkPatch"
            />
            <uk-num-input
              v-model="amount"
              :disabled="!fixture.loaded || loading"
              class="field"
              label="Amount"
              :min="1"
              :max="512"
              @input="autoPatch"
            />
            <uk-num-input
              v-model="chStop"
              disabled
              class="field"
              label="Stop"
            />
          </uk-flex>
          <uk-flex
            :gap="8"
            class="patch_form_section"
          >
            <uk-txt-input
              v-model="fixture.category"
              readonly
              :disabled="!fixture.loaded || loading"
              class="field"
              style="flex: 1"
              label="Fixture type"
            />
          </uk-flex>
          <uk-flex
            :gap="8"
            class="patch_form_section"
          >
            <div style="margin-right: 16px">
              <uk-flex
                :gap="8"
                class="patch_form_subsection"
              >
                <uk-num-input
                  v-model="fixture.position.x"
                  label="Pos X"
                  :min="-1000"
                  :max="1000"
                  :disabled="!fixture.loaded || loading"
                  class="field"
                />
                <uk-num-input
                  v-model="fixture.position.y"
                  label="Pos Y"
                  :min="-1000"
                  :max="1000"
                  :disabled="!fixture.loaded || loading"
                  class="field"
                />
                <uk-num-input
                  v-model="fixture.position.z"
                  label="Pos Z"
                  :min="-1000"
                  :max="1000"
                  :disabled="!fixture.loaded || loading"
                  class="field"
                />
              </uk-flex>
            </div>
            <div>
              <uk-flex
                :gap="8"
                class="patch_form_subsection"
              >
                <uk-num-input
                  v-model="positionOffsets.x"
                  label="Offset X"
                  :min="-1000"
                  :max="1000"
                  :disabled="!fixture.loaded || loading || amount <= 1"
                  class="field"
                />
                <uk-num-input
                  v-model="positionOffsets.y"
                  label="Offset Y"
                  :min="-1000"
                  :max="1000"
                  :disabled="!fixture.loaded || loading || amount <= 1"
                  class="field"
                />
                <uk-num-input
                  v-model="positionOffsets.z"
                  label="Offset Z"
                  :min="-1000"
                  :max="1000"
                  :disabled="!fixture.loaded || loading || amount <= 1"
                  class="field"
                />
              </uk-flex>
            </div>
          </uk-flex>
          <uk-flex
            :gap="8"
            class="patch_form_section"
          >
            <div style="margin-right: 16px">
              <uk-flex
                :gap="8"
                class="patch_form_subsection"
              >
                <uk-num-input
                  v-model="fixture.rotation.x"
                  label="°Rot X"
                  :max="360"
                  :disabled="!fixture.loaded || loading"
                  class="field"
                />
                <uk-num-input
                  v-model="fixture.rotation.y"
                  label="°Rot Y"
                  :max="360"
                  :disabled="!fixture.loaded || loading"
                  class="field"
                />
                <uk-num-input
                  v-model="fixture.rotation.z"
                  label="°Rot Z"
                  :max="360"
                  :disabled="!fixture.loaded || loading"
                  class="field"
                />
              </uk-flex>
            </div>
            <div>
              <uk-flex
                :gap="8"
                class="patch_form_subsection"
              >
                <uk-num-input
                  v-model="rotationOffsets.x"
                  label="°Offset X"
                  :max="360"
                  :disabled="!fixture.loaded || loading || amount <= 1"
                  class="field"
                />
                <uk-num-input
                  v-model="rotationOffsets.y"
                  label="°Offset Y"
                  :max="360"
                  :disabled="!fixture.loaded || loading || amount <= 1"
                  class="field"
                />
                <uk-num-input
                  v-model="rotationOffsets.z"
                  label="°Offset Z"
                  :max="360"
                  :disabled="!fixture.loaded || loading || amount <= 1"
                  class="field"
                />
              </uk-flex>
            </div>
          </uk-flex>
          <uk-spacer />
          <p
            v-show="patchError"
            class="patch_error"
          >
            Patch error: The provided fixture settings are out of universe's range
          </p>
        </div>
        <uk-spacer />
      </uk-flex>
    </uk-flex>
  </uk-popup>
</template>

<script>
import PopupMixin from '@/views/mixins/popup.mixin';

const NO_FIXTURE_STR = 'No fixture model selected';
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
  name: 'UkPopupPatch',
  mixins: [PopupMixin],
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  props: {
    universe: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      headerData: { title: 'Patch fixture' },
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
  computed: {
    count() {
      if (this.fixture.modes[this.fixture.mode]) {
        return this.fixture.modes[this.fixture.mode].length - 1;
      }
      return 0;
    },
  },
  watch: {
    state(state) {
      if (state) {
        this.init();
      }
    },
  },
  mounted() {
    this.init();
  },
  methods: {
    /**
     * Initialise popup variables
     *
     * @public
     */
    init() {
      this.fixtures = this.prepareFixtures();
      this.fixture = JSON.parse(JSON.stringify(DEFAULT_FIXTURE_DATA));
      this.amount = DEFAULT_FIXTURE_AMOUNT;
      this.positionOffsets = { x: 0, y: 0, z: 0 };
      this.rotationOffsets = { x: 0, y: 0, z: 0 };
      this.chStop = 0;
      this.patchError = false;
    },
    /**
     * Patch selected fixture using provided form parameters.
     *
     * @public
     */
    // eslint-disable-next-line consistent-return
    patchFixtures() {
      if (this.fixture.loaded && !this.patchError) {
        this.loading = true;
        const fixtures = [];
        if (this.checkPatch()) {
          try {
            const position_tmp = {};
            const rotation_tmp = {};
            const chCount = this.fixture.modes[this.fixture.mode].channels.length;
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
              const fixture = this.$show.fixturePool.addRaw(
                JSON.parse(
                  JSON.stringify(this.fixture),
                ),
              );
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
          throw new Error('Out of universe bounds');
        }
      }
    },
    /**
     * Loads selected fixture configuration file
     *
     * @public
     * @async
     */
    async loadFixture(item) {
      const { manufacturer } = item;
      const { fixture } = item;
      const res = await this.$http.get(`${import.meta.env.VITE_STATIC_URL}/fixtures/${manufacturer.name}/${fixture}`);
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
    /**
     * Checks that provided patch configuration is valid
     *
     * @public
     */
    checkPatch() {
      const chCount = this.fixture.modes[this.fixture.mode].channels.length;
      if (this.universe.canPatchMany(this.chStart, chCount, this.amount)) {
        this.patchError = false;
        this.chStop = chCount * this.amount + this.chStart;
        return true;
      }
      this.patchError = true;
      return false;
    },
    /**
     * Automatically patches fixture within available universe address space.
     *
     * @public
     */
    autoPatch() {
      const chCount = this.fixture.modes[this.fixture.mode].channels.length;
      const chStart = this.universe.findChStartAutoPatch(chCount, this.amount);
      this.chStop = chCount * this.amount + chStart;
      if (chStart > -1) {
        this.patchError = false;
        this.chStart = chStart;
      } else {
        this.patchError = true;
      }
    },
    /**
     * Prepare fixture list
     *
     * @todo this shouldn't be called in a watcher. it might (and does) waste event loop time.
     * @public
     */
    prepareFixtures() {
      return this.$show.rawOFLFixtures.map((manufacturer) => ({
        name: manufacturer.name,
        icon: 'folder',
        unfold: manufacturer.fixtures.map((fixture) => ({
          name: fixture,
          icon: 'wave',
          manufacturer,
          fixture,
        })),
      }));
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
