import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { AdminUsersDashboard } from "@/components/admin-users-dashboard";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import type { AdminUserListItem } from "@/lib/admin-users";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/auth/sign-in");
  }

  if (!session.user.isAdmin && !isAdminEmail(session.user.email)) {
    redirect("/");
  }

  const users = hasDatabaseUrl()
    ? await prisma.user.findMany({
        orderBy: {
          createdAt: "desc"
        },
        include: {
          _count: {
            select: {
              favorites: true,
              promptRuns: true
            }
          }
        }
      })
    : [];

  const items: AdminUserListItem[] = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
    favoritesCount: user._count.favorites,
    promptRunsCount: user._count.promptRuns
  }));

  return (
    <main className="history-shell">
      <section className="history-header">
        <div>
          <p className="eyebrow">账号管理</p>
          <h1>注册用户列表</h1>
          <p>查看当前注册用户、收藏数量和生成记录数量。</p>
        </div>
        <div className="history-actions">
          <a className="ghost-button history-link" href="/">返回首页</a>
        </div>
      </section>

      {items.length ? (
        <AdminUsersDashboard initialUsers={items} />
      ) : (
        <div className="empty-state">当前还没有可展示的注册账号，或数据库尚未连接。</div>
      )}
    </main>
  );
}
