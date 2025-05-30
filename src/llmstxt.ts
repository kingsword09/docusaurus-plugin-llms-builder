import { generate } from "@docusaurus/utils";
import assert from "node:assert";
import path from "node:path";

import {
  collectLLMSessionFiles,
  getAllDocusaurusBuildFilesPaths,
  processLLMSessionsFilesWithPatternFilters,
} from "./docs";
import { markdownMetadataParser } from "./markdown";
import type { ExtraSession, LLMConfig, LLMSessionFiles, PluginContext, PluginSiteConfig } from "./types";
import { htmlContentParser, htmlTitleParser, parseRssItems, sitemapParser } from "./xml";

type LLMSessionItem = {
  title: string;
  link: string;
  description?: string;
};

type LLMSession = {
  sessionName: string;
  items: LLMSessionItem[];
};

type LLMStdConfig = {
  title: string;
  description: string;
  summary?: string;
  sessions: LLMSession[];
};

type LLMFullSessionItem = {
  title: string;
  content: string;
};

type LLMFullStdConfig = {
  title: string;
  description: string;
  summary?: string;
  sessions: LLMFullSessionItem[];
};

type LLMOutputConfig = { updatedStandardConfig: LLMStdConfig; updatedFullContentConfig: LLMFullStdConfig };

export const generateLLMStdConfig = async (
  stdConfig: LLMStdConfig,
  buildFilesPaths: Set<string>,
  llmSessionFiles: LLMSessionFiles[],
  pluginSiteConfig: PluginSiteConfig,
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

export const generateLLMFullStdConfig = async (
  stdFullConfig: LLMFullStdConfig,
  buildFilesPaths: Set<string>,
  llmSessionFiles: LLMSessionFiles[],
  pluginSiteConfig: PluginSiteConfig,
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
export const standardizeLLMsTxtContent = (llmStdConfig: LLMStdConfig, extraSession?: ExtraSession): string => {
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

/**
 * 初始化LLM配置对象
 */
const initializeLLMConfigurations = (config: LLMConfig): LLMOutputConfig => {
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

/**
 * 处理文档类型的会话文件
 */
const processDocumentationSession = async (
  sessionFileData: LLMSessionFiles,
  siteConfig: PluginSiteConfig,
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

/**
 * 处理博客类型的会话文件
 */
const processBlogSession = async (
  sessionFileData: LLMSessionFiles,
  siteConfig: PluginSiteConfig,
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

/**
 * 处理其他类型的会话文件
 */
const processGenericSession = async (
  sessionFileData: LLMSessionFiles,
  siteConfig: PluginSiteConfig,
  buildFilePaths: Set<string>,
  processedSessionFiles: LLMSessionFiles[],
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

/**
 * 生成并写入LLM文本文件
 */
const generateOutputFiles = async (
  llmConfig: LLMConfig,
  siteConfig: PluginSiteConfig,
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

export const generateLLMsTxtFlow = async (context: PluginContext): Promise<void> => {
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
    const processedSessionFiles: LLMSessionFiles[] = [];

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
