import Link from "next/link";
import { getClients } from "@/actions/clients";
import { Plus } from "lucide-react";
import { ClientsTable } from "./clients-table";

export default async function ClientsPage() {
  const result = await getClients();
  const clients = result.success ? result.clients ?? [] : [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Klanten</h1>
          <p className="text-sm text-gray-500 mt-1">
            {clients.length} klant{clients.length !== 1 ? "en" : ""} totaal
          </p>
        </div>
        <Link href="/clients/new" className="btn-primary">
          <Plus className="h-4 w-4" />
          Nieuwe klant
        </Link>
      </div>

      <ClientsTable clients={clients} />
    </div>
  );
}
