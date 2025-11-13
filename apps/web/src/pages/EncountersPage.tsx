import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useEncounterStore } from '../stores/encounterStore'
import { usePatientStore } from '../stores/patientStore'
import { Plus, FileText, Clock, CheckCircle, Edit, Trash2 } from 'lucide-react'
import { Navigation } from '../components/Navigation'

export default function EncountersPage() {
  const navigate = useNavigate()
  const { patientId } = useParams()
  const { encounters, loading, error, fetchEncounters, deleteEncounter } = useEncounterStore()
  const { fetchPatient, currentPatient } = usePatientStore()

  useEffect(() => {
    if (patientId) {
      fetchPatient(patientId)
      fetchEncounters(patientId)
    } else {
      fetchEncounters()
    }
  }, [patientId, fetchEncounters, fetchPatient])

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this encounter?')) {
      await deleteEncounter(id)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800',
      signed: 'bg-green-100 text-green-800',
      exported: 'bg-gray-100 text-gray-800',
    }
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {patientId && currentPatient
                  ? `Encounters - ${currentPatient.first_name} ${currentPatient.last_name}`
                  : 'Encounters'}
              </h1>
              {patientId && (
                <button
                  onClick={() => navigate('/patients')}
                  className="text-sm text-primary-600 hover:text-primary-700 mt-2"
                >
                  ← Back to Patients
                </button>
              )}
            </div>
            <button
              onClick={() => navigate(patientId ? `/encounters/new?patientId=${patientId}` : '/encounters/new')}
              className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              New Encounter
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && !encounters.length && (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading encounters...</div>
          </div>
        )}

        {/* Empty State */}
        {!loading && encounters.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No encounters found</h3>
            <p className="text-gray-500 mb-4">Get started by creating your first encounter</p>
            <button
              onClick={() => navigate('/encounters/new')}
              className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600"
            >
              Create Encounter
            </button>
          </div>
        )}

        {/* Encounters List */}
        {!loading && encounters.length > 0 && (
          <div className="space-y-4">
            {encounters.map((encounter) => (
              <div key={encounter.id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {encounter.encounter_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(encounter.status)}`}>
                        {encounter.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDate(encounter.encounter_date)}
                      </div>
                      {encounter.chief_complaint && (
                        <div className="text-gray-700">
                          <span className="font-medium">CC:</span> {encounter.chief_complaint}
                        </div>
                      )}
                    </div>
                    {encounter.soap_note && (
                      <div className="flex items-center gap-1 text-sm text-green-600 mt-2">
                        <CheckCircle className="w-4 h-4" />
                        SOAP note generated
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/encounters/${encounter.id}`)}
                      className="text-primary-600 hover:text-primary-900"
                      title="View"
                    >
                      <FileText className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => navigate(`/encounters/${encounter.id}/edit`)}
                      className="text-primary-600 hover:text-primary-900"
                      title="Edit"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(encounter.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

