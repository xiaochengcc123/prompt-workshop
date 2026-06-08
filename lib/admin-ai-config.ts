import { getDefaultModel, type AiProvider } from "@/lib/ai-config";

export type AdminAiConfigStatus = {
  defaultMode: "hosted";
  provider: AiProvider;
  providerLabel: string;
  hostedEnabled: boolean;
  model: string;
  baseUrl: string | null;
  currentSource: "platform" | "fallback";
  requiredKeys: string[];
  missingKeys: string[];
  checks: Array<{
    key: string;
    label: string;
    configured: boolean;
    required: boolean;
    sensitive?: boolean;
    valuePreview?: string;
  }>;
  summary: string;
};

function isDeepSeekProvider(value: string | undefined): value is "deepseek" {
  return value === "deepseek";
}

function maskValue(value: string | undefined) {
  const normalized = value?.trim() || "";
  if (!normalized) return "";
  if (normalized.length <= 8) return "已配置";
  return `${normalized.slice(0, 6)}...${normalized.slice(-4)}`;
}

export function getAdminAiConfigStatus(): AdminAiConfigStatus {
  const provider: AiProvider = isDeepSeekProvider(process.env.AI_PROVIDER) ? "deepseek" : "openai";
  const providerLabel = provider === "deepseek" ? "DeepSeek" : "OpenAI";

  const openaiApiKey = process.env.OPENAI_API_KEY?.trim() || "";
  const openaiModel = process.env.OPENAI_MODEL?.trim() || getDefaultModel("openai");
  const deepseekApiKey = process.env.DEEPSEEK_API_KEY?.trim() || "";
  const deepseekModel = process.env.DEEPSEEK_MODEL?.trim() || getDefaultModel("deepseek");
  const deepseekBaseUrl = process.env.DEEPSEEK_BASE_URL?.trim() || "https://api.deepseek.com";

  const checks = [
    {
      key: "AI_PROVIDER",
      label: "默认平台提供商",
      configured: Boolean(process.env.AI_PROVIDER?.trim()),
      required: false,
      valuePreview: provider
    },
    {
      key: "OPENAI_API_KEY",
      label: "OpenAI 平台 Key",
      configured: Boolean(openaiApiKey),
      required: provider === "openai",
      sensitive: true,
      valuePreview: maskValue(openaiApiKey)
    },
    {
      key: "OPENAI_MODEL",
      label: "OpenAI 默认模型",
      configured: Boolean(process.env.OPENAI_MODEL?.trim()),
      required: provider === "openai",
      valuePreview: openaiModel
    },
    {
      key: "DEEPSEEK_API_KEY",
      label: "DeepSeek 平台 Key",
      configured: Boolean(deepseekApiKey),
      required: provider === "deepseek",
      sensitive: true,
      valuePreview: maskValue(deepseekApiKey)
    },
    {
      key: "DEEPSEEK_MODEL",
      label: "DeepSeek 默认模型",
      configured: Boolean(process.env.DEEPSEEK_MODEL?.trim()),
      required: provider === "deepseek",
      valuePreview: deepseekModel
    },
    {
      key: "DEEPSEEK_BASE_URL",
      label: "DeepSeek 接口地址",
      configured: Boolean(process.env.DEEPSEEK_BASE_URL?.trim()),
      required: provider === "deepseek",
      valuePreview: deepseekBaseUrl
    }
  ];

  const requiredKeys = checks.filter((item) => item.required).map((item) => item.key);
  const missingKeys = checks.filter((item) => item.required && !item.configured).map((item) => item.key);
  const hostedEnabled = missingKeys.length === 0 && requiredKeys.length > 0;
  const currentSource = hostedEnabled ? "platform" : "fallback";
  const model = provider === "deepseek" ? deepseekModel : openaiModel;
  const baseUrl = provider === "deepseek" ? deepseekBaseUrl : null;

  const summary = hostedEnabled
    ? `当前平台托管 AI 已启用，默认使用 ${providerLabel} / ${model}。`
    : `当前平台托管 AI 未完整配置，缺少 ${missingKeys.join("、")}，请求会回退到本地模板。`;

  return {
    defaultMode: "hosted",
    provider,
    providerLabel,
    hostedEnabled,
    model,
    baseUrl,
    currentSource,
    requiredKeys,
    missingKeys,
    checks,
    summary
  };
}
