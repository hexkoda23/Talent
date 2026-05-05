-- CreateEnum
CREATE TYPE "OnboardingDocumentType" AS ENUM ('cys_form', 'logbook', 'acceptance_letter', 'other');

-- CreateEnum
CREATE TYPE "OnboardingDocumentStatus" AS ENUM ('pending_review', 'approved', 'rejected', 'needs_reupload');

-- AlterTable
ALTER TABLE "SelectionGame" ADD COLUMN "description" TEXT;
ALTER TABLE "SelectionGame" ADD COLUMN "accessMethod" TEXT;
ALTER TABLE "SelectionGame" ADD COLUMN "configuration" JSONB;

-- CreateTable
CREATE TABLE "GameAttempt" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deadlineAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "score" INTEGER,
    "passed" BOOLEAN,
    "breakdown" JSONB,
    "attemptData" JSONB,
    "timeElapsedSeconds" INTEGER,

    CONSTRAINT "GameAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GameAttempt_userId_startedAt_idx" ON "GameAttempt"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "GameAttempt_applicationId_startedAt_idx" ON "GameAttempt"("applicationId", "startedAt");

-- AddForeignKey
ALTER TABLE "GameAttempt" ADD CONSTRAINT "GameAttempt_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "SelectionGame"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameAttempt" ADD CONSTRAINT "GameAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameAttempt" ADD CONSTRAINT "GameAttempt_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "OnboardingDocument" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "documentType" "OnboardingDocumentType" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "status" "OnboardingDocumentStatus" NOT NULL DEFAULT 'pending_review',
    "metadata" JSONB,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OnboardingDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OnboardingDocument_applicationId_documentType_idx" ON "OnboardingDocument"("applicationId", "documentType");

-- AddForeignKey
ALTER TABLE "OnboardingDocument" ADD CONSTRAINT "OnboardingDocument_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
