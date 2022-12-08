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
        link: 'https://dev.studio.asls.timekadel.com'
      },
      {
        text: 'Live Example',
        link: 'https://demo.studio.asls.timekadel.com'
      },
      {
        text: 'Download',
        link: 'https://github.com/ASLS-org/studio'
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