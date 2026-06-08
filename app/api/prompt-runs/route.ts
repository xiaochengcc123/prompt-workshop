import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";

type CreatePromptRunRequest = {
  roleName?: string;
  dutyTitle?: string;
  dutyText?: string;
  hint?: string;
  prompt?: string;
  plan?: string;
  provider?: string;
  model?: string;
  jobKey?: string;
  dutyId?: string;
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const body = (await request.json()) as CreatePromptRunRequest;

  if (!body.roleName || !body.dutyTitle || !body.dutyText || !body.prompt) {
    return NextResponse.json({ error: "缺少生成记录信息" }, { status: 400 });
  }

  if (!hasDatabaseUrl()) {
    return NextResponse.json({ saved: false, reason: "missing_database_url" }, { status: 202 });
  }

  const job = body.jobKey
    ? await prisma.job.findUnique({ where: { key: body.jobKey } })
    : null;

  const duty = body.dutyId
    ? await prisma.duty.findUnique({ where: { id: body.dutyId } })
    : null;

  const promptRun = await prisma.promptRun.create({
    data: {
      roleName: body.roleName,
      dutyTitle: body.dutyTitle,
      dutyText: body.dutyText,
      hint: body.hint,
      prompt: body.prompt,
      plan: body.plan,
      provider: body.provider,
      model: body.model,
      jobId: job?.id,
      dutyId: duty?.id,
      userId: session?.user?.id
    }
  });

  return NextResponse.json({
    saved: true,
    id: promptRun.id
  });
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  if (!hasDatabaseUrl()) {
    return NextResponse.json({ items: [], source: "fallback" });
  }

  const items = await prisma.promptRun.findMany({
    where: {
      userId: session.user.id
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 50
  });

  return NextResponse.json({
    items
  });
}
