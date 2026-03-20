export const userIdNameSelect = {
  id: true,
  name: true,
} as const;

export const userBasicSelect = {
  id: true,
  name: true,
  email: true,
} as const;

export const clientContactSelect = {
  id: true,
  companyName: true,
  contactName: true,
  email: true,
  address: true,
} as const;

export const clientInvoiceSelect = {
  id: true,
  companyName: true,
  contactName: true,
  email: true,
  phone: true,
  address: true,
  invoiceDetails: true,
} as const;

export const projectSummarySelect = {
  id: true,
  name: true,
  slug: true,
} as const;

export const projectProposalSelect = {
  id: true,
  name: true,
  description: true,
} as const;
