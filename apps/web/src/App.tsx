import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import PatientsPage from './pages/PatientsPage'
import PatientFormPage from './pages/PatientFormPage'
import EncountersPage from './pages/EncountersPage'
import EncounterFormPage from './pages/EncounterFormPage'
import EncounterDetailPage from './pages/EncounterDetailPage'
import TemplatesPage from './pages/TemplatesPage'
import TemplateFormPage from './pages/TemplateFormPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminUsersPage from './pages/AdminUsersPage'
import AdminSubscriptionsPage from './pages/AdminSubscriptionsPage'
import AdminSubscriptionFormPage from './pages/AdminSubscriptionFormPage'
import AdminAnalyticsPage from './pages/AdminAnalyticsPage'
import AdminBillingPage from './pages/AdminBillingPage'
import AdminPracticesPage from './pages/AdminPracticesPage'
import AdminIntegrationsPage from './pages/AdminIntegrationsPage'
import AdminAuditLogsPage from './pages/AdminAuditLogsPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'

function App() {
  const { user, loading } = useAuthStore()

  // Check for missing env vars
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-yellow-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-yellow-600 mb-4">Configuration Error</h1>
          <p className="text-gray-700 mb-4">
            Missing Supabase environment variables. Please check your <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code> file.
          </p>
          <div className="bg-gray-100 p-4 rounded text-sm font-mono text-gray-800 mb-4">
            <div>VITE_SUPABASE_URL: {supabaseUrl ? '✅ Set' : '❌ Missing'}</div>
            <div>VITE_SUPABASE_ANON_KEY: {supabaseKey ? '✅ Set' : '❌ Missing'}</div>
          </div>
          <p className="text-sm text-gray-600">
            Make sure <code className="bg-gray-100 px-1 rounded">.env.local</code> exists in the root directory with your Supabase credentials.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-lg font-medium text-gray-700 mb-2">Loading...</div>
          <div className="text-sm text-gray-500">Initializing ScribeMD Pro</div>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
      <Route path="/forgot-password" element={!user ? <ForgotPasswordPage /> : <Navigate to="/" />} />
      <Route path="/reset-password" element={!user ? <ResetPasswordPage /> : <Navigate to="/" />} />
      {/* Signup route disabled - admin creates accounts */}
      <Route path="/" element={user ? <DashboardPage /> : <Navigate to="/login" />} />
      <Route path="/patients" element={user ? <PatientsPage /> : <Navigate to="/login" />} />
      <Route path="/patients/new" element={user ? <PatientFormPage /> : <Navigate to="/login" />} />
      <Route path="/patients/:id" element={user ? <PatientFormPage /> : <Navigate to="/login" />} />
      <Route path="/encounters" element={user ? <EncountersPage /> : <Navigate to="/login" />} />
      <Route path="/encounters/new" element={user ? <EncounterFormPage /> : <Navigate to="/login" />} />
      <Route path="/encounters/:id/edit" element={user ? <EncounterFormPage /> : <Navigate to="/login" />} />
      <Route path="/encounters/:id" element={user ? <EncounterDetailPage /> : <Navigate to="/login" />} />
      <Route path="/patients/:patientId/encounters" element={user ? <EncountersPage /> : <Navigate to="/login" />} />
      <Route path="/templates" element={user ? <TemplatesPage /> : <Navigate to="/login" />} />
      <Route path="/templates/new" element={user ? <TemplateFormPage /> : <Navigate to="/login" />} />
      <Route path="/templates/:id/edit" element={user ? <TemplateFormPage /> : <Navigate to="/login" />} />
      
      {/* Admin Routes */}
      <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboardPage /> : <Navigate to="/" />} />
      <Route path="/admin/users" element={user?.role === 'admin' ? <AdminUsersPage /> : <Navigate to="/" />} />
      <Route path="/admin/subscriptions" element={user?.role === 'admin' ? <AdminSubscriptionsPage /> : <Navigate to="/" />} />
      <Route path="/admin/subscriptions/new" element={user?.role === 'admin' ? <AdminSubscriptionFormPage /> : <Navigate to="/" />} />
      <Route path="/admin/subscriptions/:practiceId" element={user?.role === 'admin' ? <AdminSubscriptionFormPage /> : <Navigate to="/" />} />
      <Route path="/admin/analytics" element={user?.role === 'admin' ? <AdminAnalyticsPage /> : <Navigate to="/" />} />
      <Route path="/admin/billing" element={user?.role === 'admin' ? <AdminBillingPage /> : <Navigate to="/" />} />
      <Route path="/admin/practices" element={user?.role === 'admin' ? <AdminPracticesPage /> : <Navigate to="/" />} />
      <Route path="/admin/integrations" element={user?.role === 'admin' ? <AdminIntegrationsPage /> : <Navigate to="/" />} />
      <Route path="/admin/audit-logs" element={user?.role === 'admin' ? <AdminAuditLogsPage /> : <Navigate to="/" />} />
    </Routes>
  )
}

export default App

