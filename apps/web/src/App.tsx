import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import PatientsPage from './pages/PatientsPage'
import PatientFormPage from './pages/PatientFormPage'

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
      <Route path="/" element={user ? <DashboardPage /> : <Navigate to="/login" />} />
      <Route path="/patients" element={user ? <PatientsPage /> : <Navigate to="/login" />} />
      <Route path="/patients/new" element={user ? <PatientFormPage /> : <Navigate to="/login" />} />
      <Route path="/patients/:id" element={user ? <PatientFormPage /> : <Navigate to="/login" />} />
    </Routes>
  )
}

export default App

