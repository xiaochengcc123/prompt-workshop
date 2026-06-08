-- CreateEnum
CREATE TYPE "DutySource" AS ENUM ('SEED', 'CUSTOM');

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Duty" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "hint" TEXT NOT NULL,
    "source" "DutySource" NOT NULL DEFAULT 'SEED',
    "jobId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Duty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromptRun" (
    "id" TEXT NOT NULL,
    "roleName" TEXT NOT NULL,
    "dutyTitle" TEXT NOT NULL,
    "dutyText" TEXT NOT NULL,
    "hint" TEXT,
    "prompt" TEXT NOT NULL,
    "plan" TEXT,
    "provider" TEXT,
    "model" TEXT,
    "jobId" TEXT,
    "dutyId" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromptRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Job_key_key" ON "Job"("key");

-- CreateIndex
CREATE INDEX "Duty_jobId_idx" ON "Duty"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Favorite_userId_createdAt_idx" ON "Favorite"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_prompt_key" ON "Favorite"("userId", "prompt");

-- CreateIndex
CREATE INDEX "PromptRun_jobId_idx" ON "PromptRun"("jobId");

-- CreateIndex
CREATE INDEX "PromptRun_dutyId_idx" ON "PromptRun"("dutyId");

-- CreateIndex
CREATE INDEX "PromptRun_userId_idx" ON "PromptRun"("userId");

-- CreateIndex
CREATE INDEX "PromptRun_createdAt_idx" ON "PromptRun"("createdAt");

-- AddForeignKey
ALTER TABLE "Duty" ADD CONSTRAINT "Duty_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromptRun" ADD CONSTRAINT "PromptRun_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromptRun" ADD CONSTRAINT "PromptRun_dutyId_fkey" FOREIGN KEY ("dutyId") REFERENCES "Duty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromptRun" ADD CONSTRAINT "PromptRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
