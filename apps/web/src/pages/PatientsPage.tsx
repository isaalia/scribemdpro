import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePatientStore } from '../stores/patientStore'
import { Plus, Search, Edit, Trash2, User, FileText } from 'lucide-react'
import { Navigation } from '../components/Navigation'

export default function PatientsPage() {
  const navigate = useNavigate()
  const { patients, loading, error, fetchPatients, deletePatient, searchPatients } = usePatientStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])

  useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (query.trim()) {
      const results = await searchPatients(query)
      setSearchResults(results)
    } else {
      setSearchResults([])
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this patient?')) {
      await deletePatient(id)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const calculateAge = (dob: string) => {
    const today = new Date()
    const birthDate = new Date(dob)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const displayPatients = searchQuery.trim() ? searchResults : patients

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
            <button
              onClick={() => navigate('/patients/new')}
              className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              New Patient
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name or MRN..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && !patients.length && (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading patients...</div>
          </div>
        )}

        {/* Patients List */}
        {!loading && displayPatients.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery ? 'Try a different search term' : 'Get started by adding your first patient'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => navigate('/patients/new')}
                className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600"
              >
                Add Patient
              </button>
            )}
          </div>
        )}

        {/* Patients Table */}
        {!loading && displayPatients.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    DOB / Age
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    MRN
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary-600 font-medium">
                            {patient.first_name[0]}{patient.last_name[0]}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {patient.first_name} {patient.last_name}
                          </div>
                          {patient.gender && (
                            <div className="text-sm text-gray-500">{patient.gender}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(patient.date_of_birth)}</div>
                      <div className="text-sm text-gray-500">{calculateAge(patient.date_of_birth)} years old</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {patient.mrn || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {patient.phone || patient.email || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => navigate(`/encounters/new?patientId=${patient.id}`)}
                          className="text-green-600 hover:text-green-900"
                          title="New Encounter"
                        >
                          <FileText className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => navigate(`/patients/${patient.id}`)}
                          className="text-primary-600 hover:text-primary-900"
                          title="Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(patient.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Patient Count */}
        {!loading && patients.length > 0 && (
          <div className="mt-4 text-sm text-gray-500">
            Showing {displayPatients.length} of {patients.length} patients
          </div>
        )}
      </div>
    </div>
  )
}

