<template>
  <uk-popup
    v-model="state"
    :valid="fixture.loaded && !patchError && !loading"
    :header="headerData"
    @submit="patchFixtures"
    @input="update()"
  >
    <uk-flex class="patch_popup">
      <uk-flex
        col
        class="fixture_sources"
        :class="{ dragging }"
        @dragover.prevent="dragging = true"
        @dragleave="dragging = false"
        @drop.prevent="dropFiles"
      >
        <uk-list
          class="fixture_list"
          :items="fixtures"
          filterable
          @select="loadFixture"
        />
        <div class="import_bar">
          <uk-button
            square
            icon="library"
            label="Import GDTF…"
            :disabled="importing"
            style="width: 100%; height: 25px"
            @click="$refs.gdtfFiles.click()"
          />
          <input
            ref="gdtfFiles"
            type="file"
            accept=".gdtf"
            multiple
            hidden
            @change="pickFiles"
          >
        </div>
      </uk-flex>
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
import EventBus from '@/plugins/eventbus';
import FixtureLibrary from '@/models/fixtures/fixture.library';
import { PROFILE_SOURCES } from '@/models/fixtures/fixture.profile';

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
      importing: false,
      dragging: false,
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
      this.refreshFixtures();
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
              const fixture = this.$show.fixturePool.addRaw({
                profile: this.fixture.profile,
                manufacturer: this.fixture.manufacturer,
                model: this.fixture.model,
                name: this.fixture.name,
                category: this.fixture.category,
                mode: this.fixture.modeNames[this.fixture.mode],
                universe: this.fixture.universe,
                chStart: this.fixture.chStart,
                position: { ...this.fixture.position },
                rotation: { ...this.fixture.rotation },
              });
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
      if (!item || !item.fixture) return;
      const { source, manufacturer, fixture } = item;
      const profile = await FixtureLibrary.getProfile(source, manufacturer, fixture);
      Object.assign(this.fixture, {
        profile,
        modes: profile.modes,
        modeNames: profile.modes.map((mode) => mode.name),
        name: profile.name,
        model: profile.model,
        manufacturer: profile.manufacturer,
        category: profile.category,
        mode: 0,
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
     * Lists the fixtures to patch: imported GDTF fixtures (this device's library), bundled GDTF
     * fixtures, then the OFL library by manufacturer
     *
     * @public
     * @async
     */
    async refreshFixtures() {
      const gdtfItem = (f) => ({
        name: f.name,
        more: f.manufacturer,
        icon: 'wave',
        source: PROFILE_SOURCES.GDTF,
        manufacturer: f.manufacturer,
        fixture: f.fixtureTypeId,
      });
      const { imported, bundled } = await FixtureLibrary.listGDTF();
      const ofl = this.$show.rawOFLFixtures.map((manufacturer) => ({
        name: manufacturer.name,
        icon: 'folder',
        unfold: manufacturer.fixtures.map((fixture) => ({
          name: fixture,
          icon: 'wave',
          source: PROFILE_SOURCES.OFL,
          manufacturer: manufacturer.name,
          fixture,
        })),
      }));
      this.fixtures = [
        { name: 'Imported (GDTF)', icon: 'library', unfold: imported.map(gdtfItem) },
        { name: 'Bundled (GDTF)', icon: 'library', unfold: bundled.map(gdtfItem) },
        ...ofl,
      ];
    },
    /**
     * Imports `.gdtf` files into this device's fixture library, then refreshes the list. A file
     * that is not a usable GDTF fixture is reported and skipped.
     *
     * @public
     * @async
     * @param {Array<File>} files Picked or dropped files
     */
    async importFiles(files) {
      this.importing = true;
      try {
        for (let i = 0; i < files.length; i++) {
          try {
            await FixtureLibrary.importGDTF(await files[i].arrayBuffer());
          } catch (error) {
            EventBus.emit('app_error', new Error(`${files[i].name}: ${error.message}`));
          }
        }
        await this.refreshFixtures();
      } finally {
        this.importing = false;
      }
    },
    /**
     * Imports the files picked with the Import GDTF button
     *
     * @public
     * @param {Event} event File input change event
     */
    pickFiles(event) {
      const files = [...event.target.files];
      event.target.value = '';
      this.importFiles(files);
    },
    /**
     * Imports the `.gdtf` files dropped on the fixture list
     *
     * @public
     * @param {DragEvent} event Drop event
     */
    dropFiles(event) {
      this.dragging = false;
      const files = [...event.dataTransfer.files].filter((f) => /\.gdtf$/i.test(f.name));
      if (files.length) this.importFiles(files);
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
.fixture_sources {
  width: 300px;
  border-right: 1px solid var(--primary-dark);
}
.fixture_sources.dragging {
  outline: 1px dashed var(--accent-blue);
  outline-offset: -2px;
}
.fixture_list {
  height: 350px;
  width: 300px;
  max-height: 350px;
  overflow: hidden;
}
.import_bar {
  padding: 8px;
  border-top: 1px solid var(--primary-dark);
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
