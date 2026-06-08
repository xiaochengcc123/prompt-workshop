"use client";

import { useMemo, useState } from "react";
import { safeReadJson } from "@/lib/http-response";
import type { AdminUserDetail, AdminUserListItem } from "@/lib/admin-users";

type Props = {
  initialUsers: AdminUserListItem[];
};

export function AdminUsersDashboard({ initialUsers }: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(initialUsers[0]?.id ?? null);
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const filteredUsers = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return users;
    return users.filter((user) =>
      `${user.name || ""} ${user.email}`.toLowerCase().includes(keyword)
    );
  }, [query, users]);

  async function loadDetail(userId: string) {
    setSelectedId(userId);
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/users/${userId}`, { cache: "no-store" });
      const data = await safeReadJson<{ error?: string; item?: AdminUserDetail }>(response);
      if (!response.ok || !data?.item) {
        setMessage(data?.error || "加载用户详情失败");
        setDetail(null);
        return;
      }
      setDetail(data.item);
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword() {
    if (!selectedId) return;
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/users/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword })
      });
      const data = await safeReadJson<{ error?: string }>(response);
      if (!response.ok) {
        setMessage(data?.error || "重置密码失败");
        return;
      }
      setNewPassword("");
      setMessage("密码已重置");
    } finally {
      setLoading(false);
    }
  }

  async function deleteUser() {
    if (!selectedId || !detail) return;
    if (!window.confirm(`确认删除账号 ${detail.email} 吗？此操作不可恢复。`)) return;

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/users/${selectedId}`, {
        method: "DELETE"
      });
      const data = await safeReadJson<{ error?: string }>(response);
      if (!response.ok) {
        setMessage(data?.error || "删除账号失败");
        return;
      }

      const nextUsers = users.filter((user) => user.id !== selectedId);
      setUsers(nextUsers);
      setSelectedId(nextUsers[0]?.id ?? null);
      setDetail(null);
      setMessage("账号已删除");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-layout">
      <section className="admin-sidebar-panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">用户列表</p>
            <h3>账号检索</h3>
          </div>
        </div>
        <div className="search-box admin-search">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            placeholder="搜索昵称或邮箱"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="admin-user-list">
          {filteredUsers.length ? filteredUsers.map((user) => (
            <button
              key={user.id}
              className={`admin-user-item${user.id === selectedId ? " active" : ""}`}
              type="button"
              onClick={() => void loadDetail(user.id)}
            >
              <strong>{user.name || "未命名用户"}</strong>
              <span>{user.email}</span>
              <small>{user.promptRunsCount} 条记录 / {user.favoritesCount} 个收藏</small>
            </button>
          )) : <div className="empty-state">没有匹配的账号</div>}
        </div>
      </section>

      <section className="admin-detail-panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">用户详情</p>
            <h3>账号运维</h3>
          </div>
        </div>

        {message ? <p className="auth-message">{message}</p> : null}

        {!selectedId ? (
          <div className="empty-state">请选择一个用户查看详情</div>
        ) : loading && !detail ? (
          <div className="empty-state">正在加载用户详情...</div>
        ) : detail ? (
          <div className="admin-detail-stack">
            <div className="admin-stat-grid">
              <div className="admin-stat-card">
                <span>昵称</span>
                <strong>{detail.name || "未填写"}</strong>
              </div>
              <div className="admin-stat-card">
                <span>邮箱</span>
                <strong>{detail.email}</strong>
              </div>
              <div className="admin-stat-card">
                <span>注册时间</span>
                <strong>{new Date(detail.createdAt).toLocaleString("zh-CN")}</strong>
              </div>
              <div className="admin-stat-card">
                <span>最近更新</span>
                <strong>{new Date(detail.updatedAt).toLocaleString("zh-CN")}</strong>
              </div>
            </div>

            <div className="admin-action-card">
              <h4>管理员操作</h4>
              <div className="admin-action-row">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="输入新密码（至少 6 位）"
                />
                <button className="primary-button" type="button" onClick={() => void resetPassword()} disabled={loading}>
                  重置密码
                </button>
                <button className="ghost-button danger-button" type="button" onClick={() => void deleteUser()} disabled={loading}>
                  删除账号
                </button>
              </div>
            </div>

            <div className="admin-content-grid">
              <div className="admin-card">
                <h4>最近收藏</h4>
                {detail.favorites.length ? (
                  <div className="admin-mini-list">
                    {detail.favorites.map((favorite) => (
                      <div key={favorite.id} className="admin-mini-item">
                        <strong>{favorite.title}</strong>
                        <span>{new Date(favorite.createdAt).toLocaleString("zh-CN")}</span>
                      </div>
                    ))}
                  </div>
                ) : <div className="empty-state">暂无收藏</div>}
              </div>

              <div className="admin-card">
                <h4>最近生成记录</h4>
                {detail.promptRuns.length ? (
                  <div className="admin-mini-list">
                    {detail.promptRuns.map((item) => (
                      <div key={item.id} className="admin-mini-item">
                        <strong>{item.dutyTitle}</strong>
                        <span>{item.provider || "fallback"} / {item.model || "local-template"}</span>
                        <span>{new Date(item.createdAt).toLocaleString("zh-CN")}</span>
                      </div>
                    ))}
                  </div>
                ) : <div className="empty-state">暂无生成记录</div>}
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-state">请选择一个用户查看详情</div>
        )}
      </section>
    </div>
  );
}
