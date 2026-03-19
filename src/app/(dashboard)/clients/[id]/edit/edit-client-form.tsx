"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { updateClient } from "@/actions/clients";
import { Loader2 } from "lucide-react";

interface Client {
  id: string;
  companyName: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  invoiceDetails: string | null;
}

export function EditClientForm({ client }: { client: Client }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    companyName: client.companyName,
    contactName: client.contactName ?? "",
    email: client.email ?? "",
    phone: client.phone ?? "",
    address: client.address ?? "",
    notes: client.notes ?? "",
    invoiceDetails: client.invoiceDetails ?? "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.user?.id) return;
    setError(null);
    setLoading(true);

    try {
      const result = await updateClient(client.id, form, session.user.id);
      if (result.success) {
        router.push(`/clients/${client.id}`);
      } else {
        setError(result.error ?? "Klant bijwerken mislukt.");
      }
    } catch {
      setError("Er is een onverwachte fout opgetreden.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Contact Information */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
            Contactinformatie
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label htmlFor="companyName" className="form-label">
                Bedrijfsnaam <span className="text-red-500">*</span>
              </label>
              <input
                id="companyName"
                name="companyName"
                type="text"
                required
                value={form.companyName}
                onChange={handleChange}
                className="form-input"
              />
            </div>
            <div>
              <label htmlFor="contactName" className="form-label">
                Contactpersoon <span className="text-red-500">*</span>
              </label>
              <input
                id="contactName"
                name="contactName"
                type="text"
                required
                value={form.contactName}
                onChange={handleChange}
                className="form-input"
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
              />
            </div>
            <div>
              <label htmlFor="phone" className="form-label">
                Telefoon
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                className="form-input"
              />
            </div>
            <div>
              <label htmlFor="address" className="form-label">
                Adres
              </label>
              <input
                id="address"
                name="address"
                type="text"
                value={form.address}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>
        </div>

        {/* Notes & Billing */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
            Notities &amp; facturatie
          </h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="invoiceDetails" className="form-label">
                Factuurgegevens
              </label>
              <textarea
                id="invoiceDetails"
                name="invoiceDetails"
                rows={3}
                value={form.invoiceDetails}
                onChange={handleChange}
                className="form-textarea"
              />
            </div>
            <div>
              <label htmlFor="notes" className="form-label">
                Interne notities
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={form.notes}
                onChange={handleChange}
                className="form-textarea"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Bezig met opslaan…
              </>
            ) : (
              "Wijzigingen opslaan"
            )}
          </button>
          <Link href={`/clients/${client.id}`} className="btn-secondary">
            Annuleren
          </Link>
        </div>
      </form>
    </>
  );
}
