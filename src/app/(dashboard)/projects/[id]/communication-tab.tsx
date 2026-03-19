"use client";

import { useState } from "react";
import { Plus, ChevronDown, ChevronUp, Mail } from "lucide-react";
import { CommunicationForm } from "@/components/communication/communication-form";
import { CommunicationList } from "@/components/communication/communication-list";
import { getCommunicationEntries } from "@/actions/communication";
import { getOutgoingEmails } from "@/actions/outgoing-emails";
import { CommunicationType, OutgoingEmailStatus } from "@prisma/client";
import { OutgoingEmailComposer } from "@/components/outgoing-email/outgoing-email-composer";
import {
  OutgoingEmailList,
  type OutgoingEmailListItem,
} from "@/components/outgoing-email/outgoing-email-list";

interface CommunicationEntry {
  id: string;
  type: CommunicationType;
  subject: string;
  content: string;
  occurredAt: Date | string;
  externalSenderName: string | null;
  externalSenderEmail: string | null;
  isInternal: boolean;
  links: string[];
  author: { id: string; name: string };
}

interface Props {
  projectId: string;
  initialEntries: CommunicationEntry[];
  initialEmails: OutgoingEmailListItem[];
  client: {
    email: string | null;
    contactName: string | null;
  };
}

export function ProjectCommunicationTab({
  projectId,
  initialEntries,
  initialEmails,
  client,
}: Props) {
  const [entries, setEntries] = useState<CommunicationEntry[]>(initialEntries);
  const [emails, setEmails] = useState<OutgoingEmailListItem[]>(initialEmails);
  const [showForm, setShowForm] = useState(false);
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [replyToEmail, setReplyToEmail] = useState<OutgoingEmailListItem | null>(null);

  async function handleSuccess() {
    setShowForm(false);
    // Refresh entries
    const result = await getCommunicationEntries(projectId);
    if (result.success && result.entries) {
      setEntries(result.entries as CommunicationEntry[]);
    }
  }

  async function handleEmailRefresh(closeComposer: boolean) {
    const result = await getOutgoingEmails(projectId);
    if (result.success && result.emails) {
      setEmails(
        result.emails.map((email) => ({
          id: email.id,
          toAddresses: email.toAddresses,
          ccAddresses: email.ccAddresses,
          subject: email.subject,
          bodyText: email.bodyText,
          status: email.status as OutgoingEmailStatus,
          providerError: email.providerError,
          sentAt: email.sentAt,
          createdAt: email.createdAt,
          sender: email.sender,
          attachments: email.attachments,
        })),
      );
    }
    if (closeComposer) {
      setShowEmailComposer(false);
      setReplyToEmail(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Projectcommunicatie</h3>
          <p className="mt-1 text-sm text-gray-500">
            Werk vanuit deze ticketcontext met logboekitems en uitgaande e-mails.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setReplyToEmail(null);
              setShowEmailComposer(!showEmailComposer);
            }}
            className="btn-secondary"
          >
            <Mail className="h-4 w-4" />
            {showEmailComposer ? "Annuleren" : "Nieuwe e-mail"}
          </button>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            {showForm ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Annuleren
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Uitgebreid logitem
              </>
            )}
          </button>
        </div>
      </div>

      {showEmailComposer && (
        <div className="card p-5">
          <h4 className="mb-4 text-sm font-semibold text-gray-900">
            {replyToEmail ? "Antwoord op e-mail" : "Nieuwe e-mail"}
          </h4>
          <OutgoingEmailComposer
            projectId={projectId}
            defaultRecipientEmail={client.email}
            defaultRecipientName={client.contactName}
            replyTo={
              replyToEmail
                ? {
                    id: replyToEmail.id,
                    subject: replyToEmail.subject,
                    toAddresses: replyToEmail.toAddresses,
                    ccAddresses: replyToEmail.ccAddresses,
                  }
                : null
            }
            onCancel={() => {
              setShowEmailComposer(false);
              setReplyToEmail(null);
            }}
            onSent={handleEmailRefresh}
          />
        </div>
      )}

      {showForm && (
        <div className="card p-5">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">
            Nieuw logboekitem
          </h4>
          <CommunicationForm projectId={projectId} onSuccess={handleSuccess} />
        </div>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Uitgaande e-mails ({emails.length})
          </h4>
        </div>
        <OutgoingEmailList
          emails={emails}
          onReply={(email) => {
            setReplyToEmail(email);
            setShowEmailComposer(true);
          }}
        />
      </section>

      <section className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Projectlogboek ({entries.length})
        </h4>
      <CommunicationList entries={entries} />
      </section>
    </div>
  );
}
