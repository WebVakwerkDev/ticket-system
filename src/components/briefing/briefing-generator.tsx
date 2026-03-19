"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { generateDeveloperBriefing, saveAgentRun } from "@/actions/agent-runs";
import { Loader2, Copy, Save, Check, Wand2 } from "lucide-react";
import { ChangeRequestStatus, ChangeRequestImpact } from "@prisma/client";

interface ChangeRequest {
  id: string;
  title: string;
  status: ChangeRequestStatus;
  impact: ChangeRequestImpact;
}

interface Props {
  projectId: string;
  changeRequests: ChangeRequest[];
}

export function BriefingGenerator({ projectId, changeRequests }: Props) {
  const { data: session } = useSession();
  const [selectedCrId, setSelectedCrId] = useState<string>("");
  const [briefing, setBriefing] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!session?.user?.id) return;
    setError(null);
    setGenerating(true);
    setSaved(false);

    try {
      const result = await generateDeveloperBriefing(
        projectId,
        selectedCrId || null,
        session.user.id
      );

      if (result.success && result.briefing) {
        setBriefing(result.briefing);
      } else {
        setError(result.error ?? "Briefing genereren mislukt.");
      }
    } catch {
      setError("Er is een onverwachte fout opgetreden.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!session?.user?.id || !briefing) return;
    setSaving(true);
    setError(null);

    try {
      const result = await saveAgentRun({
        projectId,
        changeRequestId: selectedCrId || undefined,
        promptSnapshot: briefing,
        actorUserId: session.user.id,
      });

      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(result.error ?? "Briefing opslaan mislukt.");
      }
    } catch {
      setError("Briefing opslaan mislukt.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCopy() {
    if (!briefing) return;
    await navigator.clipboard.writeText(briefing);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Wand2 className="h-4 w-4 text-blue-600" />
        <h3 className="font-semibold text-gray-900">Developer briefing genereren</h3>
      </div>
      <p className="text-sm text-gray-500">
        Genereer een gestructureerde developer briefing op basis van de
        projectgegevens en optioneel een specifiek wijzigingsverzoek.
      </p>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label htmlFor="briefing-cr" className="form-label">
            Wijzigingsverzoek (optioneel)
          </label>
          <select
            id="briefing-cr"
            value={selectedCrId}
            onChange={(e) => setSelectedCrId(e.target.value)}
            className="form-select"
          >
            <option value="">Algemene briefing (geen specifiek WV)</option>
            {changeRequests
              .filter((cr) => cr.status !== "DONE")
              .map((cr) => (
                <option key={cr.id} value={cr.id}>
                  {cr.title} ({cr.impact})
                </option>
              ))}
          </select>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="btn-primary flex-shrink-0"
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Bezig met genereren…
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4" />
              Genereren
            </>
          )}
        </button>
      </div>

      {briefing && (
        <div className="space-y-3">
          <div className="relative">
            <textarea
              value={briefing}
              onChange={(e) => setBriefing(e.target.value)}
              rows={20}
              className="form-textarea font-mono text-xs leading-relaxed"
              placeholder="De gegenereerde briefing verschijnt hier…"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              className="btn-secondary"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  Gekopieerd!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Kopiëren naar klembord
                </>
              )}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Bezig met opslaan…
                </>
              ) : saved ? (
                <>
                  <Check className="h-4 w-4" />
                  Opgeslagen!
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Opslaan &amp; loggen
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
