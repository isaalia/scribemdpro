import { useNavigate } from 'react-router-dom'
import { Users, FileText, Calendar } from 'lucide-react'
import { Navigation } from '../components/Navigation'
import { useAuthStore } from '../stores/authStore'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600 mt-2">Welcome back, {user?.full_name}!</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Patients</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">0</p>
              </div>
              <div className="bg-primary-100 rounded-full p-3">
                <Users className="w-6 h-6 text-primary-600" />
              </div>
            </div>
            <button
              onClick={() => navigate('/patients')}
              className="mt-4 text-sm text-primary-600 hover:text-primary-700"
            >
              View all →
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Encounters Today</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">0</p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <button className="mt-4 text-sm text-primary-600 hover:text-primary-700">
              View all →
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">0</p>
              </div>
              <div className="bg-yellow-100 rounded-full p-3">
                <Calendar className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <button className="mt-4 text-sm text-primary-600 hover:text-primary-700">
              View calendar →
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/patients/new')}
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-left"
            >
              <div className="bg-primary-100 rounded p-2">
                <Users className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Add New Patient</div>
                <div className="text-sm text-gray-500">Create a new patient record</div>
              </div>
            </button>

            <button
              onClick={() => navigate('/encounters/new')}
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-left"
            >
              <div className="bg-green-100 rounded p-2">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Start Encounter</div>
                <div className="text-sm text-gray-500">Begin a new patient encounter</div>
              </div>
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

