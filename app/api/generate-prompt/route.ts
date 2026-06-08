import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getReadableAiError } from "@/lib/ai-error";
import { generateText, hasUsableAiConfig } from "@/lib/ai-client";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";

type GeneratePromptRequest = {
  roleName?: string;
  dutyTitle?: string;
  dutyText?: string;
  hint?: string;
  jobKey?: string;
  dutyId?: string;
  aiConfig?: {
    provider?: "openai" | "deepseek";
    apiKey?: string;
    model?: string;
  };
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const body = (await request.json()) as GeneratePromptRequest;
  const { roleName, dutyTitle, dutyText, hint, jobKey, dutyId, aiConfig } = body;

  if (!roleName || !dutyTitle || !dutyText) {
    return NextResponse.json({ error: "缺少岗位或职责信息" }, { status: 400 });
  }

  if (!hasUsableAiConfig({ runtimeConfig: aiConfig })) {
    return NextResponse.json(
      { error: "未配置可用的 AI Key，已使用本地模板生成。" },
      { status: 503 }
    );
  }

  const aiInput = `你是资深${roleName}专家，重点方向是${hint || dutyTitle}。

请基于以下职责生成一份可直接复制使用的 AI 提示词：

职责标题：${dutyTitle}
职责描述：${dutyText}

要求：
1. 包含角色设定、任务目标、执行步骤、输出格式、约束条件。
2. 适合真实工作场景。
3. 使用中文。
4. 输出 Markdown。
5. 内容具体可执行，不要输出解释过程。`;

  let prompt = "";
  let config: Awaited<ReturnType<typeof generateText>>["config"];

  try {
    const result = await generateText(aiInput, {
      runtimeConfig: aiConfig
    });
    prompt = result.text;
    config = result.config;
  } catch (error) {
    const message = getReadableAiError(error);
    console.error("Prompt generation failed", error);
    return NextResponse.json(
      {
        error: "AI 提示词生成失败",
        detail: message
      },
      { status: 502 }
    );
  }

  if (hasDatabaseUrl()) {
    try {
      const [job, duty] = await Promise.all([
        jobKey ? prisma.job.findUnique({ where: { key: jobKey } }) : Promise.resolve(null),
        dutyId ? prisma.duty.findUnique({ where: { id: dutyId } }) : Promise.resolve(null)
      ]);

      await prisma.promptRun.create({
        data: {
          roleName,
          dutyTitle,
          dutyText,
          hint,
          prompt,
          provider: config.provider,
          model: config.model,
          jobId: job?.id,
          dutyId: duty?.id,
          userId: session?.user?.id
        }
      });
    } catch (error) {
      console.error("Failed to save prompt run", error);
    }
  }

  return NextResponse.json({
    prompt
  });
}
