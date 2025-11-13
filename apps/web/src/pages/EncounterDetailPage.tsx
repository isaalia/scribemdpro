import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useEncounterStore } from '../stores/encounterStore'
import { usePatientStore } from '../stores/patientStore'
import { ArrowLeft, Save, Mic, FileText, CheckCircle } from 'lucide-react'
import { TranscriptionPanel } from '../components/TranscriptionPanel'
import { VitalSignsPanel } from '../components/VitalSignsPanel'
import { FileUploadPanel } from '../components/FileUploadPanel'
import { ICD10Suggestions } from '../components/ICD10Suggestions'
import { EMLevelCalculator } from '../components/EMLevelCalculator'
import { ClinicalIntelligence } from '../components/ClinicalIntelligence'
import { ExportPDFButton } from '../components/ExportPDFButton'
import { Navigation } from '../components/Navigation'

export default function EncounterDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { currentEncounter, loading, fetchEncounter, updateEncounter, signEncounter, generateSOAP } = useEncounterStore()
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

  const [isGeneratingSOAP, setIsGeneratingSOAP] = useState(false)
  const [soapError, setSoapError] = useState('')

  const handleGenerateSOAP = async () => {
    if (!currentEncounter?.raw_transcript) {
      setSoapError('Please complete transcription first before generating SOAP note.')
      return
    }

    if (confirm('Generate SOAP note from transcript? This may take a few moments.')) {
      setIsGeneratingSOAP(true)
      setSoapError('')
      try {
        await generateSOAP(id!)
        // Refresh encounter to get updated SOAP note
        if (id) {
          await fetchEncounter(id)
        }
        setSoapError('')
      } catch (error: any) {
        setSoapError(error.message || 'Failed to generate SOAP note. Please try again.')
        console.error('SOAP generation error:', error)
      } finally {
        setIsGeneratingSOAP(false)
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
      <Navigation />
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
              <ExportPDFButton encounterId={currentEncounter.id} />
              {currentEncounter.status !== 'signed' && (
                <button
                  onClick={handleSignEncounter}
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

        {/* Vital Signs */}
        <div className="mb-6">
          <VitalSignsPanel
            encounterId={currentEncounter.id}
            initialVitals={currentEncounter.vitals}
            onSave={() => {
              if (id) {
                fetchEncounter(id)
              }
            }}
          />
        </div>

        {/* Transcription Section */}
        {currentEncounter.status === 'in_progress' ? (
          <TranscriptionPanel encounterId={currentEncounter.id} />
        ) : (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Transcription</h2>
            {currentEncounter.raw_transcript ? (
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <p className="text-gray-700 whitespace-pre-wrap">{currentEncounter.raw_transcript}</p>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Mic className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>No transcription available for this encounter.</p>
              </div>
            )}
          </div>
        )}

        {/* SOAP Note Section */}
        {currentEncounter.soap_note ? (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">SOAP Note</h2>
              <button
                onClick={handleGenerateSOAP}
                disabled={isGeneratingSOAP || loading}
                className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <FileText className="w-4 h-4" />
                {isGeneratingSOAP ? 'Regenerating...' : 'Regenerate SOAP Note'}
              </button>
            </div>
            {soapError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
                {soapError}
              </div>
            )}
            {isGeneratingSOAP && (
              <div className="flex items-center gap-2 text-primary-600 mb-4">
                <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Regenerating SOAP note from transcript...</span>
              </div>
            )}
            <div className="space-y-4">
              {currentEncounter.soap_note.subjective && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Subjective</h3>
                  {typeof currentEncounter.soap_note.subjective === 'object' ? (
                    <div className="space-y-2">
                      {currentEncounter.soap_note.subjective.chief_complaint && (
                        <p><strong>Chief Complaint:</strong> {currentEncounter.soap_note.subjective.chief_complaint}</p>
                      )}
                      {currentEncounter.soap_note.subjective.hpi && (
                        <p><strong>HPI:</strong> {currentEncounter.soap_note.subjective.hpi}</p>
                      )}
                      {currentEncounter.soap_note.subjective.ros && (
                        <p><strong>ROS:</strong> {currentEncounter.soap_note.subjective.ros}</p>
                      )}
                      {currentEncounter.soap_note.subjective.note && (
                        <p className="text-gray-700">{currentEncounter.soap_note.subjective.note}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-700">{currentEncounter.soap_note.subjective}</p>
                  )}
                </div>
              )}
              {currentEncounter.soap_note.objective && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Objective</h3>
                  {typeof currentEncounter.soap_note.objective === 'object' ? (
                    <div className="space-y-2">
                      {currentEncounter.soap_note.objective.physical_exam && (
                        <p><strong>Physical Exam:</strong> {currentEncounter.soap_note.objective.physical_exam}</p>
                      )}
                      {currentEncounter.soap_note.objective.vitals && (
                        <p><strong>Vitals:</strong> {currentEncounter.soap_note.objective.vitals}</p>
                      )}
                      {currentEncounter.soap_note.objective.diagnostic_tests && (
                        <p><strong>Diagnostic Tests:</strong> {currentEncounter.soap_note.objective.diagnostic_tests}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-700">{currentEncounter.soap_note.objective}</p>
                  )}
                </div>
              )}
              {currentEncounter.soap_note.assessment && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Assessment</h3>
                  {typeof currentEncounter.soap_note.assessment === 'object' ? (
                    <div className="space-y-2">
                      {currentEncounter.soap_note.assessment.primary_diagnosis && (
                        <p><strong>Primary Diagnosis:</strong> {currentEncounter.soap_note.assessment.primary_diagnosis}</p>
                      )}
                      {currentEncounter.soap_note.assessment.differential_diagnosis && (
                        <div>
                          <strong>Differential Diagnosis:</strong>
                          <ul className="list-disc list-inside ml-4">
                            {currentEncounter.soap_note.assessment.differential_diagnosis.map((dx: string, i: number) => (
                              <li key={i}>{dx}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-700">{currentEncounter.soap_note.assessment}</p>
                  )}
                </div>
              )}
              {currentEncounter.soap_note.plan && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Plan</h3>
                  {typeof currentEncounter.soap_note.plan === 'object' ? (
                    <div className="space-y-2">
                      {currentEncounter.soap_note.plan.treatment && (
                        <p><strong>Treatment:</strong> {currentEncounter.soap_note.plan.treatment}</p>
                      )}
                      {currentEncounter.soap_note.plan.medications && (
                        <div>
                          <strong>Medications:</strong>
                          <ul className="list-disc list-inside ml-4">
                            {currentEncounter.soap_note.plan.medications.map((med: string, i: number) => (
                              <li key={i}>{med}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {currentEncounter.soap_note.plan.follow_up && (
                        <p><strong>Follow-up:</strong> {currentEncounter.soap_note.plan.follow_up}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-700">{currentEncounter.soap_note.plan}</p>
                  )}
                </div>
              )}
              {currentEncounter.soap_note.icd10_codes && currentEncounter.soap_note.icd10_codes.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">ICD-10 Codes</h3>
                  <div className="space-y-1">
                    {currentEncounter.soap_note.icd10_codes.map((code: any, i: number) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{code.code}</span>
                        <span className="text-gray-700">{code.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {currentEncounter.soap_note.em_level && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">E/M Level</h3>
                  <p className="text-gray-700">{currentEncounter.soap_note.em_level}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">SOAP Note</h2>
              {currentEncounter.raw_transcript && (
                <button
                  onClick={handleGenerateSOAP}
                  disabled={isGeneratingSOAP || loading}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileText className="w-5 h-5" />
                  {isGeneratingSOAP ? 'Generating...' : 'Generate SOAP Note'}
                </button>
              )}
            </div>
            {!currentEncounter.raw_transcript && (
              <p className="text-gray-500 text-center py-8">
                Complete transcription first to generate SOAP note
              </p>
            )}
            {soapError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mt-4">
                {soapError}
              </div>
            )}
            {isGeneratingSOAP && (
              <div className="flex items-center gap-2 text-primary-600 mt-4">
                <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Generating SOAP note from transcript...</span>
              </div>
            )}
          </div>
        )}

        {/* File Attachments */}
        <div className="mb-6">
          <FileUploadPanel
            encounterId={currentEncounter.id}
            initialFiles={currentEncounter.files || []}
            onFilesChange={() => {
              if (id) {
                fetchEncounter(id)
              }
            }}
          />
        </div>

        {/* Clinical Intelligence Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* ICD-10 Code Suggestions */}
          <ICD10Suggestions
            encounterId={currentEncounter.id}
            encounter={currentEncounter}
            onCodesUpdate={() => {
              if (id) {
                fetchEncounter(id)
              }
            }}
          />

          {/* E/M Level Calculator */}
          <EMLevelCalculator
            encounterId={currentEncounter.id}
            encounter={currentEncounter}
            onLevelUpdate={() => {
              if (id) {
                fetchEncounter(id)
              }
            }}
          />
        </div>

        {/* Clinical Intelligence Analysis */}
        <div className="mb-6">
          <ClinicalIntelligence
            encounter={currentEncounter}
            patientAge={currentPatient ? Math.floor((Date.now() - new Date(currentPatient.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : undefined}
          />
        </div>

        {/* Clinical Intelligence - Display Selected Codes */}
        {currentEncounter.icd10_codes && currentEncounter.icd10_codes.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Selected ICD-10 Codes</h2>
            <div className="space-y-2">
              {currentEncounter.icd10_codes.map((code: any, index: number) => (
                <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                  <span className="font-mono text-sm font-semibold bg-white px-2 py-1 rounded border">{code.code}</span>
                  <span className="text-gray-700">{code.description}</span>
                  {code.confidence && (
                    <span className="text-xs text-gray-500 ml-auto">
                      {(code.confidence * 100).toFixed(0)}% confidence
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

