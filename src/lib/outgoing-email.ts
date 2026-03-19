export const OUTGOING_EMAIL_ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
  "image/webp",
  "text/plain",
  "text/csv",
]);

export const MAX_OUTGOING_EMAIL_ATTACHMENTS = 5;
export const MAX_OUTGOING_EMAIL_TOTAL_BYTES = 15 * 1024 * 1024;

export interface EmailAttachmentInput {
  fileName: string;
  mimeType: string;
  fileSize: number;
  contentBase64: string;
}

export function parseEmailAddressList(input: string) {
  return input
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function formatReplySubject(subject: string) {
  return /^re:/i.test(subject.trim()) ? subject.trim() : `Re: ${subject.trim()}`;
}

export async function readAndValidateAttachments(files: File[]) {
  if (files.length > MAX_OUTGOING_EMAIL_ATTACHMENTS) {
    throw new Error(`Je kunt maximaal ${MAX_OUTGOING_EMAIL_ATTACHMENTS} bijlagen toevoegen.`);
  }

  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  if (totalBytes > MAX_OUTGOING_EMAIL_TOTAL_BYTES) {
    throw new Error("De totale grootte van de bijlagen is te groot.");
  }

  const attachments: EmailAttachmentInput[] = [];

  for (const file of files) {
    if (!OUTGOING_EMAIL_ALLOWED_MIME_TYPES.has(file.type)) {
      throw new Error(`Bestandstype niet toegestaan: ${file.name}`);
    }

    const arrayBuffer = await file.arrayBuffer();
    attachments.push({
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
      contentBase64: Buffer.from(arrayBuffer).toString("base64"),
    });
  }

  return attachments;
}
