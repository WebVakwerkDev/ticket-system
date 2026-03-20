import { z } from "zod";
import { CommunicationType } from "@prisma/client";
import { optionalTrimmedString } from "@/lib/validations/shared";

export const CommunicationFormSchema = z.object({
  projectId: z.string().trim().min(1, "Project is required"),
  type: z.nativeEnum(CommunicationType),
  subject: z.string().trim().min(2, "Subject must be at least 2 characters"),
  content: z.string().trim().min(5, "Content must be at least 5 characters"),
  externalSenderName: optionalTrimmedString,
  externalSenderEmail: optionalTrimmedString.pipe(z.string().email("Invalid email address").optional()),
  isInternal: z.boolean().default(false),
  links: z.array(z.string().trim().min(1)).default([]),
  occurredAt: z.string().trim().min(1, "Date is required"),
});

export type CommunicationFormData = z.infer<typeof CommunicationFormSchema>;
