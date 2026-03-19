"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { FileText } from "lucide-react";
import { sendInvoiceToN8n } from "@/actions/invoices";

interface Props {
  invoiceId: string;
  n8nEnabled: boolean;
}

export function SendInvoiceButton({ invoiceId, n8nEnabled }: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    if (!session?.user?.id) return;
    setLoading(true);
    setError(null);
    const result = await sendInvoiceToN8n(invoiceId, session.user.id);
    setLoading(false);
    if (!result.success) {
      setError(result.error ?? "Verzenden mislukt.");
    } else {
      router.refresh();
    }
  }

  return (
    <div>
      {error && (
        <p className="mb-2 text-xs text-red-600">{error}</p>
      )}
      <button
        type="button"
        className="btn-primary"
        disabled={loading || !n8nEnabled}
        title={!n8nEnabled ? "N8N_WEBHOOK_INVOICE_URL is niet ingesteld" : undefined}
        onClick={handleSend}
      >
        <FileText className="h-4 w-4" />
        {loading ? "Bezig…" : "PDF & verstuur via n8n"}
      </button>
    </div>
  );
}
