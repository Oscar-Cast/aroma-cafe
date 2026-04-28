import { AuthProvider, useAuth } from './providers/AuthProvider'
import { LoginPage } from './components/login-page'
import { MainDashboard } from './components/main-dashboard'

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#E5D7C4]">
        <div className="text-[#4C3D19] text-xl">Cargando aplicación...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return <MainDashboard />
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
