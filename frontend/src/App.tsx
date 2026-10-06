import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from './pages/LoginPage'
import { Dashboard } from './pages/Dashboard'
import { Users } from './pages/Users'
import { Infos } from './pages/Infos'
import { Invites } from './pages/Invites'
import { Plans } from './pages/Plans'
import { Closings } from './pages/Closings'
import { FGInvites } from './pages/FGInvites'
import { FeelGoods } from './pages/FeelGoods'
import { DailyUpdates } from './pages/DailyUpdates'
import { PipelineUpdates } from './pages/PipelineUpdates'
import { KIV } from './pages/KIV'
import { Reports } from './pages/Reports'
import { PlanScheduler } from './pages/PlanScheduler'
import { ProtectedRoute } from './components/ProtectedRoute'
import { useAuth } from './hooks/useAuth'
import { useOAuthCallback } from './hooks/useOAuthCallback'

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth()
  useOAuthCallback()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="inline-block">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <Users />
          </ProtectedRoute>
        }
      />
      <Route
        path="/infos"
        element={
          <ProtectedRoute>
            <Infos />
          </ProtectedRoute>
        }
      />
      <Route
        path="/invites"
        element={
          <ProtectedRoute>
            <Invites />
          </ProtectedRoute>
        }
      />
      <Route
        path="/plans"
        element={
          <ProtectedRoute>
            <Plans />
          </ProtectedRoute>
        }
      />
      <Route
        path="/closings"
        element={
          <ProtectedRoute>
            <Closings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/fg-invites"
        element={
          <ProtectedRoute>
            <FGInvites />
          </ProtectedRoute>
        }
      />
      <Route
        path="/feel-goods"
        element={
          <ProtectedRoute>
            <FeelGoods />
          </ProtectedRoute>
        }
      />
      <Route
        path="/daily-updates"
        element={
          <ProtectedRoute>
            <DailyUpdates />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pipeline-updates"
        element={
          <ProtectedRoute>
            <PipelineUpdates />
          </ProtectedRoute>
        }
      />
      <Route
        path="/kiv"
        element={
          <ProtectedRoute>
            <KIV />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/plan-scheduler"
        element={
          <ProtectedRoute>
            <PlanScheduler />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App
