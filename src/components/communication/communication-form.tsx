"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { createCommunicationEntry } from "@/actions/communication";
import { Loader2 } from "lucide-react";
import { CommunicationType } from "@prisma/client";

const COMMUNICATION_TYPES: { value: CommunicationType; label: string }[] = [
  { value: "EMAIL", label: "Email" },
  { value: "CALL", label: "Telefoongesprek" },
  { value: "MEETING", label: "Meeting" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "DM", label: "Privébericht" },
  { value: "INTERNAL", label: "Interne notitie" },
  { value: "OTHER", label: "Overig" },
];

interface Props {
  projectId: string;
  onSuccess: () => void;
}

export function CommunicationForm({ projectId, onSuccess }: Props) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const now = new Date();
  const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  const [form, setForm] = useState({
    type: "EMAIL" as CommunicationType,
    subject: "",
    occurredAt: localNow,
    content: "",
    externalSenderName: "",
    externalSenderEmail: "",
    isInternal: false,
    links: "",
  });

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleCheckbox(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.checked }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.user?.id) return;
    setError(null);
    setLoading(true);

    try {
      const links = form.links
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean);

      const result = await createCommunicationEntry(
        {
          projectId,
          type: form.type,
          subject: form.subject,
          occurredAt: form.occurredAt,
          content: form.content,
          externalSenderName: form.externalSenderName || undefined,
          externalSenderEmail: form.externalSenderEmail || undefined,
          isInternal: form.isInternal,
          links,
        },
        session.user.id
      );

      if (result.success) {
        onSuccess();
      } else {
        setError(result.error ?? "Item aanmaken mislukt.");
      }
    } catch {
      setError("Er is een onverwachte fout opgetreden.");
    } finally {
      setLoading(false);
    }
  }

  const isExternal = form.type !== "INTERNAL";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="comm-type" className="form-label">
            Type
          </label>
          <select
            id="comm-type"
            name="type"
            value={form.type}
            onChange={handleChange}
            className="form-select"
          >
            {COMMUNICATION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="comm-occurredAt" className="form-label">
            Datum &amp; tijd
          </label>
          <input
            id="comm-occurredAt"
            name="occurredAt"
            type="datetime-local"
            value={form.occurredAt}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="comm-subject" className="form-label">
          Onderwerp <span className="text-red-500">*</span>
        </label>
        <input
          id="comm-subject"
          name="subject"
          type="text"
          required
          value={form.subject}
          onChange={handleChange}
          className="form-input"
          placeholder="Waar ging deze communicatie over?"
        />
      </div>

      {isExternal && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="comm-senderName" className="form-label">
              Naam afzender
            </label>
            <input
              id="comm-senderName"
              name="externalSenderName"
              type="text"
              value={form.externalSenderName}
              onChange={handleChange}
              className="form-input"
              placeholder="Jan Janssen"
            />
          </div>
          <div>
            <label htmlFor="comm-senderEmail" className="form-label">
              E-mail afzender
            </label>
            <input
              id="comm-senderEmail"
              name="externalSenderEmail"
              type="email"
              value={form.externalSenderEmail}
              onChange={handleChange}
              className="form-input"
              placeholder="jan@client.nl"
            />
          </div>
        </div>
      )}

      <div>
        <label htmlFor="comm-content" className="form-label">
          Inhoud <span className="text-red-500">*</span>
        </label>
        <textarea
          id="comm-content"
          name="content"
          rows={8}
          required
          value={form.content}
          onChange={handleChange}
          className="form-textarea"
          placeholder="Plak hier de volledige e-mail, gespreksnotities of samenvatting van de meeting…"
        />
      </div>

      <div>
        <label htmlFor="comm-links" className="form-label">
          Links{" "}
          <span className="font-normal text-gray-400">(kommagescheiden)</span>
        </label>
        <input
          id="comm-links"
          name="links"
          type="text"
          value={form.links}
          onChange={handleChange}
          className="form-input"
          placeholder="https://drive.google.com/..., https://figma.com/..."
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="comm-isInternal"
          name="isInternal"
          type="checkbox"
          checked={form.isInternal}
          onChange={handleCheckbox}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="comm-isInternal" className="text-sm text-gray-700">
          Alleen intern (niet gedeeld met de klant)
        </label>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? (
            <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Bezig met opslaan…
              </>
            ) : (
            "Item opslaan"
          )}
        </button>
      </div>
    </form>
  );
}
