import { generate } from "@docusaurus/utils";
import path from "node:path";

import { collectLLMSessionFiles, processLLMSessionsFilesWithPatternFilters } from "./docs";
import { markdownMetadataParser } from "./markdown";
import type { ExtraSession, LLMConfig, LLMSessionFiles, PluginContext, PluginSiteConfig } from "./types";

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
  llmSessionFiles: LLMSessionFiles,
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

  const session: LLMSession = {
    sessionName: llmSessionFiles.infixName ?? llmSessionFiles.docsDir,
    items: [],
  };

  for await (const filePath of llmSessionFiles.docsFiles) {
    const { title, description, link } = await markdownMetadataParser({
      filePath,
      siteConfig: pluginSiteConfig.siteConfig,
      baseDir: path.join(pluginSiteConfig.siteDir, llmSessionFiles.docsDir),
      siteUrl: pluginSiteConfig.siteUrl,
      pathPrefix: llmSessionFiles.docsDir,
      removeContentTitle: true,
    });
    session.items.push({
      title: title ?? "",
      description: description ?? "",
      link: link ?? "",
    });
  }
  stdConfig.sessions.push(session);

  console.warn("stdConfig: ", JSON.stringify(stdConfig));
  return stdConfig;
};

export const generateLLMFullStdConfig = async (
  llmSessionFiles: LLMSessionFiles,
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

  for await (const filePath of llmSessionFiles.docsFiles) {
    const { title, content } = await markdownMetadataParser({
      filePath,
      siteConfig: pluginSiteConfig.siteConfig,
      baseDir: path.join(pluginSiteConfig.siteDir, llmSessionFiles.docsDir),
      siteUrl: pluginSiteConfig.siteUrl,
      pathPrefix: llmSessionFiles.docsDir,
      removeContentTitle: true,
    });

    stdFullConfig.sessions.push({
      title: title ?? "",
      content,
    });
  }

  console.warn("stdFullConfig: ", JSON.stringify(stdFullConfig));

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
          return item.description ? `${baseLink}: ${item.description}` : `${baseLink}\n`;
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
          return link.description ? `${baseLink}: ${link.description}` : `${baseLink}\n`;
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
      const sessionHeader = `\n## ${session.title}\n`;
      const sessionItems = session.content;
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
  console.warn("llmConfigs: ", JSON.stringify(llmConfigs));
  console.warn("pluginSiteConfig: ", JSON.stringify(pluginSiteConfig));

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

    // 4. Process docs files
    for await (const llmSessionFile of llmSessionFiles) {
      const sessionFiles = await processLLMSessionsFilesWithPatternFilters(llmSessionFile, pluginSiteConfig);

      const stdConfig = await generateLLMStdConfig(sessionFiles, llmConfig, pluginSiteConfig);

      if (llmConfig.generateLLMsTxt) {
        const llmsTxtContent = standardizeLLMsTxtContent(stdConfig, llmConfig.extraSession);
        await generateLLMsTxt(
          pluginSiteConfig.outDir,
          llmSessionFile.infixName ? `llms-${llmSessionFile.infixName}.txt` : "llms.txt",
          llmsTxtContent,
        );
      }

      if (llmConfig.generateLLMsFullTxt) {
        const llmFullStdConfig = await generateLLMFullStdConfig(sessionFiles, llmConfig, pluginSiteConfig);
        const llmsFullTxtContent = standardizeLLMsFullTxtContent(llmFullStdConfig);
        await generateLLMsTxt(
          pluginSiteConfig.outDir,
          llmSessionFile.infixName ? `llms-${llmSessionFile.infixName}-full.txt` : "llms-full.txt",
          llmsFullTxtContent,
        );
      }
    }
  }
};
