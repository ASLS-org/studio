<template>
  <a
    v-if="href"
    :href="href"
    :target="external ? '_blank' : undefined"
    :rel="external ? 'noreferrer' : undefined"
  ><slot /></a>
  <span
    v-else
    class="resource_link_unset"
    title="Link coming soon"
  ><slot /></span>
</template>

<script>
/**
 * Link to a Studio resource configured once in .vitepress/config.js (`themeConfig.links`, fed by
 * MANUAL_URL_* in the repo's .env). Renders plain text while the URL is not set.
 * @example <ResourceLink to="demo">Try the live demo</ResourceLink>
 */
export default {
  name: 'ResourceLink',
  props: {
    /**
     * Resource key: demo, website, devDocs, download, repository, releases, discussions,
     * issues, license
     * @type {String}
     */
    to: {
      type: String,
      required: true,
    },
  },
  computed: {
    /**
     * Configured URL, or '' when unset
     * @type {String}
     */
    href() {
      return this.$links[this.to] || '';
    },
    /**
     * Whether the link leaves the manual
     * @type {Boolean}
     */
    external() {
      return /^https?:/.test(this.href);
    },
  },
};
</script>

<style scoped>
.resource_link_unset {
  cursor: help;
}
</style>
