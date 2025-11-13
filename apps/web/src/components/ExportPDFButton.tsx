import { useState } from 'react'
import { FileDown, Loader2 } from 'lucide-react'

interface ExportPDFButtonProps {
  encounterId: string
  onExportComplete?: () => void
}

export function ExportPDFButton({ encounterId, onExportComplete }: ExportPDFButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ encounter_id: encounterId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to export PDF')
      }

      const { html, filename } = await response.json()

      // Open PDF in new window for printing/saving
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(html)
        printWindow.document.close()
        printWindow.focus()
        // Auto-print or allow user to save
        setTimeout(() => {
          printWindow.print()
        }, 250)
      }

      if (onExportComplete) onExportComplete()
    } catch (error: any) {
      alert(`Error exporting PDF: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <FileDown className="w-4 h-4" />
          Export PDF
        </>
      )}
    </button>
  )
}

