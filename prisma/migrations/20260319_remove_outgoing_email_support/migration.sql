-- Remove OutgoingEmail and OutgoingEmailAttachment tables
DROP TABLE IF EXISTS "outgoing_email_attachments";
DROP TABLE IF EXISTS "outgoing_emails";

-- Remove OutgoingEmailStatus enum
DROP TYPE IF EXISTS "OutgoingEmailStatus";

-- Remove emailSignature from BusinessSettings
ALTER TABLE "business_settings" DROP COLUMN IF EXISTS "emailSignature";
