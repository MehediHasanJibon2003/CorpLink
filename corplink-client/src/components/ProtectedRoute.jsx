import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

function ProtectedRoute({ children }) {
  const { user, loading, profile } = useAuth()
  const [companyStatus, setCompanyStatus] = useState(null)
  const [checkingStatus, setCheckingStatus] = useState(true)

  useEffect(() => {
    async function checkStatus() {
      if (profile && profile.role !== "super_admin" && profile.company_id) {
        const { data, error } = await supabase
          .from("companies")
          .select("status")
          .eq("id", profile.company_id)
          .single()
        
        if (!error && data) {
          setCompanyStatus(data.status)
        } else {
          // Security First: Default to pending if status is unknown or column is missing
          setCompanyStatus("pending")
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
        <p className="text-lg font-medium text-slate-600 dark:text-slate-300">Authenticating...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Check corporate approval status
  if (profile && profile.role !== "super_admin") {
    if (companyStatus === "pending" || companyStatus === "rejected") {
      return <Navigate to="/pending-approval" replace />
    }
  }

  return children
}

export default ProtectedRoute