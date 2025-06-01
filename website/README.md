# docusaurus-plugin-llms-builder

<a :href="`https://www.npmjs.com/package/docusaurus-plugin-llms-builder`" target="_blank"><img src="https://img.shields.io/npm/v/docusaurus-plugin-llms-builder?label=npm" alt="NPM version"></a>

A Docusaurus plugin that generates standardized LLM prompt files (llms.txt and llms-full.txt) from your documentation.

## Installation

```bash
npm install -D docusaurus-plugin-llms-builder
```

## Usage

Add the plugin to your `docusaurus.config.js`:

## Options

### PluginOptions

| Name       | Type                   | Required | Default | Description                                       |
| ---------- | ---------------------- | -------- | ------- | ------------------------------------------------- |
| version    | string                 | Yes      | None    | Plugin version, recommended to match package.json |
| llmConfigs | ContentConfiguration[] | Yes      | None    | Array of LLM content generation configurations    |

### ContentConfiguration

| Name                | Type              | Required | Default | Description                                       |
| ------------------- | ----------------- | -------- | ------- | ------------------------------------------------- |
| title               | string            | 否       | None    | Configuration title                               |
| description         | string            | 否       | None    | Configuration description                         |
| summary             | string            | 否       | None    | Configuration summary                             |
| infixName           | string            | 否       | None    | Infix for output file name (e.g. llms-blog.txt)   |
| sessions            | ContentSession[]  | 是       | None    | Array of content session configurations           |
| generateLLMsTxt     | boolean           | 否       | true    | Whether to generate llms.txt                      |
| generateLLMsFullTxt | boolean           | 否       | true    | generate llms-full.txt                            |
| extraSession        | AdditionalSession | 否       | None    | Extra session configuration (e.g. external links) |

### ContentSession

| Name        | Type                     | Required | Default | Description                                           |
| ----------- | ------------------------ | -------- | ------- | ----------------------------------------------------- |
| type        | "docs" \| "blog"         | Yes      | None    | Session type                                          |
| sessionName | string                   | No       | None    | Session name                                          |
| docsDir     | string                   | Yes      | None    | Docs or blog directory                                |
| patterns    | FilePatternConfiguration | No       | None    | File pattern configuration                            |
| sitemap/rss | string                   | No       | None    | Path to sitemap.xml (for docs) or atom.xml (for blog) |

### FilePatternConfiguration

| Name            | Type     | Required     | Default | Description                                            |
| --------------- | -------- | ------------ | ------- | ------------------------------------------------------ | -------------------------- |
| ignorePatterns  | string[] | No           | None    | Glob patterns to ignore                                |
| includePatterns | string[] | No           | None    | Glob patterns to include (higher priority than ignore) |
| orderPatterns   | string[] | sortFunction | No      | None                                                   | Glob patterns for ordering |

### AdditionalSession

| Name        | Type           | Required | Default | Description             |
| ----------- | -------------- | -------- | ------- | ----------------------- |
| sessionName | string         | Yes      | None    | Extra session name      |
| extraLinks  | ExternalLink[] | Yes      | None    | Array of external links |

### ExternalLink

| Name        | Type   | Required | Default | Description      |
| ----------- | ------ | -------- | ------- | ---------------- |
| title       | string | Yes      | None    | Link title       |
| link        | string | Yes      | None    | Link URL         |
| description | string | No       | None    | Link description |

---

## Example Configuration

```js
module.exports = {
  plugins: [
    [
      "docusaurus-plugin-llms-builder",
      /** @type {import("docusaurus-plugin-llms-builder").PluginOptions} */
      （{
        version: "2.0.0",
        llmConfigs: [
          {
            title: "Title",
            description: "Optional description goes here",
            summary: "Optional details go here",
            sessions: [
              {
                type: "docs",
                docsDir: "docs",
                sessionName: "Docs",
                sitemap: "sitemap.xml",
                patterns: {
                  ignorePatterns: ["**/tutorial-basics/**"],
                  orderPatterns: ["**/tutorial-extras/**"],
                },
              },
              {
                type: "blog",
                docsDir: "blog",
                sessionName: "Blog",
                rss: "atom.xml",
                patterns: {
                  ignorePatterns: ["**/mdx-blog-post"],
                  orderPatterns: ["**/first-blog-post"],
                },
              },
            ],
            generateLLMsTxt: true,
            generateLLMsFullTxt: true,
            extraSession: {
              sessionName: "Reference",
              extraLinks: [
                {
                  title: "baidu",
                  link: "https://www.baidu.com",
                },
              ],
            },
          },
        ],
      }),
    ],
  ],
};
```

## Related Projects

- [docusaurus-plugin-llms](https://github.com/rachfop/docusaurus-plugin-llms)

## License

This project is licensed under the MIT License.
