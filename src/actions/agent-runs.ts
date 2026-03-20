"use server";

import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { AgentRunStatus } from "@prisma/client";
import { logger } from "@/lib/logger";
import { buildDeveloperBriefing } from "@/lib/briefing";

export async function getAgentRuns(projectId: string) {
  try {
    const agentRuns = await prisma.agentRun.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      include: {
        initiatedBy: {
          select: { id: true, name: true },
        },
        changeRequest: {
          select: { id: true, title: true },
        },
      },
    });

    return { success: true, agentRuns };
  } catch (error) {
    logger.error("getAgentRuns error:", error);
    return { success: false, error: "Failed to fetch agent runs" };
  }
}

export async function generateDeveloperBriefing(
  projectId: string,
  changeRequestId: string | null,
  actorUserId: string
): Promise<{
  success: boolean;
  briefing?: string;
  agentRunId?: string;
  error?: string;
}> {
  try {
    const project = await prisma.projectWorkspace.findUnique({
      where: { id: projectId },
      include: {
        client: { select: { companyName: true } },
        repositories: true,
      },
    });

    if (!project) {
      return { success: false, error: "Project not found" };
    }

    let changeRequest = null;
    if (changeRequestId) {
      changeRequest = await prisma.changeRequest.findUnique({
        where: { id: changeRequestId },
        select: {
          title: true,
          description: true,
          impact: true,
          sourceType: true,
        },
      });
    }

    const briefing = buildDeveloperBriefing(project, changeRequest);

    // Save the agent run
    const agentRun = await prisma.agentRun.create({
      data: {
        projectId,
        changeRequestId: changeRequestId ?? null,
        initiatedByUserId: actorUserId,
        promptSnapshot: briefing,
        status: AgentRunStatus.COMPLETED,
      },
    });

    await createAuditLog({
      actorUserId,
      entityType: "AgentRun",
      entityId: agentRun.id,
      action: "GENERATE_BRIEFING",
      metadata: {
        projectId,
        changeRequestId,
        projectName: project.name,
      },
    });

    return { success: true, briefing, agentRunId: agentRun.id };
  } catch (error) {
    logger.error("generateDeveloperBriefing error:", error);
    return { success: false, error: "Failed to generate developer briefing" };
  }
}

export async function saveAgentRun(data: {
  projectId: string;
  changeRequestId?: string;
  promptSnapshot: string;
  actorUserId: string;
}): Promise<{ success: boolean; agentRunId?: string; error?: string }> {
  try {
    const agentRun = await prisma.agentRun.create({
      data: {
        projectId: data.projectId,
        changeRequestId: data.changeRequestId ?? null,
        initiatedByUserId: data.actorUserId,
        promptSnapshot: data.promptSnapshot,
        status: AgentRunStatus.COMPLETED,
      },
    });

    await createAuditLog({
      actorUserId: data.actorUserId,
      entityType: "AgentRun",
      entityId: agentRun.id,
      action: "SAVE",
      metadata: {
        projectId: data.projectId,
        changeRequestId: data.changeRequestId,
      },
    });

    return { success: true, agentRunId: agentRun.id };
  } catch (error) {
    logger.error("saveAgentRun error:", error);
    return { success: false, error: "Failed to save agent run" };
  }
}
