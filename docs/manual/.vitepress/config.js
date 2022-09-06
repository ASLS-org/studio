export default {
  title: "ASLS Studio",
  description: "Open-source, web-based DMX lighting control software.",
  themeConfig: {
    siteTitle: "ASLS Studio",
    algolia: {
      apiKey: '535c62495650c876ca7413debb4491ff',
      indexName: 'ASLS',
      appId: '1L7RJIJ77A'
    },
    logo: '/asls.logo.blue.only.png',
    nav: [{
        text: 'User Manual',
        link: '/introduction/'
      },
      {
        text: 'Developer Resources',
        link: '/dev/'
      },
      {
        text: 'Live Example',
        link: 'https://github.com/...'
      },
      {
        text: 'Download',
        link: 'https://github.com/...'
      },
    ],
    sidebar: {
      '/': [{
        text: 'Introduction',
        collapsible: true,
        items: [{
          text: 'About',
          link: '/introduction/'
        }, {
          text: 'Installation',
          link: '/introduction/installation'
        }, {
          text: 'Overview',
          link: '/introduction/overview'
        }, {
          text: 'License',
          link: '/introduction/license'
        }]
      }, {
        text: 'Interface',
        collapsible: true,
        items: [{
          text: 'Toolbar',
          link: '/interface/toolbar/'
        }, {
          text: 'Patch Bay',
          link: '/interface/patchbay/'
        }, {
          text: 'Group Pool',
          link: '/interface/grouppool/'
        }, {
          text: 'Visualizer',
          link: '/interface/visualizer/'
        }, {
          text: 'Modifier',
          link: '/interface/modifier/'
        }]
      }, {
        text: 'Modifiers',
        collapsible: true,
        items: [{
          text: 'Universe',
          link: '/modifiers/universe/'
        }, {
          text: 'Group',
          link: '/modifiers/group/'
        }, {
          text: 'Chase',
          link: '/modifiers/chase/'
        }]
      }, {
        text: 'Workflow',
        collapsible: true,
        items: [{
          text: 'Setting up Environment',
          link: '/workflow/environment/'
        }, {
          text: 'Patching Fixtures',
          link: '/workflow/patching/'
        }, {
          text: 'Setting up Groups',
          link: '/workflow/grouping/'
        }, {
          text: 'Creating Scenes',
          link: '/workflow/scenes/'
        }, {
          text: 'Creating Effects',
          link: '/workflow/effects/'
        }, {
          text: 'Triggering Cues',
          link: '/workflow/triggering/'
        }]
      }, {
        text: 'Import/Export',
        collapsible: true,
        items: [{
          text: 'Fixture',
          link: '/workflow/show'
        }, {
          text: 'Showfile',
          link: '/workflow/patch'
        }]
      }, {
        text: 'Collaborate',
        collapsible: true,
        items: [{
          text: 'Report Issues',
          link: '/collab/issues'
        }, {
          text: 'Request Features',
          link: '/collab/requests'
        }]
      }],
    },
    footer: {
      message: "ASLS Studio - Released under the GPLv3 License",
      copyright: "Copyright (C) 2021-present Timé Kadel."
    },
    markdown: {
      // theme: 'material-palenight'
      toc: "every"
    }
  }
}