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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function getFieldError(name: string) {
    return fieldErrors[name];
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.user?.id) return;

    setLoading(true);
    setError(null);
    setFieldErrors({});

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
        if ("fieldErrors" in result && Array.isArray(result.fieldErrors)) {
          const nextFieldErrors: Record<string, string> = {};
          result.fieldErrors.forEach((fieldError) => {
            nextFieldErrors[fieldError.field] = fieldError.message;
          });
          setFieldErrors(nextFieldErrors);
        }
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
        onChange={(e) => {
          setSubject(e.target.value);
          if (fieldErrors.subject) {
            setFieldErrors((prev) => {
              const next = { ...prev };
              delete next.subject;
              return next;
            });
          }
        }}
        className={`form-input ${getFieldError("subject") ? "border-red-500 bg-red-50" : ""}`}
        placeholder="Titel van de notitie"
        required
      />
      {getFieldError("subject") && (
        <p className="text-sm text-red-600">{getFieldError("subject")}</p>
      )}

      <textarea
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          if (fieldErrors.content) {
            setFieldErrors((prev) => {
              const next = { ...prev };
              delete next.content;
              return next;
            });
          }
        }}
        rows={5}
        className={`form-textarea ${getFieldError("content") ? "border-red-500 bg-red-50" : ""}`}
        placeholder="Bijvoorbeeld: klant akkoord op homepage, header aangepast, feedback verwerkt, nog wachten op teksten…"
        required
      />
      {getFieldError("content") && (
        <p className="text-sm text-red-600">{getFieldError("content")}</p>
      )}

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
