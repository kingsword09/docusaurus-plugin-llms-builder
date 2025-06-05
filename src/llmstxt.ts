import { generate } from "@docusaurus/utils";
import { minimatch } from "minimatch";
import assert from "node:assert";
import path from "node:path";

import {
  collectLLMSessionFiles,
  getAllDocusaurusBuildFilesPaths,
  processLLMSessionsFilesWithPatternFilters,
} from "./files";
import { createLlmsHooks } from "./hooks";
import { markdownMetadataParser } from "./parser";
import type {
  AdditionalSession,
  BuilderContext,
  ContentConfiguration,
  LLMFullStdConfig,
  LLMOutputConfig,
  LLMSession,
  LLMStdConfig,
  RSSFeedItem,
  SessionFiles,
  SiteConfiguration,
} from "./types";
import { htmlParser, parseRssItems, sitemapParser } from "./xml";

// Generates standard LLM configuration by processing session files
const generateLLMStdConfig = async (
  stdConfig: LLMStdConfig,
  buildFilesPaths: Set<string>,
  llmSessionFiles: SessionFiles[],
  pluginSiteConfig: SiteConfiguration,
): Promise<LLMStdConfig> => {
  for await (const llmSessionFile of llmSessionFiles) {
    const session: LLMSession = {
      sessionName: llmSessionFile.sessionName ?? llmSessionFile.docsDir,
      source: "normal",
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
const generateLLMFullStdConfig = async (
  stdFullConfig: LLMFullStdConfig,
  buildFilesPaths: Set<string>,
  llmSessionFiles: SessionFiles[],
  pluginSiteConfig: SiteConfiguration,
): Promise<LLMFullStdConfig> => {
  for await (const llmSessionFile of llmSessionFiles) {
    for await (const filePath of llmSessionFile.docsFiles) {
      const { title, content, link } = await markdownMetadataParser({
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
        link,
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
const standardizeLLMsTxtContent = (llmStdConfig: LLMStdConfig, extraSession?: AdditionalSession): string => {
  // Generate Title 、Description 、Details
  const headerSection = [`# ${llmStdConfig.title}`, `> ${llmStdConfig.description}`, llmStdConfig.summary]
    .filter(Boolean)
    .join("\n\n");

  // Generate Table of Contents
  const sessionsContent =
    `\n\n## Table of Contents` +
    llmStdConfig.sessions
      .map((session) => {
        const sessionHeader = `\n\n### ${session.sessionName}\n\n`;
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
    const extraLinksHeader = `\n\n### ${extraSession.sessionName}\n\n`;
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
const standardizeLLMsFullTxtContent = (llmFullStdConfig: LLMFullStdConfig): string => {
  // Generate Title 、Description 、Details
  const headerSection = [`# ${llmFullStdConfig.title}`, `> ${llmFullStdConfig.description}`, llmFullStdConfig.summary]
    .filter(Boolean)
    .join("\n\n");

  // Generate sessions content
  const sessionsContent = llmFullStdConfig.sessions
    .map((session) => {
      const sessionHeader = `\n\n---\nurl: ${session.link}\n---\n${session.title ? "# " + session.title + "\n" : ""}`;
      const sessionItems = `\n${session.content.trim()}\n`;
      return sessionHeader + sessionItems + "\n---";
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
const generateLLMsTxt = async (outDir: string, filename: string, content: string): Promise<void> => {
  return generate(outDir, filename, content, true);
};

// Initialize both standard and full LLM configurations with basic metadata
const initializeLLMConfigurations = (config: ContentConfiguration): LLMOutputConfig => {
  return {
    llmStdConfig: {
      title: config.title ?? "",
      description: config.description ?? "",
      summary: config.summary ?? "",
      sessions: [],
    },
    llmFullStdConfig: {
      title: config.title ?? "",
      description: config.description ?? "",
      summary: config.summary ?? "",
      processedUrls: new Set(),
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

  const sessionItem: LLMSession = {
    sessionName: sessionFileData.sessionName ?? sessionFileData.docsDir,
    source: "sitemap",
    items: [],
  };

  const { ignorePatterns, includePatterns, orderPatterns } = sessionFileData.patterns ?? {};

  const sitemapPath = path.join(siteConfig.outDir, sessionFileData.sitemap!);
  const urlList = await sitemapParser(sitemapPath);
  if (!urlList) return { llmStdConfig: standardConfig, llmFullStdConfig: fullContentConfig };

  let matchedUrls: string[] = [];

  // Process files according to orderPatterns
  if (orderPatterns) {
    if (Array.isArray(orderPatterns)) {
      for await (const orderPattern of orderPatterns) {
        const matchedUrlsByPattern = urlList.filter((url) => minimatch(url, orderPattern, { matchBase: true }));
        matchedUrlsByPattern.forEach((url) => matchedUrls.push(url));
      }

      const unmatchedUrls = urlList.filter((url) => !matchedUrls.includes(url));
      matchedUrls = matchedUrls.concat(unmatchedUrls);
    } else {
      matchedUrls = urlList.sort(orderPatterns);
    }
  } else {
    matchedUrls = urlList;
  }

  for await (const pageUrl of matchedUrls) {
    const htmlFilePath = decodeURIComponent(
      path.join(siteConfig.outDir, pageUrl.replace(siteConfig.siteUrl, ""), "index.html"),
    );

    if (ignorePatterns && ignorePatterns.some((pattern) => minimatch(pageUrl, pattern, { matchBase: true }))) {
      continue;
    }

    if (includePatterns && !includePatterns.some((pattern) => minimatch(pageUrl, pattern, { matchBase: true }))) {
      continue;
    }

    const htmlParserResult = await htmlParser(htmlFilePath);
    const pageTitle = htmlParserResult?.title ?? "";
    const content = htmlParserResult?.content ?? "";

    sessionItem.items.push({
      title: pageTitle,
      link: pageUrl,
      description: htmlParserResult?.description ?? "",
    });

    if (fullContentConfig.processedUrls.has(pageUrl)) continue;
    fullContentConfig.processedUrls.add(pageUrl);
    fullContentConfig.sessions.push({
      title: pageTitle,
      link: pageUrl,
      content,
    });
  }

  standardConfig.sessions.push(sessionItem);

  return { llmStdConfig: standardConfig, llmFullStdConfig: fullContentConfig };
};

// Process blog type sessions by parsing RSS feed content
const processBlogSession = async (
  sessionFileData: SessionFiles,
  siteConfig: SiteConfiguration,
  standardConfig: LLMStdConfig,
  fullContentConfig: LLMFullStdConfig,
): Promise<LLMOutputConfig> => {
  assert(sessionFileData.type === "blog", `Session ${sessionFileData.docsDir} is not a blog type, skipping processing`);

  const { ignorePatterns, includePatterns, orderPatterns } = sessionFileData.patterns ?? {};

  const sessionItem: LLMSession = {
    sessionName: sessionFileData.sessionName ?? sessionFileData.docsDir,
    source: "rss",
    items: [],
  };

  const rssFilePath = path.join(siteConfig.outDir, sessionFileData.docsDir, sessionFileData.rss!);
  const blogEntries = await parseRssItems(rssFilePath);

  let matchedRssFeedItems: RSSFeedItem[] = [];

  // Process files according to orderPatterns
  if (orderPatterns) {
    if (Array.isArray(orderPatterns)) {
      for await (const orderPattern of orderPatterns) {
        const matchedUrlsByPattern = blogEntries.filter((entry) =>
          minimatch(entry.link, orderPattern, { matchBase: true }),
        );
        matchedUrlsByPattern.forEach((rssFeedItem) => matchedRssFeedItems.push(rssFeedItem));
      }
      const unmatchedUrls = blogEntries.filter((entry) => !matchedRssFeedItems.includes(entry));
      matchedRssFeedItems = matchedRssFeedItems.concat(unmatchedUrls);
    } else {
      const entryMap = new Map(blogEntries.map((entry) => [entry.link, entry]));
      matchedRssFeedItems = Array.from(entryMap.keys())
        .sort(orderPatterns)
        .map((link) => entryMap.get(link)!)
        .filter(Boolean);
    }
  } else {
    matchedRssFeedItems = blogEntries;
  }

  for await (const blogEntry of matchedRssFeedItems) {
    if (ignorePatterns && ignorePatterns.some((pattern) => minimatch(blogEntry.link, pattern, { matchBase: true }))) {
      continue;
    }

    if (
      includePatterns &&
      !includePatterns.some((pattern) => minimatch(blogEntry.link, pattern, { matchBase: true }))
    ) {
      continue;
    }

    sessionItem.items.push({
      title: blogEntry.title,
      description: blogEntry.description,
      link: blogEntry.link,
    });

    if (fullContentConfig.processedUrls.has(blogEntry.link)) continue;

    fullContentConfig.processedUrls.add(blogEntry.link);
    fullContentConfig.sessions.push({
      title: blogEntry.title,
      link: blogEntry.link,
      content: blogEntry.content ?? "",
    });
  }

  standardConfig.sessions.push(sessionItem);

  return { llmStdConfig: standardConfig, llmFullStdConfig: fullContentConfig };
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

  return { llmStdConfig: updatedStandardConfig, llmFullStdConfig: updatedFullContentConfig };
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

    let { llmStdConfig: currentStandardConfig, llmFullStdConfig: currentFullContentConfig } =
      initializeLLMConfigurations(currentLLMConfig);

    for await (const sessionFileData of sessionFilesList) {
      if (sessionFileData.type === "docs" && sessionFileData.sitemap) {
        const { llmStdConfig, llmFullStdConfig } = await processDocumentationSession(
          sessionFileData,
          siteConfig,
          currentStandardConfig,
          currentFullContentConfig,
        );
        currentStandardConfig = llmStdConfig;
        currentFullContentConfig = llmFullStdConfig;
      } else if (sessionFileData.type === "blog" && sessionFileData.rss) {
        const { llmStdConfig, llmFullStdConfig } = await processBlogSession(
          sessionFileData,
          siteConfig,
          currentStandardConfig,
          currentFullContentConfig,
        );
        currentStandardConfig = llmStdConfig;
        currentFullContentConfig = llmFullStdConfig;
      } else {
        const processedSessionFiles: SessionFiles[] = [];
        const { llmStdConfig, llmFullStdConfig } = await processGenericSession(
          sessionFileData,
          siteConfig,
          buildFilePaths,
          processedSessionFiles,
          currentStandardConfig,
          currentFullContentConfig,
        );
        currentStandardConfig = llmStdConfig;
        currentFullContentConfig = llmFullStdConfig;
      }
    }

    currentStandardConfig.sessions = currentStandardConfig.sessions.map((session) => {
      // If the session source is sitemap, filter out items whose URLs match other sessions' URLs
      if (session.source === "sitemap") {
        const otherSessionUrls = new Set(
          currentStandardConfig.sessions
            .filter((s) => s.sessionName !== session.sessionName)
            .flatMap((s) => s.items.map((item) => item.link)),
        );

        session.items = session.items.filter((item) => !otherSessionUrls.has(item.link));
      }
      return session;
    });

    const { hooks, context } = await createLlmsHooks(currentLLMConfig, currentStandardConfig, currentFullContentConfig);
    await hooks.callHook("generate:prepare", context);

    await generateOutputFiles(
      currentLLMConfig,
      siteConfig,
      context.llmConfig.llmStdConfig,
      context.llmConfig.llmFullStdConfig,
    );
  }
};
