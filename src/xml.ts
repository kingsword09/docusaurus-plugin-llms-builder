import { NodeHtmlMarkdown, parse } from "@kingsword/node-html-markdown";
import { XMLParser } from "fast-xml-parser";
import fs from "node:fs/promises";

import type { HtmlParser, RSSFeedItem } from "./types";

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

    return locUrls.sort((a, b) => {
      const pathA = new URL(a).pathname;
      const pathB = new URL(b).pathname;
      return pathA.localeCompare(pathB);
    });
  }
  return null;
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
      const dom = parse(content);
      content = NodeHtmlMarkdown.translate(dom.querySelector(".markdown") ?? content);
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
export const htmlParser = async (filePath: string): Promise<HtmlParser | null> => {
  try {
    const htmlContent = await fs.readFile(filePath, "utf8");
    const dom = parse(htmlContent);

    const title = dom.querySelector("title")?.textContent;

    // Get meta description content if available
    const metaDescription = dom.querySelector('meta[name="description"]')?.getAttribute("content");

    return {
      title,
      description: metaDescription,
      content: NodeHtmlMarkdown.translate(dom.querySelector(".markdown")?.toString() ?? htmlContent),
    };
  } catch (error) {
    console.warn(`Failed to parse MDX HTML content for file: ${filePath}`, error);
  }
  return null;
};
