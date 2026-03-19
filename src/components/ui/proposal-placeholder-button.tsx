interface ProposalPlaceholderButtonProps {
  label?: string;
}

export function ProposalPlaceholderButton({
  label = "Offerte via n8n",
}: ProposalPlaceholderButtonProps) {
  return (
    <button
      type="button"
      disabled
      title="Deze knop koppel je later aan n8n voor het genereren van offertes."
      className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-500 cursor-not-allowed"
    >
      {label}
    </button>
  );
}
