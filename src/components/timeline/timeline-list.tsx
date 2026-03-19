import { formatDateTime } from "@/lib/utils";

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  createdAt: Date | string;
  actor: { id: string; name: string } | null;
  metadata: Record<string, unknown> | null;
}

interface Props {
  auditLogs: AuditLog[];
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-400",
  UPDATE: "bg-blue-400",
  DELETE: "bg-red-400",
  MARK_PAID: "bg-green-500",
  GENERATE_BRIEFING: "bg-purple-400",
  SAVE: "bg-gray-400",
};

function formatActionDescription(
  action: string,
  entityType: string,
  metadata: Record<string, unknown> | null
): string {
  switch (action) {
    case "CREATE":
      return `${entityType.replace(/([A-Z])/g, " $1").trim()} aangemaakt`;
    case "UPDATE":
      return `${entityType.replace(/([A-Z])/g, " $1").trim()} bijgewerkt`;
    case "DELETE":
      return `${entityType.replace(/([A-Z])/g, " $1").trim()} verwijderd`;
    case "MARK_PAID":
      return `Factuur ${String(metadata?.invoiceNumber ?? "")} als betaald gemarkeerd`;
    case "GENERATE_BRIEFING":
      return "Developer briefing gegenereerd";
    case "SAVE":
      return "Agent-run opgeslagen";
    default:
      return action.replace(/_/g, " ").toLowerCase();
  }
}

export function TimelineList({ auditLogs }: Props) {
  if (auditLogs.length === 0) {
    return (
      <div className="text-center py-10 text-sm text-gray-400">
        Nog geen tijdlijnactiviteit.
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {auditLogs.map((log, index) => {
          const isLast = index === auditLogs.length - 1;
          const dotColor = ACTION_COLORS[log.action] ?? "bg-gray-400";

          return (
            <li key={log.id}>
              <div className="relative pb-8">
                {!isLast && (
                  <span
                    className="absolute left-3 top-4 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                )}
                <div className="relative flex items-start space-x-3">
                  {/* Dot */}
                  <div className="relative">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full ring-8 ring-white ${dotColor}`}
                    >
                      <span className="h-2 w-2 rounded-full bg-white" />
                    </span>
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">
                        {log.actor?.name ?? "Systeem"}
                      </span>{" "}
                      {formatActionDescription(
                        log.action,
                        log.entityType,
                        log.metadata
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {formatDateTime(log.createdAt)}
                    </p>
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <div className="mt-1 text-xs text-gray-500 space-x-2">
                        {Object.entries(log.metadata)
                          .filter(([k]) => !["projectId", "entityId"].includes(k))
                          .slice(0, 3)
                          .map(([k, v]) => (
                            <span key={k}>
                              <span className="text-gray-400">{k}: </span>
                              {String(v)}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
