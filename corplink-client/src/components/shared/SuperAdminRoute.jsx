import { Navigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { useTheme } from "../../context/ThemeContext"

export default function SuperAdminRoute({ children }) {
  const { user, profile, loading } = useAuth()
  const { branding } = useTheme()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0a1e]">
        <div className="flex flex-col items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-violet-600 flex items-center justify-center font-black text-white text-heading-1 animate-pulse shadow-xl shadow-violet-600/20 overflow-hidden">
            {branding?.logo_url ? (
              <img src={branding.logo_url} className="w-full h-full object-cover" />
            ) : (
              (branding?.platform_name?.charAt(0) || "C")
            )}
          </div>
          <p className="text-violet-300 text-heading-3 font-black uppercase tracking-widest animate-bounce">
            {branding?.platform_name || "CorpLink"}
          </p>
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

