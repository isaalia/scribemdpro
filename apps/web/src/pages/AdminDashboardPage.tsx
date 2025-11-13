import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import { Users, Building2, FileText, DollarSign, TrendingUp, AlertCircle } from 'lucide-react'
import { Navigation } from '../components/Navigation'

interface DashboardStats {
  totalUsers: number
  totalPractices: number
  totalEncounters: number
  totalPatients: number
  recentEncounters: any[]
  activeSubscriptions: number
}

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalPractices: 0,
    totalEncounters: 0,
    totalPatients: 0,
    recentEncounters: [],
    activeSubscriptions: 0,
  })

  useEffect(() => {
    // Check if user is admin
    if (!user) {
      navigate('/login')
      return
    }

    if (user.role !== 'admin') {
      navigate('/')
      return
    }

    loadDashboardData()
  }, [user, navigate])

  const loadDashboardData = async () => {
    try {
      // Fetch all stats (admin can see all practices)
      const [usersResult, practicesResult, encountersResult, patientsResult] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('practices').select('id', { count: 'exact', head: true }),
        supabase.from('encounters').select('id', { count: 'exact', head: true }),
        supabase.from('patients').select('id', { count: 'exact', head: true }),
      ])

      // Fetch recent encounters
      const { data: recentEncounters } = await supabase
        .from('encounters')
        .select(`
          id,
          encounter_date,
          status,
          encounter_type,
          patients (first_name, last_name),
          users (full_name)
        `)
        .order('encounter_date', { ascending: false })
        .limit(10)

      // Count active subscriptions (placeholder - will integrate with Stripe later)
      const { data: practices } = await supabase
        .from('practices')
        .select('id')
        .eq('subscription_status', 'active')

      setStats({
        totalUsers: usersResult.count || 0,
        totalPractices: practicesResult.count || 0,
        totalEncounters: encountersResult.count || 0,
        totalPatients: patientsResult.count || 0,
        recentEncounters: recentEncounters || [],
        activeSubscriptions: practices?.length || 0,
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage practices, users, and system settings</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers}</p>
              </div>
              <div className="p-3 bg-primary-100 rounded-lg">
                <Users className="w-8 h-8 text-primary-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Practices</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalPractices}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Encounters</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalEncounters}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <FileText className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Subscriptions</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeSubscriptions}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <DollarSign className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button
            onClick={() => navigate('/admin/practices')}
            className="bg-white rounded-lg shadow p-6 text-left hover:shadow-lg transition-shadow w-full"
          >
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Manage Practices</h3>
            </div>
            <p className="text-sm text-gray-600">Create, edit, and manage practice accounts</p>
          </button>

          <button
            onClick={() => navigate('/admin/users')}
            className="bg-white rounded-lg shadow p-6 text-left hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-6 h-6 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">Manage Users</h3>
            </div>
            <p className="text-sm text-gray-600">Add, edit, and manage user accounts</p>
          </button>

          <button
            onClick={() => navigate('/admin/subscriptions')}
            className="bg-white rounded-lg shadow p-6 text-left hover:shadow-lg transition-shadow w-full"
          >
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-6 h-6 text-yellow-600" />
              <h3 className="text-lg font-semibold text-gray-900">Subscriptions</h3>
            </div>
            <p className="text-sm text-gray-600">View and manage subscription plans</p>
          </button>

          <button
            onClick={() => navigate('/admin/analytics')}
            className="bg-white rounded-lg shadow p-6 text-left hover:shadow-lg transition-shadow w-full"
          >
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Analytics</h3>
            </div>
            <p className="text-sm text-gray-600">View system-wide metrics and insights</p>
          </button>

          <button
            onClick={() => navigate('/admin/billing')}
            className="bg-white rounded-lg shadow p-6 text-left hover:shadow-lg transition-shadow w-full"
          >
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Billing</h3>
            </div>
            <p className="text-sm text-gray-600">Manage invoices and billing records</p>
          </button>

          <button
            onClick={() => navigate('/admin/integrations')}
            className="bg-white rounded-lg shadow p-6 text-left hover:shadow-lg transition-shadow w-full"
          >
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-6 h-6 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Integrations</h3>
            </div>
            <p className="text-sm text-gray-600">Manage EHR and third-party integrations</p>
          </button>

          <button
            onClick={() => navigate('/admin/audit-logs')}
            className="bg-white rounded-lg shadow p-6 text-left hover:shadow-lg transition-shadow w-full"
          >
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Audit Logs</h3>
            </div>
            <p className="text-sm text-gray-600">HIPAA-compliant access and activity logs</p>
          </button>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Encounters</h2>
          </div>
          <div className="p-6">
            {stats.recentEncounters.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No recent encounters</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Patient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Provider
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stats.recentEncounters.map((encounter: any) => (
                      <tr key={encounter.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(encounter.encounter_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {encounter.patients
                            ? `${encounter.patients.first_name} ${encounter.patients.last_name}`
                            : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {encounter.users?.full_name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {encounter.encounter_type?.replace('_', ' ') || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              encounter.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : encounter.status === 'signed'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {encounter.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

