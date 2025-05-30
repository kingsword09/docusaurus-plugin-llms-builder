import { minimatch } from "minimatch";
import fs from "node:fs/promises";
import path from "node:path";

import type { LLMConfig, LLMSessionFiles, PluginSiteConfig } from "./types";

const collectPatternsDocsFiles = async (
  siteDir: string,
  docsDir: string,
  ignorePatterns?: string[],
): Promise<string[]> => {
  const allDocsFiles = [];

  // Process docs directory
  const fullDocsDir = path.join(siteDir, docsDir);

  try {
    await fs.access(fullDocsDir);

    // Collect all markdown files from docs directory
    const docFiles = await collectMarkdownFiles(siteDir, fullDocsDir, ignorePatterns);
    allDocsFiles.push(...docFiles);
  } catch (err) {
    console.warn(`Docs directory not found: ${fullDocsDir}`, err);
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
export const collectLLMSessionFiles = async (siteDir: string, llmConfig: LLMConfig): Promise<LLMSessionFiles[]> => {
  const llmSessionFiles: LLMSessionFiles[] = [];

  for (const session of llmConfig.sessions) {
    const docsFiles = await collectPatternsDocsFiles(siteDir, session.docsDir, session.patterns?.ignorePatterns ?? []);

    if (docsFiles.length === 0) {
      console.warn("No docs files found: ", JSON.stringify(session));
      continue;
    }

    llmSessionFiles.push({
      ...session,
      docsFiles,
    } satisfies LLMSessionFiles);
  }

  return llmSessionFiles;
};

/**
 * Process docs files with patterns
 *
 * @param options
 * @returns
 */
export const processLLMSessionsFilesWithPatternFilters = async (
  llmSessionFiles: LLMSessionFiles,
  pluginSiteConfig: PluginSiteConfig,
): Promise<LLMSessionFiles> => {
  const { patterns, docsFiles } = llmSessionFiles;
  const { siteDir } = pluginSiteConfig;
  // Filter files based on include patterns
  let filteredFiles = docsFiles;

  if (llmSessionFiles.type === "blog") {
    // Sort blog files by date in path (YYYY-mm-dd format)
    filteredFiles = filteredFiles.sort((a, b) => {
      const dateRegex = /(\d{4}-\d{2}-\d{2})/;
      const dateA = a.match(dateRegex)?.[0] || "";
      const dateB = b.match(dateRegex)?.[0] || "";

      // Sort in descending order (newest first)
      return dateB.localeCompare(dateA);
    });
  }

  let filesToProcess: string[] = [];
  if (patterns) {
    if (Array.isArray(patterns.includePatterns) && patterns.includePatterns.length > 0) {
      const includePatterns = patterns.includePatterns;
      filteredFiles = docsFiles.filter((file) => {
        const relativePath = path.relative(siteDir, file);
        return includePatterns.some((pattern) => minimatch(relativePath, pattern, { matchBase: true }));
      });
    }

    if (Array.isArray(patterns.ignorePatterns) && patterns.ignorePatterns.length > 0) {
      const ignorePatterns = patterns.ignorePatterns;
      filteredFiles = filteredFiles.filter((file) => {
        const relativePath = path.relative(siteDir, file);
        return !ignorePatterns.some((pattern) => minimatch(relativePath, pattern, { matchBase: true }));
      });
    }

    if (Array.isArray(patterns.orderPatterns) && patterns.orderPatterns.length > 0) {
      const orderPatterns = patterns.orderPatterns;
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
      if (patterns.includeUnmatched) {
        const remainingFiles = filteredFiles.filter((file) => !matchedFiles.has(file));
        filesToProcess.push(...remainingFiles);
      }
    } else {
      filesToProcess = filteredFiles;
    }
  } else {
    filesToProcess = filteredFiles;
  }

  llmSessionFiles.docsFiles = filesToProcess;
  return llmSessionFiles;
};

/**
 * Check if a file should be ignored based on glob patterns
 * @param filePath - Path to the file
 * @param baseDir - Base directory for relative paths
 * @param ignorePatterns - Glob patterns for files to ignore
 * @returns Whether the file should be ignored
 */
export const shouldIgnoreFile = (baseDir: string, filePath: string, ignorePatterns: string[] = []): boolean => {
  if (ignorePatterns.length === 0) {
    return false;
  }

  const relativePath = path.relative(baseDir, filePath);

  return ignorePatterns.some((pattern) => minimatch(relativePath, pattern, { matchBase: true }));
};

/**
 * Recursively reads all Markdown files in a directory
 * @param dir - Directory to scan
 * @param baseDir - Base directory for relative paths
 * @param ignorePatterns - Glob patterns for files to ignore
 * @returns Array of file paths
 */
export const collectMarkdownFiles = async (
  baseDir: string,
  dir: string,
  ignorePatterns?: string[],
): Promise<string[]> => {
  const files: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (shouldIgnoreFile(baseDir, fullPath, ignorePatterns)) {
      continue;
    }

    if (entry.isDirectory()) {
      const subDirFiles = await collectMarkdownFiles(baseDir, fullPath, ignorePatterns);
      files.push(...subDirFiles);
    } else if (entry.name.endsWith(".md") || entry.name.endsWith(".mdx")) {
      files.push(fullPath);
    }
  }

  return files;
};

/**
 * Get all docusaurus build files paths
 * @param outDir
 * @returns
 */
export const getAllDocusaurusBuildFilesPaths = async (outDir: string): Promise<Set<string>> => {
  const existingPaths = new Set<string>();

  try {
    const files = await fs.readdir(outDir, { recursive: true });
    for (const file of files) {
      if (!file.endsWith(".html")) continue;

      const fullPath = path.join(outDir, file.toString());
      const stat = await fs.stat(fullPath);
      if (stat.isFile()) {
        existingPaths.add(
          file.endsWith("index.html") ? (file === "index.html" ? "/" : file.replace("/index.html", "")) : file,
        );
      }
    }
  } catch (error) {
    console.warn("Error reading outDir directory:", error);
  }

  return existingPaths;
};
