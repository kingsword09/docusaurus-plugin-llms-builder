import type { LoadContext, Plugin } from "@docusaurus/types";

import { generateLLMsTxtFlow } from "./llmstxt";
import type { PluginContext, PluginOptions } from "./types";

export default function defineDocusaurusPlugins(context: LoadContext, options: PluginOptions): Plugin<void> {
  const { siteConfig, siteDir, outDir, siteVersion } = context;
  const { version, llmConfigs } = options;
  const siteUrl =
    siteConfig.url + (siteConfig.baseUrl.endsWith("/") ? siteConfig.baseUrl.slice(0, -1) : siteConfig.baseUrl || "");

  const pluginContext: PluginContext = {
    pluginSiteConfig: {
      version: version ?? siteVersion ?? "1.0.0",
      outDir,
      siteDir,
      siteConfig,
      siteUrl,
    },
    llmConfigs: llmConfigs,
  };

  return {
    name: "docusaurus-plugin-llms-builder",
    async postBuild(): Promise<void> {
      await generateLLMsTxtFlow(pluginContext);
    },
  };
}

export type { PluginOptions };
