import { config as loadEnv } from "dotenv";
import { DutySource } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { jobsData, type JobKey } from "../lib/jobs";

loadEnv({ path: ".env.local" });
loadEnv();

async function main() {
  for (const [key, job] of Object.entries(jobsData) as Array<[JobKey, (typeof jobsData)[JobKey]]>) {
    const savedJob = await prisma.job.upsert({
      where: { key },
      update: {
        name: job.name,
        icon: job.icon
      },
      create: {
        key,
        name: job.name,
        icon: job.icon
      }
    });

    for (const duty of job.duties) {
      await prisma.duty.upsert({
        where: { id: duty.id },
        update: {
          title: duty.title,
          text: duty.text,
          hint: duty.hint,
          source: DutySource.SEED,
          jobId: savedJob.id
        },
        create: {
          id: duty.id,
          title: duty.title,
          text: duty.text,
          hint: duty.hint,
          source: DutySource.SEED,
          jobId: savedJob.id
        }
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
