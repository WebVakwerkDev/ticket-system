import { getClients } from "@/actions/clients";
import { getUsers } from "@/actions/users";
import { CreateProjectForm } from "./create-project-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const { clientId } = await searchParams;

  const [clientsResult, usersResult] = await Promise.all([
    getClients(),
    getUsers(),
  ]);

  const clients = clientsResult.success ? clientsResult.clients ?? [] : [];
  const users = usersResult.success ? usersResult.users ?? [] : [];

  return (
    <div className="max-w-3xl">
      <div className="page-header">
        <div>
          <Link
            href="/projects"
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Terug naar projecten
          </Link>
          <h1 className="page-title">Nieuw project</h1>
        </div>
      </div>
      <CreateProjectForm
        clients={clients}
        users={users}
        defaultClientId={clientId}
      />
    </div>
  );
}
