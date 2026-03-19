import { requireSession } from "@/lib/auth";
import { getEmail, getTicketsForLinking } from "@/actions/emails";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EmailActions } from "./email-actions";
import { markEmailRead } from "@/actions/emails";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EmailDetailPage({ params }: Props) {
  const session = await requireSession();
  const { id } = await params;

  const [emailResult, ticketsResult] = await Promise.all([
    getEmail(id),
    getTicketsForLinking(),
  ]);

  if (!emailResult.success) notFound();
  const email = emailResult.email;

  // Mark as read (fire and forget, don't block render)
  if (!email.isRead) {
    void markEmailRead(id, true);
  }

  const tickets = ticketsResult.success ? ticketsResult.changeRequests : [];

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link href="/emails" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="page-title">{email.subject}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Van: {email.fromName ? `${email.fromName} <${email.fromEmail}>` : email.fromEmail}
              {email.toAddresses.length > 0 && (
                <> &nbsp;·&nbsp; Aan: {email.toAddresses.join(", ")}</>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Email body */}
        <div className="col-span-2">
          <div className="card p-6">
            {email.bodyHtml ? (
              <div
                className="prose prose-sm max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
              />
            ) : (
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
                {email.bodyText ?? "(Geen inhoud)"}
              </pre>
            )}
          </div>
        </div>

        {/* Sidebar: metadata + actions */}
        <div className="space-y-4">
          <EmailActions
            email={{
              id: email.id,
              folder: email.folder,
              isRead: email.isRead,
              fromEmail: email.fromEmail,
              subject: email.subject,
              changeRequestId: email.changeRequestId,
              changeRequest: email.changeRequest,
              client: email.client,
            }}
            tickets={tickets}
            currentUserId={session.user.id}
          />

          {/* Metadata */}
          <div className="card p-4 text-xs text-gray-500 space-y-2">
            <div>
              <span className="font-medium text-gray-700">Ontvangen</span>
              <p>{new Date(email.receivedAt ?? email.createdAt).toLocaleString("nl-NL")}</p>
            </div>
            {email.client && (
              <div>
                <span className="font-medium text-gray-700">Klant</span>
                <p>
                  <Link href={`/clients/${email.client.id}`} className="text-blue-600 hover:underline">
                    {email.client.companyName}
                  </Link>
                </p>
              </div>
            )}
            {email.changeRequest && (
              <div>
                <span className="font-medium text-gray-700">Ticket</span>
                <p>
                  <Link
                    href={`/projects/${email.changeRequest.project.slug}?tab=changes`}
                    className="text-blue-600 hover:underline"
                  >
                    {email.changeRequest.title}
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
