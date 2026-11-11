<template>
  <div
    class="studio_shell asls-scope"
    :class="{ home: isHome, drawer_open: drawerOpen }"
  >
    <!-- Toolbar: Studio's navigation header -->
    <header class="toolbar">
      <button
        class="toolbar_cell toolbar_drawer"
        aria-label="Manual pages"
        @click="drawerOpen = !drawerOpen"
      >
        <h3>Manual</h3>
      </button>
      <a
        class="toolbar_logo"
        :href="withBase('/')"
        title="ASLS Studio"
        aria-label="ASLS Studio manual home"
      >
        <img
          :src="withBase(logo)"
          alt=""
          width="20"
          height="20"
        >
      </a>
      <div class="toolbar_search">
        <ManualSearch @open="searchOpen = true" />
      </div>
      <ManualContentBar
        :section="!isHome && current ? current.section : null"
        :title="current ? current.title : page.title"
        :appearance="appearance"
        :edit-link="isHome ? '' : editLink"
        @appearance="setAppearance"
      />
      <a
        class="toolbar_cell"
        :href="withBase('/introduction/')"
      >
        <uk-icon name="library" />
        <h3>Manual</h3>
      </a>
      <a
        class="toolbar_cell"
        :href="$links.repository"
        target="_blank"
        rel="noreferrer"
      >
        <uk-icon name="opensource" />
        <h3>View on GitHub</h3>
      </a>
      <a
        v-if="$links.demo"
        class="toolbar_cell"
        :href="$links.demo"
        target="_blank"
        rel="noreferrer"
      >
        <uk-icon name="play" />
        <h3>Try live demo</h3>
      </a>
      <a
        v-if="$links.download"
        class="toolbar_cell"
        :href="$links.download"
        target="_blank"
        rel="noreferrer"
      >
        <uk-icon name="export" />
        <h3>Download</h3>
      </a>
    </header>

    <!-- Home: full-bleed content (hero and sections) -->
    <main
      v-if="isHome"
      class="home_main"
    >
      <Content />
    </main>

    <!-- Manual pages: navigation, page, outline -->
    <div
      v-else
      class="workspace"
    >
      <aside class="nav_column">
        <ManualContentBar
          class="drawer_bar"
          :appearance="appearance"
          @appearance="setAppearance"
        />
        <ManualNav
          :sections="sections"
          :current="current ? current.link : ''"
          @open="go"
        />
      </aside>

      <main class="page_column">
        <article
          class="studio_prose"
          :style="current ? { '--section-color': current.section.color } : null"
        >
          <Content v-if="!page.isNotFound" />
          <template v-else>
            <h1>Page not found</h1>
            <p>
              This page doesn't exist or has moved. Pick a page from the list on the left, or
              <a :href="withBase('/introduction/')">start with the introduction</a>.
            </p>
          </template>
        </article>
        <nav
          v-if="prev || next"
          class="page_pager"
          aria-label="Previous and next pages"
        >
          <a
            v-if="prev"
            class="page_pager_link prev"
            :href="withBase(prev.link)"
            :style="{ '--section-color': prev.section.color }"
            @click.prevent="go(prev.link)"
          >
            <svg
              class="page_pager_chevron"
              viewBox="0 0 16 16"
              aria-hidden="true"
            ><path d="M10 3 5 8l5 5" /></svg>
            <span class="page_pager_text">
              <span class="page_pager_kicker">Previous · {{ prev.section.title }}</span>
              <span class="page_pager_title">{{ prev.title }}</span>
            </span>
          </a>
          <span
            v-else
            class="page_pager_empty"
          />
          <a
            v-if="next"
            class="page_pager_link next"
            :href="withBase(next.link)"
            :style="{ '--section-color': next.section.color }"
            @click.prevent="go(next.link)"
          >
            <span class="page_pager_text">
              <span class="page_pager_kicker">Next · {{ next.section.title }}</span>
              <span class="page_pager_title">{{ next.title }}</span>
            </span>
            <svg
              class="page_pager_chevron"
              viewBox="0 0 16 16"
              aria-hidden="true"
            ><path d="m6 3 5 5-5 5" /></svg>
          </a>
        </nav>
      </main>

      <div
        v-if="outline.length"
        class="outline_column"
      >
        <ManualOutline
          :items="outline"
          :active="activeHeading"
          :color="current ? current.section.color : undefined"
          @go="scrollToHeading"
        />
      </div>
    </div>

    <footer
      v-if="!isHome"
      class="app_footer"
    >
      <div class="app_footer_brand">
        <img
          :src="withBase(logo)"
          alt=""
          width="16"
          height="16"
        >
        <h3>ASLS Studio</h3>
        <span
          v-if="theme.version"
          class="app_footer_version"
        >{{ theme.version }}</span>
      </div>
      <span class="toolbar_spacer" />
      <a
        class="app_footer_link"
        :href="$links.license"
        target="_blank"
        rel="noreferrer"
      >Released under the GPL-3.0 license</a>
      <span class="app_footer_made">
        Made with <span class="app_footer_heart">♥</span> by Timé Kadel
      </span>
    </footer>

    <div
      v-if="drawerOpen"
      class="drawer_backdrop"
      @click="drawerOpen = false"
    />

    <component
      :is="searchBox"
      v-if="searchOpen"
      @close="searchOpen = false"
    />
  </div>
