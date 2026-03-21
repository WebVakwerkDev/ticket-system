import { prisma } from "@/lib/db";

const SINGLETON_ID = "singleton";

export const DEFAULT_BUSINESS_SETTINGS = {
  companyName: "",
  address: null,
  kvkNumber: null,
  vatNumber: null,
  iban: null,
  bankName: null,
  email: "",
  phone: null,
  logoUrl: null,
  websiteUrl: null,
  defaultVatRate: 21,
  paymentTermDays: 30,
  defaultQuoteValidDays: 30,
  defaultPriceLabel: "Projectprijs",
  quoteFooterText: null,
  invoiceFooterText: null,
  defaultTermsText: null,
  docsRepoName: null,
  docsRepoBranch: "main",
  docsBasePath: "docs",
} as const;

export async function getResolvedBusinessSettings() {
  const settings = await prisma.businessSettings.findUnique({
    where: { id: SINGLETON_ID },
  });

  if (!settings) {
    return DEFAULT_BUSINESS_SETTINGS;
  }

  return {
    companyName: settings.companyName,
    address: settings.address,
    kvkNumber: settings.kvkNumber,
    vatNumber: settings.vatNumber,
    iban: settings.iban,
    bankName: settings.bankName,
    email: settings.email,
    phone: settings.phone,
    logoUrl: settings.logoUrl,
    websiteUrl: settings.websiteUrl,
    defaultVatRate: Number(settings.defaultVatRate),
    paymentTermDays: settings.paymentTermDays,
    defaultQuoteValidDays: settings.defaultQuoteValidDays,
    defaultPriceLabel: settings.defaultPriceLabel,
    quoteFooterText: settings.quoteFooterText,
    invoiceFooterText: settings.invoiceFooterText,
    defaultTermsText: settings.defaultTermsText,
    docsRepoName: settings.docsRepoName,
    docsRepoBranch: settings.docsRepoBranch ?? "main",
    docsBasePath: settings.docsBasePath ?? "docs",
  };
}
