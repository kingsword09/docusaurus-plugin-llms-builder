import { generate } from "@docusaurus/utils";

type LLMSessionItem = {
  title: string;
  link: string;
  description?: string;
};

type LLMSession = {
  sessionName: string;
  items: LLMSessionItem[];
};

type LLMStdConfig = {
  title: string;
  description: string;
  summary?: string;
  sessions: LLMSession[];
};

type LLMFullSessionItem = {
  title: string;
  content: string;
};

type LLMFullStdConfig = {
  title: string;
  description: string;
  summary?: string;
  sessions: LLMFullSessionItem[];
};

/**
 * Standardize the content of llms.txt
 * @param llmStdConfig
 * @returns
 */
export const standardizeLLMsTxtContent = (llmStdConfig: LLMStdConfig): string => {
  // Generate Title 、Description 、Details
  const headerSection = [`# ${llmStdConfig.title}`, `> ${llmStdConfig.description}`, llmStdConfig.summary]
    .filter(Boolean)
    .join("\n\n");

  // Generate sessions content
  const sessionsContent = llmStdConfig.sessions
    .map((session) => {
      const sessionHeader = `\n## ${session.sessionName}\n\n`;
      const sessionItems = session.items
        .map((item) => {
          const baseLink = `- [${item.title}](${item.link})`;
          return item.description ? `${baseLink}: ${item.description}` : `${baseLink}\n`;
        })
        .join("");

      return sessionHeader + sessionItems;
    })
    .join("");

  return headerSection + sessionsContent;
};

/**
 * Standardize the content of llms-full.txt
 * @param llmFullStdConfig
 * @returns
 */
export const standardizeLLMsFullTxtContent = (llmFullStdConfig: LLMFullStdConfig) => {
  // Generate Title 、Description 、Details
  const headerSection = [`# ${llmFullStdConfig.title}`, `> ${llmFullStdConfig.description}`, llmFullStdConfig.summary]
    .filter(Boolean)
    .join("\n\n");

  // Generate sessions content
  const sessionsContent = llmFullStdConfig.sessions
    .map((session) => {
      const sessionHeader = `\n## ${session.title}\n`;
      const sessionItems = session.content;
      return sessionHeader + sessionItems + "\n---\n";
    })
    .join("");

  return headerSection + sessionsContent;
};

/**
 * Generate llms.txt or llms-full.txt
 * @param outDir
 * @param filename
 * @param content
 * @returns
 */
export const generateLLMsTxt = async (outDir: string, filename: string, content: string): Promise<void> => {
  return generate(outDir, filename, content, true);
};