</template>

<script>
// eslint-disable-next-line import/no-extraneous-dependencies
import {
  useData, useRoute, useRouter, withBase,
} from 'vitepress';
import { defineAsyncComponent, markRaw } from 'vue';
import { sectionsFrom, flatPages, normalize } from './nav';
import ManualNav from './ManualNav.vue';
import ManualOutline from './ManualOutline.vue';
import ManualSearch from './ManualSearch.vue';
import ManualContentBar from './ManualContentBar.vue';

/**
 * Where the reader's theme choice is kept: 'light' | 'dark' | 'system'
 * @type {String}
 */
const APPEARANCE_KEY = 'asls-manual-appearance';

/**
 * VitePress's local search box, loaded when first opened
 * @type {Object}
 */
const SearchBox = markRaw(defineAsyncComponent(
  // eslint-disable-next-line import/no-extraneous-dependencies
  () => import('vitepress/dist/client/theme-default/components/VPLocalSearchBox.vue'),
));

/**
 * The manual's layout, built from Studio's interface: the toolbar, a navigation panel in the
 * patch bay's place, the page in a widget, and the page outline. VitePress provides routing,
 * content and search.
 */
export default {
  name: 'StudioLayout',
  components: {
    ManualNav, ManualOutline, ManualSearch, ManualContentBar,
  },
  setup() {
    // VitePress state is only reachable through its composables
    const {
      page, frontmatter, theme, isDark,
    } = useData();
    const route = useRoute();
    const router = useRouter();
    return {
      page, frontmatter, theme, isDark, route, router,
    };
  },
  data() {
    return {
      drawerOpen: false,
      searchOpen: false,
      searchBox: SearchBox,
      outline: [],
      activeHeading: '',
      appearance: 'dark',
    };
  },
  computed: {
    /**
     * Toolbar logo for the current theme
     * @type {String}
     */
    logo() {
      return this.isDark ? '/studio_standalone_logo.png' : '/studio_standalone_logo_dark.png';
    },
    /**
     * Whether the current page is the home page
     * @type {Boolean}
     */
    isHome() {
      return this.frontmatter.layout === 'home';
    },
    /**
     * Manual sections from the sidebar config
     * @type {Array<Object>}
     */
    sections() {
      return sectionsFrom(this.theme);
    },
    /**
     * Pages in sidebar order
     * @type {Array<Object>}
     */
    pages() {
      return flatPages(this.sections);
    },
    /**
     * Current page in the sidebar, if listed
     * @type {Object|undefined}
     */
    current() {
      const path = normalize(this.route.path);
      return this.pages.find((p) => normalize(withBase(p.link)) === path);
    },
    /**
     * Link to this page's source on GitHub
     * @type {String}
     */
    editLink() {
      return this.page.relativePath
        ? `${this.$links.repository}/edit/develop/docs/manual/${this.page.relativePath}`
        : '';
    },
    /**
     * Previous page in sidebar order
     * @type {Object|null}
     */
    prev() {
      const index = this.pages.indexOf(this.current);
      return index > 0 ? this.pages[index - 1] : null;
    },
    /**
     * Next page in sidebar order
     * @type {Object|null}
     */
    next() {
      const index = this.pages.indexOf(this.current);
      return index >= 0 && index < this.pages.length - 1 ? this.pages[index + 1] : null;
    },
  },
  watch: {
    'route.path': function routeChanged() {
      this.drawerOpen = false;
      this.$nextTick(this.refreshOutline);
    },
  },
  mounted() {
    window.addEventListener('keydown', this.handleKeydown);
    window.addEventListener('scroll', this.trackHeading, { passive: true });
    this.systemDark = window.matchMedia('(prefers-color-scheme: dark)');
    this.systemDark.addEventListener('change', this.followSystem);
    let stored = null;
    try {
      stored = localStorage.getItem(APPEARANCE_KEY);
    } catch (e) {
      // Storage blocked: the choice lasts until reload
    }
    const fallback = this.isDark ? 'dark' : 'light';
    this.appearance = ['light', 'dark', 'system'].includes(stored) ? stored : fallback;
    this.followSystem();
    this.refreshOutline();
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleKeydown);
    window.removeEventListener('scroll', this.trackHeading);
    this.systemDark.removeEventListener('change', this.followSystem);
  },
  methods: {
    withBase,
    /**
     * Navigates to a manual page
     * @param {String} link page link from the sidebar
     */
    go(link) {
      if (normalize(withBase(link)) !== normalize(this.route.path)) {
        this.router.go(withBase(link));
      }
      this.drawerOpen = false;
    },
    /**
     * Scrolls to a heading of the page, below the toolbar and the widget header
     * @param {String} id heading id
     */
    scrollToHeading(id) {
      const el = document.getElementById(id);
      if (!el) return;
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 72, behavior: 'smooth' });
      window.history.replaceState(null, '', `#${id}`);
    },
    /**
     * Opens search on Ctrl/⌘ K or "/", closes the drawer on Escape
     * @param {KeyboardEvent} e keydown event
     */
    handleKeydown(e) {
      const typing = /input|textarea/i.test(e.target.tagName) || e.target.isContentEditable;
      if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !typing)) {
        e.preventDefault();
        this.searchOpen = true;
      } else if (e.key === 'Escape') {
        this.drawerOpen = false;
      }
    },
    /**
     * Sets the theme: light, dark, or the system's (followed live)
     * @param {String} mode 'light' | 'dark' | 'system'
     */
    setAppearance(mode) {
      this.appearance = mode;
      try {
        localStorage.setItem(APPEARANCE_KEY, mode);
      } catch (e) {
        // Storage blocked: the choice lasts until reload
      }
      if (mode === 'system') {
        this.followSystem();
      } else {
        this.isDark = mode === 'dark';
      }
    },
    /**
     * In system mode, matches the operating system's light or dark setting
     */
    followSystem() {
      if (this.appearance === 'system') this.isDark = this.systemDark.matches;
    },
    /**
     * Outline from the rendered headings
     */
    refreshOutline() {
      if (this.isHome) return;
      const headings = [...this.$el.querySelectorAll('.studio_prose h2[id], .studio_prose h3[id]')];
      this.outline = headings.map((h) => ({
        id: h.id,
        level: Number(h.tagName[1]),
        title: h.textContent.replace(/\u200B/g, '').trim(),
      }));
      this.trackHeading();
    },
    /**
     * Marks the outline entry of the heading nearest the top of the page; at the bottom of the
     * page, the last one (the last sections can't reach the top)
     */
    trackHeading() {
      let active = this.outline.length ? this.outline[0].id : '';
      this.outline.forEach((item) => {
        const el = document.getElementById(item.id);
        if (el && el.getBoundingClientRect().top < 110) active = item.id;
      });
      const { scrollHeight } = document.documentElement;
      if (window.innerHeight + window.scrollY >= scrollHeight - 4 && this.outline.length) {
        active = this.outline[this.outline.length - 1].id;
      }
      this.activeHeading = active;
    },
  },
};
</script>

