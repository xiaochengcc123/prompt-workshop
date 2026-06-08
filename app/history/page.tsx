import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { HistoryList } from "@/components/history-list";
import { authOptions } from "@/lib/auth";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";

export default async function HistoryPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/sign-in");
  }

  const items = hasDatabaseUrl()
    ? await prisma.promptRun.findMany({
        where: {
          userId: session.user.id
        },
        orderBy: {
          createdAt: "desc"
        },
        take: 50
      })
    : [];

  return (
    <main className="history-shell">
      <section className="history-header">
        <div>
          <p className="eyebrow">生成历史</p>
          <h1>你的 AI 提示词记录</h1>
          <p>每次生成的提示词和执行方案都会自动归档到账户名下，方便回看和复用。</p>
        </div>
        <div className="history-actions">
          <a className="ghost-button history-link" href="/">返回首页</a>
        </div>
      </section>
      <HistoryList items={items.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString()
      }))} />
    </main>
  );
}
