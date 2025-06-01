import type * as Preset from "@docusaurus/preset-classic";
import type { Config } from "@docusaurus/types";
import type { PluginOptions } from "docusaurus-plugin-llms-builder";
import { themes as prismThemes } from "prism-react-renderer";
import packageJson from "../package.json";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: "Docusaurus Plugin LLMs Builder",
  tagline: "A Docusaurus plugin for building LLM-powered applications",
  favicon: "img/favicon.ico",

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: "https://blog.kingsword.tech",
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: process.env.BASE_URL ?? "/",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "kingsword09", // Usually your GitHub org/user name.
  projectName: "docusaurus-plugin-llms-builder", // Usually your repo name.

  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          // editUrl: "https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/",
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ["rss", "atom"],
            xslt: true,
          },
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          // editUrl: "https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/",
          // Useful options to enforce blogging best practices
          onInlineTags: "warn",
          onInlineAuthors: "warn",
          onUntruncatedBlogPosts: "warn",
        },
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    [
      "docusaurus-plugin-llms-builder",
      {
        version: packageJson.version,
        llmConfigs: [
          {
            title: "Docusaurus Plugin LLMs Builder",
            description: "A Docusaurus plugin for building LLM-powered applications",
            summary:
              "Docusaurus Plugin LLMs Builder is a Docusaurus plugin that allows you to build LLM-powered applications with ease. It provides a simple and intuitive API for building LLM-powered applications. It also provides a simple and intuitive API for building LLM-powered applications. It also provides a simple and intuitive API for building LLM-powered applications.",
            generateLLMsTxt: true,
            generateLLMsFullTxt: true,
            sessions: [
              {
                type: "docs",
                docsDir: "docs",
                sitemap: "sitemap.xml",
                patterns: {
                  includePatterns: ["**/docs/**"],
                },
              },
              {
                type: "blog",
                docsDir: "blog",
                rss: "rss.xml",
              },
            ],
          },
        ],
      } as PluginOptions,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: "img/docusaurus-social-card.jpg",
    navbar: {
      title: "Docusaurus Plugin LLMs Builder",
      logo: {
        alt: "Docusaurus Plugin LLMs Builder Logo",
        src: "img/logo.svg",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "tutorialSidebar",
          position: "right",
          label: "Tutorial",
        },
        { to: "/blog", label: "Blog", position: "right" },
        {
          href: "https://github.com/kingsword09/docusaurus-plugin-llms-builder",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Docs",
          items: [
            {
              label: "Tutorial",
              to: "/docs/intro",
            },
          ],
        },
        {
          title: "Community",
          items: [
            {
              label: "X",
              href: "https://x.com/kingsword09",
            },
          ],
        },
        {
          title: "More",
          items: [
            {
              label: "Blog",
              to: "/blog",
            },
            {
              label: "GitHub",
              href: "https://github.com/kingsword09/docusaurus-plugin-llms-builder",
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Docusaurus Plugin LLMs Builder.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