<style scoped>
/* ── Shell ─────────────────────────────────────────────── */
.studio_shell {
  min-height: 100vh;
  background: var(--primary-dark);
  color: var(--secondary-lighter);
}

/* ── Toolbar (toolbar.fragment.vue) ────────────────────── */
.toolbar {
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  align-items: stretch;
  height: 48px;
  background: var(--primary-light);
  border-bottom: 1px solid var(--primary-dark);
}

.home .toolbar {
  position: fixed;
  left: 0;
  right: 0;
  background: color-mix(in srgb, var(--primary-light) 72%, transparent);
  backdrop-filter: blur(12px);
}

/* Logo + search span the navigation's width, so their border lines up with the panel's */
.toolbar_logo {
  display: flex;
  flex: 0 0 48px;
  align-items: center;
  justify-content: center;
  border-right: 1px solid var(--primary-dark);
}

.toolbar_logo:hover {
  background: var(--secondary-darker);
}

.toolbar_search {
  display: flex;
  flex: 0 0 232px;
  align-items: center;
  padding: 0 10px;
  border-right: 1px solid var(--primary-dark);
}

.toolbar_spacer,
.page_spacer {
  flex: 1;
}

.toolbar_cell {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 100%;
  padding: 0 16px;
  border: none;
  border-left: 1px solid var(--primary-dark);
  background: transparent;
  color: inherit;
  font: inherit;
  text-decoration: none;
  cursor: pointer;
}

.toolbar_cell:hover {
  background: var(--secondary-darker);
}

