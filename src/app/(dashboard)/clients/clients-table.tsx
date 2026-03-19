"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Building2, Pencil, Eye } from "lucide-react";

interface Client {
  id: string;
  companyName: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  _count: { projects: number };
}

export function ClientsTable({ clients }: { clients: Client[] }) {
  const [search, setSearch] = useState("");

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.companyName.toLowerCase().includes(q) ||
      (c.contactName ?? "").toLowerCase().includes(q) ||
      (c.email ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="card">
      {/* Search */}
      <div className="border-b border-gray-100 p-4">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Zoek klanten…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input pl-9"
          />
        </div>
      </div>

      {/* Table */}
      {filtered.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left">
                <th className="px-5 py-3 font-medium text-gray-600">Bedrijf</th>
                <th className="px-5 py-3 font-medium text-gray-600">Contact</th>
                <th className="px-5 py-3 font-medium text-gray-600">E-mail</th>
                <th className="px-5 py-3 font-medium text-gray-600">Telefoon</th>
                <th className="px-5 py-3 font-medium text-gray-600 text-center">
                  Projecten
                </th>
                <th className="px-5 py-3 font-medium text-gray-600 text-right">
                  Acties
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((client) => (
                <tr
                  key={client.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-3.5 w-3.5 text-blue-600" />
                      </div>
                      <span className="font-medium text-gray-900">
                        {client.companyName}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {client.contactName ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {client.email ? (
                      <a
                        href={`mailto:${client.email}`}
                        className="hover:text-blue-600"
                      >
                        {client.email}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {client.phone ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs font-medium text-gray-700">
                      {client._count.projects}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/clients/${client.id}`}
                        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Bekijken
                      </Link>
                      <Link
                        href={`/clients/${client.id}/edit`}
                        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Bewerken
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Building2 className="h-10 w-10 text-gray-300 mb-3" />
          <p className="font-medium text-gray-600">
            {search ? "Geen klanten gevonden voor je zoekopdracht" : "Nog geen klanten"}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {search
              ? "Probeer een andere zoekterm"
              : "Voeg je eerste klant toe om te beginnen"}
          </p>
          {!search && (
            <Link href="/clients/new" className="btn-primary mt-4">
              Klant toevoegen
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
