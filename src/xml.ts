import { XMLParser } from "fast-xml-parser";
import fs from "node:fs/promises";
import path from "node:path";
import rehypeParse from "rehype-parse";
import rehypeRemark from "rehype-remark";
import remarkGfm from "remark-gfm";
import remarkStringify from "remark-stringify";
import { unified } from "unified";

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
  console.warn("QAQ data", JSON.stringify(data.urlset.url));
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
  const html = await fs.readFile(filePath, "utf8");
  const options = {
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    textNodeName: "#text",
    parseTagValue: true,
    parseAttributeValue: true,
    trimValues: true,
  };

  const parser = new XMLParser(options);
  let jsonObj = null;
  try {
    jsonObj = parser.parse(html);
  } catch (error) {
    console.error("Error parsing HTML with fast-xml-parser:", error);
  }

  if (jsonObj) {
    let pageTitle = null;
    try {
      if (jsonObj.html && jsonObj.html.head && jsonObj.html.head.title) {
        if (typeof jsonObj.html.head.title === "string") {
          pageTitle = jsonObj.html.head.title;
        } else if (jsonObj.html.head.title["#text"]) {
          pageTitle = jsonObj.html.head.title["#text"];
        } else {
          pageTitle = jsonObj.html.head.title;
        }
      }
    } catch (e) {
      console.error("Could not extract title using expected path:", e);
    }

    if (pageTitle) {
      return pageTitle;
    }
  }

  return path.dirname(filePath);
};

/**
 * Parse RSS XML file and extract title, description, and content from each item.
 * @param filePath - Path to the RSS XML file.
 * @returns An array of objects, each containing title, description, and content.
 */
export const parseRssItems = async (
  filePath: string,
): Promise<{ title: string; description: string; content: string }[]> => {
  const xmlContent = await fs.readFile(filePath, { encoding: "utf-8" });

  const parser = new XMLParser({
    isArray: (tagName) => tagName === "item", // Treat 'item' as an array
    removeNSPrefix: true, // Remove namespace prefixes like content:
    ignoreAttributes: true, // Ignore attributes
    textNodeName: "#text", // Name for text nodes
  });

  const parsedData = parser.parse(xmlContent);

  const items = parsedData?.rss?.channel?.item;

  if (!Array.isArray(items)) {
    console.error("Could not find RSS items in the provided XML file.");
    return [];
  }

  return items.map((item) => ({
    title: item.title?.__CDATA || item.title || "",
    description: item.description?.__CDATA || item.description || "",
    content: item.encoded?.__CDATA || item.encoded || "", // Use 'encoded' for content:encoded
  }));
};

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
