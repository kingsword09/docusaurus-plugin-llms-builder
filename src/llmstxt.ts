import { generate } from "@docusaurus/utils";
import assert from "node:assert";
import path from "node:path";

import {
  collectLLMSessionFiles,
  getAllDocusaurusBuildFilesPaths,
  processLLMSessionsFilesWithPatternFilters,
} from "./files";
import { markdownMetadataParser } from "./parser";
import type { AdditionalSession, BuilderContext, ContentConfiguration, SessionFiles, SiteConfiguration } from "./types";
import { htmlContentParser, htmlTitleParser, parseRssItems, sitemapParser } from "./xml";

// Interface for a single LLM session item containing title, link and optional description
type LLMSessionItem = {
  title: string;
  link: string;
  description?: string;
};

// Interface for an LLM session containing session name and array of items
type LLMSession = {
  sessionName: string;
  items: LLMSessionItem[];
};

// Interface for standard LLM configuration with metadata and sessions
type LLMStdConfig = {
  title: string;
  description: string;
  summary?: string;
  sessions: LLMSession[];
};

// Interface for a full LLM session item containing title and content
type LLMFullSessionItem = {
  title: string;
  content: string;
};

// Interface for full LLM configuration with metadata and full content sessions
type LLMFullStdConfig = {
  title: string;
  description: string;
  summary?: string;
  sessions: LLMFullSessionItem[];
};

// Combined output configuration type containing both standard and full configs
type LLMOutputConfig = { updatedStandardConfig: LLMStdConfig; updatedFullContentConfig: LLMFullStdConfig };

// Generates standard LLM configuration by processing session files
export const generateLLMStdConfig = async (
  stdConfig: LLMStdConfig,
  buildFilesPaths: Set<string>,
  llmSessionFiles: SessionFiles[],
  pluginSiteConfig: SiteConfiguration,
): Promise<LLMStdConfig> => {
  for await (const llmSessionFile of llmSessionFiles) {
    const session: LLMSession = {
      sessionName: llmSessionFile.docsDir,
      items: [],
    };
    for await (const filePath of llmSessionFile.docsFiles) {
      const { title, description, link } = await markdownMetadataParser({
        type: llmSessionFile.type,
        buildFilesPaths,
        filePath,
        siteConfig: pluginSiteConfig.siteConfig,
        baseDir: path.join(pluginSiteConfig.siteDir, llmSessionFile.docsDir),
        siteUrl: pluginSiteConfig.siteUrl,
        outDir: pluginSiteConfig.outDir,
        pathPrefix: llmSessionFile.docsDir,
        removeContentTitle: true,
      });

      session.items.push({
        title: title ?? "",
        description: description ?? "",
        link: link ?? "",
      });
    }

    if (session.items.length > 0) {
      stdConfig.sessions.push(session);
    }
  }

  return stdConfig;
};

// Generates full LLM configuration with complete content from session files
export const generateLLMFullStdConfig = async (
  stdFullConfig: LLMFullStdConfig,
  buildFilesPaths: Set<string>,
  llmSessionFiles: SessionFiles[],
  pluginSiteConfig: SiteConfiguration,
): Promise<LLMFullStdConfig> => {
  for await (const llmSessionFile of llmSessionFiles) {
    for await (const filePath of llmSessionFile.docsFiles) {
      const { title, content } = await markdownMetadataParser({
        type: llmSessionFile.type,
        buildFilesPaths,
        filePath,
        siteConfig: pluginSiteConfig.siteConfig,
        baseDir: path.join(pluginSiteConfig.siteDir, llmSessionFile.docsDir),
        siteUrl: pluginSiteConfig.siteUrl,
        outDir: pluginSiteConfig.outDir,
        pathPrefix: llmSessionFile.docsDir,
        removeContentTitle: true,
      });

      stdFullConfig.sessions.push({
        title: title ?? "",
        content,
      });
    }
  }

  return stdFullConfig;
};

/**
 * Standardize the content of llms.txt
 * @param llmStdConfig
 * @returns
 */
export const standardizeLLMsTxtContent = (llmStdConfig: LLMStdConfig, extraSession?: AdditionalSession): string => {
  // Generate Title 、Description 、Details
  const headerSection = [`# ${llmStdConfig.title}`, `> ${llmStdConfig.description}`, llmStdConfig.summary]
    .filter(Boolean)
    .join("\n\n");

  // Generate sessions content
  const sessionsContent = llmStdConfig.sessions
    .map((session) => {
      const sessionHeader = `\n\n## ${session.sessionName}\n\n`;
      const sessionItems = session.items
        .map((item) => {
          const baseLink = `- [${item.title}](${item.link})`;
          return item.description ? `${baseLink}: ${item.description}` : `${baseLink}`;
        })
        .join("\n");

      return sessionHeader + sessionItems;
    })
    .join("");

  // Generate extra links
  let extraContent = "";
  if (extraSession) {
    const extraLinksHeader = `\n\n## ${extraSession.sessionName}\n\n`;
    extraContent =
      extraLinksHeader +
      extraSession.extraLinks
        .map((link) => {
          const baseLink = `- [${link.title}](${link.link})`;
          return link.description ? `${baseLink}: ${link.description}` : `${baseLink}`;
        })
        .join("\n");
  }

  return headerSection + sessionsContent + extraContent;
};

