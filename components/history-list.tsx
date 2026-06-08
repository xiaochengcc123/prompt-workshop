type PromptRunItem = {
  id: string;
  roleName: string;
  dutyTitle: string;
  dutyText: string;
  hint: string | null;
  prompt: string;
  plan: string | null;
  provider: string | null;
  model: string | null;
  createdAt: string;
};

type HistoryListProps = {
  items: PromptRunItem[];
};

export function HistoryList({ items }: HistoryListProps) {
  if (!items.length) {
    return <div className="empty-state">还没有生成历史。登录后在首页生成提示词，这里就会自动出现。</div>;
  }

  return (
    <div className="history-list">
      {items.map((item) => (
        <article className="history-card" key={item.id}>
          <div className="history-meta">
            <span className="status-pill">{item.roleName}</span>
            <span>{new Date(item.createdAt).toLocaleString("zh-CN")}</span>
          </div>
          <h2>{item.dutyTitle}</h2>
          <p className="history-duty">{item.dutyText}</p>
          <p className="eyebrow">提示词</p>
          <pre className="history-prompt">{item.prompt}</pre>
          {item.plan ? (
            <>
              <p className="eyebrow history-section-label">方案</p>
              <pre className="history-prompt">{item.plan}</pre>
            </>
          ) : null}
          <div className="history-foot">
            <span>{item.provider || "fallback"}</span>
            <span>{item.model || "local-template"}</span>
          </div>
        </article>
      ))}
    </div>
  );
}
