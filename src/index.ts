import type { LoadContext, Plugin } from "@docusaurus/types";

import { generateLLMsTxtFlow } from "./llmstxt";
import type { BuilderContext, PluginOptions } from "./types";

export default function defineDocusaurusPlugins(context: LoadContext, options: PluginOptions): Plugin<void> {
  const { siteConfig, siteDir, outDir, siteVersion } = context;
  const { version, llmConfigs } = options;
  const siteUrl =
    siteConfig.url + (siteConfig.baseUrl.endsWith("/") ? siteConfig.baseUrl.slice(0, -1) : siteConfig.baseUrl || "");

  const pluginContext: BuilderContext = {
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
    extendCli(cli) {
      cli
        .command("llms")
        .description("Generate llms.txt and llms-full.txt file by scanning all documentation files in the directory")
        .action(async () => {
          await generateLLMsTxtFlow(pluginContext);
        });
    },
  };
}

export type { PluginOptions };
