import { NextResponse } from "next/server";
import { DutySource } from "@prisma/client";
import { jobsData } from "@/lib/jobs";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { mapDbJobsToAppJobs } from "@/lib/job-mapper";

export async function GET() {
  if (!hasDatabaseUrl()) {
    return NextResponse.json({
      jobs: jobsData,
      source: "fallback"
    });
  }

  try {
    const records = await prisma.job.findMany({
      include: {
        duties: {
          orderBy: [{ source: "desc" }, { createdAt: "desc" }]
        }
      },
      orderBy: { createdAt: "asc" }
    });

    return NextResponse.json({
      jobs: mapDbJobsToAppJobs(records),
      source: "database"
    });
  } catch (error) {
    console.error("Failed to load jobs from database", error);
    return NextResponse.json({
      jobs: jobsData,
      source: "fallback"
    });
  }
}

type CreateDutyRequest = {
  jobKey?: string;
  title?: string;
  text?: string;
  hint?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as CreateDutyRequest;
  const title = body.title?.trim();
  const text = body.text?.trim();
  const hint = body.hint?.trim() || "自定义";
  const jobKey = body.jobKey?.trim();

  if (!jobKey || !title || !text) {
    return NextResponse.json({ error: "缺少岗位或职责信息" }, { status: 400 });
  }

  if (!hasDatabaseUrl()) {
    return NextResponse.json(
      { error: "未配置 DATABASE_URL，当前无法保存到数据库。" },
      { status: 503 }
    );
  }

  const job = await prisma.job.findUnique({
    where: { key: jobKey }
  });

  if (!job) {
    return NextResponse.json({ error: "岗位不存在" }, { status: 404 });
  }

  const duty = await prisma.duty.create({
    data: {
      title,
      text,
      hint,
      source: DutySource.CUSTOM,
      jobId: job.id
    }
  });

  return NextResponse.json({
    duty: {
      id: duty.id,
      title: duty.title,
      text: duty.text,
      hint: duty.hint,
      source: "custom"
    }
  });
}
