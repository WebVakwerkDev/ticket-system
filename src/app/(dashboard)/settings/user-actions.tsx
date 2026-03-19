"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { updateUserRole, deleteUser } from "@/actions/users";
import { UserRole } from "@prisma/client";
import { Loader2, Trash2 } from "lucide-react";

const ROLES: { value: UserRole; label: string }[] = [
  { value: "ADMIN", label: "Admin" },
  { value: "EMPLOYEE", label: "Medewerker" },
  { value: "FINANCE", label: "Financiën" },
];

interface Props {
  userId: string;
  currentRole: UserRole;
  isCurrentUser: boolean;
}

export function UserActions({ userId, currentRole, isCurrentUser }: Props) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleRoleChange(newRole: UserRole) {
    if (!session?.user?.id) return;
    setLoading(true);
    try {
      await updateUserRole(userId, newRole, session.user.id);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!session?.user?.id) return;
    if (!confirm("Weet je zeker dat je deze gebruiker wilt verwijderen?")) return;
    setDeleting(true);
    try {
      const result = await deleteUser(userId, session.user.id);
      if (result.success) {
        router.refresh();
      }
    } finally {
      setDeleting(false);
    }
  }

  if (isCurrentUser) {
    return <span className="text-xs text-gray-400 text-right block">—</span>;
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
      ) : (
        <select
          value={currentRole}
          onChange={(e) => handleRoleChange(e.target.value as UserRole)}
          className="text-xs border border-gray-200 rounded px-1.5 py-1 text-gray-600 focus:outline-none focus:border-blue-400"
        >
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      )}
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="text-gray-400 hover:text-red-600 transition-colors p-1"
        title="Gebruiker verwijderen"
      >
        {deleting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Trash2 className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}
