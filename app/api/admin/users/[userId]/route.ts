import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { assertAdmin } from "@/lib/admin";
import { hashPassword } from "@/lib/password";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{
    userId: string;
  }>;
};

type ResetPasswordRequest = {
  password?: string;
};

async function guardAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !assertAdmin(session.user.email)) {
    return NextResponse.json({ error: "无权限访问" }, { status: 403 });
  }

  if (!hasDatabaseUrl()) {
    return NextResponse.json({ error: "未配置数据库" }, { status: 503 });
  }

  return null;
}

export async function GET(_: Request, context: Params) {
  const denied = await guardAdmin();
  if (denied) return denied;

  const { userId } = await context.params;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      favorites: {
        orderBy: { createdAt: "desc" },
        take: 10
      },
      promptRuns: {
        orderBy: { createdAt: "desc" },
        take: 10
      }
    }
  });

  if (!user) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  return NextResponse.json({
    item: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      favorites: user.favorites.map((favorite) => ({
        id: favorite.id,
        title: favorite.title,
        createdAt: favorite.createdAt.toISOString()
      })),
      promptRuns: user.promptRuns.map((item) => ({
        id: item.id,
        dutyTitle: item.dutyTitle,
        provider: item.provider,
        model: item.model,
        createdAt: item.createdAt.toISOString()
      }))
    }
  });
}

export async function PATCH(request: Request, context: Params) {
  const denied = await guardAdmin();
  if (denied) return denied;

  const { userId } = await context.params;
  const body = (await request.json()) as ResetPasswordRequest;
  const password = body.password?.trim();

  if (!password || password.length < 6) {
    return NextResponse.json({ error: "密码至少 6 位" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  const passwordHash = await hashPassword(password);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash }
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, context: Params) {
  const denied = await guardAdmin();
  if (denied) return denied;

  const { userId } = await context.params;

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  await prisma.user.delete({
    where: { id: userId }
  });

  return NextResponse.json({ ok: true });
}
