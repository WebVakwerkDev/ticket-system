import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { logger } from "@/lib/logger";

interface AuditOptions {
  actorUserId?: string;
  entityType: string;
  entityId: string;
  action: string;
  metadata?: Record<string, unknown>;
}

export async function createAuditLog(options: AuditOptions) {
  try {
    await prisma.auditLog.create({
      data: {
        actorUserId: options.actorUserId,
        entityType: options.entityType,
        entityId: options.entityId,
        action: options.action,
        metadataJson: options.metadata
          ? (options.metadata as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      },
    });
  } catch (error) {
    // Audit logging should never crash the main flow
    logger.error("Audit log failed", error, {
      entityType: options.entityType,
      entityId: options.entityId,
      action: options.action,
    });
  }
}
