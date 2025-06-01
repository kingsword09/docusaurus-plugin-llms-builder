import type { DocusaurusConfig } from "@docusaurus/types";

// External link configuration
type ExternalLink = {
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

/*
 * Optional: A custom sort function to order files.
 * This function takes two absolute file paths (strings) as input and should return a number.
 * - Return a negative value if `fileA` should come before `fileB`.
 * - Return a positive value if `fileA` should come after `fileB`.
 * - Return zero if their order doesn't matter relative to each other.
 * If provided, this function takes precedence over `orderByPatterns`.
 * @param fileA The first absolute file path for comparison.
 * @param fileB The second absolute file path for comparison.
 * @returns A number indicating the sort order.
 * @example
 * ```ts
 * // Sort files by filename length (shortest first)
 * sortFunction: (fileA, fileB) => require('path').basename(fileA).length - require('path').basename(fileB).length
 * ```
 */
type SortFunction = (fileA: string, fileB: string) => number;

// File pattern configuration
type FilePatternConfiguration = {
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
  orderPatterns?: string[] | SortFunction;
};

// Header configuration
type HeaderConfiguration = {
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

/**
 * HTML parser result
 */
export type HtmlParser = {
  title?: string;
  description?: string;
  content: string;
};

// Content type
export type ContentType = "docs" | "blog";

/**
 * Content session configuration, supports sidebar and pattern-based content retrieval
 */
type ContentSession =
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
type DocumentConfiguration = HeaderConfiguration & {
  sessions: ContentSession[];
};

// Session files
export type SessionFiles = ContentSession & {
  docsFiles: string[];
};

// Additional session
export type AdditionalSession = {
  sessionName: string;
  extraLinks: ExternalLink[];
};

// Common configuration
type CommonConfiguration = {
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
