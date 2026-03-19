import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getProject } from "@/actions/projects";
import { getCommunicationEntries } from "@/actions/communication";
import { getRepositories } from "@/actions/repositories";
import { getInvoices } from "@/actions/invoices";
import { formatDate, formatCurrency } from "@/lib/utils";
import {
  ArrowLeft,
  MessageSquare,
  Github,
  Receipt,
  ExternalLink,
} from "lucide-react";
import {
  ProjectStatusBadge,
  PriorityBadge,
  InvoiceStatusBadge,
} from "@/components/projects/status-badge";
import { ProjectTabs } from "@/components/projects/project-tabs";
import { TimelineList } from "@/components/timeline/timeline-list";
import { ProjectCommunicationTab } from "./communication-tab";
import { ProjectGithubTab } from "./github-tab";
import { ProjectOverviewEditor } from "@/components/projects/project-overview-editor";
import { ProjectLogbookQuickNote } from "@/components/projects/project-logbook-quick-note";
import { ProposalPlaceholderButton } from "@/components/ui/proposal-placeholder-button";

const TABS = [
  { id: "overview", label: "Overzicht" },
  { id: "logbook", label: "Logboek" },
  { id: "github", label: "Techniek" },
  { id: "invoices", label: "Offertes" },
  { id: "timeline", label: "Tijdlijn" },
];

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;
  const activeTab = tab ?? "overview";

  const projectResult = await getProject(id);
  if (!projectResult.success || !projectResult.project) {
    notFound();
  }

  const project = projectResult.project;

  const [commResult, reposResult, invoicesResult] = await Promise.all([
    getCommunicationEntries(id),
    getRepositories(id),
    getInvoices({ projectId: id }),
  ]);

  const communications = commResult.success ? commResult.entries ?? [] : [];
  const repositories = reposResult.success ? reposResult.repositories ?? [] : [];
  const invoices = invoicesResult.success ? invoicesResult.invoices ?? [] : [];

  let auditLogs: {
    id: string;
    action: string;
    entityType: string;
    createdAt: Date;
    actor: { id: string; name: string } | null;
    metadata: Record<string, unknown> | null;
  }[] = [];

  if (activeTab === "timeline") {
    const logs = await prisma.auditLog.findMany({
      where: { entityId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { actor: { select: { id: true, name: true } } },
    });

    auditLogs = logs.map((log) => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      createdAt: log.createdAt,
      actor: log.actor,
      metadata: log.metadataJson as Record<string, unknown> | null,
    }));
  }

  const tabs = TABS.map((t) => {
    if (t.id === "logbook") return { ...t, count: communications.length };
    if (t.id === "github") return { ...t, count: repositories.length };
    if (t.id === "invoices") return { ...t, count: invoices.length };
    return t;
  });

  return (
    <div>
      <Link
        href="/projects"
        className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Terug naar projecten
      </Link>

      <div className="card mb-6 p-6">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
              <ProjectStatusBadge status={project.status} />
              <PriorityBadge priority={project.priority} />
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
              <Link
                href={`/clients/${project.client.id}`}
                className="font-medium hover:text-blue-600"
              >
                {project.client.companyName}
              </Link>
              {project.owner && (
                <>
                  <span>&middot;</span>
                  <span>Eigenaar: {project.owner.name}</span>
                </>
              )}
              {project.dueDate && (
                <>
                  <span>&middot;</span>
                  <span>Deadline: {formatDate(project.dueDate)}</span>
                </>
              )}
            </div>
          </div>

          <ProposalPlaceholderButton />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-4 border-t border-gray-100 pt-5">
          <div className="flex items-center gap-2 text-sm">
            <MessageSquare className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">
              {communications.length} logitem{communications.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Github className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">
              {repositories.length} repo{repositories.length !== 1 ? "'s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Receipt className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">
              {invoices.length} offerte/factuur-item{invoices.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      <ProjectTabs projectId={id} activeTab={activeTab} tabs={tabs} />

      {activeTab === "overview" && (
        <OverviewTab
          projectId={id}
          project={project}
          communications={communications.slice(0, 8)}
        />
      )}

      {activeTab === "logbook" && (
        <ProjectCommunicationTab projectId={id} initialEntries={communications} />
      )}

      {activeTab === "github" && (
        <ProjectGithubTab projectId={id} repositories={repositories} />
      )}

      {activeTab === "invoices" && (
        <InvoicesTab invoices={invoices} />
      )}

      {activeTab === "timeline" && <TimelineList auditLogs={auditLogs} />}
    </div>
  );
}

function OverviewTab({
  projectId,
  project,
  communications,
}: {
  projectId: string;
  project: Awaited<ReturnType<typeof getProject>>["project"] & object;
  communications: {
    id: string;
    type: string;
    subject: string;
    content: string;
    occurredAt: Date;
    isInternal: boolean;
    author: { id: string; name: string };
  }[];
}) {
  if (!project) return null;

  const p = project as {
    description: string | null;
    techStack: string | null;
    domainName: string | null;
    hostingInfo: string | null;
    dueDate: Date | null;
    startDate: Date | null;
    repositories: {
      id: string;
      repoName: string;
      repoUrl: string;
      defaultBranch: string;
    }[];
  };

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2 space-y-5">
        <ProjectOverviewEditor
          projectId={projectId}
          initialDescription={p.description ?? ""}
        />

        <ProjectLogbookQuickNote projectId={projectId} />

        <div className="card">
          <div className="border-b border-gray-100 px-5 py-4">
            <h3 className="text-sm font-semibold text-gray-900">
              Laatste logboekitems
            </h3>
          </div>

          {communications.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {communications.map((entry) => (
                <div key={entry.id} className="px-5 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-medium text-gray-900">
                      {entry.subject}
                    </p>
                    <span className="text-xs text-gray-400">
                      {formatDate(entry.occurredAt)}
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">
                    {entry.content}
                  </p>
                  <p className="mt-2 text-xs text-gray-400">
                    {entry.isInternal ? "Interne notitie" : "Klantcontact"} ·{" "}
                    {entry.author.name}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-8 text-sm text-gray-400">
              Nog geen logboekitems. Voeg hierboven je eerste notitie toe.
            </div>
          )}
        </div>
      </div>

      <div className="space-y-5">
        <div className="card p-5">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">
            Projectinformatie
          </h3>
          <dl className="space-y-2 text-sm">
            {p.startDate && (
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-400">
                  Startdatum
                </dt>
                <dd className="text-gray-700">{formatDate(p.startDate)}</dd>
              </div>
            )}
            {p.dueDate && (
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-400">
                  Deadline
                </dt>
                <dd className="text-gray-700">{formatDate(p.dueDate)}</dd>
              </div>
            )}
            {p.techStack && (
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-400">
                  Tech stack
                </dt>
                <dd className="text-gray-700">{p.techStack}</dd>
              </div>
            )}
            {p.domainName && (
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-400">
                  Domein
                </dt>
                <dd className="text-gray-700">{p.domainName}</dd>
              </div>
            )}
            {p.hostingInfo && (
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-400">
                  Hosting
                </dt>
                <dd className="text-gray-700">{p.hostingInfo}</dd>
              </div>
            )}
          </dl>
        </div>

        {p.repositories.length > 0 && (
          <div className="card p-5">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">
              Gekoppelde repositories
            </h3>
            <div className="space-y-3">
              {p.repositories.map((repo) => (
                <div key={repo.id}>
                  <a
                    href={repo.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {repo.repoName}
                  </a>
                  <p className="text-xs text-gray-400">
                    Branch: {repo.defaultBranch}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InvoicesTab({
  invoices,
}: {
  invoices: {
    id: string;
    invoiceNumber: string;
    status: "DRAFT" | "SENT" | "PAID" | "OVERDUE";
    issueDate: Date;
    dueDate: Date;
    totalAmount: number | { toNumber: () => number };
  }[];
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Offertes en facturen</h3>
          <p className="mt-1 text-sm text-gray-500">
            De knop voor offertegeneratie wordt later aan n8n gekoppeld.
          </p>
        </div>
        <ProposalPlaceholderButton />
      </div>

      {invoices.length > 0 ? (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left">
                  <th className="px-5 py-3 font-medium text-gray-600">Nummer</th>
                  <th className="px-5 py-3 font-medium text-gray-600">Datum</th>
                  <th className="px-5 py-3 font-medium text-gray-600">Vervaldatum</th>
                  <th className="px-5 py-3 font-medium text-gray-600">Bedrag</th>
                  <th className="px-5 py-3 font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="px-5 py-3 font-medium">#{inv.invoiceNumber}</td>
                    <td className="px-5 py-3 text-gray-600">{formatDate(inv.issueDate)}</td>
                    <td className="px-5 py-3 text-gray-600">{formatDate(inv.dueDate)}</td>
                    <td className="px-5 py-3 font-medium">
                      {formatCurrency(
                        typeof inv.totalAmount === "object"
                          ? inv.totalAmount.toNumber()
                          : inv.totalAmount
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <InvoiceStatusBadge status={inv.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card px-5 py-8 text-sm text-gray-400">
          Nog geen offerte- of factuuritems gekoppeld aan dit project.
        </div>
      )}
    </div>
  );
}
