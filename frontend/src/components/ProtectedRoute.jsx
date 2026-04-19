import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
          <p className="text-slate-400 text-sm font-medium">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return children
}
