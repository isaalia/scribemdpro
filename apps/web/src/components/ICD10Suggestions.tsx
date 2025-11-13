import { useState } from 'react'
import { Sparkles, Check, X, Loader2 } from 'lucide-react'
import { useEncounterStore } from '../stores/encounterStore'

interface ICD10Suggestion {
  code: string
  description: string
  confidence: number
  rationale?: string
}

interface ICD10SuggestionsProps {
  encounterId: string
  encounter: {
    raw_transcript?: string
    chief_complaint?: string
    soap_note?: any
    icd10_codes?: Array<{ code: string; description: string; confidence?: number }>
  }
  onCodesUpdate?: () => void
}

export function ICD10Suggestions({ encounterId, encounter, onCodesUpdate }: ICD10SuggestionsProps) {
  const { updateEncounter } = useEncounterStore()
  const [suggestions, setSuggestions] = useState<ICD10Suggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(
    new Set(encounter.icd10_codes?.map(c => c.code) || [])
  )

  const handleSuggest = async () => {
    setLoading(true)
    setError('')
    setSuggestions([])

    try {
      const response = await fetch('/api/icd10/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: encounter.raw_transcript,
          chief_complaint: encounter.chief_complaint,
          assessment: encounter.soap_note?.assessment?.primary_diagnosis || encounter.soap_note?.assessment,
          patient_age: undefined, // Could be fetched from patient record
          encounter_type: undefined, // Could be fetched from encounter
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get ICD-10 suggestions')
      }

      const { suggestions: newSuggestions } = await response.json()
      setSuggestions(newSuggestions || [])
    } catch (err: any) {
      setError(err.message || 'Failed to generate ICD-10 suggestions')
      console.error('ICD-10 suggestion error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleCode = async (code: ICD10Suggestion) => {
    const newSelected = new Set(selectedCodes)
    
    if (newSelected.has(code.code)) {
      newSelected.delete(code.code)
    } else {
      newSelected.add(code.code)
    }
    
    setSelectedCodes(newSelected)

    // Update encounter with selected codes
    const currentCodes = encounter.icd10_codes || []
    let updatedCodes: Array<{ code: string; description: string; confidence?: number }>

    if (newSelected.has(code.code)) {
      // Add code if not already present
      if (!currentCodes.find(c => c.code === code.code)) {
        updatedCodes = [
          ...currentCodes,
          {
            code: code.code,
            description: code.description,
            confidence: code.confidence,
          },
        ]
      } else {
        updatedCodes = currentCodes
      }
    } else {
      // Remove code
      updatedCodes = currentCodes.filter(c => c.code !== code.code)
    }

    try {
      await updateEncounter(encounterId, {
        icd10_codes: updatedCodes,
      })
      if (onCodesUpdate) onCodesUpdate()
    } catch (err: any) {
      alert(`Error updating codes: ${err.message}`)
      // Revert selection
      setSelectedCodes(new Set(encounter.icd10_codes?.map(c => c.code) || []))
    }
  }

  const hasContent = encounter.raw_transcript || encounter.chief_complaint || encounter.soap_note?.assessment

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">ICD-10 Code Suggestions</h2>
        <button
          onClick={handleSuggest}
          disabled={loading || !hasContent}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Suggest Codes
            </>
          )}
        </button>
      </div>

      {!hasContent && (
        <p className="text-sm text-gray-500 text-center py-4">
          Complete transcription or assessment to generate ICD-10 code suggestions
        </p>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-3">
          {suggestions.map((suggestion, index) => {
            const isSelected = selectedCodes.has(suggestion.code)
            return (
              <div
                key={`${suggestion.code}-${index}`}
                className={`border rounded-lg p-4 transition-colors ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <button
                        onClick={() => handleToggleCode(suggestion)}
                        className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          isSelected
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-4 h-4" />
                            Selected
                          </>
                        ) : (
                          <>
                            <X className="w-4 h-4" />
                            Select
                          </>
                        )}
                      </button>
                      <span className="font-mono text-sm font-semibold bg-gray-100 px-2 py-1 rounded">
                        {suggestion.code}
                      </span>
                      <span className="text-xs text-gray-500">
                        {(suggestion.confidence * 100).toFixed(0)}% confidence
                      </span>
                    </div>
                    <p className="text-gray-900 font-medium mb-1">{suggestion.description}</p>
                    {suggestion.rationale && (
                      <p className="text-sm text-gray-600">{suggestion.rationale}</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {encounter.icd10_codes && encounter.icd10_codes.length > 0 && suggestions.length === 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Current Codes:</h3>
          {encounter.icd10_codes.map((code, index) => (
            <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
              <span className="font-mono text-sm font-semibold">{code.code}</span>
              <span className="text-gray-700">{code.description}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

