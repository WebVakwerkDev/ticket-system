"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { sendEmail } from "@/actions/emails";
import { Loader2 } from "lucide-react";
import Link from "next/link";

interface Props {
  defaultTo: string;
  defaultSubject: string;
  replyToEmailId?: string;
  defaultChangeRequestId?: string;
  defaultClientId?: string;
}

export function ComposeForm({
  defaultTo,
  defaultSubject,
  replyToEmailId,
  defaultChangeRequestId,
  defaultClientId,
}: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    to: defaultTo,
    subject: defaultSubject,
    body: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.user?.id) return;
    setError(null);
    setLoading(true);

    const toAddresses = form.to.split(",").map((s) => s.trim()).filter(Boolean);
    if (toAddresses.length === 0) {
      setError("Voer minimaal één ontvanger in.");
      setLoading(false);
      return;
    }

    const result = await sendEmail(
      {
        toAddresses,
        subject: form.subject,
        bodyText: form.body,
        changeRequestId: defaultChangeRequestId,
        clientId: defaultClientId,
        replyToExternalId: replyToEmailId,
      },
      session.user.id
    );

    setLoading(false);
    if (result.success) {
      router.push("/emails?folder=SENT");
    } else {
      setError(result.error ?? "Verzenden mislukt.");
    }
  }

  return (
    <div className="card p-6 max-w-2xl">
      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="form-label">Aan</label>
          <input
            name="to"
            type="text"
            required
            value={form.to}
            onChange={handleChange}
            className="form-input"
            placeholder="naam@bedrijf.nl, naam2@bedrijf.nl"
          />
        </div>
        <div>
          <label className="form-label">Onderwerp</label>
          <input
            name="subject"
            type="text"
            required
            value={form.subject}
            onChange={handleChange}
            className="form-input"
            placeholder="Onderwerp"
          />
        </div>
        <div>
          <label className="form-label">Bericht</label>
          <textarea
            name="body"
            rows={10}
            required
            value={form.body}
            onChange={handleChange}
            className="form-textarea"
            placeholder="Typ hier je bericht…"
          />
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Verzenden…
              </>
            ) : (
              "Verzenden"
            )}
          </button>
          <Link href="/emails" className="btn-secondary">
            Annuleren
          </Link>
        </div>
      </form>
    </div>
  );
}
