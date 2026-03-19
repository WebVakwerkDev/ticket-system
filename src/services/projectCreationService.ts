import { prisma } from "@/lib/db";
import { generateSlug } from "@/lib/utils";
import { Prisma } from "@prisma/client";
import type { ProjectCreateApiInput } from "@/lib/validations/api";

export interface ProjectCreateResult {
  client: {
    id: string;
    companyName: string;
    wasCreated: boolean;
  };
  project: {
    id: string;
    name: string;
    slug: string;
    status: string;
  };
  communication?: { id: string };
  changeRequest?: { id: string };
}

/**
 * Creates a project workspace (and optionally a client, communication entry,
 * and change request) inside a single database transaction.
 */
export async function createProjectViaApi(
  input: ProjectCreateApiInput,
  sourceMetadata: Record<string, unknown>,
): Promise<ProjectCreateResult> {
  return prisma.$transaction(async (tx) => {
    // Resolve a system actor for records that require an authorUserId.
    // Uses the first admin user as the API actor.
    const systemActor = await tx.user.findFirst({
      where: { role: "ADMIN" },
      select: { id: true },
    });
    if (!systemActor) {
      throw new ApiError(500, "No admin user found — cannot create records via API");
    }

    // ── 1. Resolve or create client ──────────────────────────────────────────

    let clientId: string;
    let clientCompanyName: string;
    let clientWasCreated = false;

    if (input.clientId) {
      // Explicit client ID provided — verify it exists
      const existing = await tx.client.findUnique({
        where: { id: input.clientId },
        select: { id: true, companyName: true },
      });
      if (!existing) {
        throw new ApiError(404, `Client not found: ${input.clientId}`);
      }
      clientId = existing.id;
      clientCompanyName = existing.companyName;
    } else if (input.client) {
      // Try duplicate detection: exact match on email or companyName
      const normalizedEmail = input.client.email.toLowerCase().trim();
      const match = await tx.client.findFirst({
        where: {
          OR: [
            { email: { equals: normalizedEmail, mode: "insensitive" } },
            { companyName: { equals: input.client.companyName, mode: "insensitive" } },
          ],
        },
        select: { id: true, companyName: true },
      });

      if (match) {
        clientId = match.id;
        clientCompanyName = match.companyName;
      } else {
        const created = await tx.client.create({
          data: {
            companyName: input.client.companyName,
            contactName: input.client.contactName,
            email: normalizedEmail,
            phone: input.client.phone ?? null,
            address: input.client.address ?? null,
            notes: input.client.notes ?? null,
            invoiceDetails: input.client.invoiceDetails ?? null,
          },
        });
        clientId = created.id;
        clientCompanyName = created.companyName;
        clientWasCreated = true;

        await createAuditEntry(tx, {
          entityType: "Client",
          entityId: created.id,
          action: "CLIENT_CREATED",
          metadata: { ...sourceMetadata, companyName: created.companyName },
        });
      }
    } else {
      // Should be caught by Zod refinement, but guard anyway
      throw new ApiError(400, "Either clientId or client object is required");
    }

    if (!clientWasCreated && !input.clientId) {
      // Existing client was reused via duplicate detection
      await createAuditEntry(tx, {
        entityType: "Client",
        entityId: clientId,
        action: "CLIENT_REUSED",
        metadata: { ...sourceMetadata, companyName: clientCompanyName },
      });
    }

    // ── 2. Create project workspace ──────────────────────────────────────────

    let slug = generateSlug(input.project.name);
    const slugConflict = await tx.projectWorkspace.findUnique({ where: { slug } });
    if (slugConflict) {
      slug = `${slug}-${Date.now()}`;
    }

    const project = await tx.projectWorkspace.create({
      data: {
        name: input.project.name,
        slug,
        clientId,
        projectType: input.project.projectType,
        status: input.project.status,
        priority: input.project.priority,
        description: input.project.description ?? null,
        intakeSummary: input.project.intakeSummary ?? null,
        scope: input.project.scope ?? null,
        techStack: input.project.techStack ?? null,
        domainName: input.project.domainName ?? null,
        hostingInfo: input.project.hostingInfo ?? null,
        startDate: input.project.startDate ? new Date(input.project.startDate) : null,
        ownerUserId: input.project.ownerUserId ?? null,
        tags: input.project.tags,
      },
    });

    await createAuditEntry(tx, {
      entityType: "ProjectWorkspace",
      entityId: project.id,
      action: "PROJECT_CREATED_VIA_API",
      metadata: { ...sourceMetadata, name: project.name, slug: project.slug, clientId },
    });

    // ── 3. Optional: initial communication entry ─────────────────────────────

    let communication: { id: string } | undefined;
    if (input.initialCommunication) {
      const comm = input.initialCommunication;
      const created = await tx.communicationEntry.create({
        data: {
          projectId: project.id,
          authorUserId: systemActor.id,
          type: comm.type,
          subject: comm.subject,
          content: comm.content,
          externalSenderName: comm.externalSenderName ?? null,
          externalSenderEmail: comm.externalSenderEmail ?? null,
          isInternal: false,
          occurredAt: comm.occurredAt ? new Date(comm.occurredAt) : new Date(),
        },
      });
      communication = { id: created.id };

      await createAuditEntry(tx, {
        entityType: "CommunicationEntry",
        entityId: created.id,
        action: "COMMUNICATION_CREATED_VIA_API",
        metadata: { ...sourceMetadata, projectId: project.id, subject: comm.subject },
      });
    }

    // ── 4. Optional: initial change request ──────────────────────────────────

    let changeRequest: { id: string } | undefined;
    if (input.initialChangeRequest) {
      const cr = input.initialChangeRequest;
      const created = await tx.changeRequest.create({
        data: {
          projectId: project.id,
          createdByUserId: systemActor.id,
          title: cr.title,
          description: cr.description,
          sourceType: cr.sourceType,
          status: cr.status,
          impact: cr.impact,
        },
      });
      changeRequest = { id: created.id };

      await createAuditEntry(tx, {
        entityType: "ChangeRequest",
        entityId: created.id,
        action: "CHANGE_REQUEST_CREATED_VIA_API",
        metadata: { ...sourceMetadata, projectId: project.id, title: cr.title },
      });
    }

    return {
      client: { id: clientId, companyName: clientCompanyName, wasCreated: clientWasCreated },
      project: { id: project.id, name: project.name, slug: project.slug, status: project.status },
      communication,
      changeRequest,
    };
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function createAuditEntry(
  tx: Prisma.TransactionClient,
  opts: {
    entityType: string;
    entityId: string;
    action: string;
    metadata: Record<string, unknown>;
  },
) {
  await tx.auditLog.create({
    data: {
      entityType: opts.entityType,
      entityId: opts.entityId,
      action: opts.action,
      metadataJson: opts.metadata as Prisma.InputJsonValue,
    },
  });
}

// ─── Custom error type for structured API errors ─────────────────────────────

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
