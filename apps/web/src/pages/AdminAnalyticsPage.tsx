import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import { TrendingUp, Users, FileText, DollarSign, Activity, Calendar } from 'lucide-react'
import { Navigation } from '../components/Navigation'

interface AnalyticsData {
  totalEncounters: number
  totalPatients: number
  totalUsers: number
  totalRevenue: number
  encountersByMonth: Array<{ month: string; count: number }>
  encountersByType: Array<{ type: string; count: number }>
  topProviders: Array<{ name: string; count: number }>
  recentActivity: Array<{ type: string; description: string; timestamp: string }>
}

export default function AdminAnalyticsPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalEncounters: 0,
    totalPatients: 0,
    totalUsers: 0,
    totalRevenue: 0,
    encountersByMonth: [],
    encountersByType: [],
    topProviders: [],
    recentActivity: [],
  })
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/')
      return
    }
    loadAnalytics()
  }, [user, navigate, dateRange])

  const loadAnalytics = async () => {
    try {
      const dateFilter = getDateFilter(dateRange)

      // Get totals
      const [encountersResult, patientsResult, usersResult] = await Promise.all([
        supabase
          .from('encounters')
          .select('id', { count: 'exact', head: true })
          .gte('encounter_date', dateFilter),
        supabase.from('patients').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id', { count: 'exact', head: true }),
      ])

      // Get revenue (from invoices)
      const { data: invoices } = await supabase
        .from('invoices')
        .select('amount_cents')
        .eq('status', 'paid')
        .gte('paid_at', dateFilter)

      const totalRevenue = invoices?.reduce((sum, inv) => sum + (inv.amount_cents || 0), 0) || 0

      // Get encounters by month
      const { data: encounters } = await supabase
        .from('encounters')
        .select('encounter_date, encounter_type')
        .gte('encounter_date', dateFilter)
        .order('encounter_date', { ascending: false })

      const encountersByMonth = groupByMonth(encounters || [])
      const encountersByType = groupByType(encounters || [])

      // Get top providers
      const { data: providerEncounters } = await supabase
        .from('encounters')
        .select('provider_id, users!encounters_provider_id_fkey(full_name)')
        .gte('encounter_date', dateFilter)
        .not('provider_id', 'is', null)

      const topProviders = getTopProviders(providerEncounters || [])

      // Get recent activity
      const { data: recentEncounters } = await supabase
        .from('encounters')
        .select('id, encounter_date, encounter_type, patients(first_name, last_name)')
        .gte('encounter_date', dateFilter)
        .order('encounter_date', { ascending: false })
        .limit(10)

      const recentActivity = (recentEncounters || []).map((enc: any) => ({
        type: 'encounter',
        description: `New ${enc.encounter_type?.replace('_', ' ')} encounter for ${enc.patients?.first_name} ${enc.patients?.last_name}`,
        timestamp: enc.encounter_date,
      }))

      setAnalytics({
        totalEncounters: encountersResult.count || 0,
        totalPatients: patientsResult.count || 0,
        totalUsers: usersResult.count || 0,
        totalRevenue: totalRevenue / 100, // Convert cents to dollars
        encountersByMonth,
        encountersByType,
        topProviders,
        recentActivity,
      })
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDateFilter = (range: string) => {
    const now = new Date()
    switch (range) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()
      default:
        return '2000-01-01'
    }
  }

  const groupByMonth = (encounters: any[]) => {
    const grouped: Record<string, number> = {}
    encounters.forEach((enc) => {
      const date = new Date(enc.encounter_date)
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      grouped[month] = (grouped[month] || 0) + 1
    })
    return Object.entries(grouped)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6) // Last 6 months
  }

  const groupByType = (encounters: any[]) => {
    const grouped: Record<string, number> = {}
    encounters.forEach((enc) => {
      const type = enc.encounter_type || 'unknown'
      grouped[type] = (grouped[type] || 0) + 1
    })
    return Object.entries(grouped).map(([type, count]) => ({
      type: type.replace('_', ' '),
      count,
    }))
  }

  const getTopProviders = (encounters: any[]) => {
    const grouped: Record<string, number> = {}
    encounters.forEach((enc) => {
      const providerName = (enc.users as any)?.full_name || 'Unknown'
      grouped[providerName] = (grouped[providerName] || 0) + 1
    })
    return Object.entries(grouped)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-2">System-wide metrics and insights</p>
          </div>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Encounters</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{analytics.totalEncounters.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Patients</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{analytics.totalPatients.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{analytics.totalUsers.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">${analytics.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <DollarSign className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Encounters by Month */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Encounters by Month</h2>
            <div className="space-y-3">
              {analytics.encountersByMonth.map((item) => (
                <div key={item.month}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{item.month}</span>
                    <span className="font-medium text-gray-900">{item.count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-500 h-2 rounded-full"
                      style={{
                        width: `${(item.count / Math.max(...analytics.encountersByMonth.map((e) => e.count), 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Encounters by Type */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Encounters by Type</h2>
            <div className="space-y-3">
              {analytics.encountersByType.map((item) => (
                <div key={item.type}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 capitalize">{item.type}</span>
                    <span className="font-medium text-gray-900">{item.count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{
                        width: `${(item.count / Math.max(...analytics.encountersByType.map((e) => e.count), 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Providers & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Providers */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Providers</h2>
            <div className="space-y-3">
              {analytics.topProviders.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No data available</p>
              ) : (
                analytics.topProviders.map((provider, index) => (
                  <div key={provider.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold">
                        {index + 1}
                      </div>
                      <span className="font-medium text-gray-900">{provider.name}</span>
                    </div>
                    <span className="text-gray-600">{provider.count} encounters</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {analytics.recentActivity.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No recent activity</p>
              ) : (
                analytics.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <Activity className="w-5 h-5 text-primary-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

