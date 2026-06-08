"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { safeReadJson } from "@/lib/http-response";

type AuthCardProps = {
  mode: "sign-in" | "sign-up";
};

export function AuthCard({ mode }: AuthCardProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const isSignUp = mode === "sign-up";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (isSignUp) {
        const registerResponse = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email,
            password
          })
        });

        const registerData = await safeReadJson<{ error?: string; detail?: string }>(registerResponse);
        if (!registerResponse.ok) {
          setMessage(registerData?.detail || registerData?.error || "注册失败");
          return;
        }
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false
      });

      if (result?.error) {
        setMessage("邮箱或密码不正确");
        return;
      }

      const destination = isSignUp ? "/" : "/history";
      window.location.assign(destination);
      return;
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-shell">
      <div className="auth-card">
        <div className="auth-head">
          <p className="eyebrow">{isSignUp ? "创建账号" : "欢迎回来"}</p>
          <h1>{isSignUp ? "注册并开始保存历史" : "登录查看你的生成记录"}</h1>
          <p>{isSignUp ? "注册后，生成历史会和你的账号绑定。" : "登录后可查看专属生成历史，并把记录持续保存在云端。"}</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isSignUp ? (
            <label>
              <span>昵称</span>
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：张三" />
            </label>
          ) : null}
          <label>
            <span>邮箱</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              required
            />
          </label>
          <label>
            <span>密码</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="至少 6 位"
              minLength={6}
              required
            />
          </label>
          {message ? <p className="auth-message">{message}</p> : null}
          <button className="primary-button auth-submit" type="submit" disabled={loading}>
            {loading ? "处理中" : isSignUp ? "注册并登录" : "登录"}
          </button>
        </form>

        <div className="auth-switch">
          {isSignUp ? (
            <a href="/auth/sign-in">已有账号，去登录</a>
          ) : (
            <a href="/auth/sign-up">还没有账号，去注册</a>
          )}
        </div>
      </div>
    </section>
  );
}
