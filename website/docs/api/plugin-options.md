---
sidebar_position: 1
title: Plugin Options
description:
  The Docusaurus LLMs Builder plugin provides a flexible configuration system that allows you to define how your
  documentation and blog content should be processed for LLM integration.
---

# Plugin Options

The Docusaurus LLMs Builder plugin is configured within your `docusaurus.config.js` file. This page details all the
available options to customize its behavior.

The plugin is added as an array entry in the `plugins` section of your Docusaurus configuration:

```javascript
// docusaurus.config.js
module.exports = {
  // ... other configurations
  plugins: [
    [
      "docusaurus-plugin-llms-builder",
      {
        // Plugin options go here
      },
    ],
  ],
};
```

## Main Configuration Object

The main configuration object for the plugin supports the following top-level properties:

### `version`

- **Type:** `string`
- **Required:** Yes
- **Description:** Specifies the version of the plugin configuration schema. This helps in managing compatibility and
  migrations if the configuration structure changes in future plugin updates.
- **Example:** `"2.0.0"`

### `llmConfigs`

- **Type:** `Array<Object>`
- **Required:** Yes
- **Description:** An array of LLM configuration objects. Each object defines a distinct set of content to be processed
  and how it should be handled. This allows you to configure the plugin multiple times for different parts of your site
  or with different settings.

Each object within the `llmConfigs` array can have the following properties:

#### `title`

- **Type:** `string`
- **Required:** Yes
- **Description:** A descriptive title for this specific LLM configuration instance. This can be useful for identifying
  the purpose of the configuration, especially if you have multiple entries in `llmConfigs`.
- **Example:** `"Main Documentation Build"`

#### `sessions`

- **Type:** `Array<Object>`
- **Required:** Yes
- **Description:** An array of session objects. Each session defines a source of data (like docs or blog posts) that the
  LLM builder will process.

Each session object has the following properties:

##### `type`

    - **Type:** `string`
    - **Required:** Yes
    - **Description:** Specifies the type of content the session represents.
    - **Supported Values:**
      - `"docs"`: For documentation pages typically managed in a `docs` directory and listed in a sitemap.
      - `"blog"`: For blog posts, usually found in a `blog` directory and listed in an RSS feed.
    - **Example:** `"docs"`

##### `docsDir`

    - **Type:** `string`
    - **Required:** Yes
    - **Description:** The directory path (relative to the Docusaurus project root) where the source files for this session are located.
    - **Example:** `"docs"`, `"versioned_docs/version-1.0.0"`

##### `sessionName`

    - **Type:** `string`
    - **Required:** Yes
    - **Description:** A user-friendly name for this session. This might be used in generated outputs or logs.
    - **Example:** `"User Manual"`, `"Developer Blog"`

##### `sitemap`

    - **Type:** `string`
    - **Required:** No
    - **Description:** The path (relative to the Docusaurus project root) to the sitemap XML file. This is used for sessions of `type: "docs"` to discover pages. If omitted for `type: "docs"`, the plugin may attempt to find all relevant document files (e.g., `.md`, `.mdx`) within the `docsDir`, but using a sitemap is recommended for accuracy and to respect Docusaurus' routing conventions.
    - **Example:** `"sitemap.xml"`

##### `rss`

    - **Type:** `string`
    - **Required:** No
    - **Description:** The path (relative to the Docusaurus project root) to the RSS feed XML file (usually `atom.xml` or `rss.xml`). This is used for sessions of `type: "blog"` to discover posts. If omitted for `type: "blog"`, the plugin may attempt to find all relevant content files (e.g., `.md`, `.mdx`) within the `docsDir`. However, providing an RSS feed is recommended for blog content.
    - **Example:** `"atom.xml"`

