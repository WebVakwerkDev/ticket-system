"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { createUser } from "@/actions/users";
import { UserRole } from "@prisma/client";
import { Loader2, ArrowLeft } from "lucide-react";

const ROLES: { value: UserRole; label: string; description: string }[] = [
  {
    value: "ADMIN",
    label: "Admin",
    description: "Volledige toegang tot alle functies en instellingen",
  },
  {
    value: "EMPLOYEE",
    label: "Medewerker",
    description: "Toegang tot projecten, klanten en communicatie",
  },
  {
    value: "FINANCE",
    label: "Financiën",
    description: "Toegang tot facturen en financiële gegevens",
  },
];

export default function NewUserPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "EMPLOYEE" as UserRole,
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.user?.id) return;
    setError(null);
    setLoading(true);

    try {
      const result = await createUser(
        {
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
        },
        session.user.id
      );

      if (result.success) {
        router.push("/settings");
      } else {
        setError(result.error ?? "Gebruiker aanmaken mislukt.");
      }
    } catch {
      setError("Er is een onverwachte fout opgetreden.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md">
      <div className="page-header">
        <div>
          <Link
            href="/settings"
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Terug naar instellingen
          </Link>
          <h1 className="page-title">Nieuwe gebruiker</h1>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
            Gebruikersgegevens
          </h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="form-label">
                Volledige naam <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={form.name}
                onChange={handleChange}
                className="form-input"
                placeholder="Jan Janssen"
              />
            </div>
            <div>
              <label htmlFor="email" className="form-label">
                E-mailadres <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                className="form-input"
                placeholder="jan@agency.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="form-label">
                Wachtwoord <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={handleChange}
                className="form-input"
                placeholder="Min. 8 tekens"
              />
            </div>
            <div>
              <label htmlFor="role" className="form-label">
                Rol
              </label>
              <select
                id="role"
                name="role"
                value={form.role}
                onChange={handleChange}
                className="form-select"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                {ROLES.find((r) => r.value === form.role)?.description}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Bezig met aanmaken…
              </>
            ) : (
              "Gebruiker aanmaken"
            )}
          </button>
          <Link href="/settings" className="btn-secondary">
            Annuleren
          </Link>
        </div>
      </form>
    </div>
  );
}