/**
 * Standardize the content of llms-full.txt
 * @param llmFullStdConfig
 * @returns
 */
export const standardizeLLMsFullTxtContent = (llmFullStdConfig: LLMFullStdConfig): string => {
  // Generate Title 、Description 、Details
  const headerSection = [`# ${llmFullStdConfig.title}`, `> ${llmFullStdConfig.description}`, llmFullStdConfig.summary]
    .filter(Boolean)
    .join("\n\n");

  // Generate sessions content
  const sessionsContent = llmFullStdConfig.sessions
    .map((session) => {
      const sessionHeader = `\n\n## ${session.title}\n`;
      const sessionItems = `\n${session.content}\n`;
      return sessionHeader + sessionItems + "\n---\n";
    })
    .join("");

  return headerSection + sessionsContent;
};

/**
 * Generate llms.txt or llms-full.txt
 * @param outDir
 * @param filename
 * @param content
 * @returns
 */
export const generateLLMsTxt = async (outDir: string, filename: string, content: string): Promise<void> => {
  return generate(outDir, filename, content, true);
};

// Initialize both standard and full LLM configurations with basic metadata
const initializeLLMConfigurations = (config: ContentConfiguration): LLMOutputConfig => {
  return {
    updatedStandardConfig: {
      title: config.title ?? "",
      description: config.description ?? "",
      summary: config.summary ?? "",
      sessions: [],
    },
    updatedFullContentConfig: {
      title: config.title ?? "",
      description: config.description ?? "",
      summary: config.summary ?? "",
      sessions: [],
    },
  };
};

// Process documentation type sessions by parsing sitemap and HTML content
const processDocumentationSession = async (
  sessionFileData: SessionFiles,
  siteConfig: SiteConfiguration,
  standardConfig: LLMStdConfig,
  fullContentConfig: LLMFullStdConfig,
): Promise<LLMOutputConfig> => {
  assert(sessionFileData.type === "docs", `Session ${sessionFileData.docsDir} is not a docs type, skipping processing`);

  const sessionSummary: LLMSession = {
    sessionName: sessionFileData.docsDir,
    items: [],
  };
  const fullContentSession: LLMFullSessionItem = {
    title: sessionFileData.docsDir,
    content: "",
  };

  const sitemapPath = path.join(siteConfig.outDir, sessionFileData.sitemap!);
  const urlList = await sitemapParser(sitemapPath);
  if (!urlList) return { updatedStandardConfig: standardConfig, updatedFullContentConfig: fullContentConfig };

  for await (const pageUrl of urlList) {
    const htmlFilePath = decodeURIComponent(
      path.join(siteConfig.outDir, pageUrl.replace(siteConfig.siteUrl, ""), "index.html"),
    );
    const pageTitle = await htmlTitleParser(htmlFilePath);
    const pageContent = await htmlContentParser(htmlFilePath);

    sessionSummary.items.push({
      title: pageTitle,
      link: pageUrl,
    });

    fullContentConfig.sessions.push({
      title: pageTitle,
      content: pageContent ?? "",
    });
  }

  standardConfig.sessions.push(sessionSummary);
  fullContentConfig.sessions.push(fullContentSession);

  return { updatedStandardConfig: standardConfig, updatedFullContentConfig: fullContentConfig };
};

// Process blog type sessions by parsing RSS feed content
const processBlogSession = async (
  sessionFileData: SessionFiles,
  siteConfig: SiteConfiguration,
  standardConfig: LLMStdConfig,
  fullContentConfig: LLMFullStdConfig,
): Promise<LLMOutputConfig> => {
  assert(sessionFileData.type === "blog", `Session ${sessionFileData.docsDir} is not a blog type, skipping processing`);

  const sessionSummary: LLMSession = {
    sessionName: sessionFileData.docsDir,
    items: [],
  };
  const fullContentSession: LLMFullSessionItem = {
    title: sessionFileData.docsDir,
    content: "",
  };

  const rssFilePath = path.join(siteConfig.outDir, sessionFileData.docsDir, sessionFileData.rss!);
  const blogEntries = await parseRssItems(rssFilePath);

  for await (const blogEntry of blogEntries) {
    sessionSummary.items.push({
      title: blogEntry.title,
      description: blogEntry.description,
      link: blogEntry.link,
    });
    fullContentSession.content = blogEntry.content ?? "";
  }

  standardConfig.sessions.push(sessionSummary);
  fullContentConfig.sessions.push(fullContentSession);

  return { updatedStandardConfig: standardConfig, updatedFullContentConfig: fullContentConfig };
};