##### `patterns`

    - **Type:** `Object`
    - **Required:** No
    - **Description:** An object that defines glob patterns for fine-grained control over which files are included or excluded, and their processing order.
    - **Properties:**
      - `ignorePatterns`: `Array<string>` (Optional) - Glob patterns for files/directories to exclude.
      - `orderPatterns`: `Array<string> | ((a: string, b: string) => number)` (Optional)
        - Can be an array of glob strings. Files matching these patterns will be ordered according to the sequence of patterns. For example: `["**/introduction.md", "**/getting-started/**", "**/api/**"]`.
        - Can also be a custom sort function that takes two file path strings (relative to project root) and returns a number (`-1` for `a` first, `1` for `b` first, `0` for no change). For example:
          ```ts
          orderPatterns: (a, b) => a.length - b.length // Sort by path length in ascending order
          ```
        - If both array and function are provided, the custom sort function takes precedence.
      - `includeUnmatched`: `boolean` (Optional, Default: `true`)
        - If `orderPatterns` (array form) is used, this option determines how files not matching any `orderPatterns` are handled.
        - If `true`, unmatched files are typically appended after the ordered files (their relative order might depend on filesystem or sitemap/RSS order).
        - If `false`, only files explicitly matching an `orderPatterns` glob will be included in the session's output.
        - This option has no effect if `orderPatterns` is a custom sort function or is not defined.

#### `generateLLMsTxt`

- **Type:** `boolean`
- **Required:** No (Default: `false`)
- **Description:** If set to `true`, the plugin will generate a `llms.txt` file in the root directory of your Docusaurus
  project. This file typically contains a concatenated version of the text content from the configured sessions,
  optimized for ingestion by Large Language Models.
- **Example:** `true`

#### `generateLLMsFullTxt`

- **Type:** `boolean`
- **Required:** No (Default: `false`)
- **Description:** If set to `true`, the plugin will generate a `llms_full.txt` file in the root directory of your
  Docusaurus project. This file usually offers a more comprehensive or differently structured output compared to
  `llms.txt`, potentially including more metadata or closer fidelity to the original content.
- **Example:** `true`

#### `extraSession`

- **Type:** `Object`
- **Required:** No
- **Description:** Allows defining an additional, special session that typically consists of a list of external links
  rather than local file processing.
- **Properties:**
  - `sessionName`: `string` (Required if `extraSession` is defined) - A name for this extra session. Example:
    `"Reference Links"`, `"Community Resources"`
  - `extraLinks`: `Array<Object>` (Required if `extraSession` is defined) - An array of link objects.
    - Each link object has:
      - `title`: `string` (Required) - The display title for the link.
      - `link`: `string` (Required) - The URL of the link.
      - **Example:**
        ```javascript
        extraSession: {
          sessionName: "External Resources",
          extraLinks: [
            { title: "Docusaurus Official Site", link: "https://docusaurus.io" },
            { title: "React Native Docs", link: "https://reactnative.dev" }
          ]
        }
        ```

## Example Full Configuration

Here's an example demonstrating various options:

```javascript
// docusaurus.config.js
module.exports = {
  plugins: [
    [
      "docusaurus-plugin-llms-builder",
      {
        version: "2.0.0",
        llmConfigs: [
          {
            title: "Main Site Documentation",
            sessions: [
              {
                type: "docs",
                docsDir: "docs",
                sessionName: "User Guides",
                sitemap: "sitemap.xml",
                patterns: {
                  ignorePatterns: ["**/tutorial-basics/**"],
                  orderPatterns: ["**/introduction.md", "**/tutorial-extras/**"],
                },
              },
              {
                type: "blog",
                docsDir: "blog",
                sessionName: "Announcements",
                rss: "atom.xml",
                patterns: {
                  ignorePatterns: ["**/draft-posts/**"],
                },
              },
            ],
            generateLLMsTxt: true,
            generateLLMsFullTxt: false,
            extraSession: {
              sessionName: "Useful Links",
              extraLinks: [
                { title: "Our Community Forum", link: "https://community.example.com" },
                { title: "GitHub Repository", link: "https://github.com/example/repo" },
              ],
            },
          },
          // You could add another object here for a different LLM configuration
        ],
      },
    ],
  ],
};
```

This detailed breakdown should help users understand how to configure the Docusaurus LLMs Builder plugin effectively.
