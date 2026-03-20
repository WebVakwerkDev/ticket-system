"use server";

import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { ClientFormSchema, type ClientFormData } from "@/lib/validations/client";
import { logger } from "@/lib/logger";
import { toFieldErrors } from "@/lib/validation-errors";
import { ZodError } from "zod";

export async function getClients() {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { companyName: "asc" },
      include: {
        _count: {
          select: { projects: true },
        },
      },
    });
    return { success: true, clients };
  } catch (error) {
    logger.error("Failed to fetch clients", error);
    return { success: false, error: "Failed to fetch clients" };
  }
}

export async function getClient(id: string) {
  try {
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        projects: {
          orderBy: { updatedAt: "desc" },
          include: {
            _count: {
              select: { communicationEntries: true },
            },
          },
        },
        invoices: {
          orderBy: { issueDate: "desc" },
        },
      },
    });

    if (!client) {
      return { success: false, error: "Client not found" };
    }

    return { success: true, client };
  } catch (error) {
    logger.error("Failed to fetch client", error, { clientId: id });
    return { success: false, error: "Failed to fetch client" };
  }
}

export async function createClient(data: ClientFormData, actorUserId: string) {
  try {
    const validated = ClientFormSchema.parse(data);

    const client = await prisma.client.create({
      data: buildClientWriteData(validated),
    });

    await createAuditLog({
      actorUserId,
      entityType: "Client",
      entityId: client.id,
      action: "CREATE",
      metadata: { companyName: client.companyName },
    });

    return { success: true as const, client };
  } catch (error) {
    logger.error("Failed to create client", error);
    if (error instanceof ZodError) {
      const fieldErrors = toFieldErrors(error);
      return { success: false as const, error: "Validatiefout", fieldErrors };
    }
    return { success: false as const, error: "Klant aanmaken mislukt" };
  }
}

export async function updateClient(
  id: string,
  data: ClientFormData,
  actorUserId: string
) {
  try {
    const validated = ClientFormSchema.parse(data);

    const client = await prisma.client.update({
      where: { id },
      data: buildClientWriteData(validated),
    });

    await createAuditLog({
      actorUserId,
      entityType: "Client",
      entityId: client.id,
      action: "UPDATE",
      metadata: { companyName: client.companyName },
    });

    return { success: true as const };
  } catch (error) {
    logger.error("Failed to update client", error, { clientId: id });
    if (error instanceof ZodError) {
      const fieldErrors = toFieldErrors(error);
      return { success: false as const, error: "Validatiefout", fieldErrors };
    }
    return { success: false as const, error: "Klant bijwerken mislukt" };
  }
}

export async function deleteClient(id: string, actorUserId: string) {
  try {
    const projectCount = await prisma.projectWorkspace.count({
      where: { clientId: id },
    });

    if (projectCount > 0) {
      return {
        success: false,
        error: `Cannot delete client with ${projectCount} existing project(s). Remove or reassign all projects first.`,
      };
    }

    const client = await prisma.client.delete({
      where: { id },
    });

    await createAuditLog({
      actorUserId,
      entityType: "Client",
      entityId: id,
      action: "DELETE",
      metadata: { companyName: client.companyName },
    });

    return { success: true };
  } catch (error) {
    logger.error("Failed to delete client", error, { clientId: id });
    return { success: false, error: "Failed to delete client" };
  }
}

function buildClientWriteData(data: ClientFormData) {
  return {
    companyName: data.companyName,
    contactName: data.contactName,
    email: data.email,
    phone: data.phone ?? null,
    address: data.address ?? null,
    notes: data.notes ?? null,
    invoiceDetails: data.invoiceDetails ?? null,
  };
}
