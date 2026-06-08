"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { AiSettingsPanel, readStoredAiConfig } from "@/components/ai-settings-panel";
import { sanitizeRuntimeConfig, type AiRuntimeConfig } from "@/lib/ai-config";
import { buildPrompt } from "@/lib/prompt-template";
import { defaultJobKey, jobsData, type Duty, type Job, type JobKey } from "@/lib/jobs";

type Favorite = {
  id?: string;
  title: string;
  prompt: string;
  createdAt: string;
};

type JobsState = Record<JobKey, Job>;
type JobsResponse = {
  jobs: JobsState;
  source: "database" | "fallback";
};
type CreateDutyResponse = {
  duty: Duty;
};

const storageKey = "prompt-workshop-favorites";

function cloneJobs(): JobsState {
  return structuredClone(jobsData);
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function readFavorites() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(storageKey) || "[]") as Favorite[];
  } catch {
    return [];
  }
}

export function PromptWorkbench() {
  const { data: session, status } = useSession();
  const [jobs, setJobs] = useState<JobsState>(() => cloneJobs());
  const [currentJobKey, setCurrentJobKey] = useState<JobKey>(defaultJobKey);
  const [currentDutyId, setCurrentDutyId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [latestPrompt, setLatestPrompt] = useState("");
  const [latestPlan, setLatestPlan] = useState("");
  const [latestTitle, setLatestTitle] = useState("");
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [customOpen, setCustomOpen] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customText, setCustomText] = useState("");
  const [toast, setToast] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [dataSource, setDataSource] = useState<"database" | "fallback">("fallback");
  const [favoritesSource, setFavoritesSource] = useState<"cloud" | "local">("local");
  const [aiConfig, setAiConfig] = useState<AiRuntimeConfig>(() => sanitizeRuntimeConfig(null));

  const currentJob = jobs[currentJobKey];
  const keyword = normalize(searchTerm);

  const visibleJobs = useMemo(() => {
    return Object.entries(jobs).filter(([, job]) => {
      if (!keyword) return true;
      const haystack = normalize(`${job.name} ${job.duties.map((duty) => `${duty.title} ${duty.text}`).join(" ")}`);
      return haystack.includes(keyword);
    }) as Array<[JobKey, Job]>;
  }, [jobs, keyword]);

  const visibleDuties = useMemo(() => {
    if (!keyword) return currentJob.duties;
    return currentJob.duties.filter((duty) => {
      const haystack = normalize(`${currentJob.name} ${duty.title} ${duty.text} ${duty.hint}`);
      return haystack.includes(keyword);
    });
  }, [currentJob, keyword]);

  const isCurrentFavorite = favorites.some((item) => item.prompt === latestPrompt);

  useEffect(() => {
    if (status === "loading") return;

    let cancelled = false;

    async function loadFavorites() {
      if (session?.user?.id) {
        try {
          const response = await fetch("/api/favorites", { cache: "no-store" });
          if (!response.ok) {
            if (!cancelled) {
              setFavorites(readFavorites());
              setFavoritesSource("local");
            }
            return;
          }
          const data = (await response.json()) as { items: Favorite[] };
          if (!cancelled) {
            setFavorites(data.items);
            setFavoritesSource("cloud");
          }
          return;
        } catch {
          if (!cancelled) {
            setFavorites(readFavorites());
            setFavoritesSource("local");
          }
          return;
        }
      }

      if (!cancelled) {
        setFavorites(readFavorites());
        setFavoritesSource("local");
      }
    }

    void loadFavorites();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, status]);

  useEffect(() => {
    setAiConfig(readStoredAiConfig());
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadJobs() {
      try {
        const response = await fetch("/api/jobs", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as JobsResponse;
        if (cancelled) return;
        setJobs(data.jobs);
        setDataSource(data.source);
      } catch {
        if (!cancelled) {
          setDataSource("fallback");
        }
      }
    }

    void loadJobs();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && favoritesSource === "local") {
      localStorage.setItem(storageKey, JSON.stringify(favorites));
    }
  }, [favorites, favoritesSource]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 1600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function generatePrompt(duty: Duty) {
    setCurrentDutyId(duty.id);
    setIsGenerating(true);

    const fallbackPrompt = buildPrompt(currentJob, duty);
    const title = `${currentJob.name} · ${duty.title}`;

    try {
      const response = await fetch("/api/generate-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleName: currentJob.name,
          dutyTitle: duty.title,
          dutyText: duty.text,
          hint: duty.hint,
          jobKey: currentJobKey,
          dutyId: duty.id,
          aiConfig
        })
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as {
          error?: string;
          detail?: string;
        } | null;
        setLatestPrompt(fallbackPrompt);
        setLatestPlan("");
        setLatestTitle(title);
        setToast(errorBody?.detail ? `已回退本地模板：${errorBody.detail}` : "已用本地模板生成");
        void savePromptRun({
          roleName: currentJob.name,
          dutyTitle: duty.title,
          dutyText: duty.text,
          hint: duty.hint,
          prompt: fallbackPrompt,
          provider: "fallback",
          model: "local-template",
          jobKey: currentJobKey,
          dutyId: duty.id
        });
        return;
      }

      const data = (await response.json()) as { prompt?: string };
      setLatestPrompt(data.prompt || fallbackPrompt);
      setLatestPlan("");
      setLatestTitle(title);
      setToast("AI 提示词已生成");
    } catch {
      setLatestPrompt(fallbackPrompt);
      setLatestPlan("");
      setLatestTitle(title);
      setToast("已用本地模板生成");
      void savePromptRun({
        roleName: currentJob.name,
        dutyTitle: duty.title,
        dutyText: duty.text,
        hint: duty.hint,
        prompt: fallbackPrompt,
        provider: "fallback",
        model: "local-template",
        jobKey: currentJobKey,
        dutyId: duty.id
      });
    } finally {
      setIsGenerating(false);
    }
  }

  async function savePromptRun(payload: {
    roleName: string;
    dutyTitle: string;
    dutyText: string;
    hint: string;
    prompt: string;
    plan?: string;
    provider: string;
    model: string;
    jobKey: JobKey;
    dutyId: string;
  }) {
    try {
      await fetch("/api/prompt-runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch {
      // Intentionally silent: prompt generation should not fail because analytics/history write failed.
    }
  }

  async function generatePlan() {
    if (!latestPrompt || !currentDutyId) {
      setToast("请先生成提示词");
      return;
    }

    const duty = currentJob.duties.find((item) => item.id === currentDutyId);
    if (!duty) {
      setToast("当前职责不存在");
      return;
    }

    setIsGeneratingPlan(true);

    try {
      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleName: currentJob.name,
          dutyTitle: duty.title,
          dutyText: duty.text,
          hint: duty.hint,
          prompt: latestPrompt,
          jobKey: currentJobKey,
          dutyId: duty.id,
          aiConfig
        })
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as {
          error?: string;
          detail?: string;
        } | null;
        setToast(errorBody?.detail ? `生成方案失败：${errorBody.detail}` : "生成方案失败");
        return;
      }

      const data = (await response.json()) as { plan?: string };
      setLatestPlan(data.plan || "");
      setToast("方案已生成");
    } catch {
      setToast("生成方案失败");
    } finally {
      setIsGeneratingPlan(false);
    }
  }

  async function copyPrompt() {
    if (!latestPrompt) {
      setToast("请先生成提示词");
      return;
    }

    try {
      await navigator.clipboard.writeText(latestPrompt);
      setToast("已复制");
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = latestPrompt;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
      setToast("已复制");
    }
  }

  function downloadPrompt() {
    if (!latestPrompt) {
      setToast("请先生成提示词");
      return;
    }

    const blob = new Blob([latestPrompt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${latestTitle.replace(/[\\/:*?"<>|]/g, "-")}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setToast("已下载");
  }

  async function addFavorite() {
    if (!latestPrompt) {
      setToast("请先生成提示词");
      return;
    }

    if (isCurrentFavorite) {
      setToast("已经在收藏夹");
      return;
    }

    const nextFavorite: Favorite = {
      title: latestTitle,
      prompt: latestPrompt,
      createdAt: new Date().toISOString()
    };

    if (session?.user?.id) {
      try {
        const response = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: latestTitle,
            prompt: latestPrompt
          })
        });

        if (response.ok) {
          const data = (await response.json()) as { item: Favorite };
          setFavorites((items) => [data.item, ...items.filter((item) => item.prompt !== data.item.prompt)].slice(0, 12));
          setFavoritesSource("cloud");
          setToast("已收藏到云端");
          return;
        }
      } catch {
        // Fallback below.
      }
    }

    setFavorites((items) => [nextFavorite, ...items].slice(0, 12));
    setFavoritesSource("local");
    setToast("已收藏到本地");
  }

  async function createCustomDuty(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = customTitle.trim();
    const text = customText.trim();

    if (!title || !text) {
      setToast("请补全职责名称和描述");
      return;
    }

    const fallbackDuty: Duty = {
      id: `custom_${Date.now()}`,
      title,
      text,
      hint: "自定义",
      source: "custom"
    };

    let customDuty = fallbackDuty;

    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobKey: currentJobKey,
          title,
          text,
          hint: "自定义"
        })
      });

      if (response.ok) {
        const data = (await response.json()) as CreateDutyResponse;
        customDuty = data.duty;
        setDataSource("database");
      }
    } catch {
      // Keep local fallback below.
    }

    setJobs((current) => ({
      ...current,
      [currentJobKey]: {
        ...current[currentJobKey],
        duties: [customDuty, ...current[currentJobKey].duties]
      }
    }));
    setCustomTitle("");
    setCustomText("");
    setCustomOpen(false);
    setCurrentDutyId(customDuty.id);
    const prompt = buildPrompt(currentJob, customDuty);
    setLatestPrompt(prompt);
    setLatestTitle(`${currentJob.name} · ${customDuty.title}`);
    setToast(dataSource === "database" ? "自定义职责已保存并生成" : "自定义提示词已生成");
  }

  return (
    <>
      <div className="shell">
        <aside className="sidebar" aria-label="岗位导航">
          <div className="brand">
            <div className="brand-mark" aria-hidden="true">P</div>
            <div>
              <h1>岗位提示词工坊</h1>
              <p>Prompt Workshop</p>
            </div>
          </div>

          <label className="search-box">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              placeholder="搜索岗位或职责"
              autoComplete="off"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>

          <nav className="job-list" aria-label="岗位列表">
            {visibleJobs.map(([key, job]) => (
              <button
                key={key}
                className={`job-item${key === currentJobKey ? " active" : ""}`}
                type="button"
                aria-pressed={key === currentJobKey}
                onClick={() => {
                  setCurrentJobKey(key);
                  setCurrentDutyId("");
                }}
              >
                <span className="job-icon" aria-hidden="true">{job.icon}</span>
                <span>
                  <span className="job-name">{job.name}</span>
                  <span className="job-count">{job.duties.length} 个职责</span>
                </span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="workspace">
          <section className="role-toolbar" aria-label="当前岗位">
            <div>
              <p className="eyebrow">当前岗位</p>
              <h2>{currentJob.name}</h2>
            </div>
            <div className="toolbar-actions">
              <button
                className="icon-button"
                type="button"
                aria-label={isCurrentFavorite ? "已收藏当前提示词" : "收藏当前提示词"}
                title="收藏当前提示词"
                onClick={addFavorite}
              >
                {isCurrentFavorite ? "★" : "☆"}
              </button>
              <button className="icon-button" type="button" aria-label="下载当前提示词" title="下载当前提示词" onClick={downloadPrompt}>⇩</button>
              <button className="ghost-button" type="button" onClick={generatePlan} disabled={isGeneratingPlan || !latestPrompt}>
                {isGeneratingPlan ? "生成方案中" : "生成方案"}
              </button>
              <button className="primary-button" type="button" onClick={copyPrompt}>复制</button>
            </div>
          </section>

          <AiSettingsPanel value={aiConfig} onChange={setAiConfig} />

          <section className="content-grid">
            <div className="duties-panel">
              <div className="section-head">
                <div>
                  <p className="eyebrow">职责库</p>
                  <h3>选择职责</h3>
                </div>
                <button className="ghost-button" type="button" onClick={() => setCustomOpen((open) => !open)}>
                  新增职责
                </button>
              </div>

              <div className="section-head" style={{ marginTop: -4 }}>
                <span className="status-pill">
                  {dataSource === "database" ? "数据库模式" : "本地回退模式"}
                </span>
              </div>

              {customOpen ? (
                <form className="custom-form" onSubmit={createCustomDuty}>
                  <label>
                    <span>职责名称</span>
                    <input value={customTitle} onChange={(event) => setCustomTitle(event.target.value)} placeholder="例如：招聘渠道优化" />
                  </label>
                  <label>
                    <span>职责描述</span>
                    <textarea value={customText} onChange={(event) => setCustomText(event.target.value)} rows={4} placeholder="写下需要 AI 辅助完成的具体工作" />
                  </label>
                  <button className="primary-button" type="submit">生成</button>
                </form>
              ) : null}

              <div className="duties-list">
                {visibleDuties.length ? visibleDuties.map((duty) => (
                  <article key={duty.id} className={`duty-card${duty.id === currentDutyId ? " active" : ""}`}>
                    <div className="duty-title">
                      <span>{duty.title}</span>
                      <span className="status-pill">{duty.hint}</span>
                    </div>
                    <p>{duty.text}</p>
                    <div className="duty-actions">
                      <button className="primary-button" type="button" onClick={() => generatePrompt(duty)} disabled={isGenerating}>
                        {isGenerating && duty.id === currentDutyId ? "生成中" : "生成"}
                      </button>
                    </div>
                  </article>
                )) : <div className="empty-state">没有匹配的职责</div>}
              </div>
            </div>

            <section className="prompt-panel" aria-label="提示词预览">
              <div className="section-head prompt-head">
                <div>
                  <p className="eyebrow">输出</p>
                  <h3>提示词预览</h3>
                </div>
                <span className="status-pill">{latestTitle || "等待生成"}</span>
              </div>
              <pre className="prompt-output">{latestPrompt || "选择左侧职责后，这里会生成可直接使用的专业提示词。"}</pre>
            </section>
          </section>

          <section className="prompt-panel plan-panel" aria-label="方案展示">
            <div className="section-head prompt-head">
              <div>
                <p className="eyebrow">方案</p>
                <h3>执行方案</h3>
              </div>
              <span className="status-pill">{latestPlan ? "已生成方案" : "等待生成"}</span>
            </div>
            <pre className="prompt-output">{latestPlan || "生成提示词后，可以继续生成执行方案、交付物建议和分阶段动作。"} </pre>
          </section>

          <section className="favorites-panel" aria-label="收藏提示词">
            <div className="section-head">
              <div>
                <p className="eyebrow">收藏夹</p>
                <h3>常用提示词</h3>
                <p className="favorites-caption">
                  {favoritesSource === "cloud" ? "当前为账号云端收藏" : "当前为浏览器本地收藏"}
                </p>
              </div>
              <button
                className="ghost-button"
                type="button"
                onClick={async () => {
                  if (session?.user?.id && favoritesSource === "cloud") {
                    try {
                      const response = await fetch("/api/favorites", {
                        method: "DELETE"
                      });
                      if (response.ok) {
                        setFavorites([]);
                        setToast("云端收藏已清空");
                        return;
                      }
                    } catch {
                      // Fallback below.
                    }
                  }

                  setFavorites([]);
                  setFavoritesSource("local");
                  setToast("本地收藏已清空");
                }}
              >
                清空
              </button>
            </div>
            <div className="favorites-list">
              {favorites.length ? favorites.map((item) => (
                <article className="favorite-card" key={`${item.createdAt}-${item.title}`}>
                  <strong>{item.title}</strong>
                  <p>{item.prompt}</p>
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() => {
                      setLatestPrompt(item.prompt);
                      setLatestTitle(item.title);
                      setLatestPlan("");
                      setToast("已打开收藏");
                    }}
                  >
                    打开
                  </button>
                </article>
              )) : <div className="empty-state">暂无收藏</div>}
            </div>
          </section>
        </main>
      </div>

      <div className={`toast${toast ? " show" : ""}`} role="status" aria-live="polite">
        {toast}
      </div>
    </>
  );
}
