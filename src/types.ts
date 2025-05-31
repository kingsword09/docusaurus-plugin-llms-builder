import type { DocusaurusConfig } from "@docusaurus/types";

// External link configuration
export type ExternalLink = {
  title: string;
  link: string;
  description?: string;
};

// Document information
export type DocumentInfo = {
  title: string;
  description?: string;
  summary?: string;
  content: string;
  link: string;
};

// RSS feed item
export type RSSFeedItem = {
  title: string;
  description: string;
  content: string;
  link: string;
};

// Plugin site configuration
export type SiteConfiguration = {
  version: string;
  outDir: string;
  siteDir: string;
  siteConfig: DocusaurusConfig;
  siteUrl: string;
};

// Plugin context
export type BuilderContext = {
  pluginSiteConfig: SiteConfiguration;
  llmConfigs: ContentConfiguration[];
};

// File pattern configuration
export type FilePatternConfiguration = {
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

// Header configuration
export type HeaderConfiguration = {
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

// Content type
export type ContentType = "docs" | "blog";

/**
 * Content session configuration, supports sidebar and pattern-based content retrieval
 */
export type ContentSession =
  | {
      type: "docs";
      sessionName?: string;
      docsDir: string;
      /**
       * Optional: Configuration for file patterns and traversal method
       */
      patterns?: FilePatternConfiguration;
      /**
       * Optional: Whether to use sitemap for file discovery instead of recursive traversal
       * @default false
       */
      sitemap?: string;
    }
  | {
      type: "blog";
      sessionName?: string;
      docsDir: string;
      /**
       * Optional: Configuration for file patterns and traversal method
       */
      patterns?: FilePatternConfiguration;
      /**
       * Optional: Whether to use sitemap for file discovery instead of recursive traversal
       * @default false
       */
      rss?: string;
    };

// Document configuration
export type DocumentConfiguration = HeaderConfiguration & {
  sessions: ContentSession[];
};

// Session files
export type SessionFiles = ContentSession & {
  docsFiles: string[];
};

// Session files item
export type SessionFilesItem = DocumentConfiguration & {
  sessions: SessionFiles[];
};

// Additional session
export type AdditionalSession = {
  sessionName: string;
  extraLinks: ExternalLink[];
};

// Common configuration
export type CommonConfiguration = {
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
  extraSession?: AdditionalSession;
};

// Content configuration
export type ContentConfiguration = DocumentConfiguration & CommonConfiguration;

/**
 * Plugin options for configuring LLM builder functionality
 * Defines settings for generating LLM files, directory traversal, and metadata processing
 */
export type PluginOptions = {
  version: string;
  llmConfigs: ContentConfiguration[];
};
