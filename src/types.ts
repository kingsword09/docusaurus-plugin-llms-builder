import type { DocusaurusConfig } from "@docusaurus/types";

export type ExtraLink = {
  title: string;
  link: string;
  description?: string;
};

export type DocsInfo = {
  title: string;
  description?: string;
  summary?: string;
  content: string;
  link: string;
};

export type RssItem = {
  title: string;
  description: string;
  content: string;
  link: string;
};

export type PluginSiteConfig = {
  version: string;
  outDir: string;
  siteDir: string;
  siteConfig: DocusaurusConfig;
  siteUrl: string;
};

export type PluginContext = {
  pluginSiteConfig: PluginSiteConfig;
  llmConfigs: LLMConfig[];
};

export type LLMPatternsConfig = {
  /**
   * Whether to include unmatched files last (default: false)
   */
  includeUnmatched?: boolean;

  /**
   * Optional: Patterns to ignore when processing files (e.g. ['test/**'])
   */
  ignorePatterns?: string[];

  /**
   * Optional: Patterns to include when processing files (e.g. ['docs/**'])
   * Only process .md and .mdx files
   */
  includePatterns?: string[];

  /**
   * Optional: Patterns to order when processing files
   */
  orderPatterns?: string[];
};

export type LLMHeaderConfig = {
  /**
   * Optional: Header title
   */
  title?: string;
  /**
   * Optional: Header description
   */
  description?: string;
  /**
   * Optional: Header summary
   */
  summary?: string;
};

export type LLMDocsType = "docs" | "blog";
/**
 * Configuration for docs type content, supporting sidebar and pattern-based content retrieval
 */
export type LLMSession =
  | {
      type: "docs";
      docsDir: string;
      /**
       * Optional: Configuration for file patterns and traversal method
       */
      patterns?: LLMPatternsConfig;
      /**
       * Optional: Whether to use sitemap for file discovery instead of recursive traversal
       * @default false
       */
      sitemap?: string;
    }
  | {
      type: "blog";
      docsDir: string;
      /**
       * Optional: Configuration for file patterns and traversal method
       */
      patterns?: LLMPatternsConfig;
      /**
       * Optional: Whether to use sitemap for file discovery instead of recursive traversal
       * @default false
       */
      rss?: string;
    };

export type LLMDocsConfig = LLMHeaderConfig & {
  sessions: LLMSession[];
};

export type LLMSessionFiles = LLMSession & {
  docsFiles: string[];
};

export type LLMSessionFilesItem = LLMDocsConfig & {
  sessions: LLMSessionFiles[];
};

export type ExtraSession = {
  sessionName: string;
  extraLinks: ExtraLink[];
};

export type LLMCommonConfig = {
  infixName?: string;
  /**
   * Whether to generate llms.txt file (default: true)
   */
  generateLLMsTxt?: boolean;
  /**
   * Whether to generate llms-full.txt file (default: true)
   */
  generateLLMsFullTxt?: boolean;

  /**
   * Optional: Additional external links or references to include
   */
  extraSession?: ExtraSession;
};

export type LLMConfig = LLMDocsConfig & LLMCommonConfig;

/**
 * Plugin options for configuring the LLM builder functionality
 * Defines settings for generating LLM files, directory traversal,
 * and metadata handling across the documentation site
 */
export type PluginOptions = {
  version: string;
  llmConfigs: LLMConfig[];
};
