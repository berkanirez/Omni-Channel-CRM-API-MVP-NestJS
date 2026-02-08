-- AlterTable
ALTER TABLE "CommunicationRecord" ADD COLUMN     "lastAttemptAt" TIMESTAMP(3),
ADD COLUMN     "nextRetryAt" TIMESTAMP(3),
ADD COLUMN     "retryCount" INTEGER NOT NULL DEFAULT 0;
