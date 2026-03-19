"use client";

import { useState } from "react";
import { Plus, ChevronUp } from "lucide-react";
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
  client: {
    email: string | null;
    contactName: string | null;
  };
}

export function ProjectCommunicationTab({
  projectId,
  initialEntries,
  client,
}: Props) {
  const [entries, setEntries] = useState<CommunicationEntry[]>(initialEntries);
  const [showForm, setShowForm] = useState(false);

  async function handleSuccess() {
    const result = await getCommunicationEntries(projectId);
    if (result.success && result.entries) {
      setEntries(result.entries);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Projectcommunicatie</h3>
          <p className="mt-1 text-sm text-gray-500">
            Bijhouden van communicatie via verschillende kanalen (calls, meetings, e-mail, etc.)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            {showForm ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Annuleren
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Communicatie toevoegen
              </>
            )}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card p-5">
          <h4 className="mb-4 text-sm font-semibold text-gray-900">Nieuwe communicatie</h4>
          <CommunicationForm projectId={projectId} onSuccess={handleSuccess} />
        </div>
      )}

      <section className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Geschiedenis ({entries.length})
        </h4>
        <CommunicationList entries={entries} />
      </section>
    </div>
  );
}
