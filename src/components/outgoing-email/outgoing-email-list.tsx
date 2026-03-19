"use client";

import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { Reply, Paperclip } from "lucide-react";
import { OutgoingEmailStatus } from "@prisma/client";

export interface OutgoingEmailListItem {
  id: string;
  toAddresses: string[];
  ccAddresses: string[];
  subject: string;
  bodyText: string;
  status: OutgoingEmailStatus;
  providerError: string | null;
  sentAt: Date | string | null;
  createdAt: Date | string;
  sender: { id: string; name: string; email: string };
  attachments: { id: string; fileName: string; mimeType: string; fileSize: number }[];
}

interface Props {
  emails: OutgoingEmailListItem[];
  onReply: (email: OutgoingEmailListItem) => void;
}

const STATUS_VARIANTS: Record<OutgoingEmailStatus, Parameters<typeof Badge>[0]["variant"]> = {
  DRAFT: "default",
  SENT: "success",
  FAILED: "danger",
};

const STATUS_LABELS: Record<OutgoingEmailStatus, string> = {
  DRAFT: "Concept",
  SENT: "Verzonden",
  FAILED: "Mislukt",
};

export function OutgoingEmailList({ emails, onReply }: Props) {
  if (emails.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-white px-5 py-8 text-center text-sm text-gray-400">
        Nog geen verzonden e-mails voor dit ticket.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {emails.map((email) => (
        <div key={email.id} className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <Badge variant={STATUS_VARIANTS[email.status]}>
                  {STATUS_LABELS[email.status]}
                </Badge>
                <span className="text-xs text-gray-400">
                  {formatDateTime(email.sentAt ?? email.createdAt)}
                </span>
              </div>
              <h4 className="truncate text-sm font-semibold text-gray-900">{email.subject}</h4>
              <p className="mt-1 text-xs text-gray-500">
                Aan: {email.toAddresses.join(", ")}
                {email.ccAddresses.length > 0 ? ` · Cc: ${email.ccAddresses.join(", ")}` : ""}
              </p>
            </div>
            <button type="button" className="btn-secondary" onClick={() => onReply(email)}>
              <Reply className="h-4 w-4" />
              Reply
            </button>
          </div>

          <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
            {email.bodyText}
          </div>

          {email.attachments.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {email.attachments.map((attachment) => (
                <span
                  key={attachment.id}
                  className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600"
                >
                  <Paperclip className="h-3 w-3" />
                  {attachment.fileName}
                </span>
              ))}
            </div>
          )}

          {email.status === "FAILED" && email.providerError && (
            <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {email.providerError}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
