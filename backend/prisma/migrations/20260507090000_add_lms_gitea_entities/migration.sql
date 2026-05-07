-- CreateTable
CREATE TABLE "Quest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "language" TEXT NOT NULL DEFAULT 'python',
    "xpReward" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER,
    "manifest" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Quest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestExercise" (
    "id" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER,
    "xpReward" INTEGER NOT NULL DEFAULT 0,
    "instructions" TEXT,
    "filesToSubmit" JSONB,
    "allowedFunctions" JSONB,
    "defaultCode" TEXT,
    "defaultCodeByLanguage" JSONB,
    "sampleTests" JSONB,
    "hiddenTests" JSONB,
    "restrictions" JSONB,
    "auditChecklist" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "currentExerciseId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PASSED',
    "results" JSONB,
    "passedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExerciseProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GiteaAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "giteaUserId" INTEGER,
    "giteaUsername" TEXT NOT NULL,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GiteaAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GiteaRepository" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "questId" TEXT,
    "repoFullName" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "repoUrl" TEXT NOT NULL,
    "giteaRepoId" INTEGER,
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GiteaRepository_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "exerciseId" TEXT,
    "repositoryId" TEXT,
    "commitHash" TEXT,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "result" JSONB,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "auditedAt" TIMESTAMP(3),

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Audit" (
    "id" TEXT NOT NULL,
    "auditeeId" TEXT NOT NULL,
    "auditorId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "submissionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'AUDITING',
    "checklistResults" JSONB,
    "feedback" TEXT,
    "repoUrl" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "Audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditQueue" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'WAITING',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditPoint" (
    "userId" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 1,
    "auditsCompleted" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditPoint_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "AuditBlock" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "blockedUserId" TEXT NOT NULL,
    "reason" TEXT NOT NULL DEFAULT 'recent_audit',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "XPTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questId" TEXT,
    "amount" INTEGER NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "XPTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Quest_slug_key" ON "Quest"("slug");
CREATE UNIQUE INDEX "QuestExercise_questId_exerciseId_key" ON "QuestExercise"("questId", "exerciseId");
CREATE INDEX "QuestExercise_questId_order_idx" ON "QuestExercise"("questId", "order");
CREATE UNIQUE INDEX "QuestProgress_userId_questId_key" ON "QuestProgress"("userId", "questId");
CREATE INDEX "QuestProgress_questId_status_idx" ON "QuestProgress"("questId", "status");
CREATE UNIQUE INDEX "ExerciseProgress_userId_questId_exerciseId_key" ON "ExerciseProgress"("userId", "questId", "exerciseId");
CREATE INDEX "ExerciseProgress_questId_exerciseId_status_idx" ON "ExerciseProgress"("questId", "exerciseId", "status");
CREATE UNIQUE INDEX "GiteaAccount_userId_key" ON "GiteaAccount"("userId");
CREATE UNIQUE INDEX "GiteaAccount_giteaUsername_key" ON "GiteaAccount"("giteaUsername");
CREATE UNIQUE INDEX "GiteaRepository_repoFullName_key" ON "GiteaRepository"("repoFullName");
CREATE UNIQUE INDEX "GiteaRepository_userId_questId_key" ON "GiteaRepository"("userId", "questId");
CREATE INDEX "GiteaRepository_questId_idx" ON "GiteaRepository"("questId");
CREATE INDEX "Submission_userId_submittedAt_idx" ON "Submission"("userId", "submittedAt");
CREATE INDEX "Submission_questId_exerciseId_status_idx" ON "Submission"("questId", "exerciseId", "status");
CREATE INDEX "Audit_auditeeId_status_idx" ON "Audit"("auditeeId", "status");
CREATE INDEX "Audit_auditorId_status_idx" ON "Audit"("auditorId", "status");
CREATE INDEX "Audit_questId_exerciseId_status_idx" ON "Audit"("questId", "exerciseId", "status");
CREATE UNIQUE INDEX "AuditQueue_userId_questId_exerciseId_key" ON "AuditQueue"("userId", "questId", "exerciseId");
CREATE INDEX "AuditQueue_questId_exerciseId_status_idx" ON "AuditQueue"("questId", "exerciseId", "status");
CREATE UNIQUE INDEX "AuditBlock_userId_blockedUserId_reason_key" ON "AuditBlock"("userId", "blockedUserId", "reason");
CREATE INDEX "AuditBlock_userId_blockedUserId_idx" ON "AuditBlock"("userId", "blockedUserId");
CREATE UNIQUE INDEX "XPTransaction_userId_sourceType_sourceId_key" ON "XPTransaction"("userId", "sourceType", "sourceId");
CREATE INDEX "XPTransaction_userId_createdAt_idx" ON "XPTransaction"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "QuestExercise" ADD CONSTRAINT "QuestExercise_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "QuestProgress" ADD CONSTRAINT "QuestProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "QuestProgress" ADD CONSTRAINT "QuestProgress_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExerciseProgress" ADD CONSTRAINT "ExerciseProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GiteaAccount" ADD CONSTRAINT "GiteaAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GiteaRepository" ADD CONSTRAINT "GiteaRepository_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GiteaRepository" ADD CONSTRAINT "GiteaRepository_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "GiteaRepository"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Audit" ADD CONSTRAINT "Audit_auditeeId_fkey" FOREIGN KEY ("auditeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Audit" ADD CONSTRAINT "Audit_auditorId_fkey" FOREIGN KEY ("auditorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Audit" ADD CONSTRAINT "Audit_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Audit" ADD CONSTRAINT "Audit_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditQueue" ADD CONSTRAINT "AuditQueue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditPoint" ADD CONSTRAINT "AuditPoint_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditBlock" ADD CONSTRAINT "AuditBlock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditBlock" ADD CONSTRAINT "AuditBlock_blockedUserId_fkey" FOREIGN KEY ("blockedUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "XPTransaction" ADD CONSTRAINT "XPTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "XPTransaction" ADD CONSTRAINT "XPTransaction_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
