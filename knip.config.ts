import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: ["src/index.ts!"],
  project: ["src/**/*.ts!"],
  ignoreDependencies: ["knip"],
};

export default config;
