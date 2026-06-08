import { DutySource, type Prisma } from "@prisma/client";
import { defaultJobKey, jobsData, type Duty, type Job, type JobKey } from "@/lib/jobs";

type JobWithDuties = Prisma.JobGetPayload<{
  include: {
    duties: true;
  };
}>;

function isJobKey(value: string): value is JobKey {
  return value in jobsData;
}

export function mapDbJobsToAppJobs(records: JobWithDuties[]): Record<JobKey, Job> {
  const fallback = structuredClone(jobsData);

  for (const record of records) {
    if (!isJobKey(record.key)) continue;
    const key = record.key;
    fallback[key] = {
      name: record.name,
      icon: record.icon,
      duties: record.duties.map<Duty>((duty) => ({
        id: duty.id,
        title: duty.title,
        text: duty.text,
        hint: duty.hint,
        source: duty.source === DutySource.CUSTOM ? "custom" : "seed"
      }))
    };
  }

  return fallback;
}

export function getJobKeyOrDefault(value: string | null | undefined): JobKey {
  if (value && isJobKey(value)) return value;
  return defaultJobKey;
}
