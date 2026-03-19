import { notFound } from "next/navigation";
import { getClient } from "@/actions/clients";
import { EditClientForm } from "./edit-client-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function EditClientPage({
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
    <div className="max-w-2xl">
      <div className="page-header">
        <div>
          <Link
            href={`/clients/${client.id}`}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Terug naar klant
          </Link>
          <h1 className="page-title">Bewerk {client.companyName}</h1>
        </div>
      </div>
      <EditClientForm client={client} />
    </div>
  );
}
