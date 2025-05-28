import type { LoadContext, Plugin } from "@docusaurus/types";
import type { PluginOptions } from "./options";

export default function defineDocusaurusPlugins(context: LoadContext, _options: PluginOptions): Plugin<void> {
  const { siteConfig } = context;
  console.warn(siteConfig);

  return {
    name: "docusaurus-plugin-llms-builder",
  };
}

export type { PluginOptions };
