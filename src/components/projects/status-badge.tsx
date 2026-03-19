import {
  ProjectStatus,
  ChangeRequestStatus,
  InvoiceStatus,
  ProjectPriority,
  ChangeRequestImpact,
} from "@prisma/client";
import { Badge } from "@/components/ui/badge";

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const map: Record<ProjectStatus, { variant: Parameters<typeof Badge>[0]["variant"]; label: string }> = {
    LEAD: { variant: "info", label: "Lead" },
    INTAKE: { variant: "purple", label: "Intake" },
    IN_PROGRESS: { variant: "info", label: "In uitvoering" },
    WAITING_FOR_CLIENT: { variant: "warning", label: "Wacht op klant" },
    REVIEW: { variant: "purple", label: "Review" },
    COMPLETED: { variant: "success", label: "Afgerond" },
    MAINTENANCE: { variant: "default", label: "Onderhoud" },
    PAUSED: { variant: "default", label: "Gepauzeerd" },
  };

  const { variant, label } = map[status] ?? { variant: "default", label: status };
  return <Badge variant={variant}>{label}</Badge>;
}

export function ChangeRequestStatusBadge({
  status,
}: {
  status: ChangeRequestStatus;
}) {
  const map: Record<ChangeRequestStatus, { variant: Parameters<typeof Badge>[0]["variant"]; label: string }> = {
    NEW: { variant: "info", label: "Nieuw" },
    REVIEWED: { variant: "purple", label: "Beoordeeld" },
    PLANNED: { variant: "warning", label: "Gepland" },
    IN_PROGRESS: { variant: "info", label: "In uitvoering" },
    WAITING_FOR_FEEDBACK: { variant: "warning", label: "Wacht op feedback" },
    DONE: { variant: "success", label: "Afgerond" },
  };

  const { variant, label } = map[status] ?? { variant: "default", label: status };
  return <Badge variant={variant}>{label}</Badge>;
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const map: Record<InvoiceStatus, { variant: Parameters<typeof Badge>[0]["variant"]; label: string }> = {
    DRAFT: { variant: "default", label: "Concept" },
    SENT: { variant: "info", label: "Verzonden" },
    PAID: { variant: "success", label: "Betaald" },
    OVERDUE: { variant: "danger", label: "Achterstallig" },
  };

  const { variant, label } = map[status] ?? { variant: "default", label: status };
  return <Badge variant={variant}>{label}</Badge>;
}

export function PriorityBadge({ priority }: { priority: ProjectPriority }) {
  const map: Record<ProjectPriority, { variant: Parameters<typeof Badge>[0]["variant"]; label: string }> = {
    LOW: { variant: "default", label: "Laag" },
    MEDIUM: { variant: "info", label: "Gemiddeld" },
    HIGH: { variant: "warning", label: "Hoog" },
    URGENT: { variant: "danger", label: "Urgent" },
  };

  const { variant, label } = map[priority] ?? { variant: "default", label: priority };
  return <Badge variant={variant}>{label}</Badge>;
}

export function ImpactBadge({ impact }: { impact: ChangeRequestImpact }) {
  const map: Record<ChangeRequestImpact, { variant: Parameters<typeof Badge>[0]["variant"]; label: string }> = {
    SMALL: { variant: "success", label: "Klein" },
    MEDIUM: { variant: "warning", label: "Gemiddeld" },
    LARGE: { variant: "danger", label: "Groot" },
  };

  const { variant, label } = map[impact] ?? { variant: "default", label: impact };
  return <Badge variant={variant}>{label}</Badge>;
}
