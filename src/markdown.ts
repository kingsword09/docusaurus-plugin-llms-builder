import type { DocusaurusConfig } from "@docusaurus/types";
import type { ParseFrontMatterResult } from "@docusaurus/types/src/config";
import { parseMarkdownFile } from "@docusaurus/utils";
import fs from "fs/promises";
import Fuse, { type IFuseOptions } from "fuse.js";
import path from "path";

import type { DocsInfo, LLMDocsType } from "./types";
import { htmlContentParser } from "./xml";

/**
 * parse markdown file title
 *
 * @param filePath - Path to the markdown file
 * @param contentTitle - Title extracted from the markdown content
 * @param frontMatter - Front matter data extracted from the markdown file
 * @returns Parsed title
 */
const titleParser = (
  filePath: string,
  frontMatter: ParseFrontMatterResult["frontMatter"],
  content: string,
  contentTitle?: string,
): string => {
  if (contentTitle) return contentTitle;

  if (typeof frontMatter.title === "string" && frontMatter.title) return frontMatter.title;

  const headingMatch = content.match(/^#\s+(.*)/m);
  if (headingMatch && headingMatch[1]) {
    return headingMatch[1].trim();
  }

  // Finally use filename
  return path
    .basename(filePath, path.extname(filePath))
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

/**
 * Process a markdown file and extract its metadata and content
 *
 * @param filePath - Path to the markdown file
 * @param removeContentTitle - If true, the matching title will be removed from the returned content. We can promise that at least one empty line will be left between the content before and after, but you shouldn't make too much assumption about what's left.
 * @param siteConfig - Docusaurus config
 * @returns
 */
export const markdownParser = async (
  filePath: string,
  removeContentTitle: boolean,
  siteConfig: DocusaurusConfig,
): Promise<ReturnType<typeof parseMarkdownFile>> => {
  const fileContent = await fs.readFile(filePath, "utf8");

  return await parseMarkdownFile({
    filePath,
    fileContent,
    parseFrontMatter: siteConfig.markdown.parseFrontMatter,
    removeContentTitle,
  });
};

/**
 * Process a markdown file and extract its metadata and content
 * @param options
 * @returns
 */
export const markdownMetadataParser = async (options: {
  type: LLMDocsType;
  buildFilesPaths: Set<string>;
  filePath: string;
  siteConfig: DocusaurusConfig;
  baseDir: string;
  siteUrl: string;
  outDir: string;
  pathPrefix?: string;
  removeContentTitle?: boolean;
}): Promise<DocsInfo> => {
  const { type, buildFilesPaths, filePath, removeContentTitle, siteConfig, baseDir, siteUrl, outDir, pathPrefix } =
    options;
  const metadata = await markdownParser(filePath, removeContentTitle ?? false, siteConfig);
  const normalizedPath = path.normalize(path.relative(baseDir, filePath));
  let isMdx = false;
  if (normalizedPath.endsWith(".mdx")) {
    isMdx = true;
  }
  // Convert .md extension to appropriate path
  const linkPathBase = normalizedPath.replace(/\.mdx?$/, "");

  // Handle cases where the file name matches its parent directory name
  const parts = linkPathBase.split("/");
  const lastPart = parts[parts.length - 1];
  const parentDir = parts[parts.length - 2];

  // Check if the file is in a directory with the same name
  // This helps handle cases where content is organized in directories
  // named after their main topic/content, with a matching markdown file
  // Example: /guides/getting-started/getting-started.md
  // We want to treat this similarly to /guides/getting-started/index.md
  // for cleaner URLs and better organization
  let linkPath;
  if (linkPathBase.endsWith("index")) {
    // Handle index files
    linkPath = linkPathBase.replace(/\/index$/, "");
  } else if (lastPart === parentDir) {
    // If file name matches parent directory, treat it like an index file
    linkPath = parts.slice(0, -1).join("/");
  } else {
    linkPath = linkPathBase;
  }

  let finalLinkPath = linkPath;
  if (metadata.frontMatter.slug) {
    finalLinkPath = metadata.frontMatter.slug as string;
  }

  if (type === "blog") {
    const dateMatch = linkPath.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (dateMatch) {
      // Check if the date is more than a year old
      const currentDate = new Date();
      const postDate = new Date(parseInt(dateMatch[1]!), parseInt(dateMatch[2]!) - 1, parseInt(dateMatch[3]!));
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(currentDate.getFullYear() - 1);

      if (postDate < oneYearAgo) {
        // If post is older than a year, remove the date from the path
        finalLinkPath = linkPath.replace(/\d{4}-\d{2}-\d{2}-/, "");
      } else {
        // Otherwise, keep the date in YYYY/MM/DD format
        finalLinkPath = linkPath.replace(/(\d{4})-(\d{2})-(\d{2})-/, "$1/$2/$3");
      }
    }
  } else {
    // Remove leading multiple number prefix patterns
    finalLinkPath = finalLinkPath.replace(/^(\d{1,2})-/, "");
  }

  let content = metadata.content;
  // Find the best match in the buildFilesPaths set
  finalLinkPath =
    finalLinkPath === "/"
      ? ""
      : // If path exists without pathPrefix, return directly
        buildFilesPaths.has(finalLinkPath)
        ? finalLinkPath
        : findBestMatch(path.join(pathPrefix ?? "", finalLinkPath), buildFilesPaths);

  // For MDX documents, we need to parse components by converting the compiled HTML back to markdown
  if (isMdx) {
    const mdxContent = await htmlContentParser(path.join(outDir, finalLinkPath, "index.html"));
    if (mdxContent) {
      content = mdxContent;
    }
  }

  const link = new URL(finalLinkPath, siteUrl).toString();

  const title = titleParser(filePath, metadata.frontMatter, metadata.content, metadata.contentTitle);
  const description =
    (typeof metadata.frontMatter.description === "string" && metadata.frontMatter.description) ||
    metadata.excerpt ||
    "";

  return {
    title,
    description,
    summary: metadata.excerpt,
    content: content,
    link,
  } satisfies DocsInfo;
};

/**
 * Clean a description for use in a TOC item
 * @param description - The original description
 * @returns Cleaned description suitable for TOC
 */
export const cleanDescriptionForToc = (description: string): string => {
  if (!description) return "";

  // Get just the first line for TOC display
  const firstLine = description.split("\n")[0] ?? description;

  // Remove heading markers only at the beginning of the line
  // Be careful to only remove actual heading markers (# followed by space at beginning)
  // and not hashtag symbols that are part of the content (inline hashtags)
  const cleaned = firstLine.replace(/^(#+)\s+/g, "");

  // Truncate if too long (150 characters max with ellipsis)
  return cleaned.length > 150 ? cleaned.substring(0, 147) + "..." : cleaned;
};

/**
 * Find the best matching string in an array using fuzzy search
 * @param needle - The string to search for
 * @param haystack - Array of strings to search in
 * @param options - Optional Fuse.js options
 * @returns The best matching string or null if no matches found
 */
export const findBestMatch = (
  needle: string,
  haystack: Set<string>,
  options: IFuseOptions<string> = {
    threshold: 0.6,
    includeScore: true,
  },
): string => {
  // First try exact match
  if (haystack.has(needle)) {
    return needle;
  }

  // If no exact match, use fuzzy search
  // Convert Set to Array for Fuse.js
  const haystackArray = Array.from(haystack);
  const fuse = new Fuse(haystackArray, options);
  const results = fuse.search(needle).sort((a, b) => {
    // Sort by score ascending (lower is better) and refIndex descending
    if (a.score === b.score) {
      return b.refIndex - a.refIndex;
    }
    return (a.score ?? 0) - (b.score ?? 0);
  });

  // Return the best match if any found
  if (results.length > 0) {
    return results[0]?.item ?? needle;
  }

  return needle;
};
