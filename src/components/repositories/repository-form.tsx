"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { addRepository } from "@/actions/repositories";
import { Loader2 } from "lucide-react";

interface Props {
  projectId: string;
  onSuccess: () => void;
}

export function RepositoryForm({ projectId, onSuccess }: Props) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    repoName: "",
    repoUrl: "",
    defaultBranch: "main",
    issueBoardUrl: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.user?.id) return;
    setError(null);
    setLoading(true);

    try {
      const result = await addRepository(
        projectId,
        {
          repoName: form.repoName,
          repoUrl: form.repoUrl,
          defaultBranch: form.defaultBranch,
          issueBoardUrl: form.issueBoardUrl || undefined,
        },
        session.user.id
      );

      if (result.success) {
        setForm({
          repoName: "",
          repoUrl: "",
          defaultBranch: "main",
          issueBoardUrl: "",
        });
        onSuccess();
      } else {
        setError(result.error ?? "Repository toevoegen mislukt.");
      }
    } catch {
      setError("Er is een onverwachte fout opgetreden.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="repo-name" className="form-label">
            Repositorynaam <span className="text-red-500">*</span>
          </label>
          <input
            id="repo-name"
            name="repoName"
            type="text"
            required
            value={form.repoName}
            onChange={handleChange}
            className="form-input"
            placeholder="my-project"
          />
        </div>
        <div>
          <label htmlFor="repo-branch" className="form-label">
            Standaardbranch
          </label>
          <input
            id="repo-branch"
            name="defaultBranch"
            type="text"
            value={form.defaultBranch}
            onChange={handleChange}
            className="form-input"
            placeholder="main"
          />
        </div>
        <div>
          <label htmlFor="repo-url" className="form-label">
            Repository-URL <span className="text-red-500">*</span>
          </label>
          <input
            id="repo-url"
            name="repoUrl"
            type="url"
            required
            value={form.repoUrl}
            onChange={handleChange}
            className="form-input"
            placeholder="https://github.com/org/repo"
          />
        </div>
        <div>
          <label htmlFor="repo-issue-board" className="form-label">
            Issueboard-URL
          </label>
          <input
            id="repo-issue-board"
            name="issueBoardUrl"
            type="url"
            value={form.issueBoardUrl}
            onChange={handleChange}
            className="form-input"
            placeholder="https://github.com/org/repo/issues"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Bezig met toevoegen…
            </>
          ) : (
            "Repository toevoegen"
          )}
        </button>
      </div>
    </form>
  );
}
