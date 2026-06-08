import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getReadableAiError } from "@/lib/ai-error";
import { generateText, hasUsableAiConfig } from "@/lib/ai-client";
import { buildPlan } from "@/lib/plan-template";
import { jobsData, type JobKey } from "@/lib/jobs";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";

type GeneratePlanRequest = {
  roleName?: string;
  dutyTitle?: string;
  dutyText?: string;
  hint?: string;
  prompt?: string;
  jobKey?: string;
  dutyId?: string;
  aiConfig?: {
    provider?: "openai" | "deepseek";
    apiKey?: string;
    model?: string;
  };
};

function isJobKey(value: string | undefined): value is JobKey {
  return Boolean(value && value in jobsData);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const body = (await request.json()) as GeneratePlanRequest;
  const { roleName, dutyTitle, dutyText, hint, prompt, jobKey, dutyId, aiConfig } = body;

  if (!roleName || !dutyTitle || !dutyText || !prompt) {
    return NextResponse.json({ error: "缺少生成方案所需信息" }, { status: 400 });
  }

  const appJob = isJobKey(jobKey) ? jobsData[jobKey] : jobsData.hr;
  const appDuty = appJob.duties.find((item) => item.id === dutyId) ?? {
    id: dutyId || "fallback",
    title: dutyTitle,
    text: dutyText,
    hint: hint || dutyTitle
  };
  const fallbackPlan = buildPlan(appJob, appDuty, prompt);

  if (!hasUsableAiConfig({ runtimeConfig: aiConfig })) {
    if (hasDatabaseUrl()) {
      try {
        await savePlanToHistory({
          sessionUserId: session?.user?.id,
          roleName,
          dutyTitle,
          dutyText,
          hint,
          prompt,
          plan: fallbackPlan,
          provider: "fallback",
          model: "local-template",
          jobKey,
          dutyId
        });
      } catch (error) {
        console.error("Failed to save fallback plan to history", error);
      }
    }

    return NextResponse.json({
      plan: fallbackPlan,
      source: "fallback"
    });
  }

  const aiInput = `你是一名资深${roleName}顾问。请基于以下 AI 提示词，输出一份可执行方案。

职责标题：${dutyTitle}
职责描述：${dutyText}
参考提示词：
${prompt}

要求：
1. 输出“背景与目标、分阶段方案、交付物、风险与应对、下一步行动建议”五部分。
2. 方案必须具体，可执行，适合真实工作场景。
3. 使用中文和 Markdown。
4. 不要重复解释提示词本身，而是把它转化为行动方案。`;

  let text = "";
  let config: Awaited<ReturnType<typeof generateText>>["config"];

  try {
    const result = await generateText(aiInput, {
      runtimeConfig: aiConfig
    });
    text = result.text;
    config = result.config;
  } catch (error) {
    const message = getReadableAiError(error);
    console.error("Plan generation failed", error);
    return NextResponse.json(
      {
        error: "AI 方案生成失败",
        detail: message
      },
      { status: 502 }
    );
  }

  const plan = text || fallbackPlan;

  if (hasDatabaseUrl()) {
    try {
      await savePlanToHistory({
        sessionUserId: session?.user?.id,
        roleName,
        dutyTitle,
        dutyText,
        hint,
        prompt,
        plan,
        provider: config.provider,
        model: config.model,
        jobKey,
        dutyId
      });
    } catch (error) {
      console.error("Failed to save AI plan to history", error);
    }
  }

  return NextResponse.json({
    plan,
    source: "ai"
  });
}

async function savePlanToHistory(input: {
  sessionUserId?: string;
  roleName: string;
  dutyTitle: string;
  dutyText: string;
  hint?: string;
  prompt: string;
  plan: string;
  provider: string;
  model: string;
  jobKey?: string;
  dutyId?: string;
}) {
  const [job, duty] = await Promise.all([
    input.jobKey ? prisma.job.findUnique({ where: { key: input.jobKey } }) : Promise.resolve(null),
    input.dutyId ? prisma.duty.findUnique({ where: { id: input.dutyId } }) : Promise.resolve(null)
  ]);

  const existing = await prisma.promptRun.findFirst({
    where: {
      userId: input.sessionUserId ?? null,
      dutyId: duty?.id ?? null,
      prompt: input.prompt
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  if (existing) {
    await prisma.promptRun.update({
      where: { id: existing.id },
      data: {
        plan: input.plan,
        provider: input.provider,
        model: input.model
      }
    });
    return;
  }

  await prisma.promptRun.create({
    data: {
      roleName: input.roleName,
      dutyTitle: input.dutyTitle,
      dutyText: input.dutyText,
      hint: input.hint,
      prompt: input.prompt,
      plan: input.plan,
      provider: input.provider,
      model: input.model,
      jobId: job?.id,
      dutyId: duty?.id,
      userId: input.sessionUserId
    }
  });
}
