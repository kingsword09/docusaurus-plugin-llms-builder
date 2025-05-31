---
sidebar_position: 1
---

# Docusaurus LLMs Builder Plugin

Welcome to the Docusaurus LLMs Builder Plugin! This powerful tool helps you integrate Large Language Models (LLMs) into
your Docusaurus documentation, enabling dynamic content generation, automated documentation updates, and enhanced user
interactions.

## Getting Started

Let's get you up and running with the Docusaurus LLMs Builder Plugin. Follow these simple steps to enhance your
documentation with AI capabilities.

### Prerequisites

Before you begin, make sure you have:

- A working [Docusaurus](https://docusaurus.io) site (version 3.0 or higher)
- [Node.js](https://nodejs.org/en/download/) version 20.0 or above installed
  - During Node.js installation, ensure you select all recommended dependencies
  - You can verify your Node.js version by running `node --version` in your terminal

## Installation

To add the Docusaurus LLMs Builder plugin to your project, use npm:

```bash
npm install -D docusaurus-plugin-llms-builder
```

## Usage

Add the plugin to your `docusaurus.config.js`:

```js
module.exports = {
  plugins: [
    [
      "docusaurus-plugin-llms-builder",
      {
        version: "2.0.0",
        llmConfigs: [
          {
            title: "主文档",
            sessions: [
              {
                type: "docs",
                docsDir: "docs",
                sessionName: "文档",
                sitemap: "sitemap.xml",
                patterns: {
                  ignorePatterns: ["**/tutorial-basics/**"],
                  orderPatterns: ["**/tutorial-extras/**"],
                  includeUnmatched: true,
                },
              },
              {
                type: "blog",
                docsDir: "blog",
                sessionName: "博客",
                rss: "atom.xml",
                patterns: {
                  ignorePatterns: ["**/mdx-blog-post"],
                  orderPatterns: ["**/first-blog-post"],
                  includeUnmatched: true,
                },
              },
            ],
            generateLLMsTxt: true,
            generateLLMsFullTxt: true,
            extraSession: {
              sessionName: "参考链接",
              extraLinks: [
                {
                  title: "百度",
                  link: "https://www.baidu.com",
                },
              ],
            },
          },
        ],
      },
    ],
  ],
};
```
