import { generate } from "@docusaurus/utils";
import path from "node:path";

import { collectLLMSessionFiles, processLLMSessionsFilesWithPatternFilters } from "./docs";
import { markdownMetadataParser } from "./markdown";
import type { ExtraSession, LLMConfig, LLMSessionFiles, PluginContext, PluginSiteConfig } from "./types";
import { htmlContentParser, htmlTitleParser, sitemapParser } from "./xml";

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

export const generateLLMStdConfig = async (
  buildFilesPaths: Set<string>,
  llmSessionFiles: LLMSessionFiles[],
  llmConfig: LLMConfig,
  pluginSiteConfig: PluginSiteConfig,
): Promise<LLMStdConfig> => {
  const { title, description, summary } = llmConfig;

  const stdConfig: LLMStdConfig = {
    title: title ?? "",
    description: description ?? "",
    summary: summary ?? "",
    sessions: [],
  };

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
  buildFilesPaths: Set<string>,
  llmSessionFiles: LLMSessionFiles[],
  llmConfig: LLMConfig,
  pluginSiteConfig: PluginSiteConfig,
): Promise<LLMFullStdConfig> => {
  const { title, description, summary } = llmConfig;

  const stdFullConfig: LLMFullStdConfig = {
    title: title ?? "",
    description: description ?? "",
    summary: summary ?? "",
    sessions: [],
  };

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

export const generateLLMsTxtFlow = async (context: PluginContext): Promise<void> => {
  const { pluginSiteConfig, llmConfigs } = context;

  for await (const llmConfig of llmConfigs) {
    // 1. check if generateLLMsTxt or generateLLMsFullTxt is true
    if (!llmConfig.generateLLMsTxt && !llmConfig.generateLLMsFullTxt) {
      continue;
    }

    // 2. Collect docs files
    const llmSessionFiles = await collectLLMSessionFiles(pluginSiteConfig.siteDir, llmConfig);

    // 3. judge if docsFiles is empty
    if (llmSessionFiles.length === 0) {
      console.warn("No docs files found: ", JSON.stringify(llmConfig));
      continue;
    }
    // 5. Process docs files
    const sessionFiles = [];

    const stdConfig: LLMStdConfig = {
      title: llmConfig.title ?? "",
      description: llmConfig.description ?? "",
      summary: llmConfig.summary ?? "",
      sessions: [],
    };
    const llmFullStdConfig: LLMFullStdConfig = {
      title: llmConfig.title ?? "",
      description: llmConfig.description ?? "",
      summary: llmConfig.summary ?? "",
      sessions: [],
    };
    for await (const llmSessionFile of llmSessionFiles) {
      const sessionItem: LLMSession = {
        sessionName: llmSessionFile.docsDir,
        items: [],
      };
      const sessionFullItem: LLMFullSessionItem = {
        title: llmSessionFile.docsDir,
        content: "",
      };
      if (llmSessionFile.type === "docs" && llmSessionFile.sitemap) {
        const locUrls = await sitemapParser(path.join(pluginSiteConfig.outDir, llmSessionFile.sitemap));
        if (!locUrls) continue;
        for await (const locUrl of locUrls) {
          const filePath = path.join(
            pluginSiteConfig.outDir,
            locUrl.replace(pluginSiteConfig.siteUrl, ""),
            "index.html",
          );
          const title = await htmlTitleParser(filePath);
          const content = await htmlContentParser(filePath);
          sessionItem.items.push({
            title: title,
            link: locUrl,
          });
          sessionFullItem.content = content ?? "";
        }
        stdConfig.sessions.push(sessionItem);
        llmFullStdConfig.sessions.push(sessionFullItem);
      } else if (llmSessionFile.type === "blog" && llmSessionFile.rss) {
      } else {
        const sessionFile = await processLLMSessionsFilesWithPatternFilters(llmSessionFile, pluginSiteConfig);
        sessionFiles.push(sessionFile);
      }
      stdConfig.sessions.push(sessionItem);
    }

    if (llmConfig.generateLLMsTxt) {
      const llmsTxtContent = standardizeLLMsTxtContent(stdConfig, llmConfig.extraSession);
      await generateLLMsTxt(
        pluginSiteConfig.outDir,
        llmConfig.infixName ? `llms-${llmConfig.infixName}.txt` : "llms.txt",
        llmsTxtContent,
      );
    }

    if (llmConfig.generateLLMsFullTxt) {
      const llmsFullTxtContent = standardizeLLMsFullTxtContent(llmFullStdConfig);
      await generateLLMsTxt(
        pluginSiteConfig.outDir,
        llmConfig.infixName ? `llms-${llmConfig.infixName}-full.txt` : "llms-full.txt",
        llmsFullTxtContent,
      );
    }
  }
};
