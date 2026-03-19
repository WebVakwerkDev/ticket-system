import { requireSession } from "@/lib/auth";
import { getEmails } from "@/actions/emails";
import Link from "next/link";
import { Plus, Mail, AlertCircle } from "lucide-react";
import { EmailStatus } from "@prisma/client";
import { formatDate } from "@/lib/utils";

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

export default async function EmailsPage() {
  await requireSession();

  const result = await getEmails();
  const emails = result.success ? result.emails : [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">E-mails</h1>
          <p className="page-subtitle">Verzonden communicatie</p>
        </div>
        <Link href="/emails/compose" className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nieuwe e-mail
        </Link>
      </div>

      {!result.success && (
        <div className="card p-4 flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {result.error}
        </div>
      )}

      {emails.length === 0 ? (
        <div className="card p-12 text-center">
          <Mail className="mx-auto h-10 w-10 text-gray-300 mb-3" />
          <p className="text-gray-500 text-sm">Nog geen e-mails verzonden</p>
          <Link href="/emails/compose" className="mt-4 btn-primary inline-flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Eerste e-mail sturen
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="px-4 py-3 font-medium text-gray-500">Aan</th>
                <th className="px-4 py-3 font-medium text-gray-500">Onderwerp</th>
                <th className="px-4 py-3 font-medium text-gray-500">Ticket</th>
                <th className="px-4 py-3 font-medium text-gray-500">Datum</th>
                <th className="px-4 py-3 font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {emails.map((email) => (
                <tr key={email.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-700">
                    {email.toAddresses.slice(0, 2).join(", ")}
                    {email.toAddresses.length > 2 && (
                      <span className="text-gray-400"> +{email.toAddresses.length - 2}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/emails/${email.id}`}
                      className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                    >
                      {email.subject}
                    </Link>
                    {Array.isArray(email.attachmentsMeta) && (email.attachmentsMeta as unknown[]).length > 0 && (
                      <span className="ml-2 text-xs text-gray-400">
                        📎 {(email.attachmentsMeta as unknown[]).length}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {email.changeRequest ? (
                      <Link
                        href={`/projects/${email.changeRequest.project.slug}`}
                        className="hover:text-blue-600 transition-colors"
                      >
                        {email.changeRequest.title}
                      </Link>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {formatDate(email.sentAt ?? email.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[email.status]}`}
                    >
                      {STATUS_LABEL[email.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
