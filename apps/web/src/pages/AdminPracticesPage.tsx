import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import { Plus, Search, Edit, Building2, Users, DollarSign } from 'lucide-react'
import { Navigation } from '../components/Navigation'

interface Practice {
  id: string
  name: string
  slug: string
  subscription_status: string
  subscription_plan: string
  created_at: string
  user_count?: number
}

export default function AdminPracticesPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [practices, setPractices] = useState<Practice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
  })

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/')
      return
    }
    loadPractices()
  }, [user, navigate])

  const loadPractices = async () => {
    try {
      const { data: practicesData, error } = await supabase
        .from('practices')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Get user counts for each practice
      const practicesWithCounts = await Promise.all(
        (practicesData || []).map(async (practice) => {
          const { count } = await supabase
            .from('users')
            .select('id', { count: 'exact', head: true })
            .eq('practice_id', practice.id)

          return {
            ...practice,
            user_count: count || 0,
          }
        })
      )

      setPractices(practicesWithCounts)
    } catch (error) {
      console.error('Error loading practices:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePractice = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { error } = await supabase.from('practices').insert({
        name: formData.name,
        slug: formData.slug.toLowerCase().replace(/\s+/g, '-'),
        subscription_status: 'inactive',
      })

      if (error) throw error

      setShowCreateModal(false)
      setFormData({ name: '', slug: '' })
      loadPractices()
    } catch (error: any) {
      alert(`Error creating practice: ${error.message}`)
    }
  }

  const filteredPractices = practices.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Practice Management</h1>
            <p className="text-gray-600 mt-2">Manage practice accounts and settings</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            <Plus className="w-5 h-5" />
            Create Practice
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search practices by name or slug..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Practices Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPractices.map((practice) => (
            <div
              key={practice.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/admin/practices/${practice.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <Building2 className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{practice.name}</h3>
                    <p className="text-sm text-gray-500">{practice.slug}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Status</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      practice.subscription_status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {practice.subscription_status || 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Plan</span>
                  <span className="font-medium text-gray-900 capitalize">
                    {practice.subscription_plan || 'None'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Users</span>
                  <span className="font-medium text-gray-900">{practice.user_count || 0}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate(`/admin/subscriptions/${practice.id}`)
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg"
                >
                  <DollarSign className="w-4 h-4" />
                  Subscription
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate(`/admin/practices/${practice.id}/users`)
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
                >
                  <Users className="w-4 h-4" />
                  Users
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredPractices.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No practices found</p>
          </div>
        )}

        {/* Create Practice Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Practice</h2>
              <form onSubmit={handleCreatePractice}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Practice Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                    <input
                      type="text"
                      required
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="practice-slug"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">URL-friendly identifier (e.g., "my-practice")</p>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                  >
                    Create Practice
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

