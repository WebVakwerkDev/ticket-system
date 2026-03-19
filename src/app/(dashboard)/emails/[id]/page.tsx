import { requireSession } from "@/lib/auth";
import { getEmail } from "@/actions/emails";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Paperclip, AlertCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { EmailStatus } from "@prisma/client";

interface Props {
  params: Promise<{ id: string }>;
}

type AttachmentMeta = { name: string; mimeType: string; size: number };

const STATUS_LABEL: Record<EmailStatus, string> = {
  SENDING: "Verzenden...",
  SENT: "Verzonden",
  FAILED: "Mislukt",
};

const STATUS_STYLE: Record<EmailStatus, string> = {
  SENDING: "bg-yellow-100 text-yellow-700",
  SENT: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
};

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function EmailDetailPage({ params }: Props) {
  await requireSession();
  const { id } = await params;

  const result = await getEmail(id);
  if (!result.success) notFound();

  const email = result.email;
  const attachments = Array.isArray(email.attachmentsMeta)
    ? (email.attachmentsMeta as AttachmentMeta[])
    : [];

  const replySubject = email.subject.startsWith("Re:")
    ? email.subject
    : `Re: ${email.subject}`;

  const replyTo = email.toAddresses[0] ?? "";

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
              Aan: {email.toAddresses.join(", ")}
              {email.ccAddresses.length > 0 && (
                <> &nbsp;·&nbsp; CC: {email.ccAddresses.join(", ")}</>
              )}
            </p>
          </div>
        </div>
        <Link
          href={`/emails/compose?to=${encodeURIComponent(replyTo)}&subject=${encodeURIComponent(replySubject)}${email.changeRequestId ? `&ticketId=${email.changeRequestId}` : ""}`}
          className="btn-secondary text-sm"
        >
          Beantwoorden
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          <div className="card p-6">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
              {email.bodyText}
            </pre>
          </div>

          {attachments.length > 0 && (
            <div className="card p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Paperclip className="h-3.5 w-3.5" />
                Bijlagen ({attachments.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {attachments.map((att, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
                  >
                    <Paperclip className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-700">{att.name}</span>
                    <span className="text-xs text-gray-400">{formatBytes(att.size)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {email.status === EmailStatus.FAILED && email.errorMessage && (
            <div className="card p-4 flex items-start gap-2 text-red-700 bg-red-50 border border-red-200">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Verzenden mislukt</p>
                <p className="mt-0.5 text-red-600">{email.errorMessage}</p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card p-4 text-xs text-gray-500 space-y-3">
            <div>
              <p className="font-medium text-gray-700 mb-0.5">Status</p>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[email.status]}`}>
                {STATUS_LABEL[email.status]}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-700 mb-0.5">Van</p>
              <p>{email.fromName ? `${email.fromName} <${email.fromEmail}>` : email.fromEmail}</p>
            </div>
            <div>
              <p className="font-medium text-gray-700 mb-0.5">Datum</p>
              <p>{formatDate(email.sentAt ?? email.createdAt)}</p>
            </div>
            {email.changeRequest && (
              <div>
                <p className="font-medium text-gray-700 mb-0.5">Ticket</p>
                <Link
                  href={`/projects/${email.changeRequest.project.slug}`}
                  className="text-blue-600 hover:underline"
                >
                  {email.changeRequest.title}
                </Link>
                <p className="text-gray-400">{email.changeRequest.project.name}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
