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
  const usingPersonal = value.mode === "personal";

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
          <h3>平台托管与个人 Key</h3>
          <p className="favorites-caption">
            默认使用平台托管 AI。只有你主动切到个人模式时，API Key 才会保存在当前浏览器本地。
          </p>
        </div>
        <button className="ghost-button" type="button" onClick={() => setOpen((current) => !current)}>
          {open ? "收起" : "展开"}
        </button>
      </div>

      {open ? (
        <div className="custom-form">
          <label>
            <span>使用方式</span>
            <select
              value={value.mode}
              onChange={(event) => {
                const mode = event.target.value as AiRuntimeConfig["mode"];
                onChange({
                  ...value,
                  mode,
                  apiKey: mode === "hosted" ? "" : value.apiKey
                });
              }}
            >
              <option value="hosted">平台托管（推荐）</option>
              <option value="personal">个人 Key</option>
            </select>
          </label>

          {usingPersonal ? (
            <>
              <label>
                <span>AI 提供商</span>
                <select
                  value={value.provider}
                  onChange={(event) => {
                    const provider = event.target.value as AiRuntimeConfig["provider"];
                    onChange({
                      ...value,
                      provider,
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

              <div className="status-note">
                个人 Key 仅保存在当前浏览器，不会写入账号、数据库或服务器日志。
              </div>
            </>
          ) : (
            <div className="status-note">
              当前默认走平台托管 AI。用户无需准备 API Key；如果平台未配置服务端 Key，系统会自动回退到本地模板并展示原因。
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
