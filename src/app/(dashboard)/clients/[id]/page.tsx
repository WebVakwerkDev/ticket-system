import { notFound } from "next/navigation";
import Link from "next/link";
import { getClient } from "@/actions/clients";
import { formatDate, formatCurrency } from "@/lib/utils";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Pencil,
  ArrowLeft,
  FolderKanban,
  Receipt,
} from "lucide-react";
import { ProjectStatusBadge, InvoiceStatusBadge } from "@/components/projects/status-badge";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getClient(id);

  if (!result.success || !result.client) {
    notFound();
  }

  const client = result.client;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <Link
            href="/clients"
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Terug naar klanten
          </Link>
          <h1 className="page-title">{client.companyName}</h1>
          {client.contactName && (
            <p className="text-sm text-gray-500 mt-1">{client.contactName}</p>
          )}
        </div>
        <Link href={`/clients/${client.id}/edit`} className="btn-secondary">
          <Pencil className="h-4 w-4" />
          Klant bewerken
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left column: contact info */}
        <div className="space-y-4">
          {/* Contact */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-gray-400" />
              Contactinformatie
            </h2>
            <dl className="space-y-2 text-sm">
              {client.email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                  <a href={`mailto:${client.email}`} className="hover:text-blue-600">
                    {client.email}
                  </a>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                  <span>{client.phone}</span>
                </div>
              )}
              {client.address && (
                <div className="flex items-start gap-2 text-gray-600">
                  <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span>{client.address}</span>
                </div>
              )}
            </dl>
          </div>

          {/* Company details */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">
              Bedrijfsgegevens
            </h2>
            <dl className="space-y-2 text-sm">
              {client.vatNumber && (
                <div>
                  <dt className="text-xs text-gray-400 uppercase tracking-wide">VAT</dt>
                  <dd className="text-gray-700">{client.vatNumber}</dd>
                </div>
              )}
              {client.chamberOfCommerceNumber && (
                <div>
                  <dt className="text-xs text-gray-400 uppercase tracking-wide">KvK</dt>
                  <dd className="text-gray-700">{client.chamberOfCommerceNumber}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-gray-400 uppercase tracking-wide">Klant sinds</dt>
                <dd className="text-gray-700">{formatDate(client.createdAt)}</dd>
              </div>
            </dl>
          </div>

          {/* Notes */}
          {(client.notes || client.invoiceDetails) && (
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">
                Notities &amp; facturatie
              </h2>
              {client.invoiceDetails && (
                <div className="mb-3">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                    Factuurgegevens
                  </p>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                    {client.invoiceDetails}
                  </p>
                </div>
              )}
              {client.notes && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                    Interne notities
                  </p>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                    {client.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right columns: projects + invoices */}
        <div className="col-span-2 space-y-6">
          {/* Projects */}
          <div className="card">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-gray-400" />
                Projecten ({client.projects.length})
              </h2>
              <Link
                href={`/projects/new?clientId=${client.id}`}
                className="text-xs text-blue-600 hover:underline"
              >
                + Nieuw project
              </Link>
            </div>
            {client.projects.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {client.projects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {project.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {project._count.communicationEntries} comm. &middot;{" "}
                        {project._count.changeRequests} wijzigingsverzoeken
                      </p>
                    </div>
                    <ProjectStatusBadge status={project.status} />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="px-5 py-8 text-center text-sm text-gray-400">
                Nog geen projecten.{" "}
                <Link
                  href={`/projects/new?clientId=${client.id}`}
                  className="text-blue-600 hover:underline"
                >
                  Maak er een aan
                </Link>
              </div>
            )}
          </div>

          {/* Invoices */}
          <div className="card">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Receipt className="h-4 w-4 text-gray-400" />
                Facturen ({client.invoices.length})
              </h2>
              <Link
                href={`/finance/invoices/new?clientId=${client.id}`}
                className="text-xs text-blue-600 hover:underline"
              >
                + Nieuwe factuur
              </Link>
            </div>
            {client.invoices.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {client.invoices.map((invoice) => (
                  <Link
                    key={invoice.id}
                    href={`/finance/invoices/${invoice.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        #{invoice.invoiceNumber}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDate(invoice.issueDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-700">
                        {formatCurrency(invoice.totalAmount)}
                      </span>
                      <InvoiceStatusBadge status={invoice.status} />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="px-5 py-8 text-center text-sm text-gray-400">
                Nog geen facturen.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
