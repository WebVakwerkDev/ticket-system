import { z } from "zod";
import { CommunicationType } from "@prisma/client";

const optionalTrimmedString = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  },
  z.string().optional(),
);

export const CommunicationFormSchema = z.object({
  projectId: z.string().trim().min(1, "Project is required"),
  type: z.nativeEnum(CommunicationType),
  subject: z.string().trim().min(2, "Subject must be at least 2 characters"),
  content: z.string().trim().min(5, "Content must be at least 5 characters"),
  externalSenderName: optionalTrimmedString,
  externalSenderEmail: z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;
      const trimmed = value.trim();
      return trimmed === "" ? undefined : trimmed;
    },
    z.string().email("Invalid email address").optional(),
  ),
  isInternal: z.boolean().default(false),
  links: z.array(z.string().trim().min(1)).default([]),
  occurredAt: z.string().trim().min(1, "Date is required"),
});

export type CommunicationFormData = z.infer<typeof CommunicationFormSchema>;
