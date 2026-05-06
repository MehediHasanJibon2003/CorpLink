import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

export default function SuperAdminRoute({ children }) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0a1e]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-600 flex items-center justify-center font-black text-white text-xl animate-pulse">
            C
          </div>
          <p className="text-violet-300 text-sm font-medium">Authenticating...</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  
  // Security: Allow all users with super_admin role
  if (profile?.role !== "super_admin") {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}
