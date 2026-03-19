import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getUsers } from "@/actions/users";
import { getBusinessSettings } from "@/actions/business-settings";
import { UserRole } from "@prisma/client";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { UserActions } from "./user-actions";
import { BusinessSettingsForm } from "./business-settings-form";

const ROLE_VARIANTS: Record<UserRole, Parameters<typeof Badge>[0]["variant"]> = {
  ADMIN: "danger",
  EMPLOYEE: "info",
  FINANCE: "purple",
};

export default async function SettingsPage() {
  const session = await requireRole([UserRole.ADMIN]);
  const [usersResult, settingsResult] = await Promise.all([
    getUsers(),
    getBusinessSettings(),
  ]);
  const users = usersResult.success ? usersResult.users ?? [] : [];
  const settings = settingsResult.success ? settingsResult.settings : null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Instellingen</h1>
          <p className="text-sm text-gray-500 mt-1">
            Beheer gebruikers en applicatie-instellingen
          </p>
        </div>
      </div>

      {/* Business settings section */}
      <div className="card mb-6">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="font-semibold text-gray-900">Bedrijfsinstellingen</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Deze gegevens en documentdefaults worden automatisch gebruikt in offertes, facturen en uitgaande communicatie.
          </p>
        </div>
        <div className="p-5">
          <BusinessSettingsForm initial={settings} />
        </div>
      </div>

      {/* Users section */}
      <div className="card">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="font-semibold text-gray-900">Gebruikers</h2>
            <p className="text-sm text-gray-500">
              {users.length} gebruiker{users.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Link href="/settings/users/new" className="btn-primary">
            <Plus className="h-4 w-4" />
            Gebruiker uitnodigen
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left">
                <th className="px-5 py-3 font-medium text-gray-600">Naam</th>
                <th className="px-5 py-3 font-medium text-gray-600">E-mail</th>
                <th className="px-5 py-3 font-medium text-gray-600">Rol</th>
                <th className="px-5 py-3 font-medium text-gray-600">Lid sinds</th>
                <th className="px-5 py-3 font-medium text-gray-600 text-right">
                  Acties
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-700 text-xs font-semibold">
                          {user.name
                            .split(" ")
                            .slice(0, 2)
                            .map((w) => w[0])
                            .join("")
                            .toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium text-gray-900">
                        {user.name}
                      </span>
                      {user.id === session.user.id && (
                        <span className="text-xs text-gray-400">(jij)</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{user.email}</td>
                  <td className="px-5 py-3">
                    <Badge variant={ROLE_VARIANTS[user.role]}>
                      {user.role}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString("nl-NL", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-3">
                    <UserActions
                      userId={user.id}
                      currentRole={user.role}
                      isCurrentUser={user.id === session.user.id}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
