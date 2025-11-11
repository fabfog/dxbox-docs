// @ts-check

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.

 @type {import('@docusaurus/plugin-content-docs').SidebarsConfig}
 */
const sidebars = {
  useLessReactDocsSidebar: [
    'use-less-react/intro',
    'use-less-react/getting-started',
    {
      type: 'category',
      label: 'API',
      items: [
        {
          type: 'category',
          label: 'Classes',
          items: [
            'use-less-react/api/classes/pubsub',
            'use-less-react/api/classes/pubsub-mixin',
            'use-less-react/api/classes/depends-on',
            'use-less-react/api/classes/notifies',
            'use-less-react/api/classes/batch-notifications',
            'use-less-react/api/classes/immutable-class',
            'use-less-react/api/classes/serializable-class',
          ]
        },
        {
          type: 'category',
          label: 'Client',
          items: [
            'use-less-react/api/client/use-reactive-instance',
            'use-less-react/api/client/create-generic-context',
            'use-less-react/api/client/create-hydration-context',

          ]
        },
        {
          type: 'category',
          label: 'Prefabs',
          items: [
            'use-less-react/api/prefabs/state',
            'use-less-react/api/prefabs/memento',
            'use-less-react/api/prefabs/event-bus',
            'use-less-react/api/prefabs/command-bus',
          ]
        },
      ]
    },
    // 'use-less-react/faq',
    {
      type: 'link',
      label: 'View GitHub repo',
      href: 'https://github.com/fabfog/use-less-react',
    },
    {
          type: 'category',
          label: 'FAQ',
          items: [
            'use-less-react/faq/logo',
          ]
        },
  ],
};

export default sidebars;
