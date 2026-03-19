"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { FileText, Plus, X } from "lucide-react";
import { createProposalDraft, sendProposalToN8n } from "@/actions/proposals";

interface Proposal {
  id: string;
  title: string;
  summary: string;
  amount: number | { toNumber: () => number } | null;
  deliveryTime: string | null;
  createdAt: Date | string;
  status: string;
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
}

export function ProjectProposalsPanel({ client, project, proposals }: Props) {
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Offertes</h3>
          <p className="mt-1 text-sm text-gray-500">
            Maak hier een offerteconcept aan dat je later aan n8n kunt koppelen.
          </p>
        </div>
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

      {proposals.length > 0 ? (
        <div className="space-y-3">
          {proposals.map((proposal) => (
            <div key={proposal.id} className="card p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <h4 className="font-medium text-gray-900">{proposal.title}</h4>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{proposal.summary}</p>
                  <p className="mt-2 text-xs text-gray-400">
                    {proposal.deliveryTime ?? "Geen doorlooptijd ingevuld"} · {proposal.status}
                  </p>
                </div>
                {proposal.amount && (
                  <span className="text-sm font-semibold text-gray-700">
                    €{typeof proposal.amount === "object" ? proposal.amount.toNumber().toFixed(2) : proposal.amount.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-8 text-sm text-gray-400">
          Nog geen offerteconcepten voor dit project.
        </div>
      )}
    </div>
  );
}
