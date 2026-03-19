import { getClients } from "@/actions/clients";
import { getProjects } from "@/actions/projects";
import { getInvoices } from "@/actions/invoices";
import { generateInvoiceNumber } from "@/lib/utils";
import { InvoiceForm } from "./invoice-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string; projectId?: string }>;
}) {
  const { clientId: defaultClientId, projectId: defaultProjectId } =
    await searchParams;

  const [clientsResult, projectsResult, invoicesResult] = await Promise.all([
    getClients(),
    getProjects(),
    getInvoices(),
  ]);

  const clients = clientsResult.success ? clientsResult.clients ?? [] : [];
  const projects = projectsResult.success ? projectsResult.projects ?? [] : [];
  const invoices = invoicesResult.success ? invoicesResult.invoices ?? [] : [];

  // Generate next invoice number
  const lastInvoice = invoices.sort((a, b) =>
    b.invoiceNumber.localeCompare(a.invoiceNumber)
  )[0];
  const nextInvoiceNumber = generateInvoiceNumber(lastInvoice?.invoiceNumber);

  return (
    <div className="max-w-2xl">
      <div className="page-header">
        <div>
          <Link
            href="/finance"
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Terug naar financiën
          </Link>
          <h1 className="page-title">Nieuwe factuur</h1>
        </div>
      </div>
      <InvoiceForm
        clients={clients}
        projects={projects}
        defaultInvoiceNumber={nextInvoiceNumber}
        defaultClientId={defaultClientId}
        defaultProjectId={defaultProjectId}
      />
    </div>
  );
}
