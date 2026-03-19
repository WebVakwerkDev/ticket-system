import Link from "next/link";
import { getDashboardStats } from "@/actions/projects";
import { formatDate } from "@/lib/utils";
import {
  FolderKanban,
  Clock,
  MessageSquareText,
  AlertTriangle,
  ArrowRight,
  Calendar,
  GitBranch,
} from "lucide-react";

export default async function DashboardPage() {
  const result = await getDashboardStats();

  if (!result.success || !result.stats) {
    return (
      <div className="text-red-600 text-sm">
        Dashboardgegevens konden niet worden geladen. Ververs de pagina.
      </div>
    );
  }

  const {
    inProgress,
    waitingForClient,
    recentLogEntries,
    overdueInvoices,
    recentActivity,
    projectsWithoutRepo,
    upcomingDeadlines,
  } = result.stats;

  const statCards = [
    {
      label: "In uitvoering",
      value: inProgress,
      icon: FolderKanban,
      borderColor: "border-blue-500",
      iconColor: "text-blue-500",
      bgColor: "bg-blue-50",
    },
    {
      label: "Wacht op klant",
      value: waitingForClient,
      icon: Clock,
      borderColor: "border-yellow-500",
      iconColor: "text-yellow-500",
      bgColor: "bg-yellow-50",
    },
    {
      label: "Nieuwe logboekitems",
      value: recentLogEntries,
      icon: MessageSquareText,
      borderColor: "border-purple-500",
      iconColor: "text-purple-500",
      bgColor: "bg-purple-50",
    },
    {
      label: "Achterstallige facturen",
      value: overdueInvoices,
      icon: AlertTriangle,
      borderColor: "border-red-500",
      iconColor: "text-red-500",
      bgColor: "bg-red-50",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page title */}
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          {new Date().toLocaleDateString("nl-NL", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Warning banners */}
      {(overdueInvoices > 0 || projectsWithoutRepo.length > 0) && (
        <div className="space-y-2">
          {overdueInvoices > 0 && (
            <div className="flex items-center gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>
                <strong>{overdueInvoices}</strong> achterstallige factuur
                {overdueInvoices !== 1 ? "en" : ""} vereis{overdueInvoices !== 1 ? "en" : "t"} aandacht.{" "}
                <Link href="/finance" className="font-medium underline">
                  Bekijk financiën
                </Link>
              </span>
            </div>
          )}
          {projectsWithoutRepo.length > 0 && (
            <div className="flex items-center gap-3 rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
              <GitBranch className="h-4 w-4 flex-shrink-0" />
              <span>
                <strong>{projectsWithoutRepo.length}</strong> actief project
                {projectsWithoutRepo.length !== 1 ? "en" : ""} zonder gekoppelde
                repository.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`card border-l-4 ${card.borderColor} p-5`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {card.value}
                  </p>
                </div>
                <div className={`rounded-lg ${card.bgColor} p-3`}>
                  <Icon className={`h-5 w-5 ${card.iconColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Projects without repo (needing attention) */}
        <div className="card">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h2 className="font-semibold text-gray-900">
              Projecten zonder repository
            </h2>
            <Link
              href="/projects"
              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
            >
              Alles bekijken <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {projectsWithoutRepo.length > 0 ? (
              projectsWithoutRepo.map(
                (p: { id: string; name: string; slug: string; status: string }) => (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-900">
                      {p.name}
                    </p>
                    <span className="text-xs text-gray-400 capitalize">
                      {p.status.replace(/_/g, " ").toLowerCase()}
                    </span>
                  </Link>
                )
              )
            ) : (
                <div className="px-5 py-6 text-center text-sm text-gray-400">
                Alle actieve projecten hebben een gekoppelde repository
              </div>
            )}
          </div>
        </div>

        {/* Upcoming deadlines */}
        <div className="card">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h2 className="font-semibold text-gray-900">Aankomende deadlines</h2>
            <span className="text-xs text-gray-400">Volgende 14 dagen</span>
          </div>
          <div className="divide-y divide-gray-50">
            {upcomingDeadlines.length > 0 ? (
              upcomingDeadlines.map(
                (p: {
                  id: string;
                  name: string;
                  slug: string;
                  dueDate: Date | null;
                  status: string;
                  priority: string;
                }) => {
                  const daysLeft = p.dueDate
                    ? Math.ceil(
                        (new Date(p.dueDate).getTime() - Date.now()) /
                          (1000 * 60 * 60 * 24)
                      )
                    : null;
                  return (
                    <Link
                      key={p.id}
                      href={`/projects/${p.id}`}
                      className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {p.name}
                          </p>
                          {p.dueDate && (
                            <p className="text-xs text-gray-500">
                              Deadline {formatDate(p.dueDate)}
                            </p>
                          )}
                        </div>
                      </div>
                      <span
                        className={`text-xs font-medium ${
                          daysLeft !== null && daysLeft <= 3
                            ? "text-red-600"
                            : daysLeft !== null && daysLeft <= 7
                            ? "text-yellow-600"
                            : "text-gray-500"
                        }`}
                      >
                        {daysLeft !== null
                          ? daysLeft === 0
                            ? "Vandaag"
                            : `Nog ${daysLeft} d`
                          : "—"}
                      </span>
                    </Link>
                  );
                }
              )
            ) : (
              <div className="px-5 py-6 text-center text-sm text-gray-400">
                Geen aankomende deadlines in de komende 14 dagen
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="font-semibold text-gray-900">Recent Activity</h2>
          
        </div>
        <div className="divide-y divide-gray-50">
          {recentActivity.length > 0 ? (
            recentActivity.map(
              (log) => (
                <div key={log.id} className="flex items-start gap-3 px-5 py-3">
                  <div className="mt-1.5 h-2 w-2 rounded-full bg-blue-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700">
                        <span className="font-medium">
                        {log.actor?.name ?? "Systeem"}
                      </span>{" "}
                      {formatAction(log.action, log.metadataJson as Record<string, unknown> | null)}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDate(log.createdAt)} &middot; {log.entityType}
                    </p>
                  </div>
                </div>
              )
            )
          ) : (
              <div className="px-5 py-6 text-center text-sm text-gray-400">
              Geen recente activiteit
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatAction(
  action: string,
  metadata?: Record<string, unknown> | null
): string {
  switch (action) {
    case "CREATE":
      return "heeft een item aangemaakt";
    case "UPDATE":
      return "heeft een item bijgewerkt";
    case "DELETE":
      return "heeft een item verwijderd";
    case "MARK_PAID":
      return `heeft factuur ${String(metadata?.invoiceNumber ?? "")} als betaald gemarkeerd`;
    case "GENERATE_BRIEFING":
      return "heeft een developer briefing gegenereerd";
    case "SAVE":
      return "heeft een agent-run opgeslagen";
    default:
      return action.toLowerCase().replace(/_/g, " ");
  }
}
