import type { DocusaurusConfig } from "@docusaurus/types";

export type ExtraLink = {
  title: string;
  link: string;
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

type LLMCustomConfig = LLMPatternsConfig & {
  /**
   * Parent directory path to traverse (e.g. 'docs')
   * For 'separate' mode: generates llms-{filename}.txt for each file
   * For 'combined' mode: generates llms-{dirname}.txt for the directory
   * Note: Mode settings (separate/combined) are only configurable in extraLLMConfig
   */
  docsDir: string;

  /**
   * Whether to generate llms.txt file (default: true)
   */
  generateLLMsTxt?: boolean;
  /**
   * Whether to generate llms-full.txt file (default: true)
   */
  generateLLMsFullTxt?: boolean;
};

export type LLMDefaultConfig = {
  /**
   * Optional: Blog directory path to traverse (e.g. 'blog')
   */
  blogDirname?: string;

  /**
   * Optional: Additional external links or references to include
   */
  extraLinks?: ExtraLink[];
} & LLMCustomConfig;

type LLMGenerateMode = "separate" | "combined";
export type LLMDocsType = "docs" | "blog";

type LLMMetaData = {
  title: string;
  description?: string;
  name: string;
};

/**
 * Metadata for LLM configuration
 */
export type ExtraLLMConfig = {
  /**
   * Specify a directory to automatically traverse all first-level subdirectories,
   * and generate llms-{dirname}.txt and llms-{dirname}-full.txt files for each subdirectory.
   * For example: docs/a, docs/b will generate llms-a.txt, llms-b.txt.
   */
  metaMap: Record<string, LLMMetaData>;

  /**
   * Whether to generate separate llms.txt files for each file (default: 'combined')
   * If 'combined', all files will be combined into a single llms.txt
   */
  generateMode: LLMGenerateMode;
} & LLMCustomConfig;

/**
 * Plugin options for configuring the LLM builder functionality
 * Defines settings for generating LLM files, directory traversal,
 * and metadata handling across the documentation site
 */
export type PluginOptions = {
  title?: string;
  description?: string;
  version?: string;

  /**
   * Global configuration for generating main llms.txt and llms-full.txt files
   * This is for the entire website, separate from customLLMConfig
   */
  defaultLLMConfig: LLMDefaultConfig;

  /**
   * Additional LLM configurations for specific directories
   * Each config object specifies settings for generating LLM files
   * for individual directories and their contents
   */
  extraLLMConfig?: ExtraLLMConfig[];
};

export type PluginContext = {
  docTitle: string;
  docDescription: string;
  docVersion: string;
  outDir: string;
  siteDir: string;
  siteConfig: DocusaurusConfig;
  siteUrl: string;
  defaultLLMConfig: LLMDefaultConfig;
  extraLLMConfig?: ExtraLLMConfig[];
};

export type DocsInfo = {
  title: string;
  path: string;
  description: string;
  link: string;
  content: string;
};
