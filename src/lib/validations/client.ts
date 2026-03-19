import { z } from "zod";

const trimmedRequiredString = (label: string) =>
  z.string().trim().min(2, `${label} must be at least 2 characters`);

const optionalTrimmedString = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  },
  z.string().optional(),
);

export const ClientFormSchema = z.object({
  companyName: trimmedRequiredString("Company name"),
  contactName: trimmedRequiredString("Contact name"),
  email: z.string().trim().email("Invalid email address"),
  phone: optionalTrimmedString,
  address: optionalTrimmedString,
  notes: optionalTrimmedString,
  invoiceDetails: optionalTrimmedString,
});

export type ClientFormData = z.infer<typeof ClientFormSchema>;
