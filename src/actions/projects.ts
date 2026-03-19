"use server";

import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { ProjectFormSchema, type ProjectFormData } from "@/lib/validations/project";
import { generateSlug } from "@/lib/utils";
import { CommunicationType, ProjectStatus, InvoiceStatus } from "@prisma/client";

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
          select: { id: true, name: true },
        },
        _count: {
          select: { communicationEntries: true },
        },
      },
    });

    return { success: true, projects };
  } catch (error) {
    console.error("getProjects error:", error);
    return { success: false, error: "Failed to fetch projects" };
  }
}

export async function getProject(id: string) {
  try {
    const project = await prisma.projectWorkspace.findUnique({
      where: { id },
      include: {
        client: true,
        owner: {
          select: { id: true, name: true, email: true },
        },
        repositories: true,
        communicationEntries: {
          orderBy: { occurredAt: "desc" },
          take: 10,
          include: {
            author: { select: { id: true, name: true } },
          },
        },
        invoices: {
          orderBy: { issueDate: "desc" },
        },
        _count: {
          select: { communicationEntries: true },
        },
      },
    });

    if (!project) {
      return { success: false, error: "Project not found" };
    }

    return { success: true, project };
  } catch (error) {
    console.error("getProject error:", error);
    return { success: false, error: "Failed to fetch project" };
  }
}

export async function getProjectBySlug(slug: string) {
  try {
    const project = await prisma.projectWorkspace.findUnique({
      where: { slug },
      include: {
        client: true,
        owner: {
          select: { id: true, name: true, email: true },
        },
        repositories: true,
        communicationEntries: {
          orderBy: { occurredAt: "desc" },
          take: 10,
          include: {
            author: { select: { id: true, name: true } },
          },
        },
        invoices: {
          orderBy: { issueDate: "desc" },
        },
        _count: {
          select: { communicationEntries: true },
        },
      },
    });

    if (!project) {
      return { success: false, error: "Project not found" };
    }

    return { success: true, project };
  } catch (error) {
    console.error("getProjectBySlug error:", error);
    return { success: false, error: "Failed to fetch project" };
  }
}

export async function createProject(data: ProjectFormData, actorUserId: string) {
  try {
    const validated = ProjectFormSchema.parse(data);

    // Generate a unique slug
    let slug = generateSlug(validated.name);
    const existing = await prisma.projectWorkspace.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    const project = await prisma.projectWorkspace.create({
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
        dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
        ownerUserId: validated.ownerUserId ?? null,
        tags: validated.tags,
      },
    });

    await createAuditLog({
      actorUserId,
      entityType: "Project",
      entityId: project.id,
      action: "CREATE",
      metadata: { name: project.name, slug: project.slug },
    });

    return { success: true, project };
  } catch (error) {
    console.error("createProject error:", error);
    return { success: false, error: "Failed to create project" };
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
        ...(data.dueDate !== undefined
          ? { dueDate: data.dueDate ? new Date(data.dueDate) : null }
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

    return { success: true };
  } catch (error) {
    console.error("updateProject error:", error);
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
      upcomingDeadlines,
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
            select: { id: true, name: true },
          },
        },
      }),
      prisma.projectWorkspace.findMany({
        where: {
          status: { in: [ProjectStatus.IN_PROGRESS, ProjectStatus.REVIEW] },
          repositories: { none: {} },
        },
        select: { id: true, name: true, slug: true, status: true },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
      prisma.projectWorkspace.findMany({
        where: {
          dueDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // next 14 days
          },
          status: {
            notIn: [ProjectStatus.COMPLETED, ProjectStatus.PAUSED],
          },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          dueDate: true,
          status: true,
          priority: true,
        },
        orderBy: { dueDate: "asc" },
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
        upcomingDeadlines,
      },
    };
  } catch (error) {
    console.error("getDashboardStats error:", error);
    return { success: false, error: "Failed to fetch dashboard stats" };
  }
}
