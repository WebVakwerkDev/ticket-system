"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, Save } from "lucide-react";
import { updateProject } from "@/actions/projects";

interface Props {
  projectId: string;
  initialDescription: string;
}

export function ProjectOverviewEditor({
  projectId,
  initialDescription,
}: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const [description, setDescription] = useState(initialDescription);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const result = await updateProject(
        projectId,
        { description },
        session.user.id
      );

      if (!result.success) {
        setError(result.error ?? "Projectomschrijving opslaan mislukt.");
        return;
      }

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
          Wat wil de klant?
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Gebruik dit veld voor de hoofdwens, projectscope en huidige context.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={8}
        className="form-textarea"
        placeholder="Beschrijf hier wat de klant wil, wat afgesproken is en wat de huidige stand van zaken is…"
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
              <Save className="h-4 w-4" />
              Overzicht opslaan
            </>
          )}
        </button>
      </div>
    </form>
  );
}
