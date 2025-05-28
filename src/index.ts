import type { LoadContext, Plugin } from "@docusaurus/types";

import { collectCustomDocsFiles, collectDefaultDocsFiles } from "./docs";
import type { PluginContext, PluginOptions } from "./types";

export default function defineDocusaurusPlugins(context: LoadContext, options: PluginOptions): Plugin<void> {
  const { siteConfig, siteDir, outDir, siteVersion } = context;
  const { title, description, version, defaultLLMConfig, extraLLMConfig } = options;
  const siteUrl =
    siteConfig.url + (siteConfig.baseUrl.endsWith("/") ? siteConfig.baseUrl.slice(0, -1) : siteConfig.baseUrl || "");

  const pluginContext: PluginContext = {
    docTitle: title ?? siteConfig.title,
    docDescription: description ?? siteConfig.tagline,
    docVersion: version ?? siteVersion ?? "1.0.0",
    outDir,
    siteDir,
    siteConfig,
    siteUrl,
    defaultLLMConfig,
    extraLLMConfig,
  };

  return {
    name: "docusaurus-plugin-llms-builder",
    async postBuild(): Promise<void> {
      const docsFiles = await collectDefaultDocsFiles(pluginContext.siteDir, defaultLLMConfig);

      if (docsFiles.length === 0) {
        console.warn("No default docs files found");
        return;
      }

      if (extraLLMConfig) {
        const customDocsFiles = await collectCustomDocsFiles(pluginContext.siteDir, extraLLMConfig);

        if (customDocsFiles.length === 0) {
          console.warn("No custom docs files found");
          return;
        }
      }
    },
  };
}

export type { PluginOptions };
