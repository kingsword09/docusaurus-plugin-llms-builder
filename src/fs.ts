import fs from "fs/promises";
import { minimatch } from "minimatch";
import path from "path";

import { processDocsWithPatternFilters } from "./docs";
import { cleanDescriptionForToc } from "./markdown";
import type { DocsInfo, ExtraLink, PluginContext } from "./types";

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
  ignorePatterns: string[] = [],
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
 * Generate an LLM-friendly file
 * {
 *    @param docs - Processed document information
 *    @param outputPath - Path to write the output file
 *    @param fileTitle - Title for the file
 *    @param fileDescription - Description for the file
 *    @param includeFullContent - Whether to include full content or just links
 *    @param version - Version of the file
 *    @param extraLinks - Extra links to include in the file
 * }
 */
const generateLLMFile = async (options: {
  docs: DocsInfo[];
  outputPath: string;
  fileTitle: string;
  fileDescription: string;
  includeFullContent: boolean;
  version?: string;
  extraLinks?: ExtraLink[];
}): Promise<void> => {
  const { docs, outputPath, fileTitle, fileDescription, includeFullContent, version, extraLinks } = options;
  console.warn(`Generating file: ${outputPath}, version: ${version || "undefined"}`);
  const versionInfo = version ? `\n\nVersion: ${version}` : "";

  if (includeFullContent) {
    // Generate full content file
    const fullContentSections = docs.map((doc) => {
      return `## ${doc.title}

${doc.content}`;
    });

    const llmFileContent = `# ${fileTitle}

> ${fileDescription}${versionInfo}

This file contains all documentation content in a single document following the llmstxt.org standard.

${fullContentSections.join("\n\n---\n\n")}
`;

    await fs.writeFile(outputPath, llmFileContent);
  } else {
    // Generate links-only file
    const tocItems = docs.map((doc) => {
      // Clean and format the description for TOC
      const cleanedDescription = cleanDescriptionForToc(doc.description);

      return `- [${doc.title}](${doc.link})${cleanedDescription ? `: ${cleanedDescription}` : ""}`;
    });

    const llmFileContent = `# ${fileTitle}

> ${fileDescription}${versionInfo}

This file contains links to documentation sections following the llmstxt.org standard.

## Table of Contents

${tocItems.join("\n")}

${
  extraLinks
    ? `## Extra Links
${extraLinks.map((link) => `- [${link.title}](${link.link})`).join("\n")}`
    : ""
}
`;

    await fs.writeFile(outputPath, llmFileContent);
  }

  console.warn(`Generated: ${outputPath}`);
};

export const generateDefaultLLMFiles = async (context: PluginContext, allDocsFiles: string[] = []): Promise<void> => {
  const { docTitle, docDescription, docVersion, outDir, siteDir, siteConfig, defaultLLMConfig } = context;

  const {
    generateLLMsTxt,
    generateLLMsFullTxt,
    ignorePatterns,
    includePatterns,
    orderPatterns,
    includeUnmatched,
    extraLinks,
  } = defaultLLMConfig;

  if (!generateLLMsTxt && !generateLLMsFullTxt) {
    return;
  }

  const processedDocs = await processDocsWithPatternFilters({
    siteDir,
    siteUrl: siteConfig.url,
    siteConfig,
    docsDir: defaultLLMConfig.docsDir,
    allDocsFiles,
    patterns: {
      includePatterns,
      ignorePatterns,
      orderPatterns,
      includeUnmatched,
    },
  });

  if (generateLLMsTxt) {
    const llmsTxtPath = path.join(outDir, "llms.txt");
    await generateLLMFile({
      docs: processedDocs,
      outputPath: llmsTxtPath,
      fileTitle: docTitle,
      fileDescription: docDescription,
      includeFullContent: false,
      version: docVersion,
      extraLinks,
    });
  }

  if (generateLLMsFullTxt) {
    const llmsFullTxtPath = path.join(outDir, "llms-full.txt");
    await generateLLMFile({
      docs: processedDocs,
      outputPath: llmsFullTxtPath,
      fileTitle: docTitle,
      fileDescription: docDescription,
      includeFullContent: true,
      version: docVersion,
    });
  }
};

export const generateExtraLLMFiles = async (context: PluginContext, allDocsFiles: string[] = []): Promise<void> => {
  const { docTitle, docDescription, docVersion, outDir, siteDir, siteConfig, extraLLMConfig } = context;
  if (!extraLLMConfig) {
    return;
  }
  for (const config of extraLLMConfig) {
    const { generateLLMsTxt, generateLLMsFullTxt, ignorePatterns, includePatterns, orderPatterns, includeUnmatched } =
      config;
    if (!generateLLMsTxt && !generateLLMsFullTxt) {
      continue; // Skip if both are false for this config
    }

    const processedDocs = await processDocsWithPatternFilters({
      siteDir,
      siteUrl: siteConfig.url,
      siteConfig,
      docsDir: config.docsDir,
      allDocsFiles,
      patterns: {
        includePatterns,
        ignorePatterns,
        orderPatterns,
        includeUnmatched,
      },
    });

    if (generateLLMsTxt) {
      const llmsTxtPath = path.join(outDir, `llms-${config.docsDir}.txt`);
      await generateLLMFile({
        docs: processedDocs,
        outputPath: llmsTxtPath,
        fileTitle: docTitle,
        fileDescription: docDescription,
        includeFullContent: false,
        version: docVersion,
      });
    }

    if (generateLLMsFullTxt) {
      const llmsFullTxtPath = path.join(outDir, `llms-${config.docsDir}-full.txt`);
      await generateLLMFile({
        docs: processedDocs,
        outputPath: llmsFullTxtPath,
        fileTitle: docTitle,
        fileDescription: docDescription,
        includeFullContent: true,
        version: docVersion,
      });
    }
  }
};
