"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { markInvoicePaid } from "@/actions/invoices";
import { Loader2, Check } from "lucide-react";

export function MarkPaidButton({ invoiceId }: { invoiceId: string }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!session?.user?.id) return;
    if (!confirm("Deze factuur als betaald markeren?")) return;
    setLoading(true);
    try {
      await markInvoicePaid(invoiceId, session.user.id);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-800 font-medium disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Check className="h-3.5 w-3.5" />
      )}
      Markeer als betaald
    </button>
  );
}
