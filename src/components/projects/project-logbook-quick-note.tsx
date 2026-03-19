"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, Plus } from "lucide-react";
import { createCommunicationEntry } from "@/actions/communication";

interface Props {
  projectId: string;
}

export function ProjectLogbookQuickNote({ projectId }: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const result = await createCommunicationEntry(
        {
          projectId,
          type: "INTERNAL",
          subject,
          content,
          occurredAt: new Date().toISOString(),
          externalSenderName: undefined,
          externalSenderEmail: undefined,
          isInternal: true,
          links: [],
        },
        session.user.id
      );

      if (!result.success) {
        setError(result.error ?? "Notitie opslaan mislukt.");
        return;
      }

      setSubject("");
      setContent("");
      router.refresh();
    } catch {
      setError("Er is een onverwachte fout opgetreden.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card p-5 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">
          Snelle notitie toevoegen
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Log hier kort wat je hebt gedaan, wat veranderd is of wat nog moet gebeuren.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <input
        type="text"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        className="form-input"
        placeholder="Titel van de notitie"
        required
      />

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={5}
        className="form-textarea"
        placeholder="Bijvoorbeeld: klant akkoord op homepage, header aangepast, feedback verwerkt, nog wachten op teksten…"
        required
      />

      <div className="flex items-center justify-end">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Opslaan…
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Notitie toevoegen
            </>
          )}
        </button>
      </div>
    </form>
  );
}
