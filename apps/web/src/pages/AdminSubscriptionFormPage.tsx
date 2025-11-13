import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Navigation } from '../components/Navigation'
import { PLANS } from '../lib/plans'

export default function AdminSubscriptionFormPage() {
  const navigate = useNavigate()
  const { practiceId } = useParams()
  const [searchParams] = useSearchParams()
  const { user } = useAuthStore()
  const [practices, setPractices] = useState<Array<{ id: string; name: string }>>([])
  const [selectedPractice, setSelectedPractice] = useState(practiceId || '')
  const [selectedPlan, setSelectedPlan] = useState(searchParams.get('plan') || '')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/')
      return
    }
    loadPractices()
  }, [user, navigate])

  const loadPractices = async () => {
    const { data } = await supabase.from('practices').select('id, name').order('name')
    if (data) setPractices(data)
  }

  const handleSubscribe = async () => {
    if (!selectedPractice || !selectedPlan) {
      alert('Please select a practice and plan')
      return
    }

    setProcessing(true)
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          practice_id: selectedPractice,
          plan_id: selectedPlan,
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
      setProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate('/admin/subscriptions')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Subscriptions
        </button>

        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Subscription</h1>

          <div className="space-y-6">
            {/* Practice Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Practice
              </label>
              <select
                value={selectedPractice}
                onChange={(e) => setSelectedPractice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                disabled={!!practiceId}
              >
                <option value="">Choose a practice...</option>
                {practices.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Plan Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Plan
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(PLANS).map(([planId, plan]) => (
                  <button
                    key={planId}
                    onClick={() => setSelectedPlan(planId)}
                    className={`p-4 border-2 rounded-lg text-left transition-colors ${
                      selectedPlan === planId
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-bold text-gray-900 mb-1">{plan.name}</div>
                    <div className="text-2xl font-bold text-gray-900 mb-2">
                      ${plan.price}
                      <span className="text-sm font-normal text-gray-600">/month</span>
                    </div>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {plan.features.slice(0, 3).map((feature, i) => (
                        <li key={i}>• {feature}</li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Plan Details */}
            {selectedPlan && PLANS[selectedPlan as keyof typeof PLANS] && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {PLANS[selectedPlan as keyof typeof PLANS].name} Plan
                </h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  {PLANS[selectedPlan as keyof typeof PLANS].features.map((feature, i) => (
                    <li key={i}>✓ {feature}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubscribe}
              disabled={!selectedPractice || !selectedPlan || processing}
              className="w-full px-4 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                'Continue to Payment'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

