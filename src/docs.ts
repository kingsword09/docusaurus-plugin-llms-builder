import type { DocusaurusConfig } from "@docusaurus/types";
import { minimatch } from "minimatch";
import fs from "node:fs/promises";
import path from "node:path";

import { collectMarkdownFiles } from "./fs";
import { markdownMetadataParser } from "./markdown";
import type { DocsInfo, ExtraLLMConfig, LLMDefaultConfig, LLMPatternsConfig } from "./types";

const collectIgnorePatternsDocsFiles = async (
  siteDir: string,
  docsDir: string,
  ignorePatterns: string[],
  blogDirname?: string,
): Promise<string[]> => {
  const allDocsFiles = [];

  // Process docs directory
  const fullDocsDir = path.join(siteDir, docsDir);

  try {
    await fs.access(fullDocsDir);

    // Collect all markdown files from docs directory
    const docFiles = await collectMarkdownFiles(fullDocsDir, siteDir, ignorePatterns);
    allDocsFiles.push(...docFiles);
  } catch (err) {
    console.warn(`Docs directory not found: ${fullDocsDir}`, err);
  }

  // Process blog if enabled
  if (blogDirname) {
    const blogDir = path.join(siteDir, blogDirname);

    try {
      await fs.access(blogDir);

      // Collect all markdown files from blog directory
      const blogFiles = await collectMarkdownFiles(siteDir, blogDir, ignorePatterns);
      allDocsFiles.push(...blogFiles);
    } catch (err) {
      console.warn(`Blog directory not found: ${blogDir}`, err);
    }
  }

  return allDocsFiles;
};

/**
 * Collect all docs files from docs directory and blog directory
 *
 * @param siteDir
 * @param defaultLLMConfig
 * @returns
 */
export const collectDefaultDocsFiles = (siteDir: string, defaultLLMConfig: LLMDefaultConfig): Promise<string[]> => {
  return collectIgnorePatternsDocsFiles(
    siteDir,
    defaultLLMConfig.docsDir,
    defaultLLMConfig.ignorePatterns ?? [],
    defaultLLMConfig.blogDirname,
  );
};

/**
 * Collect all docs files from custom docs directory
 *
 * @param siteDir
 * @param customLLMConfig
 * @returns
 */
export const collectCustomDocsFiles = async (siteDir: string, customLLMConfig: ExtraLLMConfig[]): Promise<string[]> => {
  const allDocsFiles: string[] = [];

  for await (const config of customLLMConfig) {
    allDocsFiles.concat(await collectIgnorePatternsDocsFiles(siteDir, config.docsDir, config.ignorePatterns ?? []));
  }

  return allDocsFiles;
};

/**
 * Process docs files with patterns
 *
 * @param options
 * @returns
 */
export const processDocsWithPatternFilters = async (options: {
  siteDir: string;
  siteUrl: string;
  siteConfig: DocusaurusConfig;
  docsDir: string;
  allDocsFiles: string[];
  patterns: LLMPatternsConfig;
  blogDirname?: string;
}): Promise<DocsInfo[]> => {
  const { siteDir, siteUrl, siteConfig, docsDir, allDocsFiles, patterns, blogDirname } = options;
  const { includePatterns, ignorePatterns, orderPatterns, includeUnmatched } = patterns;

  // Filter files based on include patterns
  let filteredFiles = allDocsFiles;

  if (includePatterns && includePatterns.length > 0) {
    filteredFiles = allDocsFiles.filter((file) => {
      const relativePath = path.relative(siteDir, file);
      return includePatterns.some((pattern) => minimatch(relativePath, pattern, { matchBase: true }));
    });
  }

  // Apply ignore patterns
  if (ignorePatterns && ignorePatterns.length > 0) {
    filteredFiles = filteredFiles.filter((file) => {
      const relativePath = path.relative(siteDir, file);
      return !ignorePatterns.some((pattern) => minimatch(relativePath, pattern, { matchBase: true }));
    });
  }

  // Order files according to orderPatterns
  let filesToProcess: string[] = [];

  if (orderPatterns && orderPatterns.length > 0) {
    const matchedFiles = new Set<string>();

    // Process files according to orderPatterns
    for (const pattern of orderPatterns) {
      const matchingFiles = filteredFiles.filter((file) => {
        const relativePath = path.relative(siteDir, file);
        return minimatch(relativePath, pattern, { matchBase: true }) && !matchedFiles.has(file);
      });

      for (const file of matchingFiles) {
        filesToProcess.push(file);
        matchedFiles.add(file);
      }
    }

    // Add remaining files if includeUnmatched is true
    if (includeUnmatched) {
      const remainingFiles = filteredFiles.filter((file) => !matchedFiles.has(file));
      filesToProcess.push(...remainingFiles);
    }
  } else {
    filesToProcess = filteredFiles;
  }

  // Process each file to generate DocsInfo
  const processedDocs: DocsInfo[] = [];

  for (const filePath of filesToProcess) {
    try {
      // Determine if this is a blog or docs file
      if (blogDirname) {
      }
      const isBlogFile = (blogDirname && filePath.includes(path.join(siteDir, blogDirname))) || false;
      const baseDir = (isBlogFile && blogDirname && path.join(siteDir, blogDirname)) || path.join(siteDir, docsDir);
      const pathPrefix = isBlogFile ? blogDirname : docsDir;

      const docInfo = await markdownMetadataParser({
        filePath,
        siteConfig,
        baseDir,
        siteUrl,
        pathPrefix,
        removeContentTitle: true,
      });
      processedDocs.push(docInfo);
    } catch (err) {
      console.warn(`Error processing ${filePath}: ${err}`);
    }
  }

  return processedDocs;
};
