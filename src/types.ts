import type { DocusaurusConfig } from "@docusaurus/types";

// 外部链接配置
export type ExternalLink = {
  title: string;
  link: string;
  description?: string;
};

// 文档信息
export type DocumentInfo = {
  title: string;
  description?: string;
  summary?: string;
  content: string;
  link: string;
};

// RSS条目
export type RSSFeedItem = {
  title: string;
  description: string;
  content: string;
  link: string;
};

// 插件站点配置
export type SiteConfiguration = {
  version: string;
  outDir: string;
  siteDir: string;
  siteConfig: DocusaurusConfig;
  siteUrl: string;
};

// 插件上下文
export type BuilderContext = {
  pluginSiteConfig: SiteConfiguration;
  llmConfigs: ContentConfiguration[];
};

// 文件模式配置
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

// 头部配置
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

// 内容类型
export type ContentType = "docs" | "blog";

/**
 * 内容会话配置，支持侧边栏和基于模式的内容检索
 */
export type ContentSession =
  | {
      type: "docs";
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

// 文档配置
export type DocumentConfiguration = HeaderConfiguration & {
  sessions: ContentSession[];
};

// 会话文件
export type SessionFiles = ContentSession & {
  docsFiles: string[];
};

// 会话文件项
export type SessionFilesItem = DocumentConfiguration & {
  sessions: SessionFiles[];
};

// 额外会话
export type AdditionalSession = {
  sessionName: string;
  extraLinks: ExternalLink[];
};

// 通用配置
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

// 内容配置
export type ContentConfiguration = DocumentConfiguration & CommonConfiguration;

/**
 * 插件选项，用于配置LLM构建器功能
 * 定义生成LLM文件、目录遍历和元数据处理的设置
 */
export type PluginOptions = {
  version: string;
  llmConfigs: ContentConfiguration[];
};
