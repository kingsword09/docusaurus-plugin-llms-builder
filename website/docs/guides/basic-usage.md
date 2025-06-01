---
sidebar_position: 1
title: Basic Usage Guide
description: A step-by-step guide to using the Docusaurus LLMs Builder plugin for your Docusaurus documentation.
---

# Basic Usage Guide

This guide will walk you through a common scenario for using the Docusaurus LLMs Builder plugin, assuming you have
already completed the [Installation](./../getting-started/installation.md) and
[Basic Configuration](./../getting-started/configuration.md) steps.

Our goal is to configure the plugin to process your main Docusaurus documentation and your blog posts, preparing them
for potential use with Large Language Models (LLMs).

## Scenario: Processing Docs and Blog Content

Let's say your Docusaurus site has:

1.  Standard documentation in the `docs` folder.
2.  A blog in the `blog` folder.

You want to use the LLMs Builder plugin to create consolidated text files from these sources, which might then be used
for tasks like:

- Feeding into an LLM for question-answering over your documentation.
- Generating summaries.
- Performing content analysis.

### Configuration Example

Here’s how you might configure `docusaurus-plugin-llms-builder` in your `docusaurus.config.js` for this scenario:

```javascript
// docusaurus.config.js
module.exports = {
  // ... other configurations
  plugins: [
    [
      "docusaurus-plugin-llms-builder",
      {
        version: "2.0.0",
        llmConfigs: [
          {
            title: "Website Content for LLM",
            sessions: [
              {
                type: "docs",
                docsDir: "docs", // Points to your main docs folder
                sessionName: "Main Documentation",
                sitemap: "sitemap.xml", // Assumes sitemap.xml exists at the site root
                patterns: {
                  // Optional: exclude specific folders or files
                  // ignorePatterns: ["docs/archive/**"],
                },
              },
              {
                type: "blog",
                docsDir: "blog", // Points to your blog folder
                sessionName: "Blog Posts",
                rss: "atom.xml", // Assumes atom.xml exists for your blog
              },
            ],
            generateLLMsTxt: true, // Generate a concatenated llms.txt
            generateLLMsFullTxt: false, // Optionally, generate a more detailed version
            extraSession: {
              sessionName: "Key Project Links",
              extraLinks: [
                { title: "Project GitHub", link: "https://github.com/your-repo" },
                { title: "Community Chat", link: "https://discord.gg/your-server" },
              ],
            },
          },
        ],
      },
    ],
    // ... other plugins
  ],
};
```

### Understanding the Configuration

- **`title: "Website Content for LLM"`**: A descriptive name for this particular setup.
- **Sessions**:
  - The first session is of `type: "docs"`. It targets the `/docs` directory, names this part "Main Documentation", and
    uses `sitemap.xml` to find all the document pages.
  - The second session is of `type: "blog"`. It targets the `/blog` directory, names this part "Blog Posts", and uses
    `atom.xml` to find all the blog entries.
- **`generateLLMsTxt: true`**: This is a key option. When enabled, the plugin will process the content from the defined
  sessions (Main Documentation and Blog Posts) and generate a file named `llms.txt` (the exact location and content
  format are specific to the plugin's implementation). This file is typically a consolidation of the text from your
  documents and blog posts, structured for easier processing by an LLM.
- **`extraSession`**: This adds a section to your LLM-ready content that includes important external links, providing
  context or further resources.

### What Happens Next?

After configuring the plugin and running your Docusaurus build process (e.g., `npm run build`), the
`docusaurus-plugin-llms-builder` will:

1.  Scan the content in your `docs` and `blog` directories based on your sitemap and RSS feed.
2.  Apply any `patterns` you've defined to include or exclude specific files.
3.  Generate the `llms.txt` file (and `llms_full.txt` if enabled) containing the processed text from your documentation
    and blog, plus the extra links.

You can then use these generated text files as input for your chosen LLM applications.

## Using the `llms` CLI Command

The Docusaurus LLMs Builder plugin provides a CLI command that allows you to generate the `llms.txt` and `llms-full.txt` files manually, without needing to run a full Docusaurus build. This can be useful for quick updates or when you only need to regenerate the LLM-specific files.

To use the command, you can run it via `npx`:

```bash
npx docusaurus llms
```

This command will execute the LLMs Builder plugin based on your existing `docusaurus.config.js` configuration. The generated files (e.g., `llms.txt`, `llms_full.txt`) will be placed in the root directory of your Docusaurus project.

## Further Customization

This is a basic example. The plugin offers many more options for fine-tuning how your content is processed. For a
complete list of all configuration parameters and their detailed explanations, please refer to the
[Plugin Options API Reference](../api/plugin-options.md).

You might want to:

- Specify exact ordering of documents using `orderPatterns`.
- Ignore certain sub-folders or specific documents using `ignorePatterns`.
- Configure multiple `llmConfigs` blocks if you have very different sets of content for different LLM purposes.

By tailoring the configuration, you can ensure that the generated text files are perfectly suited for your LLM
integration needs.

```

```
