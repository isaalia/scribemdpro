import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useEncounterStore } from '../stores/encounterStore'
import { usePatientStore } from '../stores/patientStore'
import { ArrowLeft, Save, Mic } from 'lucide-react'

export default function EncounterFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const patientIdFromQuery = searchParams.get('patientId')
  
  const isEdit = !!id
  const { currentEncounter, loading, fetchEncounter, createEncounter, updateEncounter } = useEncounterStore()
  const { patients, fetchPatients } = usePatientStore()

  const [formData, setFormData] = useState({
    patient_id: patientIdFromQuery || '',
    encounter_type: 'established',
    chief_complaint: '',
  })

  useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  useEffect(() => {
    if (isEdit && id) {
      fetchEncounter(id)
    }
  }, [isEdit, id, fetchEncounter])

  useEffect(() => {
    if (isEdit && currentEncounter) {
      setFormData({
        patient_id: currentEncounter.patient_id,
        encounter_type: currentEncounter.encounter_type,
        chief_complaint: currentEncounter.chief_complaint || '',
      })
    }
  }, [isEdit, currentEncounter])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (isEdit && id) {
        await updateEncounter(id, formData)
      } else {
        const encounter = await createEncounter(formData as any)
        // Navigate to encounter detail page to start transcription
        navigate(`/encounters/${encounter.id}`)
        return
      }
      navigate('/encounters')
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  if (loading && isEdit) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading encounter...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? 'Edit Encounter' : 'New Encounter'}
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          <div className="space-y-6">
            {/* Patient Selection */}
            <div>
              <label htmlFor="patient_id" className="block text-sm font-medium text-gray-700 mb-2">
                Patient *
              </label>
              <select
                id="patient_id"
                name="patient_id"
                required
                value={formData.patient_id}
                onChange={handleChange}
                disabled={!!patientIdFromQuery}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="">Select a patient...</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.first_name} {patient.last_name} (DOB: {new Date(patient.date_of_birth).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>

            {/* Encounter Type */}
            <div>
              <label htmlFor="encounter_type" className="block text-sm font-medium text-gray-700 mb-2">
                Encounter Type *
              </label>
              <select
                id="encounter_type"
                name="encounter_type"
                required
                value={formData.encounter_type}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="new_patient">New Patient</option>
                <option value="established">Established Patient</option>
                <option value="telemedicine">Telemedicine</option>
                <option value="procedure">Procedure</option>
                <option value="follow_up">Follow-up</option>
              </select>
            </div>

            {/* Chief Complaint */}
            <div>
              <label htmlFor="chief_complaint" className="block text-sm font-medium text-gray-700 mb-2">
                Chief Complaint
              </label>
              <textarea
                id="chief_complaint"
                name="chief_complaint"
                rows={3}
                value={formData.chief_complaint}
                onChange={handleChange}
                placeholder="e.g., Chest pain for 2 days"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              {isEdit ? (
                <>
                  <Save className="w-5 h-5" />
                  Update Encounter
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5" />
                  Create & Start Encounter
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

