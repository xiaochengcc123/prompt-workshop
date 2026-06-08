import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { assertAdmin } from "@/lib/admin";
import { getAdminAiConfigStatus } from "@/lib/admin-ai-config";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !assertAdmin(session.user.email)) {
    return NextResponse.json({ error: "无权访问" }, { status: 403 });
  }

  return NextResponse.json({
    item: getAdminAiConfigStatus()
  });
}
