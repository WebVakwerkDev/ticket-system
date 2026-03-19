"use server";

import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { InvoiceFormSchema, type InvoiceFormData } from "@/lib/validations/invoice";
import { InvoiceStatus } from "@prisma/client";
import { getN8nInvoiceWebhookUrl } from "@/lib/env";
import { logger } from "@/lib/logger";
import { getResolvedBusinessSettings } from "@/lib/settings";

export async function getInvoices(filters?: {
  clientId?: string;
  projectId?: string;
  status?: InvoiceStatus;
}) {
  try {
    const invoices = await prisma.invoice.findMany({
      where: {
        ...(filters?.clientId ? { clientId: filters.clientId } : {}),
        ...(filters?.projectId ? { projectId: filters.projectId } : {}),
        ...(filters?.status ? { status: filters.status } : {}),
      },
      orderBy: { issueDate: "desc" },
      include: {
        client: {
          select: { id: true, companyName: true },
        },
        project: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return { success: true, invoices };
  } catch (error) {
    logger.error("getInvoices error:", error);
    return { success: false, error: "Failed to fetch invoices" };
  }
}

export async function getInvoice(id: string) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        project: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (!invoice) {
      return { success: false, error: "Invoice not found" };
    }

    return { success: true, invoice };
  } catch (error) {
    logger.error("getInvoice error:", error);
    return { success: false, error: "Failed to fetch invoice" };
  }
}

export async function createInvoice(data: InvoiceFormData, actorUserId: string) {
  try {
    const validated = InvoiceFormSchema.parse(data);

    const vatAmount = validated.subtotal * (validated.vatRate / 100);
    const totalAmount = validated.subtotal + vatAmount;

    const invoice = await prisma.invoice.create({
      data: {
        clientId: validated.clientId,
        projectId: validated.projectId ?? null,
        invoiceNumber: validated.invoiceNumber,
        issueDate: new Date(validated.issueDate),
        serviceDate: validated.serviceDate ? new Date(validated.serviceDate) : null,
        dueDate: new Date(validated.dueDate),
        status: validated.status,
        subtotal: validated.subtotal,
        vatRate: validated.vatRate,
        vatAmount,
        totalAmount,
        description: validated.description,
        notes: validated.notes ?? null,
      },
    });

    await createAuditLog({
      actorUserId,
      entityType: "Invoice",
      entityId: invoice.id,
      action: "CREATE",
      metadata: {
        invoiceNumber: invoice.invoiceNumber,
        clientId: validated.clientId,
        totalAmount,
      },
    });

    return { success: true, invoice };
  } catch (error) {
    logger.error("createInvoice error:", error);
    return { success: false, error: "Failed to create invoice" };
  }
}

export async function updateInvoice(
  id: string,
  data: Partial<InvoiceFormData>,
  actorUserId: string
) {
  try {
    const existing = await prisma.invoice.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Invoice not found" };
    }

    // Recalculate amounts if subtotal or vatRate changed
    let vatAmount: number | undefined;
    let totalAmount: number | undefined;

    const newSubtotal =
      data.subtotal !== undefined ? data.subtotal : Number(existing.subtotal);
    const newVatRate =
      data.vatRate !== undefined ? data.vatRate : Number(existing.vatRate);

    if (data.subtotal !== undefined || data.vatRate !== undefined) {
      vatAmount = newSubtotal * (newVatRate / 100);
      totalAmount = newSubtotal + vatAmount;
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        ...(data.clientId !== undefined ? { clientId: data.clientId } : {}),
        ...(data.projectId !== undefined ? { projectId: data.projectId ?? null } : {}),
        ...(data.invoiceNumber !== undefined
          ? { invoiceNumber: data.invoiceNumber }
          : {}),
        ...(data.issueDate !== undefined
          ? { issueDate: new Date(data.issueDate) }
          : {}),
        ...(data.dueDate !== undefined
          ? { dueDate: new Date(data.dueDate) }
          : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.subtotal !== undefined ? { subtotal: data.subtotal } : {}),
        ...(data.vatRate !== undefined ? { vatRate: data.vatRate } : {}),
        ...(vatAmount !== undefined ? { vatAmount } : {}),
        ...(totalAmount !== undefined ? { totalAmount } : {}),
        ...(data.description !== undefined
          ? { description: data.description }
          : {}),
        ...(data.notes !== undefined ? { notes: data.notes ?? null } : {}),
      },
    });

    await createAuditLog({
      actorUserId,
      entityType: "Invoice",
      entityId: id,
      action: "UPDATE",
      metadata: {
        invoiceNumber: invoice.invoiceNumber,
        ...(totalAmount !== undefined ? { totalAmount } : {}),
      },
    });

    return { success: true, invoice };
  } catch (error) {
    logger.error("updateInvoice error:", error);
    return { success: false, error: "Failed to update invoice" };
  }
}

