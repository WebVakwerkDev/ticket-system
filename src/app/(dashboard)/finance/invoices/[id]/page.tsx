import { notFound } from "next/navigation";
import Link from "next/link";
import { getInvoice } from "@/actions/invoices";
import { formatDate, formatCurrency } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { InvoiceStatusBadge } from "@/components/projects/status-badge";
import { MarkPaidButton } from "../../mark-paid-button";
import { SendInvoiceButton } from "./send-invoice-button";
import { getN8nInvoiceWebhookUrl } from "@/lib/env";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getInvoice(id);

  if (!result.success || !result.invoice) {
    notFound();
  }

  const inv = result.invoice;
  const n8nEnabled = !!getN8nInvoiceWebhookUrl();
  const subtotal = Number(inv.subtotal);
  const vatAmount = Number(inv.vatAmount);
  const totalAmount = Number(inv.totalAmount);

  return (
    <div className="max-w-2xl">
      {/* Back */}
      <Link
        href="/finance"
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Terug naar financiën
      </Link>

      {/* Invoice card */}
      <div className="card p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">
                Factuur #{inv.invoiceNumber}
              </h1>
              <InvoiceStatusBadge status={inv.status} />
            </div>
            <div className="text-sm text-gray-500 space-x-3">
              <span>Opgesteld: {formatDate(inv.issueDate)}</span>
              <span>&middot;</span>
              <span>Vervalt: {formatDate(inv.dueDate)}</span>
              {inv.paidAt && (
                <>
                  <span>&middot;</span>
                  <span className="text-green-600">
                    Betaald: {formatDate(inv.paidAt)}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(inv.status === "SENT" || inv.status === "OVERDUE") && (
              <MarkPaidButton invoiceId={inv.id} />
            )}
            {inv.status === "DRAFT" && (
              <SendInvoiceButton invoiceId={inv.id} n8nEnabled={n8nEnabled} />
            )}
          </div>
        </div>

        {/* Client & Project */}
        <div className="grid grid-cols-2 gap-6 mb-8 pb-8 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
              Factureren aan
            </p>
            <Link
              href={`/clients/${inv.client.id}`}
              className="font-semibold text-gray-900 hover:text-blue-600"
            >
              {inv.client.companyName}
            </Link>
            {inv.client.address && (
              <p className="text-sm text-gray-600 mt-1">{inv.client.address}</p>
            )}
          </div>
          {inv.project && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                Project
              </p>
              <Link
                href={`/projects/${inv.project.id}`}
                className="font-medium text-gray-900 hover:text-blue-600"
              >
                {inv.project.name}
              </Link>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">
            Beschrijving
          </h3>
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {inv.description}
          </p>
        </div>

        {/* Line items / amounts */}
        <div className="rounded-md border border-gray-200 mb-6 overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="px-4 py-3 text-gray-600">Subtotaal</td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">
                  {formatCurrency(subtotal)}
                </td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="px-4 py-3 text-gray-600">
                  VAT ({Number(inv.vatRate)}%)
                </td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">
                  {formatCurrency(vatAmount)}
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-4 py-3 font-semibold text-gray-900">
                  Totaal
                </td>
                <td className="px-4 py-3 text-right text-lg font-bold text-gray-900">
                  {formatCurrency(totalAmount)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Notes */}
        {inv.notes && (
          <div className="rounded-md bg-gray-50 border border-gray-200 px-4 py-3">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
              Notities
            </p>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">
              {inv.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
