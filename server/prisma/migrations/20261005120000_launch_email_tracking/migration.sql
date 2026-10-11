CREATE TABLE "LaunchEmailLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "campaign" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "providerMessageId" TEXT,
    "error" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LaunchEmailLog_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "LaunchEmailLog_userId_campaign_key" ON "LaunchEmailLog"("userId", "campaign");
CREATE INDEX "LaunchEmailLog_campaign_status_idx" ON "LaunchEmailLog"("campaign", "status");
ALTER TABLE "LaunchEmailLog" ADD CONSTRAINT "LaunchEmailLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
