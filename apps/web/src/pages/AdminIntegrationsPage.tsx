import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import { Link, CheckCircle, XCircle, RefreshCw, Loader2 } from 'lucide-react'
import { Navigation } from '../components/Navigation'

interface Integration {
  id: string
  practice_id: string
  type: string
  status: string
  last_sync_at: string
  practices?: {
    name: string
  }
}

export default function AdminIntegrationsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuthStore()
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/')
      return
    }

    // Check for success/error messages
    if (searchParams.get('success') === 'true') {
      alert('Integration connected successfully!')
      window.history.replaceState({}, '', '/admin/integrations')
    }
    if (searchParams.get('error')) {
      alert(`Integration error: ${searchParams.get('error')}`)
      window.history.replaceState({}, '', '/admin/integrations')
    }

    loadIntegrations()
  }, [user, navigate, searchParams])

  const loadIntegrations = async () => {
    try {
      const { data, error } = await supabase
        .from('integrations')
        .select(`
          *,
          practices (name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setIntegrations(data || [])
    } catch (error) {
      console.error('Error loading integrations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async (practiceId: string, type: string) => {
    try {
      const response = await fetch(`/api/drchrono/auth?practice_id=${practiceId}`)
      if (response.redirected) {
        window.location.href = response.url
      }
    } catch (error: any) {
      alert(`Error connecting: ${error.message}`)
    }
  }

  const handleDisconnect = async (integrationId: string) => {
    if (!confirm('Are you sure you want to disconnect this integration?')) return

    try {
      const { error } = await supabase
        .from('integrations')
        .update({ status: 'disconnected' })
        .eq('id', integrationId)

      if (error) throw error
      loadIntegrations()
    } catch (error: any) {
      alert(`Error disconnecting: ${error.message}`)
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
          <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
          <p className="text-gray-600 mt-2">Manage EHR and third-party integrations</p>
        </div>

        {/* Available Integrations */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* DrChrono */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">DrChrono</h3>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Sync encounters and clinical notes to DrChrono EHR system
            </p>
            <div className="space-y-2">
              {integrations
                .filter((i) => i.type === 'drchrono')
                .map((integration) => (
                  <div key={integration.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {(integration.practices as any)?.name || 'Unknown Practice'}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          integration.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {integration.status}
                      </span>
                    </div>
                    {integration.last_sync_at && (
                      <p className="text-xs text-gray-500">
                        Last sync: {new Date(integration.last_sync_at).toLocaleString()}
                      </p>
                    )}
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleDisconnect(integration.id)}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                ))}
              <button
                onClick={() => {
                  const practiceId = prompt('Enter Practice ID to connect:')
                  if (practiceId) handleConnect(practiceId, 'drchrono')
                }}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Connect DrChrono
              </button>
            </div>
          </div>

          {/* More integrations can be added here */}
        </div>

        {/* Integration Status */}
        {integrations.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Active Integrations</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {integrations.map((integration) => (
                  <div key={integration.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary-100 rounded-lg">
                        {integration.type === 'drchrono' ? '📋' : '🔌'}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 capitalize">{integration.type}</div>
                        <div className="text-sm text-gray-600">
                          {(integration.practices as any)?.name || 'Unknown Practice'}
                        </div>
                        {integration.last_sync_at && (
                          <div className="text-xs text-gray-500 mt-1">
                            Last sync: {new Date(integration.last_sync_at).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {integration.status === 'active' ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-gray-400" />
                      )}
                      <button
                        onClick={() => handleDisconnect(integration.id)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

