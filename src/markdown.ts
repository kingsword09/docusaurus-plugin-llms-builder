import type { DocusaurusConfig } from "@docusaurus/types";
import type { ParseFrontMatterResult } from "@docusaurus/types/src/config";
import { parseMarkdownFile } from "@docusaurus/utils";
import fs from "fs/promises";
import path from "path";

import type { DocsInfo, LLMDocsType } from "./types";

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
  filePath: string;
  siteConfig: DocusaurusConfig;
  baseDir: string;
  siteUrl: string;
  pathPrefix?: string;
  removeContentTitle?: boolean;
}): Promise<DocsInfo> => {
  const { type, filePath, removeContentTitle, siteConfig, baseDir, siteUrl, pathPrefix } = options;
  const metadata = await markdownParser(filePath, removeContentTitle ?? false, siteConfig);
  const normalizedPath = path.normalize(path.relative(baseDir, filePath));
  // Convert .md extension to appropriate path
  const linkPathBase = normalizedPath.replace(/\.mdx?$/, "");
  const linkPath = linkPathBase.endsWith("index") ? linkPathBase.replace(/\/index$/, "") : linkPathBase;

  let finalLinkPath = linkPath;
  if (type === "blog") {
    if (metadata.frontMatter.slug) {
      finalLinkPath = metadata.frontMatter.slug as string;
    } else {
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
    }
  }

  const link = new URL(path.join(pathPrefix ?? "", finalLinkPath), siteUrl).toString();

  const title = titleParser(filePath, metadata.frontMatter, metadata.content, metadata.contentTitle);
  const description =
    (typeof metadata.frontMatter.description === "string" && metadata.frontMatter.description) ||
    metadata.excerpt ||
    "";

  return {
    title,
    description,
    summary: metadata.excerpt,
    content: metadata.content,
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
