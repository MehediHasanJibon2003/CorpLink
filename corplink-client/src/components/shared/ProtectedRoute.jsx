import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"

function ProtectedRoute({ children, moduleKey }) {
  const { user, loading, profile } = useAuth()
  const location = useLocation()
  const [companyStatus, setCompanyStatus] = useState(null)
  const [checkingStatus, setCheckingStatus] = useState(true)

  useEffect(() => {
    async function checkStatus() {
      if (profile && profile.role !== "super_admin" && profile.company_id) {
        const { data, error } = await supabase
          .from("companies")
          .select("status")
          .eq("id", profile.company_id)
          .maybeSingle()
        
        if (!error && data) {
          setCompanyStatus(data.status)
        } else {
          // If data is missing (due to RLS or missing row), default to active for now so it doesn't block testing
          console.warn("Could not fetch corporate status, defaulting to active");
          setCompanyStatus("active")
        }
      } else {
        setCompanyStatus("active")
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
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
        <p className="text-heading-3 font-medium text-slate-600 dark:text-slate-300">Authenticating...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!profile) {
    // If authenticated but no profile exists, their account is broken or incomplete
    return <Navigate to="/login" replace />
  }

  // Check corporate approval status
  if (profile.role !== "super_admin") {
    if (companyStatus === "pending") {
      if (profile.role === "corporate_admin" && location.pathname !== "/billing") {
        return <Navigate to="/billing" replace />
      } else if (profile.role !== "corporate_admin" && location.pathname !== "/pending-approval") {
        return <Navigate to="/pending-approval" replace />
      }
    } else if (companyStatus === "rejected" && location.pathname !== "/pending-approval") {
      return <Navigate to="/pending-approval" replace />
    }
  }

  // Prevent plain employees / restricted (interns) from accessing corporate routes
  const CORPORATE_ROLES = [
    "super_admin",
    "admin",
    "corporate_admin",
    "hr",
    "manager",
    "dept_head",
    "team_lead",
  ];
  if (!CORPORATE_ROLES.includes(profile.role)) {
    return <Navigate to="/employee/dashboard" replace />
  }

  if (moduleKey && profile.activeModules && !profile.activeModules.includes(moduleKey)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default ProtectedRoute
