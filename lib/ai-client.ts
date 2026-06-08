import OpenAI from "openai";
import { getDefaultModel, sanitizeRuntimeConfig, type AiProvider, type AiRuntimeConfig } from "@/lib/ai-config";

type RequestConfig = {
  runtimeConfig?: Partial<AiRuntimeConfig>;
};

export function resolveAiConfig(requestConfig?: RequestConfig) {
  const runtimeConfig = sanitizeRuntimeConfig(requestConfig?.runtimeConfig);

  if (runtimeConfig.apiKey) {
    return runtimeConfig;
  }

  const envProvider = (process.env.AI_PROVIDER as AiProvider | undefined) === "deepseek" ? "deepseek" : "openai";

  if (envProvider === "deepseek") {
    return {
      provider: "deepseek" as const,
      apiKey: process.env.DEEPSEEK_API_KEY?.trim() || "",
      model: process.env.DEEPSEEK_MODEL?.trim() || getDefaultModel("deepseek")
    };
  }

  return {
    provider: "openai" as const,
    apiKey: process.env.OPENAI_API_KEY?.trim() || "",
    model: process.env.OPENAI_MODEL?.trim() || getDefaultModel("openai")
  };
}

export function hasUsableAiConfig(requestConfig?: RequestConfig) {
  const config = resolveAiConfig(requestConfig);
  return Boolean(config.apiKey);
}

export function createAiClient(requestConfig?: RequestConfig) {
  const config = resolveAiConfig(requestConfig);

  const baseURL =
    config.provider === "deepseek"
      ? process.env.DEEPSEEK_BASE_URL?.trim() || "https://api.deepseek.com"
      : undefined;

  return {
    config,
    client: new OpenAI({
      apiKey: config.apiKey,
      baseURL
    })
  };
}

export async function generateText(input: string, requestConfig?: RequestConfig) {
  const { client, config } = createAiClient(requestConfig);

  if (config.provider === "deepseek") {
    const completion = await client.chat.completions.create({
      model: config.model,
      messages: [
        {
          role: "user",
          content: input
        }
      ]
    });

    return {
      text: completion.choices[0]?.message?.content || "",
      config
    };
  }

  const response = await client.responses.create({
    model: config.model,
    input
  });

  return {
    text: response.output_text || "",
    config
  };
}
