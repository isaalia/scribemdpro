import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import { CreditCard, CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react'
import { Navigation } from '../components/Navigation'
import { PLANS } from '../../../../api/stripe/create-checkout'

interface Practice {
  id: string
  name: string
  subscription_status: string
  subscription_plan: string
  stripe_customer_id?: string
  stripe_subscription_id?: string
  subscription_start_date?: string
}

export default function AdminSubscriptionsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuthStore()
  const [practices, setPractices] = useState<Practice[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/')
      return
    }

    // Check for success/cancel messages
    if (searchParams.get('success') === 'true') {
      alert('Subscription activated successfully!')
      window.history.replaceState({}, '', '/admin/subscriptions')
    }
    if (searchParams.get('canceled') === 'true') {
      alert('Subscription setup was canceled.')
      window.history.replaceState({}, '', '/admin/subscriptions')
    }

    loadPractices()
  }, [user, navigate, searchParams])

  const loadPractices = async () => {
    try {
      const { data, error } = await supabase
        .from('practices')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPractices(data || [])
    } catch (error) {
      console.error('Error loading practices:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = async (practiceId: string, planId: string) => {
    setProcessing(practiceId)
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          practice_id: practiceId,
          plan_id: planId,
          success_url: `${window.location.origin}/admin/subscriptions?success=true`,
          cancel_url: `${window.location.origin}/admin/subscriptions?canceled=true`,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create checkout session')
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (error: any) {
      alert(`Error: ${error.message}`)
      setProcessing(null)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      canceled: 'bg-red-100 text-red-800',
      past_due: 'bg-yellow-100 text-yellow-800',
      trialing: 'bg-blue-100 text-blue-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
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
          <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
          <p className="text-gray-600 mt-2">Manage practice subscriptions and billing</p>
        </div>

        {/* Practices List */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Practices</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Practice
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Started
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {practices.map((practice) => (
                  <tr key={practice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {practice.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(practice.subscription_status || 'inactive')}`}>
                        {practice.subscription_status || 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {practice.subscription_plan ? (
                        <span className="capitalize">{practice.subscription_plan}</span>
                      ) : (
                        <span className="text-gray-400">No plan</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {practice.subscription_start_date
                        ? new Date(practice.subscription_start_date).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {practice.subscription_status === 'active' ? (
                        <span className="text-green-600">Active</span>
                      ) : (
                        <button
                          onClick={() => navigate(`/admin/subscriptions/${practice.id}`)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          Subscribe
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Subscription Plans */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(PLANS).map(([planId, plan]) => (
              <div key={planId} className="bg-white rounded-lg shadow p-6 border-2 border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate(`/admin/subscriptions/new?plan=${planId}`)}
                  className="w-full px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 flex items-center justify-center gap-2"
                >
                  Select Plan
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

