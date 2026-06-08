import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { getAdminAiConfigStatus } from "@/lib/admin-ai-config";

export default async function AdminAiConfigPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/auth/sign-in");
  }

  if (!session.user.isAdmin && !isAdminEmail(session.user.email)) {
    redirect("/");
  }

  const status = getAdminAiConfigStatus();

  return (
    <main className="history-shell">
      <section className="history-header">
        <div>
          <p className="eyebrow">AI 配置检测</p>
          <h1>平台托管 AI 状态</h1>
          <p>{status.summary}</p>
        </div>
        <div className="history-actions">
          <a className="ghost-button history-link" href="/admin/users">账号管理</a>
          <a className="ghost-button history-link" href="/">返回首页</a>
        </div>
      </section>

      <section className="history-card admin-ai-status-grid">
        <div className="admin-stat-grid">
          <div className="admin-stat-card">
            <span>默认模式</span>
            <strong>平台托管</strong>
          </div>
          <div className="admin-stat-card">
            <span>默认提供商</span>
            <strong>{status.providerLabel}</strong>
          </div>
          <div className="admin-stat-card">
            <span>默认模型</span>
            <strong>{status.model}</strong>
          </div>
          <div className="admin-stat-card">
            <span>当前状态</span>
            <strong>{status.hostedEnabled ? "已启用" : "回退本地模板"}</strong>
          </div>
        </div>

        <div className="admin-card">
          <h4>诊断结果</h4>
          <div className="admin-mini-list">
            <div className="admin-mini-item">
              <strong>当前请求来源</strong>
              <span>{status.currentSource === "platform" ? "平台托管 AI" : "本地模板回退"}</span>
            </div>
            <div className="admin-mini-item">
              <strong>缺失变量</strong>
              <span>{status.missingKeys.length ? status.missingKeys.join(", ") : "无"}</span>
            </div>
            <div className="admin-mini-item">
              <strong>DeepSeek Base URL</strong>
              <span>{status.baseUrl || "当前默认提供商不使用该项"}</span>
            </div>
          </div>
        </div>

        <div className="admin-card">
          <h4>环境变量检查</h4>
          <div className="admin-mini-list">
            {status.checks.map((item) => (
              <div key={item.key} className="admin-mini-item">
                <strong>
                  {item.key}
                  {item.required ? "（必需）" : ""}
                </strong>
                <span>{item.label}</span>
                <span>{item.configured ? `已配置${item.valuePreview ? `: ${item.valuePreview}` : ""}` : "未配置"}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
