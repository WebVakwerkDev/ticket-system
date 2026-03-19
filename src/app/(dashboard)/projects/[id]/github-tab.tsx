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
import { getRepositories, deleteRepository } from "@/actions/repositories";
import {
  getProjectRepoInfo,
  checkProjectCopilotAgent,
} from "@/actions/github";
import type { GitHubRepoInfo, CopilotAgentCheck } from "@/services/githubService";

interface Repository {
  id: string;
  repoName: string;
  repoUrl: string;
  defaultBranch: string;
  issueBoardUrl: string | null;
}

interface Props {
  projectId: string;
  repositories: Repository[];
}

export function ProjectGithubTab({
  projectId,
  repositories: initialRepos,
}: Props) {
  const { data: session } = useSession();
  const [repos, setRepos] = useState<Repository[]>(initialRepos);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [repoInfo, setRepoInfo] = useState<Record<string, GitHubRepoInfo>>({});
  const [copilotStatus, setCopilotStatus] = useState<
    Record<string, CopilotAgentCheck>
  >({});
  const [loadingInfo, setLoadingInfo] = useState<string | null>(null);
  const [loadingCopilot, setLoadingCopilot] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      setRepos((prev) => prev.filter((repo) => repo.id !== repoId));
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
        session.user.id
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

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-semibold text-gray-900">
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
          <div className="card mb-4 p-5">
            <h4 className="mb-4 text-sm font-semibold text-gray-900">
              Repository koppelen
            </h4>
            <RepositoryForm projectId={projectId} onSuccess={handleRepoAdded} />
          </div>
        )}

        {repos.length > 0 ? (
          <div className="space-y-4">
            {repos.map((repo) => (
              <div key={repo.id} className="card">
                <div className="flex items-center justify-between border-b border-gray-50 px-5 py-4">
                  <div>
                    <a
                      href={repo.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
                    >
                      {repo.repoName}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    <div className="mt-0.5 space-x-2 text-xs text-gray-400">
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
                            Issues
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
                      className="p-1 text-gray-400 transition-colors hover:text-red-600"
                      title="Repository verwijderen"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {repoInfo[repo.id] && (
                  <div className="border-b border-gray-50 bg-gray-50/50 px-5 py-3">
                    <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                      <div>
                        <span className="block text-gray-400">Zichtbaarheid</span>
                        <span className="font-medium text-gray-700">
                          {repoInfo[repo.id].visibility}
                        </span>
                      </div>
                      <div>
                        <span className="flex items-center gap-1 text-gray-400">
                          <CircleDot className="h-3 w-3" /> Open issues
                        </span>
                        <span className="font-medium text-gray-700">
                          {repoInfo[repo.id].openIssuesCount}
                        </span>
                      </div>
                      <div>
                        <span className="flex items-center gap-1 text-gray-400">
                          <GitPullRequest className="h-3 w-3" /> Open PR&apos;s
                        </span>
                        <span className="font-medium text-gray-700">
                          {repoInfo[repo.id].openPrCount}
                        </span>
                      </div>
                      <div>
                        <span className="block text-gray-400">Standaardbranch</span>
                        <span className="font-medium text-gray-700">
                          {repoInfo[repo.id].defaultBranch}
                        </span>
                      </div>
                    </div>

                    {repoInfo[repo.id].latestCommit && (
                      <div className="mt-2 text-xs text-gray-500">
                        <span className="text-gray-400">Laatste commit: </span>
                        <code className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px]">
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

                {copilotStatus[repo.id] && (
                  <div className="flex items-center gap-2 bg-gray-50/50 px-5 py-2.5 text-xs">
                    <Bot className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-gray-500">Copilot coding agent:</span>
                    {copilotStatus[repo.id].available ? (
                      <span className="flex items-center gap-1 font-medium text-green-600">
                        <Check className="h-3.5 w-3.5" />
                        Beschikbaar
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 font-medium text-gray-400">
                        <X className="h-3.5 w-3.5" />
                        Niet beschikbaar
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="card py-8 text-center text-sm text-gray-400">
            Geen repositories gekoppeld. Voeg er hierboven een toe.
          </div>
        )}
      </div>
    </div>
  );
}
