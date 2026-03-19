"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { formatDate } from "@/lib/utils";
import {
  ChangeRequestStatusBadge,
  ImpactBadge,
} from "@/components/projects/status-badge";
import {
  updateChangeRequest,
  reopenChangeRequest,
  closeChangeRequest,
} from "@/actions/change-requests";
import { ChangeRequestStatus, ChangeRequestImpact } from "@prisma/client";
import { ChevronDown, ChevronUp, ExternalLink, RotateCcw, XCircle } from "lucide-react";

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

interface Props {
  changeRequests: ChangeRequest[];
  projectId: string;
  onUpdate?: () => void;
}

const STATUSES: { value: ChangeRequestStatus; label: string }[] = [
  { value: "NEW", label: "Nieuw" },
  { value: "REVIEWED", label: "Beoordeeld" },
  { value: "PLANNED", label: "Gepland" },
  { value: "IN_PROGRESS", label: "In uitvoering" },
  { value: "WAITING_FOR_FEEDBACK", label: "Wacht op feedback" },
  { value: "DONE", label: "Afgerond" },
];

function CRCard({
  cr,
  onUpdate,
}: {
  cr: ChangeRequest;
  onUpdate?: () => void;
}) {
  const { data: session } = useSession();
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);
  const isLong = cr.description.length > 150;
  const preview =
    isLong && !expanded ? cr.description.slice(0, 150) + "…" : cr.description;

  async function handleStatusChange(newStatus: ChangeRequestStatus) {
    if (!session?.user?.id) return;
    setUpdating(true);
    try {
      await updateChangeRequest(cr.id, { status: newStatus }, session.user.id);
      onUpdate?.();
    } finally {
      setUpdating(false);
    }
  }

  async function handleReopen() {
    if (!session?.user?.id) return;
    setUpdating(true);
    try {
      await reopenChangeRequest(cr.id, session.user.id);
      onUpdate?.();
    } finally {
      setUpdating(false);
    }
  }

  async function handleClose() {
    if (!session?.user?.id) return;
    setUpdating(true);
    try {
      await closeChangeRequest(cr.id, session.user.id);
      onUpdate?.();
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="flex items-start justify-between gap-4 mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 text-sm">{cr.title}</h4>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <ImpactBadge impact={cr.impact} />
          <ChangeRequestStatusBadge status={cr.status} />
        </div>
      </div>

      <div className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
        {preview}
      </div>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-1 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" /> Minder
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" /> Meer
            </>
          )}
        </button>
      )}

      <div className="mt-3 flex items-center justify-between">
        <div className="text-xs text-gray-400 space-x-2">
          <span>Door {cr.createdBy.name}</span>
          <span>&middot;</span>
          <span>{formatDate(cr.createdAt)}</span>
          {cr.assignedTo && (
            <>
              <span>&middot;</span>
              <span>Toegewezen: {cr.assignedTo.name}</span>
            </>
          )}
          <span>&middot;</span>
          <span className="capitalize">{cr.sourceType.replace(/_/g, " ").toLowerCase()}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* GitHub links */}
          {cr.githubIssueUrl && (
            <a
              href={cr.githubIssueUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              Issue
            </a>
          )}
          {cr.githubPrUrl && (
            <a
              href={cr.githubPrUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              PR
            </a>
          )}

          {/* Actions */}
          {cr.status !== "DONE" && (
            <select
              value={cr.status}
              onChange={(e) =>
                handleStatusChange(e.target.value as ChangeRequestStatus)
              }
              disabled={updating}
              className="text-xs border border-gray-200 rounded px-1.5 py-1 text-gray-600 focus:outline-none focus:border-blue-400"
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          )}

          {cr.status === "DONE" && (
            <button
              onClick={handleReopen}
              disabled={updating}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600"
            >
              <RotateCcw className="h-3 w-3" />
              Heropenen
            </button>
          )}

          {cr.status !== "DONE" && (
            <button
              onClick={handleClose}
              disabled={updating}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600"
            >
              <XCircle className="h-3 w-3" />
              Sluiten
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ChangeRequestList({ changeRequests, projectId, onUpdate }: Props) {
  if (changeRequests.length === 0) {
    return (
      <div className="text-center py-10 text-sm text-gray-400">
        Nog geen wijzigingsverzoeken. Voeg er hierboven een toe.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {changeRequests.map((cr) => (
        <CRCard key={cr.id} cr={cr} onUpdate={onUpdate} />
      ))}
    </div>
  );
}
