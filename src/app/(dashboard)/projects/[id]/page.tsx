import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getProject } from "@/actions/projects";
import { getCommunicationEntries } from "@/actions/communication";
import { getRepositories } from "@/actions/repositories";
import { getProposalDrafts } from "@/actions/proposals";
import { getInvoices } from "@/actions/invoices";
import { getN8nWebhookUrl } from "@/lib/env";
import { getResolvedBusinessSettings } from "@/lib/settings";
import { formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  MessageSquare,
  GitBranch,
  Receipt,
  ExternalLink,
} from "lucide-react";
import {
  ProjectStatusBadge,
  PriorityBadge,
} from "@/components/projects/status-badge";
import { ProjectTabs } from "@/components/projects/project-tabs";
import { TimelineList } from "@/components/timeline/timeline-list";
import { ProjectCommunicationTab } from "./communication-tab";
import { ProjectGithubTab } from "./github-tab";
import { ProjectOverviewEditor } from "@/components/projects/project-overview-editor";
import { ProjectLogbookQuickNote } from "@/components/projects/project-logbook-quick-note";
import { ProjectProposalsPanel } from "@/components/proposals/project-proposals-panel";

const TABS = [
  { id: "overview", label: "Overzicht" },
  { id: "logbook", label: "Logboek" },
  { id: "github", label: "Techniek" },
  { id: "invoices", label: "Financieel" },
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
  const n8nEnabled = Boolean(getN8nWebhookUrl());

  const [commResult, reposResult, proposalsResult, invoicesResult, businessSettings] = await Promise.all([
    getCommunicationEntries(id),
    getRepositories(id),
    getProposalDrafts(id),
    getInvoices({ projectId: id }),
    getResolvedBusinessSettings(),
  ]);

  const communications = commResult.success ? commResult.entries ?? [] : [];
  const repositories = reposResult.success ? reposResult.repositories ?? [] : [];
  const proposals = proposalsResult.success
    ? (proposalsResult.proposals ?? []).map((proposal) => ({
        id: proposal.id,
        title: proposal.title,
        summary: proposal.summary,
        amount: proposal.amount ? Number(proposal.amount) : null,
        deliveryTime: proposal.deliveryTime,
        createdAt: proposal.createdAt,
        status: proposal.status,
      }))
    : [];

  const projectInvoices = invoicesResult.success
    ? (invoicesResult.invoices ?? []).map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        description: inv.description,
        totalAmount: Number(inv.totalAmount),
        status: inv.status,
        issueDate: inv.issueDate,
        dueDate: inv.dueDate,
      }))
    : [];

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
    if (t.id === "invoices") return { ...t, count: proposals.length + projectInvoices.length };
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
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-4 border-t border-gray-100 pt-5">
          <div className="flex items-center gap-2 text-sm">
            <MessageSquare className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">
              {communications.length} logitem{communications.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <GitBranch className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">
              {repositories.length} repo{repositories.length !== 1 ? "'s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Receipt className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">
              {proposals.length} offerte{proposals.length !== 1 ? "s" : ""}{projectInvoices.length > 0 ? `, ${projectInvoices.length} factuur${projectInvoices.length !== 1 ? "en" : ""}` : ""}
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
        <ProjectCommunicationTab
          projectId={id}
          initialEntries={communications}
          client={{
            email: project.client.email,
            contactName: project.client.contactName,
          }}
        />
      )}

      {activeTab === "github" && (
        <ProjectGithubTab projectId={id} repositories={repositories} />
      )}

      {activeTab === "invoices" && (
        <ProjectProposalsPanel
          client={{
            id: project.client.id,
            companyName: project.client.companyName,
            contactName: project.client.contactName,
            email: project.client.email,
            address: project.client.address,
          }}
          project={{
            id: project.id,
            name: project.name,
            description: project.description,
            scope: project.scope,
          }}
          proposals={proposals}
          invoices={projectInvoices}
          n8nEnabled={n8nEnabled}
          defaultPriceLabel={businessSettings.defaultPriceLabel}
        />
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
