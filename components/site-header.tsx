"use client";

import { signOut, useSession } from "next-auth/react";

export function SiteHeader() {
  const { data: session, status } = useSession();

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <a className="site-brand" href="/">
          <span className="brand-mark">P</span>
          <span>
            <strong>岗位提示词工坊</strong>
            <small>Prompt Workshop</small>
          </span>
        </a>

        <nav className="site-nav">
          <a className="history-link" href="/">首页</a>
          <a className="history-link" href="/history">生成历史</a>
          {status === "authenticated" ? (
            <>
              {session.user.isAdmin ? (
                <>
                  <a className="history-link" href="/admin/users">账号管理</a>
                  <a className="history-link" href="/admin/ai-config">AI 检测</a>
                </>
              ) : null}
              <span className="site-user">{session.user.name || session.user.email}</span>
              <button className="ghost-button" type="button" onClick={() => signOut({ callbackUrl: "/" })}>
                退出
              </button>
            </>
          ) : (
            <>
              <a className="history-link" href="/auth/sign-in">登录</a>
              <a className="primary-button history-link primary-link" href="/auth/sign-up">注册</a>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
