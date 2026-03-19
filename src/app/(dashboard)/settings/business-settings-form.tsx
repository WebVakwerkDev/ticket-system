"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { updateBusinessSettings } from "@/actions/business-settings";
import type { BusinessSettings } from "@prisma/client";

interface Props {
  initial: BusinessSettings | null;
}

export function BusinessSettingsForm({ initial }: Props) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    companyName: initial?.companyName ?? "",
    address: initial?.address ?? "",
    kvkNumber: initial?.kvkNumber ?? "",
    vatNumber: initial?.vatNumber ?? "",
    iban: initial?.iban ?? "",
    bankName: initial?.bankName ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    logoUrl: initial?.logoUrl ?? "",
    websiteUrl: initial?.websiteUrl ?? "",
    defaultVatRate: initial?.defaultVatRate?.toString() ?? "21",
    paymentTermDays: initial?.paymentTermDays?.toString() ?? "30",
    defaultQuoteValidDays: initial?.defaultQuoteValidDays?.toString() ?? "30",
    defaultPriceLabel: initial?.defaultPriceLabel ?? "Projectprijs",
    quoteFooterText: initial?.quoteFooterText ?? "",
    invoiceFooterText: initial?.invoiceFooterText ?? "",
    defaultTermsText: initial?.defaultTermsText ?? "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setSaved(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.user?.id) return;
    setLoading(true);
    setError(null);
    setSaved(false);

    const result = await updateBusinessSettings(
      {
        companyName: form.companyName,
        address: form.address || undefined,
        kvkNumber: form.kvkNumber || undefined,
        vatNumber: form.vatNumber || undefined,
        iban: form.iban || undefined,
        bankName: form.bankName || undefined,
        email: form.email,
        phone: form.phone || undefined,
        logoUrl: form.logoUrl || undefined,
        websiteUrl: form.websiteUrl || undefined,
        defaultVatRate: Number(form.defaultVatRate),
        paymentTermDays: Number(form.paymentTermDays),
        defaultQuoteValidDays: Number(form.defaultQuoteValidDays),
        defaultPriceLabel: form.defaultPriceLabel,
        quoteFooterText: form.quoteFooterText || undefined,
        invoiceFooterText: form.invoiceFooterText || undefined,
        defaultTermsText: form.defaultTermsText || undefined,
      },
      session.user.id
    );

    setLoading(false);
    if (result.success) {
      setSaved(true);
    } else {
      setError(result.error ?? "Opslaan mislukt.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-8">
        <section>
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Bedrijf</h3>
            <p className="mt-1 text-sm text-gray-500">
              Gegevens die op offertes, facturen en communicatie terugkomen.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="form-label">Bedrijfsnaam *</label>
              <input
                name="companyName"
                required
                className="form-input"
                value={form.companyName}
                onChange={handleChange}
                placeholder="Webvakwerk"
              />
            </div>

            <div className="col-span-2">
              <label className="form-label">Adres</label>
              <input
                name="address"
                className="form-input"
                value={form.address}
                onChange={handleChange}
                placeholder="Straat 1, 1234 AB Amsterdam"
              />
            </div>

            <div>
              <label className="form-label">KVK-nummer</label>
              <input
                name="kvkNumber"
                className="form-input"
                value={form.kvkNumber}
                onChange={handleChange}
                placeholder="12345678"
                maxLength={8}
              />
            </div>

            <div>
              <label className="form-label">BTW-nummer</label>
              <input
                name="vatNumber"
                className="form-input"
                value={form.vatNumber}
                onChange={handleChange}
                placeholder="NL000000000B00"
              />
            </div>

            <div>
              <label className="form-label">IBAN</label>
              <input
                name="iban"
                className="form-input"
                value={form.iban}
                onChange={handleChange}
                placeholder="NL00BANK0000000000"
              />
            </div>

            <div>
              <label className="form-label">Banknaam</label>
              <input
                name="bankName"
                className="form-input"
                value={form.bankName}
                onChange={handleChange}
                placeholder="ABN AMRO"
              />
            </div>

            <div>
              <label className="form-label">E-mail *</label>
              <input
                name="email"
                type="email"
                required
                className="form-input"
                value={form.email}
                onChange={handleChange}
                placeholder="info@bedrijf.nl"
              />
            </div>

            <div>
              <label className="form-label">Telefoon</label>
              <input
                name="phone"
                className="form-input"
                value={form.phone}
                onChange={handleChange}
                placeholder="+31 6 00000000"
              />
            </div>

            <div>
              <label className="form-label">Website URL</label>
              <input
                name="websiteUrl"
                type="url"
                className="form-input"
                value={form.websiteUrl}
                onChange={handleChange}
                placeholder="https://bedrijf.nl"
              />
            </div>

            <div>
              <label className="form-label">Logo URL</label>
              <input
                name="logoUrl"
                type="url"
                className="form-input"
                value={form.logoUrl}
                onChange={handleChange}
                placeholder="https://bedrijf.nl/logo.png"
              />
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Workflow & documenten</h3>
            <p className="mt-1 text-sm text-gray-500">
              Zakelijke defaults voor offertes, facturen en uitgaande communicatie.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Standaard BTW (%)</label>
              <input
                name="defaultVatRate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                className="form-input"
                value={form.defaultVatRate}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="form-label">Betaaltermijn (dagen)</label>
              <input
                name="paymentTermDays"
                type="number"
                min="1"
                max="365"
                step="1"
                className="form-input"
                value={form.paymentTermDays}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="form-label">Offerte geldig (dagen)</label>
              <input
                name="defaultQuoteValidDays"
                type="number"
                min="1"
                max="365"
                step="1"
                className="form-input"
                value={form.defaultQuoteValidDays}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="form-label">Standaard prijslabel</label>
              <input
                name="defaultPriceLabel"
                className="form-input"
                value={form.defaultPriceLabel}
                onChange={handleChange}
                placeholder="Projectprijs"
              />
            </div>

            <div className="col-span-2">
              <label className="form-label">Offerte footer</label>
              <textarea
                name="quoteFooterText"
                className="form-textarea"
                rows={3}
                value={form.quoteFooterText}
                onChange={handleChange}
                placeholder="Bijvoorbeeld: Deze offerte is geldig gedurende 30 dagen."
              />
            </div>

            <div className="col-span-2">
              <label className="form-label">Factuur footer</label>
              <textarea
                name="invoiceFooterText"
                className="form-textarea"
                rows={3}
                value={form.invoiceFooterText}
                onChange={handleChange}
                placeholder="Bijvoorbeeld: Bedankt voor de samenwerking."
              />
            </div>

            <div className="col-span-2">
              <label className="form-label">Standaard voorwaarden / notities</label>
              <textarea
                name="defaultTermsText"
                className="form-textarea"
                rows={4}
                value={form.defaultTermsText}
                onChange={handleChange}
                placeholder="Tekst die standaard meegaat in offertes of facturen."
              />
            </div>

            <div className="col-span-2">
              <label className="form-label">E-mailhandtekening</label>
              <textarea
                className="form-textarea"
                rows={4}
                onChange={handleChange}
                placeholder="Met vriendelijke groet..."
              />
            </div>
          </div>
        </section>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Opslaan…" : "Opslaan"}
        </button>
        {saved && (
          <span className="text-sm text-green-600 font-medium">✓ Opgeslagen</span>
        )}
      </div>
    </form>
  );
}
