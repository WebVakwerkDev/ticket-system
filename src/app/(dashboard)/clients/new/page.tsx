"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { createClient } from "@/actions/clients";
import { Loader2, ArrowLeft } from "lucide-react";

export default function NewClientPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    address: "",
    vatNumber: "",
    chamberOfCommerceNumber: "",
    notes: "",
    invoiceDetails: "",
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
      const result = await createClient(form, session.user.id);
      if (result.success && result.client) {
        router.push(`/clients/${result.client.id}`);
      } else {
        setError(result.error ?? "Klant aanmaken mislukt.");
      }
    } catch {
      setError("Er is een onverwachte fout opgetreden.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="page-header">
        <div>
          <Link
            href="/clients"
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Terug naar klanten
          </Link>
          <h1 className="page-title">Nieuwe klant</h1>
        </div>
      </div>

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
                placeholder="Acme B.V."
              />
            </div>
            <div>
              <label htmlFor="contactName" className="form-label">
                Contactpersoon
              </label>
              <input
                id="contactName"
                name="contactName"
                type="text"
                value={form.contactName}
                onChange={handleChange}
                className="form-input"
                placeholder="Jan Janssen"
              />
            </div>
            <div>
              <label htmlFor="email" className="form-label">
                E-mailadres
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="form-input"
                placeholder="jan@acme.nl"
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
                placeholder="+31 6 12345678"
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
                placeholder="Straat 1, 1234 AB Amsterdam"
              />
            </div>
          </div>
        </div>

        {/* Company Details */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
            Bedrijfsgegevens
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="vatNumber" className="form-label">
                Btw-nummer
              </label>
              <input
                id="vatNumber"
                name="vatNumber"
                type="text"
                value={form.vatNumber}
                onChange={handleChange}
                className="form-input"
                placeholder="NL000000000B01"
              />
            </div>
            <div>
              <label htmlFor="chamberOfCommerceNumber" className="form-label">
                Kamer van Koophandel
              </label>
              <input
                id="chamberOfCommerceNumber"
                name="chamberOfCommerceNumber"
                type="text"
                value={form.chamberOfCommerceNumber}
                onChange={handleChange}
                className="form-input"
                placeholder="12345678"
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
                placeholder="Betaaltermijnen, afwijkend factuuradres, enz."
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
                placeholder="Interne notities over deze klant…"
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
                Bezig met aanmaken…
              </>
            ) : (
              "Klant aanmaken"
            )}
          </button>
          <Link href="/clients" className="btn-secondary">
            Annuleren
          </Link>
        </div>
      </form>
    </div>
  );
}
