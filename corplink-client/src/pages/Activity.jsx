import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import AppLayout from "../components/layout/AppLayout"
import { useAuth } from "../context/AuthContext"

function Activity() {
  const { profile } = useAuth()
  
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [filterModule, setFilterModule] = useState("all")
  const [filterSeverity, setFilterSeverity] = useState("all")

  const fetchActivities = async () => {
    if (!profile?.company_id) return
    
    setLoading(true)
    const { data, error } = await supabase
      .from("activity_logs")
      .select(`
        *,
        user:profiles!fk_activity_user_profile (full_name, role)
      `)
      .eq("company_id", profile.company_id)
      .order("created_at", { ascending: false })
      .limit(100) // Keep the last 100 for display performance

    if (error) {
      console.error(error)
      setError("Failed to load audit logs. Make sure database migrations are run.")
    } else {
      setActivities(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchActivities()

    // Setup Realtime Subscription
    if (!profile?.company_id) return
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_logs',
          filter: `company_id=eq.${profile.company_id}`
        },
        async (payload) => {
          // Log was freshly inserted! We need to dynamically fetch the user's name though.
          // For realtime, we do a quick single fetch to get the profile data for the new row.
          const { data: newRowWithUser } = await supabase
            .from("activity_logs")
            .select(`*, user:profiles!fk_activity_user_profile(full_name, role)`)
            .eq("id", payload.new.id)
            .single()

          if (newRowWithUser) {
            setActivities((prev) => [newRowWithUser, ...prev].slice(0, 100))
          } else {
             // Fallback if joined fetch fails temporarily
            setActivities((prev) => [payload.new, ...prev].slice(0, 100))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile?.company_id])

  const filteredActivities = activities.filter(item => {
    if (filterModule !== "all" && item.entity !== filterModule) return false
    if (filterSeverity !== "all" && item.severity !== filterSeverity) return false
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const matchesAction = item.action?.toLowerCase().includes(searchLower)
      const matchesUser = item.user?.full_name?.toLowerCase().includes(searchLower)
      if (!matchesAction && !matchesUser) return false
    }
    
    return true
  })

  // Badges & Styles
  const getSeverityBadge = (severity) => {
    switch(severity) {
      case 'critical': return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-bold border border-red-200">Critical</span>
      case 'warning': return <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-bold border border-orange-200">Warning</span>
      default: return <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-semibold border border-blue-100">Info</span>
    }
  }

  const getStatusIcon = (status) => {
    if (status === 'failed') return <span title="Failed" className="text-red-600 font-bold text-lg">✕</span>
    return <span title="Success" className="text-green-600 font-bold text-lg">✓</span>
  }

  return (
    <AppLayout title="Audit Log & Security" subtitle="Real-time monitoring of corporate system activities">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-10">
        
        {/* Top Controls: Search & Filter */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
            <input 
              type="text" 
              placeholder="Search by action or user..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 text-sm"
            />
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <select 
              value={filterModule} onChange={e => setFilterModule(e.target.value)}
              className="flex-1 md:flex-none border border-slate-300 bg-white rounded-lg px-3 py-2 outline-none focus:border-blue-500 text-sm font-medium text-slate-700"
            >
              <option value="all">All Modules</option>
              <option value="auth">Authentication</option>
              <option value="employee">Employees</option>
              <option value="department">Departments</option>
              <option value="task">Tasks</option>
              <option value="announcement">Feed / Announcements</option>
              <option value="collaboration">Collaboration</option>
            </select>

            <select 
              value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}
              className="flex-1 md:flex-none border border-slate-300 bg-white rounded-lg px-3 py-2 outline-none focus:border-blue-500 text-sm font-medium text-slate-700"
            >
              <option value="all">All Severities</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        {error ? (
          <div className="p-10 text-center text-red-600 bg-red-50 border-t border-red-100">{error}</div>
        ) : loading ? (
          <div className="p-10 text-center text-slate-500">Loading secure audit logs...</div>
        ) : filteredActivities.length === 0 ? (
          <div className="p-16 text-center">
            <div className="text-4xl mb-3">🛡️</div>
            <h3 className="text-lg font-semibold text-slate-700">No Logs Found</h3>
            <p className="text-slate-500 mt-1">No activities match your current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                  <th className="p-4 w-12 text-center">STS</th>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Module</th>
                  <th className="p-4">Action Details</th>
                  <th className="p-4 text-right">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredActivities.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="p-4 text-center border-r border-slate-100">
                      {getStatusIcon(log.status)}
                    </td>
                    <td className="p-4 text-slate-500 whitespace-nowrap">
                      <div>{new Date(log.created_at).toLocaleDateString()}</div>
                      <div className="text-xs">{new Date(log.created_at).toLocaleTimeString()}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-800">{log.user?.full_name || 'System / Deleted User'}</div>
                      <div className="text-xs text-slate-400 capitalize">{log.user?.role || 'Unknown Role'}</div>
                    </td>
                    <td className="p-4">
                      <span className="bg-slate-100 px-2 py-1 rounded text-xs font-semibold text-slate-600 border border-slate-200 capitalize">
                        {log.entity}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-slate-700">
                      {log.action}
                    </td>
                    <td className="p-4 text-right">
                      {getSeverityBadge(log.severity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

export default Activity