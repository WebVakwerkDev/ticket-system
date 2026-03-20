"use server";

import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { logger } from "@/lib/logger";
import { AgentRunStatus } from "@prisma/client";
import {
  getRepositoryInfo,
  checkCopilotAgent,
  createIssue,
  parseOwnerRepo,
  GitHubApiError,
} from "@/services/githubService";

// ─── Get repository info for a project ───────────────────────────────────────

export async function getProjectRepoInfo(projectId: string, repositoryId: string) {
  try {
    const repo = await prisma.projectRepository.findUnique({
      where: { id: repositoryId },
    });
    if (!repo || repo.projectId !== projectId) {
      return { success: false as const, error: "Repository not found" };
    }

    const { owner, repo: repoName } = parseOwnerRepo(repo.repoName);
    const info = await getRepositoryInfo(owner, repoName);

    return { success: true as const, info };
  } catch (error) {
    if (error instanceof GitHubApiError) {
      return { success: false as const, error: error.message, rateLimited: error.rateLimited };
    }
    logger.error("getProjectRepoInfo error:", error);
    return { success: false as const, error: "Failed to fetch repository info" };
  }
}

// ─── Check Copilot agent availability ─────────────────────────────────────────

export async function checkProjectCopilotAgent(
  projectId: string,
  repositoryId: string,
  actorUserId: string,
) {
  try {
    const repo = await prisma.projectRepository.findUnique({
      where: { id: repositoryId },
    });
    if (!repo || repo.projectId !== projectId) {
      return { success: false as const, error: "Repository not found" };
    }

    const { owner, repo: repoName } = parseOwnerRepo(repo.repoName);
    const result = await checkCopilotAgent(owner, repoName);

    await createAuditLog({
      actorUserId,
      entityType: "ProjectRepository",
      entityId: repositoryId,
      action: "COPILOT_AGENT_CHECKED",
      metadata: {
        projectId,
        repoName: repo.repoName,
        available: result.available,
      },
    });

    return { success: true as const, copilot: result };
  } catch (error) {
    if (error instanceof GitHubApiError) {
      return { success: false as const, error: error.message, rateLimited: error.rateLimited };
    }
    logger.error("checkProjectCopilotAgent error:", error);
    return { success: false as const, error: "Failed to check Copilot agent" };
  }
}

// ─── Prompt GitHub Copilot agent ──────────────────────────────────────────────

export async function promptGithubAgent(
  projectId: string,
  repositoryId: string,
  prompt: string,
  actorUserId: string,
) {
  try {
    if (!prompt.trim()) {
      return { success: false as const, error: "Prompt is verplicht" };
    }

    const [repo, project] = await Promise.all([
      prisma.projectRepository.findUnique({ where: { id: repositoryId } }),
      prisma.projectWorkspace.findUnique({
        where: { id: projectId },
        select: { name: true, techStack: true, description: true },
      }),
    ]);

    if (!repo || repo.projectId !== projectId) {
      return { success: false as const, error: "Repository niet gevonden" };
    }
    if (!project) {
      return { success: false as const, error: "Project niet gevonden" };
    }

    const { owner, repo: repoName } = parseOwnerRepo(repo.repoName);

    const bodyParts = [
      prompt.trim(),
      "",
      "---",
      `**Project:** ${project.name}`,
    ];
    if (project.techStack) {
      bodyParts.push(`**Tech Stack:** ${project.techStack}`);
    }
    if (project.description) {
      bodyParts.push(`**Context:** ${project.description}`);
    }

    const title = prompt.trim().split("\n")[0].slice(0, 100);

    const issue = await createIssue(owner, repoName, {
      title,
      body: bodyParts.join("\n"),
      assignees: ["copilot-swe-agent"],
    });

    const agentRun = await prisma.agentRun.create({
      data: {
        projectId,
        initiatedByUserId: actorUserId,
        promptSnapshot: prompt.trim(),
        status: AgentRunStatus.RUNNING,
        githubIssueUrl: issue.url,
      },
    });

    await createAuditLog({
      actorUserId,
      entityType: "AgentRun",
      entityId: agentRun.id,
      action: "GITHUB_AGENT_PROMPTED",
      metadata: { projectId, repositoryId, issueUrl: issue.url, issueNumber: issue.number },
    });

    return { success: true as const, issue, agentRunId: agentRun.id };
  } catch (error) {
    if (error instanceof GitHubApiError) {
      return { success: false as const, error: error.message, rateLimited: error.rateLimited };
    }
    logger.error("promptGithubAgent error:", error);
    return { success: false as const, error: "Agent prompt versturen mislukt" };
  }
}

// ─── Create GitHub issue from change request ──────────────────────────────────

export async function createIssueFromChangeRequest(
  projectId: string,
  changeRequestId: string,
  repositoryId: string,
  actorUserId: string,
) {
  try {
    // Load change request + project + repo in parallel
    const [changeRequest, repo, project] = await Promise.all([
      prisma.changeRequest.findUnique({ where: { id: changeRequestId } }),
      prisma.projectRepository.findUnique({ where: { id: repositoryId } }),
      prisma.projectWorkspace.findUnique({
        where: { id: projectId },
        select: { name: true, techStack: true },
      }),
    ]);

    if (!changeRequest || changeRequest.projectId !== projectId) {
      return { success: false as const, error: "Change request not found" };
    }
    if (!repo || repo.projectId !== projectId) {
      return { success: false as const, error: "Repository not found" };
    }
    if (changeRequest.githubIssueUrl) {
      return { success: false as const, error: "Issue already created for this change request" };
    }

    const { owner, repo: repoName } = parseOwnerRepo(repo.repoName);

    // Build issue body
    const sections = [
      `## Change Request`,
      changeRequest.description,
      "",
      `**Impact:** ${changeRequest.impact}`,
      `**Source:** ${changeRequest.sourceType}`,
    ];
    if (project?.techStack) {
      sections.push("", `**Tech Stack:** ${project.techStack}`);
    }
    sections.push("", `---`, `*Created from project: ${project?.name ?? projectId}*`);

    const issue = await createIssue(owner, repoName, {
      title: changeRequest.title,
      body: sections.join("\n"),
    });

    // Store issue URL on the change request
    await prisma.changeRequest.update({
      where: { id: changeRequestId },
      data: { githubIssueUrl: issue.url },
    });

    await createAuditLog({
      actorUserId,
      entityType: "ChangeRequest",
      entityId: changeRequestId,
      action: "GITHUB_ISSUE_CREATED",
      metadata: {
        projectId,
        issueNumber: issue.number,
        issueUrl: issue.url,
        repoName: repo.repoName,
      },
    });

    return { success: true as const, issue };
  } catch (error) {
    if (error instanceof GitHubApiError) {
      return { success: false as const, error: error.message, rateLimited: error.rateLimited };
    }
    logger.error("createIssueFromChangeRequest error:", error);
    return { success: false as const, error: "Failed to create GitHub issue" };
  }
}
