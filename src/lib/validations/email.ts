import { z } from "zod";

const MAX_TOTAL_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB
const MAX_ATTACHMENTS = 10;

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

export const AttachmentSchema = z.object({
  name: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().int().positive(),
  data: z.string().min(1), // base64
});

export type AttachmentInput = z.infer<typeof AttachmentSchema>;

export const SendEmailSchema = z
  .object({
    toAddresses: z
      .array(z.string().trim().email("Ongeldig e-mailadres"))
      .min(1, "Minimaal één ontvanger verplicht"),
    ccAddresses: z
      .array(z.string().trim().email("Ongeldig CC-adres"))
      .default([]),
    subject: z.string().trim().min(1, "Onderwerp is verplicht"),
    bodyText: z.string().trim().min(1, "Bericht is verplicht"),
    changeRequestId: z.string().optional(),
    attachments: z.array(AttachmentSchema).default([]),
  })
  .superRefine((data, ctx) => {
    if (data.attachments.length > MAX_ATTACHMENTS) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_big,
        maximum: MAX_ATTACHMENTS,
        type: "array",
        inclusive: true,
        message: `Maximaal ${MAX_ATTACHMENTS} bijlagen toegestaan`,
        path: ["attachments"],
      });
    }

    const totalSize = data.attachments.reduce((sum, a) => sum + a.size, 0);
    if (totalSize > MAX_TOTAL_SIZE_BYTES) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Totale bijlagegrootte mag niet meer dan 20 MB zijn",
        path: ["attachments"],
      });
    }

    for (const att of data.attachments) {
      if (!ALLOWED_MIME_TYPES.has(att.mimeType)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Bestandstype "${att.mimeType}" is niet toegestaan`,
          path: ["attachments"],
        });
      }
    }
  });

export type SendEmailInput = z.infer<typeof SendEmailSchema>;