export async function markInvoicePaid(id: string, actorUserId: string) {
  try {
    const existing = await prisma.invoice.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Invoice not found" };
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        status: InvoiceStatus.PAID,
        paidAt: new Date(),
      },
    });

    await createAuditLog({
      actorUserId,
      entityType: "Invoice",
      entityId: id,
      action: "MARK_PAID",
      metadata: {
        invoiceNumber: invoice.invoiceNumber,
        paidAt: invoice.paidAt,
      },
    });

    return { success: true, invoice };
  } catch (error) {
    logger.error("markInvoicePaid error:", error);
    return { success: false, error: "Failed to mark invoice as paid" };
  }
}

export async function sendInvoiceToN8n(invoiceId: string, actorUserId: string) {
  const webhookUrl = getN8nInvoiceWebhookUrl();
  if (!webhookUrl) {
    return { success: false, error: "N8N_WEBHOOK_INVOICE_URL is niet ingesteld." };
  }

  const [invoice, settings] = await Promise.all([
    prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        client: true,
        project: { select: { id: true, name: true } },
      },
    }),
    getResolvedBusinessSettings(),
  ]);

  if (!invoice) {
    return { success: false, error: "Factuur niet gevonden." };
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        issueDate: invoice.issueDate,
        serviceDate: invoice.serviceDate ?? invoice.issueDate,
        dueDate: invoice.dueDate,
        status: invoice.status,
        description: invoice.description,
        notes: invoice.notes,
        subtotal: Number(invoice.subtotal),
        vatRate: Number(invoice.vatRate),
        vatAmount: Number(invoice.vatAmount),
        totalAmount: Number(invoice.totalAmount),
        client: {
          id: invoice.client.id,
          companyName: invoice.client.companyName,
          contactName: invoice.client.contactName,
          email: invoice.client.email,
          address: invoice.client.address,
        },
        project: invoice.project ?? null,
        from: {
          companyName: settings.companyName,
          email: settings.email,
          address: settings.address,
          kvkNumber: settings.kvkNumber,
          vatNumber: settings.vatNumber,
          iban: settings.iban,
          bankName: settings.bankName,
          phone: settings.phone,
          websiteUrl: settings.websiteUrl,
        },
        defaults: {
          invoiceFooterText: settings.invoiceFooterText,
          termsText: settings.defaultTermsText,
          emailSignature: settings.emailSignature,
          paymentTermDays: settings.paymentTermDays,
        },
      }),
    });

    if (!res.ok) {
      return { success: false, error: `n8n webhook fout: ${res.status}` };
    }
  } catch {
    return { success: false, error: "n8n webhook niet bereikbaar." };
  }

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: InvoiceStatus.SENT },
  });

  await createAuditLog({
    actorUserId,
    entityType: "Invoice",
    entityId: invoiceId,
    action: "UPDATE",
    metadata: { status: "SENT", sentViaN8n: true },
  });

  return { success: true };
}

export async function getFinanceOverview() {
  try {
    const [paidInvoices, sentInvoices, overdueInvoices] = await Promise.all([
      prisma.invoice.findMany({
        where: { status: InvoiceStatus.PAID },
        select: { totalAmount: true, vatAmount: true, issueDate: true },
      }),
      prisma.invoice.findMany({
        where: { status: InvoiceStatus.SENT },
        select: { totalAmount: true },
      }),
      prisma.invoice.findMany({
        where: { status: InvoiceStatus.OVERDUE },
        select: { totalAmount: true },
      }),
    ]);

    const totalRevenue = paidInvoices.reduce(
      (sum, inv) => sum + Number(inv.totalAmount),
      0
    );

    const openAmount = sentInvoices.reduce(
      (sum, inv) => sum + Number(inv.totalAmount),
      0
    );

    const overdueAmount = overdueInvoices.reduce(
      (sum, inv) => sum + Number(inv.totalAmount),
      0
    );

    // Group VAT by quarter
    const vatByQuarterMap = new Map<
      string,
      { vatAmount: number; revenue: number }
    >();

    for (const inv of paidInvoices) {
      const date = new Date(inv.issueDate);
      const year = date.getFullYear();
      const quarter = Math.ceil((date.getMonth() + 1) / 3);
      const key = `${year}-Q${quarter}`;

      const existing = vatByQuarterMap.get(key) ?? { vatAmount: 0, revenue: 0 };
      vatByQuarterMap.set(key, {
        vatAmount: existing.vatAmount + Number(inv.vatAmount),
        revenue: existing.revenue + Number(inv.totalAmount),
      });
    }

    const vatByQuarter = Array.from(vatByQuarterMap.entries())
      .map(([quarter, data]) => ({ quarter, ...data }))
      .sort((a, b) => a.quarter.localeCompare(b.quarter));

    return {
      success: true,
      overview: {
        totalRevenue,
        openAmount,
        overdueAmount,
        vatByQuarter,
      },
    };
  } catch (error) {
    logger.error("getFinanceOverview error:", error);
    return { success: false, error: "Failed to fetch finance overview" };
  }
}
