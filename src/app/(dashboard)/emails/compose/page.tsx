import { requireSession } from "@/lib/auth";
import { getTicketsForCompose } from "@/actions/emails";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ComposeForm } from "./compose-form";

interface Props {
  searchParams: Promise<{
    ticketId?: string;
    to?: string;
    subject?: string;
  }>;
}

export default async function ComposePage({ searchParams }: Props) {
  const session = await requireSession();
  const { ticketId, to, subject } = await searchParams;

  const ticketsResult = await getTicketsForCompose();
  const tickets = ticketsResult.success
    ? ticketsResult.changeRequests.map((cr) => ({
        id: cr.id,
        label: `${cr.project.client.companyName} · ${cr.project.name} · ${cr.title}`,
        clientEmail: cr.project.client.email,
      }))
    : [];

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link href="/emails" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="page-title">Nieuwe e-mail</h1>
            <p className="page-subtitle">Opstellen en versturen</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl">
        <div className="card p-6">
          <ComposeForm
            tickets={tickets}
            currentUserId={session.user.id}
            defaultTo={to ?? ""}
            defaultSubject={subject ?? ""}
            defaultTicketId={ticketId ?? ""}
          />
        </div>
      </div>
    </div>
  );
}
