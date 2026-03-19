import Link from "next/link";
import { getProjects } from "@/actions/projects";
import { Plus } from "lucide-react";
import { ProjectStatus } from "@prisma/client";
import { formatDate } from "@/lib/utils";
import {
  ProjectStatusBadge,
  PriorityBadge,
} from "@/components/projects/status-badge";

const STATUS_TABS = [
  { label: "Alle", value: "" },
  { label: "In uitvoering", value: "IN_PROGRESS" },
  { label: "Wacht op klant", value: "WAITING_FOR_CLIENT" },
  { label: "Review", value: "REVIEW" },
  { label: "Afgerond", value: "COMPLETED" },
];

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const activeStatus = status as ProjectStatus | undefined;

  const result = await getProjects(
    activeStatus ? { status: activeStatus } : undefined
  );
  const projects = (result.success && result.projects) ? result.projects : [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Projecten</h1>
          <p className="text-sm text-gray-500 mt-1">
            {projects.length} project{projects.length !== 1 ? "en" : ""}
            {activeStatus ? ` · ${activeStatus.replace(/_/g, " ").toLowerCase()}` : ""}
          </p>
        </div>
        <Link href="/projects/new" className="btn-primary">
          <Plus className="h-4 w-4" />
          Nieuw project
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={tab.value ? `/projects?status=${tab.value}` : "/projects"}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              (tab.value === "" && !activeStatus) ||
              tab.value === activeStatus
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Project grid */}
      {projects.length > 0 ? (
        <div className="grid grid-cols-3 gap-4">
          {projects.map((project) => {
            const isOverdue =
              project.dueDate &&
              new Date(project.dueDate) < new Date() &&
              !["COMPLETED", "PAUSED"].includes(project.status);
            const daysUntilDue = project.dueDate
              ? Math.ceil(
                  (new Date(project.dueDate).getTime() - Date.now()) /
                    (1000 * 60 * 60 * 24)
                )
              : null;

            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="card p-5 hover:shadow-md transition-shadow block"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {project.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {project.client.companyName}
                    </p>
                  </div>
                  <PriorityBadge priority={project.priority} />
                </div>

                {/* Status */}
                <div className="flex items-center gap-2 mb-3">
                  <ProjectStatusBadge status={project.status} />
                </div>

                {/* Meta */}
                <div className="space-y-1.5 text-xs text-gray-500">
                  {project.owner && (
                    <div>
                      <span className="text-gray-400">Eigenaar: </span>
                      {project.owner.name}
                    </div>
                  )}
                  {project.dueDate && (
                    <div
                      className={
                        isOverdue
                          ? "text-red-600 font-medium"
                          : daysUntilDue !== null && daysUntilDue <= 7
                          ? "text-yellow-600"
                          : ""
                      }
                    >
                      <span className="text-gray-400">Deadline: </span>
                      {formatDate(project.dueDate)}
                      {isOverdue && " (achterstallig)"}
                    </div>
                  )}
                  <div className="flex items-center gap-3 pt-1">
                    <span>
                      {project._count.communicationEntries} logitems
                    </span>
                  </div>
                </div>

                {/* Tags */}
                {project.tags && project.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {project.tags.slice(0, 4).map((tag: string) => (
                      <span
                        key={tag}
                        className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                      >
                        {tag}
                      </span>
                    ))}
                    {project.tags.length > 4 && (
                      <span className="text-xs text-gray-400">
                        +{project.tags.length - 4}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-xl bg-gray-100 p-5 mb-4">
            <Plus className="h-8 w-8 text-gray-400" />
          </div>
          <p className="font-medium text-gray-600">Geen projecten gevonden</p>
          <p className="text-sm text-gray-400 mt-1">
            {activeStatus
              ? "Geen projecten met deze status"
              : "Maak je eerste project aan om te beginnen"}
          </p>
          {!activeStatus && (
            <Link href="/projects/new" className="btn-primary mt-4">
              Nieuw project
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
