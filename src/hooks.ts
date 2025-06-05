import { createHooks, type Hookable } from "hookable";
import type { BuildContext, ContentConfiguration, LLMFullStdConfig, LLMsHooks, LLMStdConfig } from "./types";

export const createLlmsHooks = async (
  llmConfig: ContentConfiguration,
  llmStdConfig: LLMStdConfig,
  llmFullStdConfig: LLMFullStdConfig,
): Promise<{
  hooks: Hookable<LLMsHooks>;
  context: BuildContext;
}> => {
  const hooks = createHooks<LLMsHooks>();

  if (typeof llmConfig.hooks === "object") {
    hooks.addHooks(llmConfig.hooks);
  } else if (typeof llmConfig.hooks === "function") {
    await llmConfig.hooks(hooks);
  }

  const context: BuildContext = {
    llmConfig: {
      llmStdConfig,
      llmFullStdConfig,
    },
    hooks,
  };

  return {
    hooks,
    context,
  };
};
