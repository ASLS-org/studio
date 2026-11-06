/*
 * Navigation model of the Studio shell, built from the sidebar in config.js. Each section is
 * shown like a universe in the patch bay (coloured dot, pages unfolded under it) and like a menu
 * in Studio's toolbar. Icons are Studio's own (src/views/components/uikit/icons/images).
 */

/**
 * Section colour (accent token) and icon, by section title
 * @type {Object<string, Object>}
 */
const SECTION_STYLE = {
  Introduction: { color: 'var(--accent-maroon)', icon: 'bulb' },
  Interface: { color: 'var(--accent-violet)', icon: 'grid' },
  Modifiers: { color: 'var(--accent-blue)', icon: 'adjust' },
  Workflow: { color: 'var(--accent-sea-green)', icon: 'line' },
};

/**
 * Page icon by link. Pages may also set `icon:` in their frontmatter.
 * @type {Object<string, string>}
 */
const PAGE_ICONS = {
  '/introduction/': 'bulb',
  '/introduction/overview': 'help',
  '/introduction/installation': 'export',
  '/introduction/license': 'opensource',
  '/interface/toolbar/': 'control',
  '/interface/patchbay/': 'patch',
  '/interface/grouppool/': 'grid',
  '/interface/visualizer/': 'visualizer',
  '/interface/modifier/': 'adjust',
  '/modifiers/universe/': 'universe',
  '/modifiers/group/': 'grid',
  '/modifiers/chase/': 'line',
  '/workflow/environment/': 'gear',
  '/workflow/patching/': 'patch',
  '/workflow/grouping/': 'fixture',
  '/workflow/scenes/': 'mixer',
  '/workflow/effects/': 'wave',
  '/workflow/triggering/': 'play',
};

/**
 * Normalises a link or route path for comparison: no base, no .html, no hash
 * @param {String} path link or path
 * @returns {String} normalised path
 */
export function normalize(path) {
  return path.replace(/#.*$/, '').replace(/\.html$/, '').replace(/index$/, '');
}

/**
 * Manual sections with their pages, from VitePress's sidebar config
 * @param {Object} themeConfig VitePress theme config
 * @returns {Array<Object>} [{ title, color, icon, pages: [{ title, link, icon }] }]
 */
export function sectionsFrom(themeConfig) {
  const sidebar = themeConfig.sidebar || {};
  const groups = Array.isArray(sidebar) ? sidebar : sidebar['/'] || [];
  return groups.map((group) => {
    const style = SECTION_STYLE[group.text] || { color: 'var(--accent-teal)', icon: 'folder' };
    return {
      title: group.text,
      color: style.color,
      icon: style.icon,
      pages: (group.items || []).map((item) => ({
        title: item.text,
        link: item.link,
        icon: PAGE_ICONS[item.link] || style.icon,
      })),
    };
  });
}

/**
 * Flat page list in sidebar order (for prev/next and lookups)
 * @param {Array<Object>} sections from sectionsFrom()
 * @returns {Array<Object>} pages with their section
 */
export function flatPages(sections) {
  return sections.flatMap((section) => section.pages.map((page) => ({ ...page, section })));
}
