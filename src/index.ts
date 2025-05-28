import type { LoadContext, Plugin } from "@docusaurus/types";
import type { PluginOptions } from "./options";

export default function defineDocusaurusPlugins(context: LoadContext, options: PluginOptions): Plugin<void> {
  const { siteConfig, siteDir, outDir } = context;
  console.warn(siteConfig);
  console.warn("QAQ");
  console.warn(options);
  const { title, description, version, defaultLLMConfig, extraLLMConfig } = options;

  // const {
  //   docsDir,
  //   includeBlog,
  //   ignorePatterns,
  //   includePatterns,
  //   orderPatterns,
  //   generateLLMsTxt,
  //   generateLLMsFullTxt,
  //   extraLinks
  // } = defaultLLMConfig;

  return {
    name: "docusaurus-plugin-llms-builder",
    async postBuild(): Promise<void> {
      console.warn("QAQ");
    },
  };
}

export type { PluginOptions };
