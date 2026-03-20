"use server";

import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import {
  CommunicationFormSchema,
  type CommunicationFormData,
} from "@/lib/validations/communication";
import { logger } from "@/lib/logger";
import { toFieldErrors } from "@/lib/validation-errors";
import { ZodError } from "zod";

export async function getCommunicationEntries(projectId: string, limit = 100) {
  try {
    const entries = await prisma.communicationEntry.findMany({
      where: { projectId },
      orderBy: { occurredAt: "desc" },
      take: limit,
      include: {
        author: {
          select: { id: true, name: true },
        },
      },
    });

    return { success: true, entries };
  } catch (error) {
    logger.error("Failed to fetch communication entries", error, { projectId });
    return { success: false, error: "Failed to fetch communication entries" };
  }
}

export async function createCommunicationEntry(
  data: CommunicationFormData,
  actorUserId: string
) {
  try {
    const validated = CommunicationFormSchema.parse(data);

    const entry = await prisma.communicationEntry.create({
      data: {
        projectId: validated.projectId,
        authorUserId: actorUserId,
        type: validated.type,
        subject: validated.subject,
        content: validated.content,
        externalSenderName: validated.externalSenderName ?? null,
        externalSenderEmail: validated.externalSenderEmail || null,
        isInternal: validated.isInternal,
        links: validated.links,
        occurredAt: new Date(validated.occurredAt),
      },
    });

    await createAuditLog({
      actorUserId,
      entityType: "CommunicationEntry",
      entityId: entry.id,
      action: "CREATE",
      metadata: {
        projectId: validated.projectId,
        type: validated.type,
        subject: validated.subject,
      },
    });

    return { success: true, entry };
  } catch (error) {
    logger.error("Failed to create communication entry", error, {
      projectId: data.projectId,
    });
    if (error instanceof ZodError) {
      const fieldErrors = toFieldErrors(error);
      return { success: false as const, error: "Validatiefout", fieldErrors };
    }
    return { success: false as const, error: "Communicatie aanmaken mislukt" };
  }
}

export async function deleteCommunicationEntry(
  id: string,
  actorUserId: string
) {
  try {
    const entry = await prisma.communicationEntry.findUnique({
      where: { id },
      include: {
        author: { select: { id: true } },
        project: {
          include: {
            owner: { select: { id: true } },
          },
        },
      },
    });

    if (!entry) {
      return { success: false, error: "Communication entry not found" };
    }

    // Check user role to allow admins to delete anything
    const actor = await prisma.user.findUnique({
      where: { id: actorUserId },
      select: { role: true },
    });

    const isAdmin = actor?.role === "ADMIN";
    const isAuthor = entry.authorUserId === actorUserId;

    if (!isAdmin && !isAuthor) {
      return {
        success: false,
        error: "You can only delete your own communication entries",
      };
    }

    await prisma.communicationEntry.delete({ where: { id } });

    await createAuditLog({
      actorUserId,
      entityType: "CommunicationEntry",
      entityId: id,
      action: "DELETE",
      metadata: {
        projectId: entry.projectId,
        subject: entry.subject,
      },
    });

    return { success: true as const };
  } catch (error) {
    logger.error("Failed to delete communication entry", error, { entryId: id });
    return { success: false, error: "Failed to delete communication entry" };
  }
}
