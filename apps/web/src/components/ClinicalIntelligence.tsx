import { useState } from 'react'
import { AlertTriangle, Brain, Pill, Activity, Loader2, Sparkles } from 'lucide-react'

interface ClinicalIntelligenceProps {
  encounter: {
    raw_transcript?: string
    soap_note?: any
    vitals?: any
    chief_complaint?: string
    clinical_flags?: any[]
    differential_diagnosis?: any[]
  }
  patientAge?: number
}

export function ClinicalIntelligence({ encounter, patientAge }: ClinicalIntelligenceProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState<{
    red_flags?: Array<{
      type: string
      message: string
      severity: string
      recommendation: string
    }>
    differential_diagnosis?: Array<{
      diagnosis: string
      likelihood: string
      supporting_evidence: string
      ruling_out: string
    }>
    drug_interactions?: Array<{
      medication1: string
      medication2: string
      interaction: string
      severity: string
      recommendation: string
    }>
    vital_abnormalities?: Array<{
      vital: string
      value: string
      normal_range: string
      severity: string
      concern: string
    }>
  } | null>(null)

  const handleAnalyze = async () => {
    setLoading(true)
    setError('')
    setResults(null)

    try {
      const response = await fetch('/api/clinical/flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: encounter.raw_transcript,
          soap_note: encounter.soap_note,
          vitals: encounter.vitals,
          chief_complaint: encounter.chief_complaint,
          patient_age: patientAge,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to analyze clinical intelligence')
      }

      const data = await response.json()
      setResults(data)
    } catch (err: any) {
      setError(err.message || 'Failed to analyze clinical intelligence')
      console.error('Clinical intelligence error:', err)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-100 border-red-300 text-red-800',
      urgent: 'bg-orange-100 border-orange-300 text-orange-800',
      severe: 'bg-red-100 border-red-300 text-red-800',
      moderate: 'bg-yellow-100 border-yellow-300 text-yellow-800',
      mild: 'bg-blue-100 border-blue-300 text-blue-800',
      high: 'bg-red-100 border-red-300 text-red-800',
      low: 'bg-gray-100 border-gray-300 text-gray-800',
    }
    return colors[severity.toLowerCase()] || colors.moderate
  }

  const hasContent = encounter.raw_transcript || encounter.soap_note || encounter.chief_complaint

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Clinical Intelligence</h2>
          <p className="text-sm text-gray-500 mt-1">AI-powered clinical decision support</p>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading || !hasContent}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Analyze
            </>
          )}
        </button>
      </div>

      {!hasContent && (
        <p className="text-sm text-gray-500 text-center py-4">
          Complete transcription or SOAP note to enable clinical intelligence
        </p>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {results && (
        <div className="space-y-6">
          {/* Red Flags */}
          {results.red_flags && results.red_flags.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h3 className="font-semibold text-gray-900">Red Flags</h3>
              </div>
              <div className="space-y-2">
                {results.red_flags.map((flag, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-3 ${getSeverityColor(flag.severity)}`}
                  >
                    <div className="font-medium mb-1">{flag.message}</div>
                    <div className="text-sm opacity-90">{flag.recommendation}</div>
                    <div className="text-xs mt-1 opacity-75">Severity: {flag.severity}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Differential Diagnosis */}
          {results.differential_diagnosis && results.differential_diagnosis.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900">Differential Diagnosis</h3>
              </div>
              <div className="space-y-3">
                {results.differential_diagnosis.map((dx, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{dx.diagnosis}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(dx.likelihood)}`}>
                        {dx.likelihood} likelihood
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-1">{dx.supporting_evidence}</p>
                    {dx.ruling_out && (
                      <p className="text-xs text-gray-600">Consider: {dx.ruling_out}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Drug Interactions */}
          {results.drug_interactions && results.drug_interactions.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Pill className="w-5 h-5 text-orange-600" />
                <h3 className="font-semibold text-gray-900">Drug Interactions</h3>
              </div>
              <div className="space-y-2">
                {results.drug_interactions.map((interaction, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-3 ${getSeverityColor(interaction.severity)}`}
                  >
                    <div className="font-medium mb-1">
                      {interaction.medication1} + {interaction.medication2}
                    </div>
                    <div className="text-sm opacity-90 mb-1">{interaction.interaction}</div>
                    <div className="text-sm font-medium">{interaction.recommendation}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vital Abnormalities */}
          {results.vital_abnormalities && results.vital_abnormalities.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Vital Sign Abnormalities</h3>
              </div>
              <div className="space-y-2">
                {results.vital_abnormalities.map((abnormality, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-3 ${getSeverityColor(abnormality.severity)}`}
                  >
                    <div className="font-medium mb-1 capitalize">{abnormality.vital.replace('_', ' ')}</div>
                    <div className="text-sm">
                      <span className="font-medium">Value:</span> {abnormality.value} |{' '}
                      <span className="font-medium">Normal:</span> {abnormality.normal_range}
                    </div>
                    <div className="text-sm mt-1">{abnormality.concern}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(!results.red_flags || results.red_flags.length === 0) &&
           (!results.differential_diagnosis || results.differential_diagnosis.length === 0) &&
           (!results.drug_interactions || results.drug_interactions.length === 0) &&
           (!results.vital_abnormalities || results.vital_abnormalities.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              <p>No clinical flags detected</p>
              <p className="text-sm mt-2">Encounter appears routine</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

