import { useState } from 'react'
import { Calculator, Loader2, Info } from 'lucide-react'
import { useEncounterStore } from '../stores/encounterStore'

interface EMLevelCalculatorProps {
  encounterId: string
  encounter: {
    raw_transcript?: string
    soap_note?: any
    encounter_type?: string
    chief_complaint?: string
    vitals?: any
    em_level?: string
    em_reasoning?: string
  }
  onLevelUpdate?: () => void
}

export function EMLevelCalculator({ encounterId, encounter, onLevelUpdate }: EMLevelCalculatorProps) {
  const { updateEncounter } = useEncounterStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<any>(null)
  const [manualMode, setManualMode] = useState(false)
  const [manualInputs, setManualInputs] = useState({
    history_complexity: '',
    exam_complexity: '',
    mdm_complexity: '',
  })

  const handleCalculate = async () => {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/em/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: encounter.raw_transcript,
          soap_note: encounter.soap_note,
          encounter_type: encounter.encounter_type,
          chief_complaint: encounter.chief_complaint,
          vitals: encounter.vitals,
          ...(manualMode ? {
            history_complexity: manualInputs.history_complexity,
            exam_complexity: manualInputs.exam_complexity,
            mdm_complexity: manualInputs.mdm_complexity,
          } : {}),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to calculate E/M level')
      }

      const data = await response.json()
      setResult(data)

      // Auto-save to encounter
      await updateEncounter(encounterId, {
        em_level: data.em_level,
        em_reasoning: data.reasoning,
      })

      if (onLevelUpdate) onLevelUpdate()
    } catch (err: any) {
      setError(err.message || 'Failed to calculate E/M level')
      console.error('E/M calculation error:', err)
    } finally {
      setLoading(false)
    }
  }

  const hasContent = encounter.raw_transcript || encounter.soap_note || encounter.chief_complaint

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">E/M Level Calculator</h2>
          <p className="text-sm text-gray-500 mt-1">Calculate Evaluation & Management level (99211-99215)</p>
        </div>
        <button
          onClick={() => setManualMode(!manualMode)}
          className="text-sm text-primary-600 hover:text-primary-700"
        >
          {manualMode ? 'AI Mode' : 'Manual Mode'}
        </button>
      </div>

      {manualMode ? (
        <div className="space-y-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">History Complexity</label>
            <select
              value={manualInputs.history_complexity}
              onChange={(e) => setManualInputs({ ...manualInputs, history_complexity: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select...</option>
              <option value="problem-focused">Problem-focused</option>
              <option value="expanded-problem-focused">Expanded problem-focused</option>
              <option value="detailed">Detailed</option>
              <option value="comprehensive">Comprehensive</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Exam Complexity</label>
            <select
              value={manualInputs.exam_complexity}
              onChange={(e) => setManualInputs({ ...manualInputs, exam_complexity: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select...</option>
              <option value="problem-focused">Problem-focused</option>
              <option value="expanded-problem-focused">Expanded problem-focused</option>
              <option value="detailed">Detailed</option>
              <option value="comprehensive">Comprehensive</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">MDM Complexity</label>
            <select
              value={manualInputs.mdm_complexity}
              onChange={(e) => setManualInputs({ ...manualInputs, mdm_complexity: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select...</option>
              <option value="straightforward">Straightforward</option>
              <option value="low">Low</option>
              <option value="moderate">Moderate</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
      ) : (
        !hasContent && (
          <p className="text-sm text-gray-500 text-center py-4 mb-4">
            Complete transcription or SOAP note to calculate E/M level
          </p>
        )
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl font-bold text-primary-700">{result.em_level}</span>
            <div>
              <div className="font-semibold text-primary-900">{result.level_info?.name}</div>
              <div className="text-sm text-primary-700">{result.level_info?.description}</div>
            </div>
          </div>
          {result.reasoning && (
            <p className="text-sm text-primary-800 mt-2">{result.reasoning}</p>
          )}
          {result.details && Object.keys(result.details).length > 0 && (
            <div className="mt-3 pt-3 border-t border-primary-200">
              <div className="grid grid-cols-3 gap-2 text-xs">
                {result.details.history_complexity && (
                  <div>
                    <span className="font-medium">History:</span> {result.details.history_complexity}
                  </div>
                )}
                {result.details.exam_complexity && (
                  <div>
                    <span className="font-medium">Exam:</span> {result.details.exam_complexity}
                  </div>
                )}
                {result.details.mdm_complexity && (
                  <div>
                    <span className="font-medium">MDM:</span> {result.details.mdm_complexity}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {encounter.em_level && !result && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-gray-900">{encounter.em_level}</span>
            <div className="text-sm text-gray-600">
              {encounter.em_reasoning || 'E/M level previously calculated'}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={handleCalculate}
          disabled={loading || (!manualMode && !hasContent) || (manualMode && (!manualInputs.history_complexity || !manualInputs.exam_complexity || !manualInputs.mdm_complexity))}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Calculating...
            </>
          ) : (
            <>
              <Calculator className="w-4 h-4" />
              Calculate E/M Level
            </>
          )}
        </button>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Info className="w-3 h-3" />
          <span>Based on 2021/2023 CMS guidelines</span>
        </div>
      </div>
    </div>
  )
}

