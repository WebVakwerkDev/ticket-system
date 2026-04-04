import { format } from 'date-fns'
import { nl } from 'date-fns/locale'

export function useFormatting() {
  function formatDate(dateStr: string | Date | null): string {
    if (!dateStr) return '—'
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
    return format(d, 'd MMM yyyy', { locale: nl })
  }

  function formatDateTime(dateStr: string | Date | null): string {
    if (!dateStr) return '—'
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
    return format(d, 'd MMM yyyy HH:mm', { locale: nl })
  }

  function formatCurrency(value: number | string | null): string {
    if (value === null || value === undefined) return '€ 0,00'
    const num = typeof value === 'string' ? parseFloat(value) : value
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(num)
  }

  function statusColor(status: string): string {
    const colors: Record<string, string> = {
      // Project statuses
      LEAD: 'bg-gray-100 text-gray-500 border border-gray-200',
      INTAKE: 'bg-blue-500/10 text-blue-600 border border-blue-500/20',
      IN_PROGRESS: 'bg-amber-500/10 text-amber-600 border border-amber-500/20',
      WAITING_FOR_CLIENT: 'bg-orange-500/10 text-orange-600 border border-orange-500/20',
      REVIEW: 'bg-purple-500/10 text-purple-600 border border-purple-500/20',
      COMPLETED: 'bg-green-500/10 text-green-600 border border-green-500/20',
      MAINTENANCE: 'bg-cyan-500/10 text-cyan-600 border border-cyan-500/20',
      PAUSED: 'bg-red-500/10 text-red-600 border border-red-500/20',
      TESTING: 'bg-amber-500/10 text-amber-600 border border-amber-500/20',
      LIVE: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20',
      // Change request statuses
      NEW: 'bg-blue-500/10 text-blue-600 border border-blue-500/20',
      REVIEWED: 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20',
      PLANNED: 'bg-cyan-500/10 text-cyan-600 border border-cyan-500/20',
      WAITING_FOR_FEEDBACK: 'bg-orange-500/10 text-orange-600 border border-orange-500/20',
      DONE: 'bg-green-500/10 text-green-600 border border-green-500/20',
      // Invoice statuses
      DRAFT: 'bg-gray-100 text-gray-500 border border-gray-200',
      SENT: 'bg-blue-500/10 text-blue-600 border border-blue-500/20',
      PAID: 'bg-green-500/10 text-green-600 border border-green-500/20',
      OVERDUE: 'bg-red-500/10 text-red-600 border border-red-500/20',
      READY: 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20',
      // Priorities
      LOW: 'bg-gray-100 text-gray-500 border border-gray-200',
      MEDIUM: 'bg-amber-500/10 text-amber-600 border border-amber-500/20',
      HIGH: 'bg-orange-500/10 text-orange-600 border border-orange-500/20',
      URGENT: 'bg-red-500/10 text-red-600 border border-red-500/20',
      // Impact
      SMALL: 'bg-green-500/10 text-green-600 border border-green-500/20',
      LARGE: 'bg-red-500/10 text-red-600 border border-red-500/20',
      // Communication types
      EMAIL: 'bg-blue-500/10 text-blue-600 border border-blue-500/20',
      CALL: 'bg-amber-500/10 text-amber-600 border border-amber-500/20',
      MEETING: 'bg-purple-500/10 text-purple-600 border border-purple-500/20',
      WHATSAPP: 'bg-green-500/10 text-green-600 border border-green-500/20',
      DM: 'bg-pink-500/10 text-pink-600 border border-pink-500/20',
      INTERNAL: 'bg-gray-100 text-gray-500 border border-gray-200',
      OTHER: 'bg-gray-100 text-gray-500 border border-gray-200',
    }
    return colors[status] || 'bg-gray-100 text-gray-500 border border-gray-200'
  }

  function statusDot(status: string): string {
    const colors: Record<string, string> = {
      LEAD: 'bg-gray-400', INTAKE: 'bg-blue-400', IN_PROGRESS: 'bg-amber-400',
      WAITING_FOR_CLIENT: 'bg-orange-400', REVIEW: 'bg-purple-400', COMPLETED: 'bg-green-400',
      MAINTENANCE: 'bg-cyan-400', PAUSED: 'bg-red-400',
      TESTING: 'bg-amber-400', LIVE: 'bg-emerald-400',
      NEW: 'bg-blue-400', DONE: 'bg-green-400',
      DRAFT: 'bg-gray-400', SENT: 'bg-blue-400', PAID: 'bg-green-400', OVERDUE: 'bg-red-400',
      LOW: 'bg-gray-400', MEDIUM: 'bg-amber-400', HIGH: 'bg-orange-400', URGENT: 'bg-red-400',
    }
    return colors[status] || 'bg-gray-400'
  }

  function statusLabel(status: string): string {
    const labels: Record<string, string> = {
      LEAD: 'Lead', INTAKE: 'Intake', IN_PROGRESS: 'In uitvoering',
      WAITING_FOR_CLIENT: 'Wachtend op klant', REVIEW: 'Review', COMPLETED: 'Afgerond',
      MAINTENANCE: 'Onderhoud', PAUSED: 'Gepauzeerd', TESTING: 'Testen', LIVE: 'Live',
      NEW: 'Nieuw', REVIEWED: 'Beoordeeld', PLANNED: 'Gepland',
      WAITING_FOR_FEEDBACK: 'Wachtend op feedback', DONE: 'Afgerond',
      DRAFT: 'Concept', SENT: 'Verzonden', PAID: 'Betaald', OVERDUE: 'Achterstallig',
      READY: 'Gereed',
      TODO: 'Te doen',
      LOW: 'Laag', MEDIUM: 'Gemiddeld', HIGH: 'Hoog', URGENT: 'Urgent',
      SMALL: 'Klein', LARGE: 'Groot',
      EMAIL: 'E-mail', CALL: 'Telefoon', MEETING: 'Meeting', WHATSAPP: 'WhatsApp',
      DM: 'DM', INTERNAL: 'Intern', OTHER: 'Overig',
    }
    return labels[status] || status.replace(/_/g, ' ')
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
  }

  function toISODate(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  return { formatDate, formatDateTime, formatCurrency, statusColor, statusDot, statusLabel, downloadBlob, toISODate }
}
