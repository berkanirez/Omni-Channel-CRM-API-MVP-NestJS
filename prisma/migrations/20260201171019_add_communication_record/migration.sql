/*
  Warnings:

  - You are about to drop the column `bcc` on the `CommunicationRecord` table. All the data in the column will be lost.
  - You are about to drop the column `bodyPreview` on the `CommunicationRecord` table. All the data in the column will be lost.
  - You are about to drop the column `cc` on the `CommunicationRecord` table. All the data in the column will be lost.
  - You are about to drop the column `direction` on the `CommunicationRecord` table. All the data in the column will be lost.
  - You are about to drop the column `providerKey` on the `CommunicationRecord` table. All the data in the column will be lost.
  - You are about to drop the column `providerSnapshot` on the `CommunicationRecord` table. All the data in the column will be lost.
  - You are about to drop the column `queuedAt` on the `CommunicationRecord` table. All the data in the column will be lost.
  - You are about to drop the column `subject` on the `CommunicationRecord` table. All the data in the column will be lost.
  - You are about to drop the column `templateKey` on the `CommunicationRecord` table. All the data in the column will be lost.
  - You are about to drop the column `to` on the `CommunicationRecord` table. All the data in the column will be lost.
  - Added the required column `provider` to the `CommunicationRecord` table without a default value. This is not possible if the table is not empty.
  - Made the column `payloadSnapshot` on table `CommunicationRecord` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "CommunicationRecord_companyId_status_createdAt_idx";

-- DropIndex
DROP INDEX "CommunicationRecord_providerKey_providerMessageId_idx";

-- AlterTable
ALTER TABLE "CommunicationRecord" DROP COLUMN "bcc",
DROP COLUMN "bodyPreview",
DROP COLUMN "cc",
DROP COLUMN "direction",
DROP COLUMN "providerKey",
DROP COLUMN "providerSnapshot",
DROP COLUMN "queuedAt",
DROP COLUMN "subject",
DROP COLUMN "templateKey",
DROP COLUMN "to",
ADD COLUMN     "provider" TEXT NOT NULL,
ADD COLUMN     "providerResponse" JSONB,
ADD COLUMN     "requestId" TEXT,
ALTER COLUMN "payloadSnapshot" SET NOT NULL;

-- DropEnum
DROP TYPE "CommunicationDirection";

-- CreateIndex
CREATE INDEX "CommunicationRecord_companyId_status_channel_idx" ON "CommunicationRecord"("companyId", "status", "channel");

-- CreateIndex
CREATE INDEX "CommunicationRecord_companyId_customerId_idx" ON "CommunicationRecord"("companyId", "customerId");
