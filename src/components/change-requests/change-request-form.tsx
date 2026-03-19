"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { createChangeRequest } from "@/actions/change-requests";
import { getUsers } from "@/actions/users";
import { Loader2 } from "lucide-react";
import {
  ChangeRequestStatus,
  ChangeRequestImpact,
  ChangeRequestSource,
} from "@prisma/client";

const STATUSES: { value: ChangeRequestStatus; label: string }[] = [
  { value: "NEW", label: "Nieuw" },
  { value: "REVIEWED", label: "Beoordeeld" },
  { value: "PLANNED", label: "Gepland" },
  { value: "IN_PROGRESS", label: "In uitvoering" },
  { value: "WAITING_FOR_FEEDBACK", label: "Wacht op feedback" },
  { value: "DONE", label: "Afgerond" },
];

const IMPACTS: { value: ChangeRequestImpact; label: string }[] = [
  { value: "SMALL", label: "Klein" },
  { value: "MEDIUM", label: "Gemiddeld" },
  { value: "LARGE", label: "Groot" },
];

const SOURCE_TYPES: { value: ChangeRequestSource; label: string }[] = [
  { value: "EMAIL", label: "Email" },
  { value: "CALL", label: "Telefoongesprek" },
  { value: "WEBSITE_FORM", label: "Websiteformulier" },
  { value: "INTERNAL", label: "Intern" },
];

interface Props {
  projectId: string;
  onSuccess: () => void;
}

export function ChangeRequestForm({ projectId, onSuccess }: Props) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    sourceType: "EMAIL" as ChangeRequestSource,
    status: "NEW" as ChangeRequestStatus,
    impact: "MEDIUM" as ChangeRequestImpact,
    assignedToUserId: "",
    githubIssueUrl: "",
    githubBranch: "",
    githubPrUrl: "",
  });

  useEffect(() => {
    getUsers().then((r) => {
      if (r.success) setUsers(r.users ?? []);
    });
  }, []);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value } = e.target;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setForm((prev) => ({ ...prev, [name]: value as any }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.user?.id) return;
    setError(null);
    setLoading(true);

    try {
      const result = await createChangeRequest(
        {
          projectId,
          title: form.title,
          description: form.description,
          sourceType: form.sourceType,
          status: form.status,
          impact: form.impact,
          assignedToUserId: form.assignedToUserId || undefined,
          githubIssueUrl: form.githubIssueUrl || undefined,
          githubBranch: form.githubBranch || undefined,
          githubPrUrl: form.githubPrUrl || undefined,
        },
        session.user.id
      );

      if (result.success) {
        onSuccess();
      } else {
        setError(result.error ?? "Wijzigingsverzoek aanmaken mislukt.");
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

      <div>
        <label htmlFor="cr-title" className="form-label">
          Titel <span className="text-red-500">*</span>
        </label>
        <input
          id="cr-title"
          name="title"
          type="text"
          required
          value={form.title}
          onChange={handleChange}
          className="form-input"
          placeholder="Titel van wijzigingsverzoek…"
        />
      </div>

      <div>
        <label htmlFor="cr-description" className="form-label">
          Beschrijving <span className="text-red-500">*</span>
        </label>
        <textarea
          id="cr-description"
          name="description"
          rows={4}
          required
          value={form.description}
          onChange={handleChange}
          className="form-textarea"
          placeholder="Beschrijf de gevraagde wijziging in detail…"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="cr-sourceType" className="form-label">
            Bron
          </label>
          <select
            id="cr-sourceType"
            name="sourceType"
            value={form.sourceType}
            onChange={handleChange}
            className="form-select"
          >
            {SOURCE_TYPES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="cr-status" className="form-label">
            Status
          </label>
          <select
            id="cr-status"
            name="status"
            value={form.status}
            onChange={handleChange}
            className="form-select"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="cr-impact" className="form-label">
            Impact
          </label>
          <select
            id="cr-impact"
            name="impact"
            value={form.impact}
            onChange={handleChange}
            className="form-select"
          >
            {IMPACTS.map((i) => (
              <option key={i.value} value={i.value}>
                {i.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="cr-assignedTo" className="form-label">
          Toegewezen aan
        </label>
        <select
          id="cr-assignedTo"
          name="assignedToUserId"
          value={form.assignedToUserId}
          onChange={handleChange}
          className="form-select"
        >
          <option value="">Niet toegewezen</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="cr-githubIssueUrl" className="form-label">
            GitHub-issue-URL
          </label>
          <input
            id="cr-githubIssueUrl"
            name="githubIssueUrl"
            type="url"
            value={form.githubIssueUrl}
            onChange={handleChange}
            className="form-input"
            placeholder="https://github.com/..."
          />
        </div>
        <div>
          <label htmlFor="cr-githubBranch" className="form-label">
            Branch
          </label>
          <input
            id="cr-githubBranch"
            name="githubBranch"
            type="text"
            value={form.githubBranch}
            onChange={handleChange}
            className="form-input"
            placeholder="feature/..."
          />
        </div>
        <div>
          <label htmlFor="cr-githubPrUrl" className="form-label">
            PR-URL
          </label>
          <input
            id="cr-githubPrUrl"
            name="githubPrUrl"
            type="url"
            value={form.githubPrUrl}
            onChange={handleChange}
            className="form-input"
            placeholder="https://github.com/..."
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? (
            <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Bezig met opslaan…
              </>
            ) : (
            "Wijzigingsverzoek aanmaken"
          )}
        </button>
      </div>
    </form>
  );
}
