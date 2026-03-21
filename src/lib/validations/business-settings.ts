import { z } from "zod";

function isSupportedIbanFormat(value: string) {
  const normalized = value.replace(/\s+/g, "").toUpperCase();
  if (!normalized) {
    return true;
  }

  const isDutchIban = /^NL\d{2}[A-Z]{4}\d{10}$/.test(normalized);
  const isBelgianIban = /^BE\d{14}$/.test(normalized);

  return isDutchIban || isBelgianIban;
}

function isSupportedWebsiteUrl(value: string) {
  if (!value) {
    return true;
  }

  const normalized = value.trim();
  const isFullUrl = z.string().url().safeParse(normalized).success;
  const isDomainOnly = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}(?:\/.*)?$/i.test(
    normalized,
  );

  return isFullUrl || isDomainOnly;
}

export const BusinessSettingsSchema = z.object({
  companyName: z.string().trim().min(1, "Bedrijfsnaam is verplicht"),
  address: z.string().trim().optional(),
  kvkNumber: z
    .string()
    .trim()
    .regex(/^\d{8}$/, "KVK-nummer moet 8 cijfers zijn")
    .optional()
    .or(z.literal("")),
  vatNumber: z
    .string()
    .trim()
    .regex(/^NL\d{9}B\d{2}$/, "BTW-nummer moet het formaat NL000000000B00 hebben")
    .optional()
    .or(z.literal("")),
  iban: z
    .string()
    .trim()
    .refine(
      isSupportedIbanFormat,
      "IBAN moet een geldig Nederlands (NL..) of Belgisch (BE..) rekeningnummer zijn",
    )
    .optional()
    .or(z.literal("")),
  bankName: z.string().trim().optional(),
  email: z.string().trim().email("Ongeldig e-mailadres"),
  phone: z.string().trim().optional(),
  logoUrl: z.string().trim().url("Ongeldige URL").optional().or(z.literal("")),
  websiteUrl: z
    .string()
    .trim()
    .refine(
      isSupportedWebsiteUrl,
      "Website moet een geldige URL of domeinnaam zijn, bijvoorbeeld https://webvakwerk.nl of webvakwerk.nl",
    )
    .optional()
    .or(z.literal("")),
  defaultVatRate: z.coerce.number().min(0, "BTW moet minimaal 0 zijn").max(100, "BTW mag maximaal 100 zijn"),
  paymentTermDays: z.coerce.number().int("Betaaltermijn moet een heel getal zijn").min(1, "Betaaltermijn moet minimaal 1 dag zijn").max(365, "Betaaltermijn mag maximaal 365 dagen zijn"),
  defaultQuoteValidDays: z.coerce.number().int("Offertegeldigheid moet een heel getal zijn").min(1, "Offertegeldigheid moet minimaal 1 dag zijn").max(365, "Offertegeldigheid mag maximaal 365 dagen zijn"),
  defaultPriceLabel: z.string().trim().min(1, "Prijslabel is verplicht"),
  quoteFooterText: z.string().trim().optional(),
  invoiceFooterText: z.string().trim().optional(),
  defaultTermsText: z.string().trim().optional(),
  docsRepoName: z.string().trim().optional(),
  docsRepoBranch: z.string().trim().optional(),
  docsBasePath: z.string().trim().optional(),
});

export type BusinessSettingsData = z.infer<typeof BusinessSettingsSchema>;