.toolbar_cell:active {
  background: var(--secondary-dark);
}

.toolbar_cell :deep(svg) {
  width: 14px;
  height: 14px;
  fill: var(--secondary-lighter);
}

.toolbar_drawer {
  display: none;
  border-left: none;
  border-right: 1px solid var(--primary-dark);
}

/* ── Workspace: panels and page share the panel shade ── */
.workspace {
  display: flex;
  align-items: flex-start;
  background: var(--primary-light);
}

.nav_column {
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 48px;
  flex: 0 0 280px;
  height: calc(100vh - 48px);
  border-right: 1px solid var(--primary-dark);
}

.page_column {
  flex: 1;
  min-width: 0;
  min-height: calc(100vh - 48px);
}

.outline_column {
  position: sticky;
  top: 48px;
  flex: 0 0 260px;
  height: calc(100vh - 48px);
  border-left: 1px solid var(--primary-dark);
}

/* Previous / next: two cards in the page's dark-panel style */
.page_pager {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  width: 100%;
  max-width: 840px;
  margin: 64px auto 64px;
  padding: 0 32px;
}

.page_pager_link {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 20px;
  border-radius: 4px;
  background: var(--secondary-darker);
  text-decoration: none;
  transition: background-color 0.15s;
}

.page_pager_link:hover {
  background: var(--secondary-dark);
}

.page_pager_link.next {
  justify-content: flex-end;
  text-align: right;
}

.page_pager_text {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.page_pager_kicker {
  font-family: Roboto-Bold, sans-serif;
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--section-color);
}

.page_pager_title {
  overflow: hidden;
  font-family: Roboto-Medium, sans-serif;
  font-size: 16px;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--secondary-lighter);
}

.page_pager_chevron {
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
  fill: none;
  stroke: var(--secondary-light);
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: transform 0.15s, stroke 0.15s;
}

.page_pager_link:hover .page_pager_chevron {
  stroke: var(--section-color);
}

.page_pager_link.next:hover .page_pager_chevron {
  transform: translateX(3px);
}

.page_pager_link.prev:hover .page_pager_chevron {
  transform: translateX(-3px);
}

/* App footer: a Studio bar under everything */
.app_footer {
  position: relative;
  z-index: 26;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 24px;
  min-height: 48px;
  padding: 0 16px;
  border-top: 1px solid var(--primary-dark);
  background: var(--primary-light);
}

.app_footer_brand {
  display: flex;
  align-items: center;
  gap: 8px;
}

.app_footer_version,
.app_footer_link,
.app_footer_made {
  font-family: Roboto-Regular, sans-serif;
  font-size: 12px;
  color: var(--secondary-lighter);
  opacity: 0.7;
  text-decoration: none;
}

.app_footer_link:hover {
  opacity: 1;
}

.app_footer_heart {
  color: var(--accent-red);
}

.nav_column > :last-child {
  flex: 1;
  min-height: 0;
}

/* The content bar's copy in the page drawer, for phones only */
.drawer_bar {
  display: none;
}

/* ── Home ──────────────────────────────────────────────── */
.home_main {
  min-height: 100vh;
}

/* ── Narrow screens ────────────────────────────────────── */
@media (max-width: 1279px) {
  .outline_column {
    display: none;
  }
}

@media (max-width: 959px) {
  .toolbar_cell h3 {
    display: none;
  }

  .toolbar_drawer h3 {
    display: block;
  }

  .toolbar_cell {
    padding: 0 14px;
  }

  .toolbar_drawer {
    display: flex;
  }

  .toolbar_logo {
    display: none;
  }

  .toolbar_search {
    flex: 1 1 auto;
    min-width: 0;
  }

  .nav_column {
    position: fixed;
    top: 48px;
    left: 0;
    z-index: 25;
    width: 300px;
    max-width: 85vw;
    transform: translateX(-100%);
    transition: transform 0.2s ease-out;
  }

  .drawer_open .nav_column {
    transform: none;
  }

  .drawer_backdrop {
    position: fixed;
    inset: 48px 0 0;
    z-index: 24;
    background: color-mix(in srgb, var(--primary-dark) 60%, transparent);
  }
}

@media (max-width: 767px) {
  .toolbar .content_bar {
    display: none;
  }

  .nav_column .drawer_bar {
    display: flex;
    flex: 0 0 48px;
    padding: 0 16px;
    border-bottom: 1px solid var(--primary-dark);
    background: var(--primary-light);
  }

  .page_pager {
    grid-template-columns: 1fr;
    padding: 0 16px;
  }

  .app_footer {
    padding: 12px 16px;
  }
}
</style>
