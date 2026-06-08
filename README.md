# 岗位提示词工坊

一个基于 Next.js + TypeScript 的 AI 提示词生成产品 MVP。当前保留了静态版已有功能，并增加了服务端 AI API 接入入口。

## 当前功能

- 按岗位浏览职责库
- 搜索岗位和职责
- 一键生成结构化 AI 提示词
- 基于提示词继续生成执行方案
- 未配置 API Key 时自动使用本地模板生成
- 支持网页端输入 API Key，并切换 OpenAI / DeepSeek
- 自定义职责并生成提示词
- 复制提示词
- 下载提示词为 `.txt`
- 收藏常用提示词，登录后保存到账号云端，未登录时保存在本地浏览器
- 移动端自适应布局

## 技术栈

- Next.js App Router
- React
- TypeScript
- OpenAI Node SDK
- CSS Modules-free global stylesheet

## 本地运行

```bash
npm install
npm run dev
```

打开 `http://localhost:3000`。

如果开发缓存异常、热更新不稳定，优先使用：

```bash
npm run dev:fresh
```

当前开发模式默认使用 `next dev --webpack`，比 Turbopack 更稳，适合当前这台机器上的本地开发。

## 接入真实 AI API

复制 `.env.example` 为 `.env.local`，填写：

```env
DATABASE_URL=postgresql://user:password@host:5432/prompt_workshop
DIRECT_URL=postgresql://user:password@direct-host:5432/prompt_workshop?sslmode=require
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=一个足够长的随机字符串
ADMIN_EMAILS=admin@example.com
AI_PROVIDER=openai
OPENAI_API_KEY=你的_api_key
OPENAI_MODEL=gpt-4.1-mini
DEEPSEEK_API_KEY=
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

前端会请求 `app/api/generate-prompt/route.ts`，密钥只在服务端使用，不会暴露到浏览器。
如果你在网页端输入了 API Key，接口会优先使用浏览器本地配置；没有时再回退到环境变量。
Prisma 迁移命令也会显式读取项目根目录下的 `.env.local`。
推荐在 Neon 下使用两条连接串：
- `DATABASE_URL`：运行时使用 pooler 地址
- `DIRECT_URL`：Prisma migrate 使用直连地址，不带 `-pooler`

登录系统使用邮箱 + 密码，注册接口会把密码哈希后写入数据库。
收藏夹在登录后会自动切到云端模式，和当前账号绑定。
账号管理页 `/admin/users` 只有 `ADMIN_EMAILS` 白名单中的邮箱登录后可见。
后台支持搜索用户、查看收藏与生成记录、管理员重置密码、删除账号。

## 初始化数据库

```bash
npm run db:generate
npm run db:migrate -- --name init
npm run db:seed
```

如果没有配置 `DATABASE_URL`，项目会自动使用本地岗位数据回退运行。

## 主要文件

```text
app/page.tsx                         首页入口
app/layout.tsx                       SEO 元数据和根布局
app/globals.css                      全局样式
app/api/generate-prompt/route.ts     服务端 AI 生成接口
app/api/generate-plan/route.ts       服务端方案生成接口
app/api/jobs/route.ts                岗位和职责读取/新增接口
app/api/prompt-runs/route.ts         生成历史写入接口
app/api/auth/[...nextauth]/route.ts  登录和会话接口
app/api/auth/register/route.ts       注册接口
app/api/admin/users/[userId]/route.ts 管理员账号操作接口
app/history/page.tsx                 生成历史列表页
app/admin/users/page.tsx             管理后台账号页
app/auth/sign-in/page.tsx            登录页
app/auth/sign-up/page.tsx            注册页
components/prompt-workbench.tsx      产品主界面
components/admin-users-dashboard.tsx 管理后台交互面板
components/history-list.tsx          历史列表组件
components/auth-forms.tsx            登录注册表单
prisma/schema.prisma                 数据模型
prisma/seed.ts                       初始岗位和职责种子数据
lib/auth.ts                          Auth.js 配置
lib/plan-template.ts                 本地方案模板
lib/password.ts                      密码哈希与校验
lib/jobs.ts                          岗位和职责数据
lib/prompt-template.ts               本地提示词模板
```

## 部署

推荐部署到 Vercel。导入项目后，在 Vercel Project Settings 里配置：

```env
OPENAI_API_KEY
OPENAI_MODEL
```

如果不配置 API Key，网站仍可运行，但会使用本地模板生成提示词。
## Vercel 部署建议

当前项目已经补好了适合 Vercel 的部署脚本与配置：

- `postinstall`: `prisma generate`
- `vercel-build`: `prisma generate && prisma migrate deploy && next build`
- `vercel.json`: 固定使用 `npm install` 和 `npm run vercel-build`

推荐部署步骤：

1. 把项目推到 GitHub
2. 在 Vercel 导入仓库
3. 在 Project Settings -> Environment Variables 中配置：

```env
DATABASE_URL=你的运行时数据库连接串
DIRECT_URL=你的迁移直连数据库连接串
NEXTAUTH_URL=https://你的线上域名
NEXTAUTH_SECRET=你的随机密钥
ADMIN_EMAILS=你的管理员邮箱
AI_PROVIDER=openai
OPENAI_API_KEY=你的 OpenAI Key
OPENAI_MODEL=gpt-4.1-mini
DEEPSEEK_API_KEY=
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

说明：

- `DATABASE_URL`：运行时使用；Neon 建议填 pooler 地址
- `DIRECT_URL`：迁移使用；Neon 建议填非 pooler 直连地址
- `NEXTAUTH_URL`：必须改成正式域名，例如 `https://your-app.vercel.app`
- 如果你只用 DeepSeek，可以不填 `OPENAI_API_KEY`
- 如果你只用 OpenAI，可以不填 `DEEPSEEK_API_KEY`

部署完成后，Vercel 会按下面顺序执行：

1. `npm install`
2. `postinstall` -> `prisma generate`
3. `buildCommand` -> `npm run vercel-build`
4. `vercel-build` 内执行：
   - `prisma generate`
   - `prisma migrate deploy`
   - `next build`
