export type AiProvider = "openai" | "deepseek";
export type AiMode = "hosted" | "personal";

export type AiRuntimeConfig = {
  mode: AiMode;
  provider: AiProvider;
  apiKey: string;
  model: string;
};

export const providerOptions: Array<{
  value: AiProvider;
  label: string;
  defaultModel: string;
}> = [
  {
    value: "openai",
    label: "OpenAI",
    defaultModel: "gpt-4.1-mini"
  },
  {
    value: "deepseek",
    label: "DeepSeek",
    defaultModel: "deepseek-chat"
  }
];

export function getDefaultModel(provider: AiProvider) {
  return providerOptions.find((item) => item.value === provider)?.defaultModel || "gpt-4.1-mini";
}

export function sanitizeRuntimeConfig(input: Partial<AiRuntimeConfig> | null | undefined): AiRuntimeConfig {
  const provider = input?.provider === "deepseek" ? "deepseek" : "openai";
  const apiKey = input?.apiKey?.trim() || "";
  const mode =
    input?.mode === "personal" || (!input?.mode && Boolean(apiKey))
      ? "personal"
      : "hosted";
  const model = input?.model?.trim() || getDefaultModel(provider);

  return {
    mode,
    provider,
    apiKey,
    model
  };
}
