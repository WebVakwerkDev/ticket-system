"use client";

import { useMemo, useState } from "react";
import { Loader2, Paperclip, X } from "lucide-react";
import {
  MAX_OUTGOING_EMAIL_ATTACHMENTS,
  MAX_OUTGOING_EMAIL_TOTAL_BYTES,
  formatReplySubject,
} from "@/lib/outgoing-email";

interface ReplyTarget {
  id: string;
  subject: string;
  toAddresses: string[];
  ccAddresses: string[];
}

interface Props {
  projectId: string;
  defaultRecipientEmail?: string | null;
  defaultRecipientName?: string | null;
  replyTo?: ReplyTarget | null;
  onCancel: () => void;
  onSent: (closeComposer: boolean) => Promise<void> | void;
}

export function OutgoingEmailComposer({
  projectId,
  defaultRecipientEmail,
  defaultRecipientName,
  replyTo,
  onCancel,
  onSent,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);

  const initialTo = useMemo(() => {
    if (replyTo?.toAddresses.length) return replyTo.toAddresses.join(", ");
    return defaultRecipientEmail ?? "";
  }, [defaultRecipientEmail, replyTo]);

  const initialCc = useMemo(() => {
    if (replyTo?.ccAddresses.length) return replyTo.ccAddresses.join(", ");
    return "";
  }, [replyTo]);

  const initialSubject = useMemo(() => {
    if (replyTo?.subject) return formatReplySubject(replyTo.subject);
    const name = defaultRecipientName ? ` voor ${defaultRecipientName}` : "";
    return `Nieuwe e-mail${name}`;
  }, [defaultRecipientName, replyTo]);

  const [form, setForm] = useState({
    to: initialTo,
    cc: initialCc,
    subject: initialSubject,
    bodyText: "",
  });

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length === 0) return;

    setFiles((prev) => [...prev, ...selected].slice(0, MAX_OUTGOING_EMAIL_ATTACHMENTS));
    e.target.value = "";
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = new FormData();
      payload.set("projectId", projectId);
      if (replyTo?.id) {
        payload.set("replyToEmailId", replyTo.id);
      }
      payload.set("to", form.to);
      payload.set("cc", form.cc);
      payload.set("subject", form.subject);
      payload.set("bodyText", form.bodyText);

      files.forEach((file) => {
        payload.append("attachments", file);
      });

      const response = await fetch("/api/outgoing-emails/send", {
        method: "POST",
        body: payload,
      });

      const result = (await response.json()) as {
        success: boolean;
        error?: string;
      };

      if (!response.ok || !result.success) {
        setError(result.error ?? "E-mail verzenden mislukt.");
        await onSent(false);
        return;
      }

      await onSent(true);
    } catch {
      setError("E-mail verzenden mislukt.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="form-label">
            Aan <span className="text-red-500">*</span>
          </label>
          <input
            name="to"
            className="form-input"
            value={form.to}
            onChange={handleChange}
            placeholder="klant@bedrijf.nl, collega@bedrijf.nl"
            required
          />
        </div>
        <div className="col-span-2">
          <label className="form-label">Cc</label>
          <input
            name="cc"
            className="form-input"
            value={form.cc}
            onChange={handleChange}
            placeholder="optioneel@bedrijf.nl"
          />
        </div>
        <div className="col-span-2">
          <label className="form-label">
            Onderwerp <span className="text-red-500">*</span>
          </label>
          <input
            name="subject"
            className="form-input"
            value={form.subject}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-span-2">
          <label className="form-label">
            Bericht <span className="text-red-500">*</span>
          </label>
          <textarea
            name="bodyText"
            className="form-textarea"
            rows={10}
            value={form.bodyText}
            onChange={handleChange}
            placeholder="Schrijf hier je e-mail..."
            required
          />
        </div>
        <div className="col-span-2">
          <label className="form-label">Bijlagen</label>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-4 text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600">
            <Paperclip className="h-4 w-4" />
            Bestanden kiezen
            <input
              type="file"
              multiple
              className="hidden"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.txt,.csv"
              onChange={handleFilesChange}
            />
          </label>
          <p className="mt-2 text-xs text-gray-400">
            Maximaal {MAX_OUTGOING_EMAIL_ATTACHMENTS} bijlagen, samen maximaal{" "}
            {Math.round(MAX_OUTGOING_EMAIL_TOTAL_BYTES / 1024 / 1024)} MB.
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
            Geselecteerde bestanden ({files.length}) · {(totalSize / 1024 / 1024).toFixed(1)} MB
          </div>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div key={`${file.name}-${index}`} className="flex items-center justify-between gap-3 rounded-md bg-white px-3 py-2 text-sm">
                <div className="min-w-0">
                  <div className="truncate font-medium text-gray-800">{file.name}</div>
                  <div className="text-xs text-gray-400">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-gray-400 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Annuleren
        </button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Verzenden...
            </>
          ) : (
            "Versturen"
          )}
        </button>
      </div>
    </form>
  );
}
