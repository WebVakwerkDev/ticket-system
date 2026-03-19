import { notFound } from "next/navigation";
import Link from "next/link";
import { getProject } from "@/actions/projects";
import { getCommunicationEntries } from "@/actions/communication";
import { getChangeRequests } from "@/actions/change-requests";
import { getRepositories } from "@/actions/repositories";
import { getInvoices } from "@/actions/invoices";
import { prisma } from "@/lib/db";
import { formatDate, formatCurrency } from "@/lib/utils";
import {
  ArrowLeft,
  MessageSquare,
  GitPullRequest,
  Github,
  Receipt,
  Clock,
  ExternalLink,
  Plus,
} from "lucide-react";
import {
  ProjectStatusBadge,
  PriorityBadge,
  InvoiceStatusBadge,
  ChangeRequestStatusBadge,
  ImpactBadge,
} from "@/components/projects/status-badge";
import { ProjectTabs } from "@/components/projects/project-tabs";
import { CommunicationList } from "@/components/communication/communication-list";
import { TimelineList } from "@/components/timeline/timeline-list";
import { ProjectCommunicationTab } from "./communication-tab";
import { ProjectChangeRequestsTab } from "./change-requests-tab";
import { ProjectGithubTab } from "./github-tab";

const TABS = [
  { id: "overview", label: "Overzicht" },
  { id: "communication", label: "Communicatie" },
  { id: "change-requests", label: "Wijzigingsverzoeken" },
  { id: "github", label: "GitHub" },
  { id: "invoices", label: "Facturen" },
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

  // Fetch tab-specific data
  const [commResult, crResult, reposResult, invoicesResult] = await Promise.all([
    getCommunicationEntries(id),
    getChangeRequests(id),
    getRepositories(id),
    getInvoices({ projectId: id }),
  ]);

  const communications = commResult.success ? commResult.entries ?? [] : [];
  const changeRequests = crResult.success ? crResult.changeRequests ?? [] : [];
  const repositories = reposResult.success ? reposResult.repositories ?? [] : [];
  const invoices = invoicesResult.success ? invoicesResult.invoices ?? [] : [];

  // For timeline tab fetch audit logs
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
      include: {
        actor: { select: { id: true, name: true } },
      },
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

  const openCRCount = changeRequests.filter(
    (cr) => !["DONE"].includes(cr.status)
  ).length;

  const tabs = TABS.map((t) => {
    if (t.id === "communication") return { ...t, count: communications.length };
    if (t.id === "change-requests") return { ...t, count: changeRequests.length };
    if (t.id === "github") return { ...t, count: repositories.length };
    if (t.id === "invoices") return { ...t, count: invoices.length };
    return t;
  });

  return (
    <div>
      {/* Back link */}
      <Link
        href="/projects"
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Terug naar projecten
      </Link>

      {/* Project Header */}
      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
              <ProjectStatusBadge status={project.status} />
              <PriorityBadge priority={project.priority} />
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500 flex-wrap">
              <Link
                href={`/clients/${project.client.id}`}
                className="hover:text-blue-600 font-medium"
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
            {project.tags && project.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {project.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-4 gap-4 mt-5 pt-5 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm">
            <MessageSquare className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">
              {communications.length} communicatie-item
              {communications.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <GitPullRequest className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">
              {changeRequests.length} WV's ({openCRCount} open)
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
              {invoices.length} factuur{invoices.length !== 1 ? "en" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <ProjectTabs projectId={id} activeTab={activeTab} tabs={tabs} />

      {/* Tab content */}
      {activeTab === "overview" && (
        <OverviewTab
          project={project}
          communications={communications.slice(0, 3)}
          changeRequests={changeRequests.filter((cr) => cr.status !== "DONE").slice(0, 5)}
        />
      )}

      {activeTab === "communication" && (
        <ProjectCommunicationTab
          projectId={id}
          initialEntries={communications}
        />
      )}

      {activeTab === "change-requests" && (
        <ProjectChangeRequestsTab
          projectId={id}
          initialChangeRequests={changeRequests}
        />
      )}

      {activeTab === "github" && (
        <ProjectGithubTab
          projectId={id}
          repositories={repositories}
          changeRequests={changeRequests}
        />
      )}

      {activeTab === "invoices" && (
        <InvoicesTab projectId={id} clientId={project.client.id} invoices={invoices} />
      )}

      {activeTab === "timeline" && <TimelineList auditLogs={auditLogs} />}
    </div>
  );
}

function OverviewTab({
  project,
  communications,
  changeRequests,
}: {
  project: Awaited<ReturnType<typeof getProject>>["project"] & object;
  communications: unknown[];
  changeRequests: unknown[];
}) {
  if (!project) return null;

  const p = project as {
    description: string | null;
    intakeSummary: string | null;
    scope: string | null;
    techStack: string | null;
    domainName: string | null;
    hostingInfo: string | null;
    startDate: Date | null;
    dueDate: Date | null;
    repositories: { id: string; repoName: string; repoUrl: string; defaultBranch: string; issueBoardUrl: string | null }[];
    communicationEntries: {
      id: string;
      type: string;
      subject: string;
      occurredAt: Date;
      author: { id: string; name: string };
    }[];
    changeRequests: {
      id: string;
      title: string;
      status: string;
      impact: string;
      createdAt: Date;
      createdBy: { id: string; name: string };
      assignedTo: { id: string; name: string } | null;
    }[];
  };

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Main content */}
      <div className="col-span-2 space-y-5">
        {p.description && (
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Beschrijving
            </h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {p.description}
            </p>
          </div>
        )}

        {p.intakeSummary && (
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Intake-samenvatting
            </h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {p.intakeSummary}
            </p>
          </div>
        )}

        {p.scope && (
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Scope</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {p.scope}
            </p>
          </div>
        )}

        {/* Recent communication */}
        {p.communicationEntries.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
              <h3 className="text-sm font-semibold text-gray-900">
                Recente communicatie
              </h3>
            </div>
            <div className="divide-y divide-gray-50">
              {p.communicationEntries.map((entry) => (
                <div key={entry.id} className="px-5 py-3">
                  <p className="text-sm font-medium text-gray-900">
                    {entry.subject}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {entry.type} &middot; {formatDate(entry.occurredAt)} &middot;{" "}
                    {entry.author.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Open change requests */}
        {p.changeRequests.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
              <h3 className="text-sm font-semibold text-gray-900">
                Open wijzigingsverzoeken
              </h3>
            </div>
            <div className="divide-y divide-gray-50">
              {p.changeRequests.map((cr) => (
                <div
                  key={cr.id}
                  className="flex items-center justify-between px-5 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {cr.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDate(cr.createdAt)}
                      {cr.assignedTo && ` · ${cr.assignedTo.name}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ImpactBadge impact={cr.impact as "SMALL" | "MEDIUM" | "LARGE"} />
                    <ChangeRequestStatusBadge
                      status={
                        cr.status as
                          | "NEW"
                          | "REVIEWED"
                          | "PLANNED"
                          | "IN_PROGRESS"
                          | "WAITING_FOR_FEEDBACK"
                          | "DONE"
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-5">
        {/* Project info */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Projectinformatie
          </h3>
          <dl className="space-y-2 text-sm">
            {p.techStack && (
              <div>
                <dt className="text-xs text-gray-400 uppercase tracking-wide">
                  Tech stack
                </dt>
                <dd className="text-gray-700">{p.techStack}</dd>
              </div>
            )}
            {p.domainName && (
              <div>
                <dt className="text-xs text-gray-400 uppercase tracking-wide">
                  Domein
                </dt>
                <dd className="text-gray-700">{p.domainName}</dd>
              </div>
            )}
            {p.hostingInfo && (
              <div>
                <dt className="text-xs text-gray-400 uppercase tracking-wide">
                  Hosting
                </dt>
                <dd className="text-gray-700">{p.hostingInfo}</dd>
              </div>
            )}
            {p.startDate && (
              <div>
                <dt className="text-xs text-gray-400 uppercase tracking-wide">
                  Startdatum
                </dt>
                <dd className="text-gray-700">{formatDate(p.startDate)}</dd>
              </div>
            )}
            {p.dueDate && (
              <div>
                <dt className="text-xs text-gray-400 uppercase tracking-wide">
                  Einddatum
                </dt>
                <dd className="text-gray-700">{formatDate(p.dueDate)}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Repositories */}
        {p.repositories.length > 0 && (
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Repositories
            </h3>
            <div className="space-y-2">
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
  projectId,
  clientId,
  invoices,
}: {
  projectId: string;
  clientId: string;
  invoices: {
    id: string;
    invoiceNumber: string;
    status: "DRAFT" | "SENT" | "PAID" | "OVERDUE";
    issueDate: Date;
    dueDate: Date;
    totalAmount: number | { toNumber: () => number };
    client?: { companyName: string };
  }[];
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Facturen</h3>
        <Link
          href={`/finance/invoices/new?projectId=${projectId}&clientId=${clientId}`}
          className="btn-primary"
        >
          <Plus className="h-4 w-4" />
          Nieuwe factuur
        </Link>
      </div>

      {invoices.length > 0 ? (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left">
                  <th className="px-5 py-3 font-medium text-gray-600">Factuur #</th>
                  <th className="px-5 py-3 font-medium text-gray-600">Factuurdatum</th>
                  <th className="px-5 py-3 font-medium text-gray-600">Vervaldatum</th>
                  <th className="px-5 py-3 font-medium text-gray-600">Bedrag</th>
                  <th className="px-5 py-3 font-medium text-gray-600">Status</th>
                  <th className="px-5 py-3 font-medium text-gray-600"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="px-5 py-3 font-medium">#{inv.invoiceNumber}</td>
                    <td className="px-5 py-3 text-gray-600">
                      {formatDate(inv.issueDate)}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {formatDate(inv.dueDate)}
                    </td>
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
                    <td className="px-5 py-3">
                      <Link
                        href={`/finance/invoices/${inv.id}`}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Bekijken
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-10 text-sm text-gray-400">
          Nog geen facturen.{" "}
          <Link
            href={`/finance/invoices/new?projectId=${projectId}&clientId=${clientId}`}
            className="text-blue-600 hover:underline"
          >
            Maak er een aan
          </Link>
        </div>
      )}
    </div>
  );
}
