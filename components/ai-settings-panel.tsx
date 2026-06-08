"use client";

import { useEffect, useState } from "react";
import { getDefaultModel, providerOptions, sanitizeRuntimeConfig, type AiRuntimeConfig } from "@/lib/ai-config";

const storageKey = "prompt-workshop-ai-config";

type AiSettingsPanelProps = {
  value: AiRuntimeConfig;
  onChange: (value: AiRuntimeConfig) => void;
};

export function readStoredAiConfig() {
  if (typeof window === "undefined") {
    return sanitizeRuntimeConfig(null);
  }

  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return sanitizeRuntimeConfig(null);
    return sanitizeRuntimeConfig(JSON.parse(raw) as Partial<AiRuntimeConfig>);
  } catch {
    return sanitizeRuntimeConfig(null);
  }
}

export function AiSettingsPanel({ value, onChange }: AiSettingsPanelProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, JSON.stringify(value));
    }
  }, [value]);

  return (
    <section className="ai-settings-panel">
      <div className="section-head">
        <div>
          <p className="eyebrow">AI 设置</p>
          <h3>提供商与密钥</h3>
          <p className="favorites-caption">
            API Key 只保存在当前浏览器本地，不写入数据库。
          </p>
        </div>
        <button className="ghost-button" type="button" onClick={() => setOpen((current) => !current)}>
          {open ? "收起" : "展开"}
        </button>
      </div>

      {open ? (
        <div className="custom-form">
          <label>
            <span>AI 提供商</span>
            <select
              value={value.provider}
              onChange={(event) => {
                const provider = event.target.value as AiRuntimeConfig["provider"];
                onChange({
                  provider,
                  apiKey: value.apiKey,
                  model: getDefaultModel(provider)
                });
              }}
            >
              {providerOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>API Key</span>
            <input
              type="password"
              value={value.apiKey}
              onChange={(event) =>
                onChange({
                  ...value,
                  apiKey: event.target.value
                })
              }
              placeholder={value.provider === "deepseek" ? "输入 DeepSeek API Key" : "输入 OpenAI API Key"}
            />
          </label>

          <label>
            <span>模型</span>
            <input
              value={value.model}
              onChange={(event) =>
                onChange({
                  ...value,
                  model: event.target.value
                })
              }
              placeholder={getDefaultModel(value.provider)}
            />
          </label>
        </div>
      ) : null}
    </section>
  );
}
