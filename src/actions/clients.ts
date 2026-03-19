"use server";

import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { ClientFormSchema, type ClientFormData } from "@/lib/validations/client";

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
    console.error("getClients error:", error);
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
    console.error("getClient error:", error);
    return { success: false, error: "Failed to fetch client" };
  }
}

export async function createClient(data: ClientFormData, actorUserId: string) {
  try {
    const validated = ClientFormSchema.parse(data);

    const client = await prisma.client.create({
      data: {
        companyName: validated.companyName,
        contactName: validated.contactName,
        email: validated.email,
        phone: validated.phone ?? null,
        address: validated.address ?? null,
        vatNumber: validated.vatNumber ?? null,
        chamberOfCommerceNumber: validated.chamberOfCommerceNumber ?? null,
        notes: validated.notes ?? null,
        invoiceDetails: validated.invoiceDetails ?? null,
      },
    });

    await createAuditLog({
      actorUserId,
      entityType: "Client",
      entityId: client.id,
      action: "CREATE",
      metadata: { companyName: client.companyName },
    });

    return { success: true, client };
  } catch (error) {
    console.error("createClient error:", error);
    return { success: false, error: "Failed to create client" };
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
      data: {
        companyName: validated.companyName,
        contactName: validated.contactName,
        email: validated.email,
        phone: validated.phone ?? null,
        address: validated.address ?? null,
        vatNumber: validated.vatNumber ?? null,
        chamberOfCommerceNumber: validated.chamberOfCommerceNumber ?? null,
        notes: validated.notes ?? null,
        invoiceDetails: validated.invoiceDetails ?? null,
      },
    });

    await createAuditLog({
      actorUserId,
      entityType: "Client",
      entityId: client.id,
      action: "UPDATE",
      metadata: { companyName: client.companyName },
    });

    return { success: true };
  } catch (error) {
    console.error("updateClient error:", error);
    return { success: false, error: "Failed to update client" };
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
    console.error("deleteClient error:", error);
    return { success: false, error: "Failed to delete client" };
  }
}
