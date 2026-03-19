"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  Plus,
  ExternalLink,
  Trash2,
  ChevronUp,
  Github,
  RefreshCw,
  Loader2,
  GitPullRequest,
  CircleDot,
  Bot,
  AlertTriangle,
  Check,
  X,
} from "lucide-react";
import { RepositoryForm } from "@/components/repositories/repository-form";
import { BriefingGenerator } from "@/components/briefing/briefing-generator";
import { getRepositories, deleteRepository } from "@/actions/repositories";
import {
  getProjectRepoInfo,
  checkProjectCopilotAgent,
  createIssueFromChangeRequest,
} from "@/actions/github";
import { ChangeRequestStatus, ChangeRequestImpact } from "@prisma/client";
import type { GitHubRepoInfo, CopilotAgentCheck } from "@/services/githubService";

interface Repository {
  id: string;
  repoName: string;
  repoUrl: string;
  defaultBranch: string;
  issueBoardUrl: string | null;
}

interface ChangeRequest {
  id: string;
  title: string;
  status: ChangeRequestStatus;
  impact: ChangeRequestImpact;
  githubIssueUrl?: string | null;
}

interface Props {
  projectId: string;
  repositories: Repository[];
  changeRequests: ChangeRequest[];
}

export function ProjectGithubTab({
  projectId,
  repositories: initialRepos,
  changeRequests,
}: Props) {
  const { data: session } = useSession();
  const [repos, setRepos] = useState<Repository[]>(initialRepos);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // GitHub info state per repo
  const [repoInfo, setRepoInfo] = useState<Record<string, GitHubRepoInfo>>({});
  const [copilotStatus, setCopilotStatus] = useState<Record<string, CopilotAgentCheck>>({});
  const [loadingInfo, setLoadingInfo] = useState<string | null>(null);
  const [loadingCopilot, setLoadingCopilot] = useState<string | null>(null);
  const [creatingIssue, setCreatingIssue] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [issueResults, setIssueResults] = useState<
    Record<string, { number: number; url: string }>
  >({});

  async function handleRepoAdded() {
    setShowForm(false);
    const result = await getRepositories(projectId);
    if (result.success && result.repositories) {
      setRepos(result.repositories);
    }
  }

  async function handleDelete(repoId: string) {
    if (!session?.user?.id) return;
    if (!confirm("Deze repository uit het project verwijderen?")) return;
    setDeleting(repoId);
    try {
      await deleteRepository(repoId, projectId, session.user.id);
      setRepos((prev) => prev.filter((r) => r.id !== repoId));
      // Clean up cached data
      setRepoInfo((prev) => {
        const next = { ...prev };
        delete next[repoId];
        return next;
      });
      setCopilotStatus((prev) => {
        const next = { ...prev };
        delete next[repoId];
        return next;
      });
    } finally {
      setDeleting(null);
    }
  }

  async function handleCheckRepo(repoId: string) {
    setError(null);
    setLoadingInfo(repoId);
    try {
      const result = await getProjectRepoInfo(projectId, repoId);
      if (result.success && result.info) {
        setRepoInfo((prev) => ({ ...prev, [repoId]: result.info }));
      } else {
        setError(result.error ?? "Repository-informatie ophalen mislukt");
      }
    } finally {
      setLoadingInfo(null);
    }
  }

  async function handleCheckCopilot(repoId: string) {
    if (!session?.user?.id) return;
    setError(null);
    setLoadingCopilot(repoId);
    try {
      const result = await checkProjectCopilotAgent(
        projectId,
        repoId,
        session.user.id,
      );
      if (result.success && result.copilot) {
        setCopilotStatus((prev) => ({ ...prev, [repoId]: result.copilot }));
      } else {
        setError(result.error ?? "Copilot-agent controleren mislukt");
      }
    } finally {
      setLoadingCopilot(null);
    }
  }

  async function handleCreateIssue(repoId: string, crId: string) {
    if (!session?.user?.id) return;
    setError(null);
    setCreatingIssue(crId);
    try {
      const result = await createIssueFromChangeRequest(
        projectId,
        crId,
        repoId,
        session.user.id,
      );
      if (result.success && result.issue) {
        setIssueResults((prev) => ({
          ...prev,
          [crId]: { number: result.issue.number, url: result.issue.url },
        }));
      } else {
        setError(result.error ?? "Issue aanmaken mislukt");
      }
    } finally {
      setCreatingIssue(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Error banner */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Repositories */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Github className="h-4 w-4 text-gray-600" />
            Repositories ({repos.length})
          </h3>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-secondary"
          >
            {showForm ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Annuleren
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Repository toevoegen
              </>
            )}
          </button>
        </div>

        {showForm && (
          <div className="card p-5 mb-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">
              Repository koppelen
            </h4>
            <RepositoryForm projectId={projectId} onSuccess={handleRepoAdded} />
          </div>
        )}

        {repos.length > 0 ? (
          <div className="space-y-4">
            {repos.map((repo) => (
              <div key={repo.id} className="card">
                {/* Repo header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                  <div>
                    <div className="flex items-center gap-2">
                      <a
                        href={repo.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1"
                      >
                        {repo.repoName}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5 space-x-2">
                      <span>Branch: {repo.defaultBranch}</span>
                      {repo.issueBoardUrl && (
                        <>
                          <span>&middot;</span>
                          <a
                            href={repo.issueBoardUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            Issueboard
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCheckRepo(repo.id)}
                      disabled={loadingInfo === repo.id}
                      className="btn-secondary text-xs"
                      title="Controleer repository"
                    >
                      {loadingInfo === repo.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5" />
                      )}
                      Controleren
                    </button>
                    <button
                      onClick={() => handleCheckCopilot(repo.id)}
                      disabled={loadingCopilot === repo.id}
                      className="btn-secondary text-xs"
                      title="Controleer Copilot-agent"
                    >
                      {loadingCopilot === repo.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Bot className="h-3.5 w-3.5" />
                      )}
                      Copilot
                    </button>
                    <button
                      onClick={() => handleDelete(repo.id)}
                      disabled={deleting === repo.id}
                      className="text-gray-400 hover:text-red-600 transition-colors p-1"
                      title="Repository verwijderen"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Repo info panel (shown after Check) */}
                {repoInfo[repo.id] && (
                  <div className="px-5 py-3 bg-gray-50/50 border-b border-gray-50">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-gray-400 block">Zichtbaarheid</span>
                        <span className="font-medium text-gray-700">
                          {repoInfo[repo.id].visibility}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block flex items-center gap-1">
                          <CircleDot className="h-3 w-3" /> Open issues
                        </span>
                        <span className="font-medium text-gray-700">
                          {repoInfo[repo.id].openIssuesCount}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block flex items-center gap-1">
                          <GitPullRequest className="h-3 w-3" /> Open PR's
                        </span>
                        <span className="font-medium text-gray-700">
                          {repoInfo[repo.id].openPrCount}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Standaardbranch</span>
                        <span className="font-medium text-gray-700">
                          {repoInfo[repo.id].defaultBranch}
                        </span>
                      </div>
                    </div>
                    {repoInfo[repo.id].latestCommit && (
                      <div className="mt-2 text-xs text-gray-500">
                        <span className="text-gray-400">Laatste commit: </span>
                        <code className="bg-gray-100 px-1.5 py-0.5 rounded text-[11px]">
                          {repoInfo[repo.id].latestCommit!.sha}
                        </code>{" "}
                        {repoInfo[repo.id].latestCommit!.message}{" "}
                        <span className="text-gray-400">
                          door {repoInfo[repo.id].latestCommit!.author}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Copilot agent status */}
                {copilotStatus[repo.id] && (
                  <div className="px-5 py-2.5 bg-gray-50/50 border-b border-gray-50 flex items-center gap-2 text-xs">
                    <Bot className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-gray-500">Copilot coding agent:</span>
                    {copilotStatus[repo.id].available ? (
                      <span className="text-green-600 font-medium flex items-center gap-1">
                        <Check className="h-3.5 w-3.5" /> Beschikbaar
                      </span>
                    ) : (
                      <span className="text-gray-400 font-medium flex items-center gap-1">
                        <X className="h-3.5 w-3.5" /> Niet beschikbaar
                      </span>
                    )}
                  </div>
                )}

                {/* Create issue from change requests */}
                {changeRequests.length > 0 && (
                  <div className="px-5 py-3">
                    <span className="text-xs font-medium text-gray-500 block mb-2">
                      Maak GitHub-issue vanuit wijzigingsverzoek
                    </span>
                    <div className="space-y-1.5">
                      {changeRequests
                        .filter((cr) => cr.status !== "DONE")
                        .slice(0, 5)
                        .map((cr) => {
                          const existingIssue =
                            issueResults[cr.id] ?? (cr.githubIssueUrl ? { url: cr.githubIssueUrl } : null);
                          return (
                            <div
                              key={cr.id}
                              className="flex items-center justify-between text-xs py-1"
                            >
                              <span className="text-gray-700 truncate max-w-[60%]">
                                {cr.title}
                              </span>
                              {existingIssue ? (
                                <a
                                  href={existingIssue.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-green-600 hover:underline flex items-center gap-1"
                                >
                                  <Check className="h-3 w-3" />
                                  {"number" in existingIssue
                                    ? `#${existingIssue.number}`
                                    : "Issue bekijken"}
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              ) : (
                                <button
                                  onClick={() => handleCreateIssue(repo.id, cr.id)}
                                  disabled={creatingIssue === cr.id}
                                  className="btn-secondary text-xs py-0.5 px-2"
                                >
                                  {creatingIssue === cr.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Plus className="h-3 w-3" />
                                  )}
                                  Issue aanmaken
                                </button>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-sm text-gray-400 card">
            Geen repositories gekoppeld. Voeg er hierboven een toe.
          </div>
        )}
      </div>

      {/* Developer Briefing Generator */}
      <div className="card p-5">
        <BriefingGenerator
          projectId={projectId}
          changeRequests={changeRequests}
        />
      </div>
    </div>
  );
}
