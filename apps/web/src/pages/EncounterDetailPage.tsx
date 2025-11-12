import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useEncounterStore } from '../stores/encounterStore'
import { usePatientStore } from '../stores/patientStore'
import { ArrowLeft, Save, Mic, FileText, CheckCircle } from 'lucide-react'

export default function EncounterDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { currentEncounter, loading, fetchEncounter, updateEncounter, signEncounter } = useEncounterStore()
  const { fetchPatient, currentPatient } = usePatientStore()

  useEffect(() => {
    if (id) {
      fetchEncounter(id)
    }
  }, [id, fetchEncounter])

  useEffect(() => {
    if (currentEncounter?.patient_id) {
      fetchPatient(currentEncounter.patient_id)
    }
  }, [currentEncounter?.patient_id, fetchPatient])

  const handleSign = async () => {
    if (confirm('Are you sure you want to sign this encounter? This will finalize the documentation.')) {
      try {
        await signEncounter(id!)
        alert('Encounter signed successfully!')
      } catch (error: any) {
        alert(`Error: ${error.message}`)
      }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading encounter...</div>
      </div>
    )
  }

  if (!currentEncounter) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 mb-4">Encounter not found</div>
          <button
            onClick={() => navigate('/encounters')}
            className="text-primary-600 hover:text-primary-700"
          >
            Back to Encounters
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/encounters')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Encounters
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {currentEncounter.encounter_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Encounter
              </h1>
              {currentPatient && (
                <p className="text-gray-600 mt-2">
                  Patient: {currentPatient.first_name} {currentPatient.last_name}
                </p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                {formatDate(currentEncounter.encounter_date)}
              </p>
            </div>
            <div className="flex gap-2">
              {currentEncounter.status !== 'signed' && (
                <button
                  onClick={handleSign}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  <CheckCircle className="w-5 h-5" />
                  Sign Encounter
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mb-6">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            currentEncounter.status === 'signed' ? 'bg-green-100 text-green-800' :
            currentEncounter.status === 'completed' ? 'bg-blue-100 text-blue-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {currentEncounter.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>

        {/* Chief Complaint */}
        {currentEncounter.chief_complaint && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Chief Complaint</h2>
            <p className="text-gray-700">{currentEncounter.chief_complaint}</p>
          </div>
        )}

        {/* Transcription Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Transcription</h2>
            {currentEncounter.status === 'in_progress' && (
              <button className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">
                <Mic className="w-5 h-5" />
                Start Recording
              </button>
            )}
          </div>
          {currentEncounter.raw_transcript ? (
            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <p className="text-gray-700 whitespace-pre-wrap">{currentEncounter.raw_transcript}</p>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Mic className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No transcription yet. Click "Start Recording" to begin.</p>
            </div>
          )}
        </div>

        {/* SOAP Note Section */}
        {currentEncounter.soap_note ? (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">SOAP Note</h2>
              <button className="text-primary-600 hover:text-primary-700 text-sm">
                Generate SOAP Note
              </button>
            </div>
            <div className="space-y-4">
              {currentEncounter.soap_note.subjective && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Subjective</h3>
                  <p className="text-gray-700">{currentEncounter.soap_note.subjective}</p>
                </div>
              )}
              {currentEncounter.soap_note.objective && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Objective</h3>
                  <p className="text-gray-700">{currentEncounter.soap_note.objective}</p>
                </div>
              )}
              {currentEncounter.soap_note.assessment && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Assessment</h3>
                  <p className="text-gray-700">{currentEncounter.soap_note.assessment}</p>
                </div>
              )}
              {currentEncounter.soap_note.plan && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Plan</h3>
                  <p className="text-gray-700">{currentEncounter.soap_note.plan}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">SOAP Note</h2>
              {currentEncounter.raw_transcript && (
                <button className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">
                  <FileText className="w-5 h-5" />
                  Generate SOAP Note
                </button>
              )}
            </div>
            {!currentEncounter.raw_transcript && (
              <p className="text-gray-500 text-center py-8">
                Complete transcription first to generate SOAP note
              </p>
            )}
          </div>
        )}

        {/* Clinical Intelligence */}
        {currentEncounter.icd10_codes && currentEncounter.icd10_codes.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">ICD-10 Codes</h2>
            <div className="space-y-2">
              {currentEncounter.icd10_codes.map((code: any, index: number) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{code.code}</span>
                  <span className="text-gray-700">{code.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

