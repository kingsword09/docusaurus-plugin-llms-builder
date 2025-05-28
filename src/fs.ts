import fs from "fs/promises";
import { minimatch } from "minimatch";
import path from "path";

/**
 * Check if a file should be ignored based on glob patterns
 * @param filePath - Path to the file
 * @param baseDir - Base directory for relative paths
 * @param ignorePatterns - Glob patterns for files to ignore
 * @returns Whether the file should be ignored
 */
export const shouldIgnoreFile = (filePath: string, baseDir: string, ignorePatterns: string[]): boolean => {
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
export const readMarkdownFiles = async (
  dir: string,
  baseDir: string,
  ignorePatterns: string[] = [],
): Promise<string[]> => {
  const files: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (shouldIgnoreFile(fullPath, baseDir, ignorePatterns)) {
      continue;
    }

    if (entry.isDirectory()) {
      const subDirFiles = await readMarkdownFiles(fullPath, baseDir, ignorePatterns);
      files.push(...subDirFiles);
    } else if (entry.name.endsWith(".md") || entry.name.endsWith(".mdx")) {
      files.push(fullPath);
    }
  }

  return files;
};
