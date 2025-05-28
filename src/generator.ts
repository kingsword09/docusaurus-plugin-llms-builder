import type { LoadContext } from "@docusaurus/types";
import fs from "node:fs/promises";
import path from "node:path";
import { readMarkdownFiles } from "./fs";
import type { ExtraLLMConfig, LLMDefaultConfig, LLMPathConfig } from "./options";

const collectDocsFiles = async (context: LoadContext, llmsPathConfig: LLMPathConfig, includeBlog: boolean = false) => {
  const allDocsFiles = [];
  const { siteDir } = context;
  const { docsDir, ignorePatterns } = llmsPathConfig;

  // Process docs directory
  const fullDocsDir = path.join(siteDir, docsDir);

  try {
    await fs.access(fullDocsDir);

    // Collect all markdown files from docs directory
    const docFiles = await readMarkdownFiles(fullDocsDir, siteDir, ignorePatterns);
    allDocsFiles.push(...docFiles);
  } catch (err) {
    console.warn(`Docs directory not found: ${fullDocsDir}`, err);
  }

  // Process blog if enabled
  if (includeBlog) {
    const blogDir = path.join(siteDir, "blog");

    try {
      await fs.access(blogDir);

      // Collect all markdown files from blog directory
      const blogFiles = await readMarkdownFiles(blogDir, siteDir, ignorePatterns);
      allDocsFiles.push(...blogFiles);
    } catch (err) {
      console.warn(`Blog directory not found: ${blogDir}`, err);
    }
  }

  return allDocsFiles;
};

export const collectDefaultDocsFiles = (
  context: LoadContext,
  defaultLLMConfig: LLMDefaultConfig,
): Promise<string[]> => {
  return collectDocsFiles(context, defaultLLMConfig, defaultLLMConfig.includeBlog);
};

export const collectCustomDocsFiles = async (
  context: LoadContext,
  customLLMConfig: ExtraLLMConfig[],
): Promise<string[]> => {
  const allDocsFiles: string[] = [];

  for await (const config of customLLMConfig) {
    allDocsFiles.concat(await collectDocsFiles(context, config));
  }

  return allDocsFiles;
};
