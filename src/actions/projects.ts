"use server";

import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { ProjectFormSchema, type ProjectFormData } from "@/lib/validations/project";
import { generateSlug } from "@/lib/utils";
import { CommunicationType, ProjectStatus, InvoiceStatus, Prisma } from "@prisma/client";
import { logger } from "@/lib/logger";
import { revalidatePath } from "next/cache";
import { toFieldErrors } from "@/lib/validation-errors";
import {
  projectSummarySelect,
  userBasicSelect,
  userIdNameSelect,
} from "@/lib/prisma-selects";
import { ZodError } from "zod";

const projectDetailInclude = {
  client: true,
  owner: {
    select: userBasicSelect,
  },
  repositories: true,
  communicationEntries: {
    orderBy: { occurredAt: "desc" } as const,
    take: 10,
    include: {
      author: { select: userIdNameSelect },
    },
  },
  invoices: {
    orderBy: { issueDate: "desc" } as const,
  },
  _count: {
    select: { communicationEntries: true },
  },
} as const;

export async function getProjects(filters?: {
  status?: ProjectStatus;
  clientId?: string;
}) {
  try {
    const projects = await prisma.projectWorkspace.findMany({
      where: {
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.clientId ? { clientId: filters.clientId } : {}),
      },
      orderBy: { updatedAt: "desc" },
      include: {
        client: {
          select: { id: true, companyName: true },
        },
        owner: {
          select: userIdNameSelect,
        },
        _count: {
          select: { communicationEntries: true },
        },
      },
    });

    return { success: true, projects };
  } catch (error) {
    logger.error("Failed to fetch projects", error);
    return { success: false, error: "Failed to fetch projects" };
  }
}

export async function getProject(id: string) {
  try {
    const project = await prisma.projectWorkspace.findUnique({
      where: { id },
      include: projectDetailInclude,
    });

    if (!project) {
      return { success: false, error: "Project not found" };
    }

    return { success: true as const, project };
  } catch (error) {
    logger.error("Failed to fetch project", error, { projectId: id });
    return { success: false, error: "Failed to fetch project" };
  }
}

export async function getProjectBySlug(slug: string) {
  try {
    const project = await prisma.projectWorkspace.findUnique({
      where: { slug },
      include: projectDetailInclude,
    });

    if (!project) {
      return { success: false, error: "Project not found" };
    }

    return { success: true as const, project };
  } catch (error) {
    logger.error("Failed to fetch project by slug", error, { slug });
    return { success: false, error: "Failed to fetch project" };
  }
}

export async function createProject(data: ProjectFormData, actorUserId: string) {
  try {
    const validated = ProjectFormSchema.parse(data);

    const baseSlug = generateSlug(validated.name);

    const project = await (async () => {
      for (let attempt = 0; attempt < 5; attempt++) {
        const slug = attempt === 0 ? baseSlug : `${baseSlug}-${Date.now()}`;
        try {
          return await prisma.projectWorkspace.create({
            data: {
              name: validated.name,
              slug,
              clientId: validated.clientId,
              projectType: validated.projectType,
              status: validated.status,
              priority: validated.priority,
              description: validated.description ?? null,
              intakeSummary: validated.intakeSummary ?? null,
              scope: validated.scope ?? null,
              techStack: validated.techStack ?? null,
              domainName: validated.domainName ?? null,
              hostingInfo: validated.hostingInfo ?? null,
              startDate: validated.startDate ? new Date(validated.startDate) : null,
              ownerUserId: validated.ownerUserId ?? null,
              tags: validated.tags,
            },
          });
        } catch (err) {
          if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
            continue;
          }
          throw err;
        }
      }
      throw new Error("Failed to generate unique slug after 5 attempts");
    })();

    await createAuditLog({
      actorUserId,
      entityType: "Project",
      entityId: project.id,
      action: "CREATE",
      metadata: { name: project.name, slug: project.slug },
    });

    revalidatePath("/projects");
    return { success: true as const, project };
  } catch (error) {
    logger.error("Failed to create project", error);
    if (error instanceof ZodError) {
      const fieldErrors = toFieldErrors(error);
      return { success: false as const, error: "Validatiefout", fieldErrors };
    }
    return { success: false as const, error: "Project aanmaken mislukt" };
  }
}

