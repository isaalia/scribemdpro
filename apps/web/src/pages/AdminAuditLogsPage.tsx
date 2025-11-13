import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import { FileText, Search, Filter } from 'lucide-react'
import { Navigation } from '../components/Navigation'

interface AuditLog {
  id: string
  action: string
  resource_type: string
  resource_id: string
  user_id: string
  ip_address: string
  user_agent: string
  metadata: any
  created_at: string
  users?: {
    full_name: string
    email: string
  }
}

export default function AdminAuditLogsPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAction, setFilterAction] = useState<string>('all')
  const [filterResource, setFilterResource] = useState<string>('all')

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/')
      return
    }
    loadAuditLogs()
  }, [user, navigate, filterAction, filterResource])

  const loadAuditLogs = async () => {
    try {
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          users (full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(500)

      if (filterAction !== 'all') {
        query = query.eq('action', filterAction)
      }
      if (filterResource !== 'all') {
        query = query.eq('resource_type', filterResource)
      }

      const { data, error } = await query

      if (error) throw error
      setLogs(data || [])
    } catch (error) {
      console.error('Error loading audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = logs.filter(
    (log) =>
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.users as any)?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.users as any)?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      view: 'bg-blue-100 text-blue-800',
      create: 'bg-green-100 text-green-800',
      update: 'bg-yellow-100 text-yellow-800',
      delete: 'bg-red-100 text-red-800',
      sign: 'bg-purple-100 text-purple-800',
      export: 'bg-indigo-100 text-indigo-800',
      login: 'bg-gray-100 text-gray-800',
      logout: 'bg-gray-100 text-gray-800',
    }
    return colors[action.toLowerCase()] || 'bg-gray-100 text-gray-800'
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
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600 mt-2">HIPAA-compliant access and activity logging</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Actions</option>
              <option value="view">View</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="sign">Sign</option>
              <option value="export">Export</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
            </select>
            <select
              value={filterResource}
              onChange={(e) => setFilterResource(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Resources</option>
              <option value="patient">Patient</option>
              <option value="encounter">Encounter</option>
              <option value="user">User</option>
              <option value="template">Template</option>
              <option value="file">File</option>
            </select>
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Activity Log</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resource
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No audit logs found
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(log.users as any)?.full_name || 'Unknown'}
                        <div className="text-xs text-gray-500">{(log.users as any)?.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                        {log.resource_type}
                        {log.resource_id && (
                          <div className="text-xs text-gray-500 font-mono">
                            {log.resource_id.substring(0, 8)}...
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                        {log.ip_address || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {log.metadata && Object.keys(log.metadata).length > 0 ? (
                          <details className="cursor-pointer">
                            <summary className="text-primary-600 hover:text-primary-800">
                              View Details
                            </summary>
                            <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto max-w-xs">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </details>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

