import { z } from "zod";

export const OutgoingEmailFormSchema = z.object({
  projectId: z.string().trim().min(1).optional(),
  replyToEmailId: z.string().trim().min(1).optional(),
  to: z.array(z.string().trim().email("Ongeldig e-mailadres")).min(1, "Minimaal 1 ontvanger is verplicht"),
  cc: z.array(z.string().trim().email("Ongeldig e-mailadres")).default([]),
  subject: z.string().trim().min(1, "Onderwerp is verplicht"),
  bodyText: z.string().trim().min(1, "Bericht is verplicht"),
});

export type OutgoingEmailFormData = z.infer<typeof OutgoingEmailFormSchema>;
