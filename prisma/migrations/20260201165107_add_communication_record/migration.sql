-- CreateEnum
CREATE TYPE "CommunicationChannel" AS ENUM ('email', 'sms', 'push');

-- CreateEnum
CREATE TYPE "CommunicationDirection" AS ENUM ('outbound', 'inbound');

-- CreateEnum
CREATE TYPE "CommunicationStatus" AS ENUM ('queued', 'sent', 'delivered', 'failed');

-- CreateTable
CREATE TABLE "CommunicationRecord" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "customerId" TEXT,
    "contactId" TEXT,
    "dealId" TEXT,
    "taskId" TEXT,
    "createdById" TEXT,
    "channel" "CommunicationChannel" NOT NULL,
    "direction" "CommunicationDirection" NOT NULL DEFAULT 'outbound',
    "status" "CommunicationStatus" NOT NULL DEFAULT 'queued',
    "providerKey" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "to" TEXT NOT NULL,
    "cc" TEXT,
    "bcc" TEXT,
    "subject" TEXT,
    "bodyPreview" TEXT,
    "templateKey" TEXT,
    "payloadSnapshot" JSONB,
    "providerSnapshot" JSONB,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CommunicationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommunicationRecord_companyId_createdAt_idx" ON "CommunicationRecord"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "CommunicationRecord_companyId_status_createdAt_idx" ON "CommunicationRecord"("companyId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "CommunicationRecord_providerKey_providerMessageId_idx" ON "CommunicationRecord"("providerKey", "providerMessageId");

-- AddForeignKey
ALTER TABLE "CommunicationRecord" ADD CONSTRAINT "CommunicationRecord_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationRecord" ADD CONSTRAINT "CommunicationRecord_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationRecord" ADD CONSTRAINT "CommunicationRecord_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationRecord" ADD CONSTRAINT "CommunicationRecord_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationRecord" ADD CONSTRAINT "CommunicationRecord_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationRecord" ADD CONSTRAINT "CommunicationRecord_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
