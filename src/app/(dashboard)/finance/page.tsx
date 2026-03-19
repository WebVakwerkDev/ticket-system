import Link from "next/link";
import { getInvoices, getFinanceOverview } from "@/actions/invoices";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, TrendingUp, Clock, AlertTriangle, Calendar } from "lucide-react";
import { InvoiceStatus } from "@prisma/client";
import { InvoiceStatusBadge } from "@/components/projects/status-badge";
import { MarkPaidButton } from "./mark-paid-button";

const STATUS_TABS = [
  { label: "Alle", value: "" },
  { label: "Concept", value: "DRAFT" },
  { label: "Verzonden", value: "SENT" },
  { label: "Betaald", value: "PAID" },
  { label: "Achterstallig", value: "OVERDUE" },
];

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const activeStatus = status as InvoiceStatus | undefined;

  const [overviewResult, invoicesResult, overdueResult] = await Promise.all([
    getFinanceOverview(),
    getInvoices(activeStatus ? { status: activeStatus } : undefined),
    getInvoices({ status: InvoiceStatus.OVERDUE }),
  ]);

  const overview = overviewResult.success && "overview" in overviewResult ? overviewResult.overview : null;
  const invoices = invoicesResult.success ? invoicesResult.invoices ?? [] : [];
  const overdueInvoices = overdueResult.success
    ? overdueResult.invoices ?? []
    : [];

  // Current quarter revenue approximation via vatByQuarter
  const currentQuarterRevenue = overview?.vatByQuarter?.slice(-1)?.[0]?.revenue ?? 0;

  const statCards = [
    {
      label: "Totale omzet (betaald)",
      value: formatCurrency(overview?.totalRevenue ?? 0),
      icon: TrendingUp,
      color: "border-green-500",
      iconColor: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Openstaande facturen",
      value: formatCurrency(overview?.openAmount ?? 0),
      icon: Clock,
      color: "border-blue-500",
      iconColor: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Achterstallig",
      value: formatCurrency(overview?.overdueAmount ?? 0),
      icon: AlertTriangle,
      color: "border-red-500",
      iconColor: "text-red-600",
      bg: "bg-red-50",
    },
    {
      label: "Omzet huidig kwartaal",
      value: formatCurrency(currentQuarterRevenue),
      icon: Calendar,
      color: "border-purple-500",
      iconColor: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Financiën</h1>
        <Link href="/finance/invoices/new" className="btn-primary">
          <Plus className="h-4 w-4" />
          Nieuwe factuur
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`card border-l-4 ${card.color} p-5`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {card.value}
                  </p>
                </div>
                <div className={`rounded-lg ${card.bg} p-3`}>
                  <Icon className={`h-5 w-5 ${card.iconColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Overdue invoices (if any) */}
      {overdueInvoices.length > 0 && !activeStatus && (
        <div className="card">
          <div className="border-b border-gray-100 px-5 py-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <h2 className="font-semibold text-red-700">
              Achterstallige facturen ({overdueInvoices.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-red-50 text-left">
                  <th className="px-5 py-3 font-medium text-gray-600">Factuur</th>
                  <th className="px-5 py-3 font-medium text-gray-600">Klant</th>
                  <th className="px-5 py-3 font-medium text-gray-600">Project</th>
                  <th className="px-5 py-3 font-medium text-gray-600">Vervaldatum</th>
                  <th className="px-5 py-3 font-medium text-gray-600">Bedrag</th>
                  <th className="px-5 py-3 font-medium text-gray-600"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {overdueInvoices.map((inv) => (
                  <tr key={inv.id} className="bg-red-50/30">
                    <td className="px-5 py-3 font-medium">
                      <Link
                        href={`/finance/invoices/${inv.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        #{inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {inv.client?.companyName}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {inv.project?.name ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-red-600 font-medium">
                      {formatDate(inv.dueDate)}
                    </td>
                    <td className="px-5 py-3 font-semibold">
                      {formatCurrency(inv.totalAmount)}
                    </td>
                    <td className="px-5 py-3">
                      <MarkPaidButton invoiceId={inv.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* All invoices */}
      <div className="card">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="font-semibold text-gray-900">Alle facturen</h2>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-0.5 px-5 pt-3 border-b border-gray-100">
          {STATUS_TABS.map((tab) => (
            <Link
              key={tab.value}
              href={
                tab.value ? `/finance?status=${tab.value}` : "/finance"
              }
              className={`px-3 py-1.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                (tab.value === "" && !activeStatus) ||
                tab.value === activeStatus
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {invoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left">
                  <th className="px-5 py-3 font-medium text-gray-600">Factuur</th>
                  <th className="px-5 py-3 font-medium text-gray-600">Klant</th>
                  <th className="px-5 py-3 font-medium text-gray-600">Project</th>
                  <th className="px-5 py-3 font-medium text-gray-600">Factuurdatum</th>
                  <th className="px-5 py-3 font-medium text-gray-600">Vervaldatum</th>
                  <th className="px-5 py-3 font-medium text-gray-600">Bedrag</th>
                  <th className="px-5 py-3 font-medium text-gray-600">Status</th>
                  <th className="px-5 py-3 font-medium text-gray-600"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-medium">
                      <Link
                        href={`/finance/invoices/${inv.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        #{inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {inv.client?.companyName}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {inv.project ? (
                        <Link
                          href={`/projects/${inv.project.id}`}
                          className="hover:text-blue-600"
                        >
                          {inv.project.name}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {formatDate(inv.issueDate)}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {formatDate(inv.dueDate)}
                    </td>
                    <td className="px-5 py-3 font-medium">
                      {formatCurrency(inv.totalAmount)}
                    </td>
                    <td className="px-5 py-3">
                      <InvoiceStatusBadge status={inv.status} />
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/finance/invoices/${inv.id}`}
                        className="text-xs text-gray-500 hover:text-blue-600"
                      >
                        Bekijken
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-5 py-10 text-center text-sm text-gray-400">
            Geen facturen gevonden.{" "}
            {!activeStatus && (
              <Link href="/finance/invoices/new" className="text-blue-600 hover:underline">
                Maak er een aan
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
