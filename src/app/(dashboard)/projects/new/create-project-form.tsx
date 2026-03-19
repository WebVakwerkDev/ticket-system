"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { createProject } from "@/actions/projects";
import { Loader2 } from "lucide-react";
import { ProjectType, ProjectStatus, ProjectPriority } from "@prisma/client";

interface Client {
  id: string;
  companyName: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface Props {
  clients: Client[];
  users: User[];
  defaultClientId?: string;
}

const PROJECT_TYPES: { value: ProjectType; label: string }[] = [
  { value: "NEW_WEBSITE", label: "Nieuwe website" },
  { value: "REDESIGN", label: "Herontwerp" },
  { value: "MAINTENANCE", label: "Onderhoud" },
  { value: "LANDING_PAGE", label: "Landingspagina" },
  { value: "WEBSHOP", label: "Webshop" },
  { value: "OTHER", label: "Overig" },
];

const PROJECT_STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: "LEAD", label: "Lead" },
  { value: "INTAKE", label: "Intake" },
  { value: "IN_PROGRESS", label: "In uitvoering" },
  { value: "WAITING_FOR_CLIENT", label: "Wacht op klant" },
  { value: "REVIEW", label: "Review" },
  { value: "COMPLETED", label: "Afgerond" },
  { value: "MAINTENANCE", label: "Onderhoud" },
  { value: "PAUSED", label: "Gepauzeerd" },
];

const PROJECT_PRIORITIES: { value: ProjectPriority; label: string }[] = [
  { value: "LOW", label: "Laag" },
  { value: "MEDIUM", label: "Gemiddeld" },
  { value: "HIGH", label: "Hoog" },
  { value: "URGENT", label: "Urgent" },
];

export function CreateProjectForm({ clients, users, defaultClientId }: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tagsInput, setTagsInput] = useState("");

  const [form, setForm] = useState({
    name: "",
    clientId: defaultClientId ?? "",
    projectType: "NEW_WEBSITE" as ProjectType,
    status: "INTAKE" as ProjectStatus,
    priority: "MEDIUM" as ProjectPriority,
    description: "",
    intakeSummary: "",
    scope: "",
    techStack: "",
    domainName: "",
    hostingInfo: "",
    startDate: "",
    dueDate: "",
    ownerUserId: "",
  });

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.user?.id) return;
    setError(null);
    setLoading(true);

    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const result = await createProject(
        {
          ...form,
          tags,
          ownerUserId: form.ownerUserId || undefined,
          startDate: form.startDate || undefined,
          dueDate: form.dueDate || undefined,
        },
        session.user.id
      );

      if (result.success && result.project) {
        router.push(`/projects/${result.project.id}`);
      } else {
        setError(result.error ?? "Project aanmaken mislukt.");
      }
    } catch {
      setError("Er is een onverwachte fout opgetreden.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6">
          <h2 className="mb-2 text-sm font-semibold text-gray-900">
            Nieuw project
          </h2>
          <p className="mb-5 text-sm text-gray-500">
            Houd het simpel: maak het project aan en werk daarna alles verder bij in het overzicht en logboek.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label htmlFor="name" className="form-label">
                Projectnaam <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={form.name}
                onChange={handleChange}
                className="form-input"
                placeholder="Nieuwe website voor Acme"
              />
            </div>

            <div>
              <label htmlFor="clientId" className="form-label">
                Klant <span className="text-red-500">*</span>
              </label>
              <select
                id="clientId"
                name="clientId"
                required
                value={form.clientId}
                onChange={handleChange}
                className="form-select"
              >
                <option value="">Selecteer een klant…</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="ownerUserId" className="form-label">
                Verantwoordelijke
              </label>
              <select
                id="ownerUserId"
                name="ownerUserId"
                value={form.ownerUserId}
                onChange={handleChange}
                className="form-select"
              >
                <option value="">Nog niemand toegewezen</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="status" className="form-label">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={form.status}
                onChange={handleChange}
                className="form-select"
              >
                {PROJECT_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="dueDate" className="form-label">
                Deadline
              </label>
              <input
                id="dueDate"
                name="dueDate"
                type="date"
                value={form.dueDate}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div className="col-span-2">
              <label htmlFor="description" className="form-label">
                Wat wil de klant?
              </label>
              <textarea
                id="description"
                name="description"
                rows={6}
                value={form.description}
                onChange={handleChange}
                className="form-textarea"
                placeholder="Beschrijf kort de wens van de klant, de afgesproken richting en wat belangrijk is voor dit project…"
              />
            </div>

            <div>
              <label htmlFor="projectType" className="form-label">
                Projecttype
              </label>
              <select
                id="projectType"
                name="projectType"
                value={form.projectType}
                onChange={handleChange}
                className="form-select"
              >
                {PROJECT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="priority" className="form-label">
                Prioriteit
              </label>
              <select
                id="priority"
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className="form-select"
              >
                {PROJECT_PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Bezig met aanmaken…
              </>
            ) : (
              "Project aanmaken"
            )}
          </button>
          <Link href="/projects" className="btn-secondary">
            Annuleren
          </Link>
        </div>
      </form>
    </>
  );
}
