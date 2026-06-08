import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";

type CreateFavoriteRequest = {
  title?: string;
  prompt?: string;
};

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  if (!hasDatabaseUrl()) {
    return NextResponse.json({ items: [], source: "fallback" });
  }

  const items = await prisma.favorite.findMany({
    where: {
      userId: session.user.id
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 30
  });

  return NextResponse.json({
    items: items.map((item) => ({
      id: item.id,
      title: item.title,
      prompt: item.prompt,
      createdAt: item.createdAt.toISOString()
    }))
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  if (!hasDatabaseUrl()) {
    return NextResponse.json(
      { error: "未配置 DATABASE_URL，当前无法保存云端收藏。" },
      { status: 503 }
    );
  }

  const body = (await request.json()) as CreateFavoriteRequest;
  const title = body.title?.trim();
  const prompt = body.prompt?.trim();

  if (!title || !prompt) {
    return NextResponse.json({ error: "缺少收藏内容" }, { status: 400 });
  }

  const favorite = await prisma.favorite.upsert({
    where: {
      userId_prompt: {
        userId: session.user.id,
        prompt
      }
    },
    update: {
      title
    },
    create: {
      title,
      prompt,
      userId: session.user.id
    }
  });

  return NextResponse.json({
    item: {
      id: favorite.id,
      title: favorite.title,
      prompt: favorite.prompt,
      createdAt: favorite.createdAt.toISOString()
    }
  });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  if (!hasDatabaseUrl()) {
    return NextResponse.json(
      { error: "未配置 DATABASE_URL，当前无法清空云端收藏。" },
      { status: 503 }
    );
  }

  await prisma.favorite.deleteMany({
    where: {
      userId: session.user.id
    }
  });

  return NextResponse.json({ cleared: true });
}