// Process generic session files using pattern filters
const processGenericSession = async (
  sessionFileData: SessionFiles,
  siteConfig: SiteConfiguration,
  buildFilePaths: Set<string>,
  processedSessionFiles: SessionFiles[],
  standardConfig: LLMStdConfig,
  fullContentConfig: LLMFullStdConfig,
): Promise<LLMOutputConfig> => {
  const processedSessionFile = await processLLMSessionsFilesWithPatternFilters(sessionFileData, siteConfig);
  processedSessionFiles.push(processedSessionFile);

  const updatedStandardConfig = await generateLLMStdConfig(
    standardConfig,
    buildFilePaths,
    processedSessionFiles,
    siteConfig,
  );
  const updatedFullContentConfig = await generateLLMFullStdConfig(
    fullContentConfig,
    buildFilePaths,
    processedSessionFiles,
    siteConfig,
  );

  return { updatedStandardConfig, updatedFullContentConfig };
};

// Generate output files based on configuration
const generateOutputFiles = async (
  llmConfig: ContentConfiguration,
  siteConfig: SiteConfiguration,
  standardConfig: LLMStdConfig,
  fullContentConfig: LLMFullStdConfig,
): Promise<void> => {
  const fileNamePrefix = llmConfig.infixName ? `llms-${llmConfig.infixName}` : "llms";

  if (llmConfig.generateLLMsTxt) {
    const standardContent = standardizeLLMsTxtContent(standardConfig, llmConfig.extraSession);
    await generateLLMsTxt(siteConfig.outDir, `${fileNamePrefix}.txt`, standardContent);
  }

  if (llmConfig.generateLLMsFullTxt) {
    const fullContent = standardizeLLMsFullTxtContent(fullContentConfig);
    await generateLLMsTxt(siteConfig.outDir, `${fileNamePrefix}-full.txt`, fullContent);
  }
};

// Main flow for generating LLMs text files
export const generateLLMsTxtFlow = async (context: BuilderContext): Promise<void> => {
  const { pluginSiteConfig: siteConfig, llmConfigs } = context;
  const buildFilePaths = await getAllDocusaurusBuildFilesPaths(siteConfig.outDir);

  for await (const currentLLMConfig of llmConfigs) {
    if (!currentLLMConfig.generateLLMsTxt && !currentLLMConfig.generateLLMsFullTxt) {
      continue;
    }

    const sessionFilesList = await collectLLMSessionFiles(siteConfig.siteDir, currentLLMConfig);

    if (sessionFilesList.length === 0) {
      console.warn("No session files found: ", JSON.stringify(currentLLMConfig));
      continue;
    }

    const { updatedStandardConfig: standardConfig, updatedFullContentConfig: fullContentConfig } =
      initializeLLMConfigurations(currentLLMConfig);
    const processedSessionFiles: SessionFiles[] = [];

    let currentStandardConfig = standardConfig;
    let currentFullContentConfig = fullContentConfig;

    for await (const sessionFileData of sessionFilesList) {
      if (sessionFileData.type === "docs" && sessionFileData.sitemap) {
        const { updatedStandardConfig, updatedFullContentConfig } = await processDocumentationSession(
          sessionFileData,
          siteConfig,
          currentStandardConfig,
          currentFullContentConfig,
        );
        currentStandardConfig = updatedStandardConfig;
        currentFullContentConfig = updatedFullContentConfig;
      } else if (sessionFileData.type === "blog" && sessionFileData.rss) {
        const { updatedStandardConfig, updatedFullContentConfig } = await processBlogSession(
          sessionFileData,
          siteConfig,
          currentStandardConfig,
          currentFullContentConfig,
        );
        currentStandardConfig = updatedStandardConfig;
        currentFullContentConfig = updatedFullContentConfig;
      } else {
        const { updatedStandardConfig, updatedFullContentConfig } = await processGenericSession(
          sessionFileData,
          siteConfig,
          buildFilePaths,
          processedSessionFiles,
          currentStandardConfig,
          currentFullContentConfig,
        );
        currentStandardConfig = updatedStandardConfig;
        currentFullContentConfig = updatedFullContentConfig;
      }
    }

    await generateOutputFiles(currentLLMConfig, siteConfig, currentStandardConfig, currentFullContentConfig);
  }
};
