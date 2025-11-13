import { Calendar } from 'lucide-react'

interface CalendarExportButtonProps {
  encounterId: string
}

export function CalendarExportButton({ encounterId }: CalendarExportButtonProps) {
  const handleExport = () => {
    // Download iCal file
    window.location.href = `/api/calendar/download/${encounterId}.ics`
  }

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      title="Add to Calendar"
    >
      <Calendar className="w-4 h-4" />
      Add to Calendar
    </button>
  )
}

