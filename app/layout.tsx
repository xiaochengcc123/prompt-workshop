import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "岗位提示词工坊",
  description: "面向 HR、市场、产品、开发、设计等岗位的 AI 提示词生成工具。",
  openGraph: {
    title: "岗位提示词工坊",
    description: "根据岗位职责快速生成专业 AI 提示词，支持搜索、自定义职责、收藏和导出。",
    type: "website"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <Providers>
          <SiteHeader />
          {children}
        </Providers>
      </body>
    </html>
  );
}
