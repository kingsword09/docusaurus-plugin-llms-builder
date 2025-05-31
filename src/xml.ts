import { XMLParser } from "fast-xml-parser";
import fs from "node:fs/promises";
import rehypeParse from "rehype-parse";
import rehypeRemark from "rehype-remark";
import remarkGfm from "remark-gfm";
import remarkStringify from "remark-stringify";
import { unified } from "unified";

import type { RSSFeedItem } from "./types";

/**
 * Parse sitemap.xml and extract URLs
 * @param filePath
 * @returns
 */
export const sitemapParser = async (filePath: string): Promise<string[] | null> => {
  // Parse XML using fast-xml-parser
  const parser = new XMLParser({
    isArray: (tagName) => "loc" === tagName,
    removeNSPrefix: true,
  });

  const data = parser.parse(await fs.readFile(filePath, { encoding: "utf-8" }));

  if (Array.isArray(data?.urlset?.url) && data.urlset.url.length > 0) {
    const locUrls: string[] = data.urlset.url.map((url: { loc: string[] }) => url.loc.pop());
    return locUrls;
  }
  return null;
};

/**
 * Parse HTML title from a file
 * @param filePath - Path to the HTML file
 * @returns Parsed title
 */
export const htmlTitleParser = async (filePath: string): Promise<string> => {
  const htmlString = await fs.readFile(filePath, "utf8");
  const titleRegex = /<title[^>]*?>([\s\S]*?)<\/title>/i;
  const match = htmlString.match(titleRegex);

  if (match && match[1] !== undefined) {
    return match[1].trim();
  } else {
    const normalizedPath = filePath.replace(/\\/g, "/");
    const parts = normalizedPath.split("/");
    return parts[-1] ?? filePath;
  }
};

/**
 * Parse RSS XML file and extract title, description, and content from each item.
 * @param filePath - Path to the RSS XML file.
 * @returns An array of objects, each containing title, description, and content.
 */
export const parseRssItems = async (filePath: string): Promise<RSSFeedItem[]> => {
  const xmlContent = await fs.readFile(filePath, { encoding: "utf-8" });

  const parser = new XMLParser({
    isArray: (tagName) => tagName === "item", // Treat 'item' as an array
    removeNSPrefix: true, // Remove namespace prefixes like content:
    ignoreAttributes: true, // Ignore attributes
    textNodeName: "#text", // Name for text nodes
  });

  const parsedData = parser.parse(xmlContent);
  const items = parsedData?.rss?.channel?.item ?? parsedData?.feed?.entry;

  if (!Array.isArray(items)) {
    console.error("Could not find RSS items in the provided XML file.");
    return [];
  }

  return items.map((item) => {
    let content = item.encoded?.__CDATA || item.encoded || item.content || "";

    if (content) {
      const file = unified()
        .use(rehypeParse)
        .use(remarkGfm)
        .use(rehypeRemark)
        .use(remarkStringify)
        .processSync(content);
      content = String(file);
    }
    return {
      title: item.title?.__CDATA || item.title || "",
      description: item.description?.__CDATA || item.description || item.summary || "",
      content: content,
      link: item.link || item.id || "",
    };
  });
};

/**
 * Parse HTML content from a file
 * @param filePath - Path to the HTML file
 * @returns Parsed content
 */
export const htmlContentParser = async (filePath: string): Promise<string | null> => {
  try {
    const htmlContent = await fs.readFile(filePath, "utf8");
    const file = await unified()
      .use(rehypeParse)
      .use(remarkGfm)
      .use(rehypeRemark)
      .use(remarkStringify)
      .process(htmlContent);
    return String(file);
  } catch (error) {
    console.warn(`Failed to parse MDX HTML content for file: ${filePath}`, error);
  }
  return null;
};
