import { useState, useRef } from 'react'
import { Upload, FileText, Loader2 } from 'lucide-react'

interface LabImportButtonProps {
  encounterId: string
  onImportComplete?: () => void
}

export function LabImportButton({ encounterId, onImportComplete }: LabImportButtonProps) {
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    try {
      // Read file content
      const text = await file.text()
      
      // Parse lab results (supports JSON, CSV, or plain text)
      let labResults
      try {
        labResults = JSON.parse(text)
      } catch {
        // If not JSON, treat as CSV or text
        labResults = {
          name: file.name,
          content: text,
          type: file.type,
        }
      }

      const response = await fetch('/api/labs/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          encounter_id: encounterId,
          lab_results: labResults,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to import lab results')
      }

      if (onImportComplete) onImportComplete()
      alert('Lab results imported successfully!')
    } catch (error: any) {
      alert(`Error importing lab results: ${error.message}`)
    } finally {
      setLoading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.csv,.txt,.pdf"
        onChange={handleFileSelect}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Import Lab Results"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Importing...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            Import Labs
          </>
        )}
      </button>
    </div>
  )
}