export async function updateProject(
  id: string,
  data: Partial<ProjectFormData>,
  actorUserId: string
) {
  try {
    const existing = await prisma.projectWorkspace.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Project not found" };
    }

    const project = await prisma.projectWorkspace.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.clientId !== undefined ? { clientId: data.clientId } : {}),
        ...(data.projectType !== undefined ? { projectType: data.projectType } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.priority !== undefined ? { priority: data.priority } : {}),
        ...(data.description !== undefined ? { description: data.description ?? null } : {}),
        ...(data.intakeSummary !== undefined ? { intakeSummary: data.intakeSummary ?? null } : {}),
        ...(data.scope !== undefined ? { scope: data.scope ?? null } : {}),
        ...(data.techStack !== undefined ? { techStack: data.techStack ?? null } : {}),
        ...(data.domainName !== undefined ? { domainName: data.domainName ?? null } : {}),
        ...(data.hostingInfo !== undefined ? { hostingInfo: data.hostingInfo ?? null } : {}),
        ...(data.startDate !== undefined
          ? { startDate: data.startDate ? new Date(data.startDate) : null }
          : {}),
        ...(data.ownerUserId !== undefined ? { ownerUserId: data.ownerUserId ?? null } : {}),
        ...(data.tags !== undefined ? { tags: data.tags } : {}),
      },
    });

    // Log status changes specifically
    if (data.status && data.status !== existing.status) {
      await createAuditLog({
        actorUserId,
        entityType: "Project",
        entityId: id,
        action: "STATUS_CHANGE",
        metadata: {
          from: existing.status,
          to: data.status,
          projectName: project.name,
        },
      });
    } else {
      await createAuditLog({
        actorUserId,
        entityType: "Project",
        entityId: id,
        action: "UPDATE",
        metadata: { name: project.name },
      });
    }

    revalidatePath("/projects");
    revalidatePath(`/projects/${id}`);
    return { success: true };
  } catch (error) {
    logger.error("Failed to update project", error, { projectId: id });
    return { success: false, error: "Failed to update project" };
  }
}

export async function getDashboardStats() {
  try {
    const [
      inProgressCount,
      waitingForClientCount,
      recentLogEntries,
      overdueInvoices,
      recentActivity,
      projectsWithoutRepo,
    ] = await Promise.all([
      prisma.projectWorkspace.count({
        where: { status: ProjectStatus.IN_PROGRESS },
      }),
      prisma.projectWorkspace.count({
        where: { status: ProjectStatus.WAITING_FOR_CLIENT },
      }),
      prisma.communicationEntry.count({
        where: {
          isInternal: true,
          type: CommunicationType.INTERNAL,
          occurredAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.invoice.count({
        where: { status: InvoiceStatus.OVERDUE },
      }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          actor: {
            select: userIdNameSelect,
          },
        },
      }),
      prisma.projectWorkspace.findMany({
        where: {
          status: { in: [ProjectStatus.IN_PROGRESS, ProjectStatus.REVIEW] },
          repositories: { none: {} },
        },
        select: { ...projectSummarySelect, status: true },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
    ]);

    return {
      success: true,
      stats: {
        inProgress: inProgressCount,
        waitingForClient: waitingForClientCount,
        recentLogEntries,
        overdueInvoices,
        recentActivity,
        projectsWithoutRepo,
        upcomingDeadlines: [],
      },
    };
  } catch (error) {
    logger.error("Failed to fetch dashboard stats", error);
    return { success: false, error: "Failed to fetch dashboard stats" };
  }
}

export async function deleteProject(id: string, actorUserId: string) {
  try {
    const project = await prisma.projectWorkspace.findUnique({
      where: { id },
      select: { name: true },
    });

    if (!project) {
      return { success: false, error: "Project niet gevonden." };
    }

    await prisma.$transaction([
      prisma.invoice.updateMany({
        where: { projectId: id },
        data: { projectId: null },
      }),
      prisma.projectWorkspace.delete({ where: { id } }),
    ]);

    await createAuditLog({
      actorUserId,
      entityType: "Project",
      entityId: id,
      action: "DELETE",
      metadata: { name: project.name },
    });

    revalidatePath("/projects");
    return { success: true };
  } catch (error) {
    logger.error("Failed to delete project", error, { projectId: id });
    return { success: false, error: "Verwijderen mislukt." };
  }
}
