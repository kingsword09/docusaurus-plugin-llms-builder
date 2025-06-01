---
sidebar_position: 2
title: Basic Configuration
description:
  Docusaurus LLMs Builder plugin helps you easily configure and manage LLM-powered features in your documentation.
---

<!-- truncate -->

# Basic Configuration

Once installed, you need to add the Docusaurus LLMs Builder plugin to your `docusaurus.config.js` file.

## Add Plugin to `docusaurus.config.js`

Here's a basic example of how to include the plugin:

```js
// docusaurus.config.js
module.exports = {
  // ... other configurations
  plugins: [
    [
      "docusaurus-plugin-llms-builder",
      /** @type {import("docusaurus-plugin-llms-builder").PluginOptions} */
      ({
        // Minimum required configuration options can be discussed here
        // For a full list of options, see the API Reference section.
        version: "2.0.0", // Example version
        llmConfigs: [
          {
            title: "My Main Docs",
            sessions: [
              {
                type: "docs",
                docsDir: "docs", // Assumes your docs are in the 'docs' folder
                sessionName: "Documentation",
                sitemap: "sitemap.xml", // Ensure you have a sitemap
              },
            ],
            generateLLMsTxt: true, // Example option
          },
        ],
      }),
    ],
    // ... other plugins
  ],
};
```

This enables the plugin with a basic setup. For detailed information on all configuration options, please refer to the
[API Reference](../api/plugin-options.md) section.
