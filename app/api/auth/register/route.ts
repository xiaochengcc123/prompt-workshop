import { NextResponse } from "next/server";
import { getReadableAiError } from "@/lib/ai-error";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

type RegisterRequest = {
  name?: string;
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  try {
    if (!hasDatabaseUrl()) {
      return NextResponse.json(
        { error: "未配置 DATABASE_URL，当前无法创建账号。" },
        { status: 503 }
      );
    }

    const body = (await request.json()) as RegisterRequest;
    const name = body.name?.trim() || null;
    const email = body.email?.trim().toLowerCase();
    const password = body.password?.trim();

    if (!email || !password || password.length < 6) {
      return NextResponse.json(
        { error: "请填写有效的邮箱，密码至少 6 位。" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ error: "该邮箱已注册。" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash
      }
    });

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    const detail = getReadableAiError(error);
    console.error("Register failed", error);
    return NextResponse.json(
      {
        error: "注册失败",
        detail
      },
      { status: 500 }
    );
  }
}
