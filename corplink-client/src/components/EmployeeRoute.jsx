import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

/**
 * EmployeeRoute — guards all /employee/* paths.
 * Allows: employee, team_lead, manager (non-admin roles)
 * Redirects admins → /dashboard
 * Redirects unauthenticated → /login
 * Redirects pending companies → /pending-approval
 */
function EmployeeRoute({ children }) {
  const { user, loading, profile } = useAuth()
  const [companyStatus, setCompanyStatus] = useState(null)
  const [checkingStatus, setCheckingStatus] = useState(true)

  // Admin roles that should NOT access employee routes
  const ADMIN_ROLES = ["super_admin", "admin", "corporate_admin", "hr"]

  useEffect(() => {
    async function checkStatus() {
      if (profile && profile.company_id) {
        const { data, error } = await supabase
          .from("companies")
          .select("status")
          .eq("id", profile.company_id)
          .single()

        if (!error && data) {
          setCompanyStatus(data.status)
        } else {
          setCompanyStatus("pending")
        }
      } else if (profile?.role === "super_admin") {
        setCompanyStatus("active")
      } else {
        setCompanyStatus("pending")
      }
      setCheckingStatus(false)
    }

    if (profile) {
      checkStatus()
    } else if (!loading) {
      setCheckingStatus(false)
    }
  }, [profile, loading])

  if (loading || checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-lg animate-pulse">
            C
          </div>
          <p className="text-slate-400 text-sm font-medium">Loading workspace...</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!user) return <Navigate to="/login" replace />

  // Admin-level roles go back to admin dashboard
  if (ADMIN_ROLES.includes(profile?.role)) {
    return <Navigate to="/dashboard" replace />
  }

  // Corporate not yet approved
  if (companyStatus === "pending" || companyStatus === "rejected") {
    return <Navigate to="/pending-approval" replace />
  }

  return children
}

export default EmployeeRoute
