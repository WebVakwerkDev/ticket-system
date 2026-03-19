CREATE TYPE "OutgoingEmailStatus" AS ENUM ('DRAFT', 'SENT', 'FAILED');

CREATE TABLE "outgoing_emails" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "senderUserId" TEXT NOT NULL,
    "replyToEmailId" TEXT,
    "fromEmail" TEXT NOT NULL,
    "fromName" TEXT,
    "toAddresses" TEXT[] NOT NULL,
    "ccAddresses" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "subject" TEXT NOT NULL,
    "bodyText" TEXT NOT NULL,
    "bodyHtml" TEXT,
    "status" "OutgoingEmailStatus" NOT NULL DEFAULT 'DRAFT',
    "provider" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "providerError" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outgoing_emails_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "outgoing_email_attachments" (
    "id" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outgoing_email_attachments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "outgoing_emails_projectId_createdAt_idx" ON "outgoing_emails"("projectId", "createdAt");
CREATE INDEX "outgoing_emails_status_createdAt_idx" ON "outgoing_emails"("status", "createdAt");

ALTER TABLE "outgoing_emails" ADD CONSTRAINT "outgoing_emails_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project_workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "outgoing_emails" ADD CONSTRAINT "outgoing_emails_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "outgoing_emails" ADD CONSTRAINT "outgoing_emails_replyToEmailId_fkey" FOREIGN KEY ("replyToEmailId") REFERENCES "outgoing_emails"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "outgoing_email_attachments" ADD CONSTRAINT "outgoing_email_attachments_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "outgoing_emails"("id") ON DELETE CASCADE ON UPDATE CASCADE;
