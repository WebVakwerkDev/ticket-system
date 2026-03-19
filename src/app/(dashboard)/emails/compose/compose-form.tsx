"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendEmail } from "@/actions/emails";
import { Paperclip, X, Send, Loader2 } from "lucide-react";
import type { AttachmentInput } from "@/lib/validations/email";

const MAX_TOTAL_BYTES = 20 * 1024 * 1024;
const MAX_ATTACHMENTS = 10;
const ALLOWED_EXTENSIONS = ".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.png,.jpg,.jpeg,.webp,.gif";

interface Ticket {
  id: string;
  label: string;
  clientEmail?: string | null;
}

interface Props {
  tickets: Ticket[];
  currentUserId: string;
  defaultTo?: string;
  defaultSubject?: string;
  defaultTicketId?: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      if (!base64) return reject(new Error("Kon bestand niet lezen"));
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Bestand lezen mislukt"));
    reader.readAsDataURL(file);
  });
}

export function ComposeForm({
  tickets,
  currentUserId,
  defaultTo = "",
  defaultSubject = "",
  defaultTicketId = "",
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [to, setTo] = useState(defaultTo);
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState("");
  const [ticketId, setTicketId] = useState(defaultTicketId);
  const [attachments, setAttachments] = useState<AttachmentInput[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sizeWarning, setSizeWarning] = useState<string | null>(null);

  const totalSize = attachments.reduce((sum, a) => sum + a.size, 0);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    const newAttachments: AttachmentInput[] = [];
    const errors: string[] = [];

    for (const file of Array.from(files)) {
      if (attachments.length + newAttachments.length >= MAX_ATTACHMENTS) {
        errors.push(`Maximaal ${MAX_ATTACHMENTS} bijlagen toegestaan`);
        break;
      }
      if (totalSize + newAttachments.reduce((s, a) => s + a.size, 0) + file.size > MAX_TOTAL_BYTES) {
        errors.push("Totale grootte overschrijdt 20 MB");
        break;
      }

      try {
        const data = await fileToBase64(file);
        newAttachments.push({ name: file.name, mimeType: file.type || "application/octet-stream", size: file.size, data });
      } catch {
        errors.push(`Kon "${file.name}" niet laden`);
      }
    }

    if (errors.length > 0) {
      setSizeWarning(errors.join(". "));
    } else {
      setSizeWarning(null);
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
    setSizeWarning(null);
  }

  function parseAddressList(raw: string): string[] {
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const toAddresses = parseAddressList(to);
    const ccAddresses = parseAddressList(cc);

    startTransition(async () => {
      const result = await sendEmail(
        {
          toAddresses,
          ccAddresses,
          subject,
          bodyText: body,
          changeRequestId: ticketId || undefined,
          attachments,
        },
        currentUserId
      );

      if (!result.success) {
        setError(result.error ?? "Verzenden mislukt.");
        return;
      }

      router.push(`/emails/${result.emailId}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Aan <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="naam@bedrijf.nl, andere@bedrijf.nl"
          required
          className="input w-full"
        />
        <p className="mt-1 text-xs text-gray-400">Meerdere adressen scheiden met een komma</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">CC</label>
        <input
          type="text"
          value={cc}
          onChange={(e) => setCc(e.target.value)}
          placeholder="optioneel@bedrijf.nl"
          className="input w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Onderwerp <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Onderwerp van de e-mail"
          required
          className="input w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Bericht <span className="text-red-500">*</span>
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={10}
          placeholder="Typ hier je bericht..."
          required
          className="input w-full resize-y"
        />
      </div>

      {tickets.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Koppelen aan ticket <span className="text-xs font-normal text-gray-400">(optioneel)</span>
          </label>
          <select
            value={ticketId}
            onChange={(e) => setTicketId(e.target.value)}
            className="input w-full"
          >
            <option value="">— Geen ticket —</option>
            {tickets.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Bijlagen</label>

        {attachments.length > 0 && (
          <ul className="mb-3 space-y-2">
            {attachments.map((att, i) => (
              <li
                key={i}
                className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Paperclip className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="truncate text-gray-700">{att.name}</span>
                  <span className="text-xs text-gray-400 flex-shrink-0">{formatBytes(att.size)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeAttachment(i)}
                  className="ml-3 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                  aria-label="Bijlage verwijderen"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {totalSize > 0 && (
          <p className={`mb-2 text-xs ${totalSize > MAX_TOTAL_BYTES * 0.9 ? "text-orange-600" : "text-gray-400"}`}>
            Totaal: {formatBytes(totalSize)} / 20 MB
          </p>
        )}

        {sizeWarning && (
          <p className="mb-2 text-xs text-red-600">{sizeWarning}</p>
        )}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ALLOWED_EXTENSIONS}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={attachments.length >= MAX_ATTACHMENTS}
          className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Paperclip className="h-4 w-4" />
          Bijlage toevoegen
        </button>
        <p className="mt-1 text-xs text-gray-400">
          PDF, Word, Excel, afbeeldingen, TXT, CSV · Max 20 MB totaal · Max {MAX_ATTACHMENTS} bestanden
        </p>
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
        <button
          type="submit"
          disabled={isPending}
          className="btn-primary flex items-center gap-2"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {isPending ? "Verzenden..." : "Versturen"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isPending}
          className="btn-secondary"
        >
          Annuleren
        </button>
      </div>
    </form>
  );
}
