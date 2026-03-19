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
        {/* Basic info */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
            Projectgegevens
          </h2>
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
                placeholder="Website-herontwerp voor Acme"
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
            <div>
              <label htmlFor="ownerUserId" className="form-label">
                Projecteigenaar
              </label>
              <select
                id="ownerUserId"
                name="ownerUserId"
                value={form.ownerUserId}
                onChange={handleChange}
                className="form-select"
              >
                <option value="">Geen eigenaar toegewezen</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="startDate" className="form-label">
                Startdatum
              </label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                value={form.startDate}
                onChange={handleChange}
                className="form-input"
              />
            </div>
            <div>
              <label htmlFor="dueDate" className="form-label">
                Einddatum
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
              <label htmlFor="tags" className="form-label">
                Tags{" "}
                <span className="font-normal text-gray-400">
                  (kommagescheiden)
                </span>
              </label>
              <input
                id="tags"
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="form-input"
                placeholder="wordpress, woocommerce, seo"
              />
            </div>
            <div className="col-span-2">
              <label htmlFor="description" className="form-label">
                Beschrijving
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={form.description}
                onChange={handleChange}
                className="form-textarea"
                placeholder="Korte beschrijving van het project…"
              />
            </div>
          </div>
        </div>

        {/* Technical & scope */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
            Technische details &amp; scope
          </h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="intakeSummary" className="form-label">
                Intake-samenvatting
              </label>
              <textarea
                id="intakeSummary"
                name="intakeSummary"
                rows={4}
                value={form.intakeSummary}
                onChange={handleChange}
                className="form-textarea"
                placeholder="Samenvatting van het intakegesprek…"
              />
            </div>
            <div>
              <label htmlFor="scope" className="form-label">
                Scope
              </label>
              <textarea
                id="scope"
                name="scope"
                rows={4}
                value={form.scope}
                onChange={handleChange}
                className="form-textarea"
                placeholder="Wat wel en niet binnen dit project valt…"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="techStack" className="form-label">
                  Tech stack
                </label>
                <input
                  id="techStack"
                  name="techStack"
                  type="text"
                  value={form.techStack}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Next.js, Prisma, PostgreSQL"
                />
              </div>
              <div>
                <label htmlFor="domainName" className="form-label">
                  Domein
                </label>
                <input
                  id="domainName"
                  name="domainName"
                  type="text"
                  value={form.domainName}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="acme.nl"
                />
              </div>
              <div className="col-span-2">
                <label htmlFor="hostingInfo" className="form-label">
                  Hostinginformatie
                </label>
                <input
                  id="hostingInfo"
                  name="hostingInfo"
                  type="text"
                  value={form.hostingInfo}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Vercel, AWS, Cloudflare, enz."
                />
              </div>
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
