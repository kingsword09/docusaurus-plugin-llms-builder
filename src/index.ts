import type { LoadContext, Plugin } from "@docusaurus/types";

export default function defineDocusaurusPlugins(context: LoadContext, options: {}): Plugin<void> {
  const { siteConfig } = context;

  return {
    name: "docusaurus-plugin-llms-builder",
  };
}
