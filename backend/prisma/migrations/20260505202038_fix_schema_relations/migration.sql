-- CreateTable
CREATE TABLE "SelectionGameAttempt" (
    "id" TEXT NOT NULL,
    "selectionGameId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deadlineAt" TIMESTAMP(3),
    "score" INTEGER,
    "passed" BOOLEAN,
    "completedAt" TIMESTAMP(3),
    "attemptData" JSONB,

    CONSTRAINT "SelectionGameAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SelectionGameAttempt_userId_selectionGameId_idx" ON "SelectionGameAttempt"("userId", "selectionGameId");

-- AddForeignKey
ALTER TABLE "SelectionGameAttempt" ADD CONSTRAINT "SelectionGameAttempt_selectionGameId_fkey" FOREIGN KEY ("selectionGameId") REFERENCES "SelectionGame"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SelectionGameAttempt" ADD CONSTRAINT "SelectionGameAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SelectionGameAttempt" ADD CONSTRAINT "SelectionGameAttempt_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
