"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { FileText, Plus, X, Receipt } from "lucide-react";
import { createProposalDraft, sendProposalToN8n } from "@/actions/proposals";
import { formatCurrency, formatDate } from "@/lib/utils";
import { InvoiceStatusBadge } from "@/components/projects/status-badge";
import { InvoiceStatus } from "@prisma/client";

interface Proposal {
  id: string;
  title: string;
  summary: string;
  amount: number | { toNumber: () => number } | null;
  deliveryTime: string | null;
  createdAt: Date | string;
  status: string;
}

interface ProjectInvoice {
  id: string;
  invoiceNumber: string;
  description: string;
  totalAmount: number;
  status: InvoiceStatus;
  issueDate: Date | string;
  dueDate: Date | string;
}

interface Props {
  client: {
    id: string;
    companyName: string;
    contactName: string;
    email: string;
    address: string | null;
  };
  project: {
    id: string;
    name: string;
    description: string | null;
    scope: string | null;
  };
  proposals: Proposal[];
  invoices: ProjectInvoice[];
  n8nEnabled: boolean;
}

export function ProjectProposalsPanel({ client, project, proposals, invoices, n8nEnabled }: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const initialForm = useMemo(
    () => ({
      title: `Offerte ${project.name}`,
      recipientName: client.contactName ?? "",
      recipientEmail: client.email ?? "",
      recipientCompany: client.companyName,
      recipientAddress: client.address ?? "",
      summary: project.description ?? "",
      scope: project.scope ?? "",
      priceLabel: "Projectprijs",
      amount: "",
      deliveryTime: "",
      notes: "",
    }),
    [client.address, client.companyName, client.contactName, client.email, project.description, project.name, project.scope]
  );

  const [form, setForm] = useState(initialForm);

  function resetForm() {
    setForm(initialForm);
    setError(null);
  }

  async function handleSendToN8n(proposalId: string) {
    if (!session?.user?.id) return;
    setSendingId(proposalId);
    setSendError(null);
    const result = await sendProposalToN8n(proposalId, session.user.id);
    setSendingId(null);
    if (!result.success) {
      setSendError(result.error ?? "Verzenden naar n8n mislukt.");
    } else {
      router.refresh();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.user?.id) return;

    setLoading(true);
    setError(null);
    try {
      const result = await createProposalDraft({
        actorUserId: session.user.id,
        clientId: client.id,
        projectId: project.id,
        title: form.title,
        recipientName: form.recipientName,
        recipientEmail: form.recipientEmail,
        recipientCompany: form.recipientCompany,
        recipientAddress: form.recipientAddress,
        summary: form.summary,
        scope: form.scope,
        priceLabel: form.priceLabel,
        amount: form.amount ? Number(form.amount) : undefined,
        deliveryTime: form.deliveryTime,
        notes: form.notes,
      });

      if (!result.success) {
        setError(result.error ?? "Offerteconcept opslaan mislukt.");
        return;
      }

      setOpen(false);
      resetForm();
      router.refresh();
    } catch {
      setError("Er is een onverwachte fout opgetreden.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Offertes & Facturen</h3>
          <p className="mt-1 text-sm text-gray-500">
            Maak offerteconcepten aan of maak direct een factuur op basis van dit project.
          </p>
          {!n8nEnabled && (
            <p className="mt-2 text-xs text-amber-700">
              n8n is nog niet gekoppeld. Zet `N8N_WEBHOOK_PROPOSAL_URL` in je `.env` om PDF via n8n te activeren.
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/finance/invoices/new?clientId=${client.id}&projectId=${project.id}`}
            className="btn-secondary"
          >
            <Receipt className="h-4 w-4" />
            Nieuwe factuur
          </Link>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              resetForm();
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Nieuwe offerte
          </button>
        </div>
      </div>

      {open && (
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900">
              Nieuw offerteconcept
            </h4>
            <button type="button" onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-700">
              <X className="h-4 w-4" />
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="form-label">Titel</label>
                <input className="form-input" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
              </div>
              <div>
                <label className="form-label">Contactpersoon</label>
                <input className="form-input" value={form.recipientName} onChange={(e) => setForm((p) => ({ ...p, recipientName: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">E-mail</label>
                <input className="form-input" value={form.recipientEmail} onChange={(e) => setForm((p) => ({ ...p, recipientEmail: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Bedrijf</label>
                <input className="form-input" value={form.recipientCompany} onChange={(e) => setForm((p) => ({ ...p, recipientCompany: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Adres</label>
                <input className="form-input" value={form.recipientAddress} onChange={(e) => setForm((p) => ({ ...p, recipientAddress: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className="form-label">Samenvatting</label>
                <textarea className="form-textarea" rows={4} value={form.summary} onChange={(e) => setForm((p) => ({ ...p, summary: e.target.value }))} required />
              </div>
              <div className="col-span-2">
                <label className="form-label">Scope</label>
                <textarea className="form-textarea" rows={4} value={form.scope} onChange={(e) => setForm((p) => ({ ...p, scope: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Prijslabel</label>
                <input className="form-input" value={form.priceLabel} onChange={(e) => setForm((p) => ({ ...p, priceLabel: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Bedrag</label>
                <input type="number" step="0.01" className="form-input" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className="form-label">Doorlooptijd</label>
                <input className="form-input" value={form.deliveryTime} onChange={(e) => setForm((p) => ({ ...p, deliveryTime: e.target.value }))} placeholder="Bijv. 3 weken na akkoord" />
              </div>
              <div className="col-span-2">
                <label className="form-label">Extra notities</label>
                <textarea className="form-textarea" rows={4} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
                Annuleren
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                Opslaan
              </button>
            </div>
          </form>
        </div>
      )}

      {sendError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {sendError}
        </div>
      )}

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Offertes</h4>
        {proposals.length > 0 ? (
          <div className="space-y-3">
            {proposals.map((proposal) => (
              <div key={proposal.id} className="card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <h4 className="font-medium text-gray-900">{proposal.title}</h4>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">{proposal.summary}</p>
                    <p className="mt-2 text-xs text-gray-400">
                      {proposal.deliveryTime ?? "Geen doorlooptijd ingevuld"} · {proposal.status}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    {proposal.amount && (
                      <span className="text-sm font-semibold text-gray-700">
                        €{typeof proposal.amount === "object" ? proposal.amount.toNumber().toFixed(2) : proposal.amount.toFixed(2)}
                      </span>
                    )}
                    {proposal.status !== "SENT_TO_N8N" ? (
                      <button
                        type="button"
                        className="btn-primary text-xs"
                        disabled={sendingId === proposal.id || !n8nEnabled}
                        onClick={() => handleSendToN8n(proposal.id)}
                        title={!n8nEnabled ? "n8n webhook is nog niet ingesteld" : undefined}
                      >
                        {!n8nEnabled ? "n8n niet ingesteld" : sendingId === proposal.id ? "Bezig…" : "PDF via n8n"}
                      </button>
                    ) : (
                      <span className="text-xs text-green-600 font-medium">✓ Verstuurd naar n8n</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card p-6 text-sm text-gray-400">
            Nog geen offerteconcepten voor dit project.
          </div>
        )}
      </div>

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Facturen</h4>
        {invoices.length > 0 ? (
          <div className="space-y-3">
            {invoices.map((inv) => (
              <div key={inv.id} className="card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-gray-400" />
                      <Link
                        href={`/finance/invoices/${inv.id}`}
                        className="font-medium text-gray-900 hover:text-blue-600"
                      >
                        #{inv.invoiceNumber}
                      </Link>
                      <InvoiceStatusBadge status={inv.status} />
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{inv.description}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      Vervalt {formatDate(inv.dueDate)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-gray-700 shrink-0">
                    {formatCurrency(inv.totalAmount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card p-6 text-sm text-gray-400">
            Nog geen facturen voor dit project.{" "}
            <Link
              href={`/finance/invoices/new?clientId=${client.id}&projectId=${project.id}`}
              className="text-blue-600 hover:underline"
            >
              Maak er een aan.
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
