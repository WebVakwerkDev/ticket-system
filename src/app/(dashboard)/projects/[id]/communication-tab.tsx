"use client";

import { useState } from "react";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import { CommunicationForm } from "@/components/communication/communication-form";
import { CommunicationList } from "@/components/communication/communication-list";
import { getCommunicationEntries } from "@/actions/communication";
import { CommunicationType } from "@prisma/client";

interface CommunicationEntry {
  id: string;
  type: CommunicationType;
  subject: string;
  content: string;
  occurredAt: Date | string;
  externalSenderName: string | null;
  externalSenderEmail: string | null;
  isInternal: boolean;
  links: string[];
  author: { id: string; name: string };
}

interface Props {
  projectId: string;
  initialEntries: CommunicationEntry[];
}

export function ProjectCommunicationTab({ projectId, initialEntries }: Props) {
  const [entries, setEntries] = useState<CommunicationEntry[]>(initialEntries);
  const [showForm, setShowForm] = useState(false);

  async function handleSuccess() {
    setShowForm(false);
    // Refresh entries
    const result = await getCommunicationEntries(projectId);
    if (result.success && result.entries) {
      setEntries(result.entries as CommunicationEntry[]);
    }
  }

  return (
    <div className="space-y-4">
      {/* Add new button */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">
          Communicatielog ({entries.length})
        </h3>
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
              Item toevoegen
            </>
          )}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-5">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">
            Nieuw communicatie-item
          </h4>
          <CommunicationForm projectId={projectId} onSuccess={handleSuccess} />
        </div>
      )}

      {/* List */}
      <CommunicationList entries={entries} />
    </div>
  );
}
