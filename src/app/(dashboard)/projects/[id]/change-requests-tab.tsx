"use client";

import { useState } from "react";
import { Plus, ChevronUp } from "lucide-react";
import { ChangeRequestForm } from "@/components/change-requests/change-request-form";
import { ChangeRequestList } from "@/components/change-requests/change-request-list";
import { getChangeRequests } from "@/actions/change-requests";
import { ChangeRequestStatus, ChangeRequestImpact } from "@prisma/client";

interface ChangeRequest {
  id: string;
  title: string;
  description: string;
  status: ChangeRequestStatus;
  impact: ChangeRequestImpact;
  sourceType: string;
  githubIssueUrl: string | null;
  githubBranch: string | null;
  githubPrUrl: string | null;
  createdAt: Date | string;
  createdBy: { id: string; name: string };
  assignedTo: { id: string; name: string } | null;
}

type FilterType = "open" | "done" | "all";

interface Props {
  projectId: string;
  initialChangeRequests: ChangeRequest[];
}

export function ProjectChangeRequestsTab({
  projectId,
  initialChangeRequests,
}: Props) {
  const [changeRequests, setChangeRequests] =
    useState<ChangeRequest[]>(initialChangeRequests);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<FilterType>("open");

  const filtered = changeRequests.filter((cr) => {
    if (filter === "open") return cr.status !== "DONE";
    if (filter === "done") return cr.status === "DONE";
    return true;
  });

  async function handleUpdate() {
    const result = await getChangeRequests(projectId);
    if (result.success && result.changeRequests) {
      setChangeRequests(result.changeRequests as ChangeRequest[]);
    }
  }

  async function handleSuccess() {
    setShowForm(false);
    await handleUpdate();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">
            Wijzigingsverzoeken ({changeRequests.length})
          </h3>
          {/* Filter */}
          <div className="flex gap-0.5 ml-3">
            {(["open", "done", "all"] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                  filter === f
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {f === "open" ? "Open" : f === "done" ? "Afgerond" : "Alle"}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
        >
          {showForm ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Annuleren
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              WV toevoegen
            </>
          )}
        </button>
      </div>

      {showForm && (
        <div className="card p-5">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">
            Nieuw wijzigingsverzoek
          </h4>
          <ChangeRequestForm projectId={projectId} onSuccess={handleSuccess} />
        </div>
      )}

      <ChangeRequestList
        changeRequests={filtered}
        projectId={projectId}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
