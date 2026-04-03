import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import AppLayout from "../components/layout/AppLayout"

function Activity() {
  const [activities, setActivities] = useState([])
  const [error, setError] = useState("")

  const fetchActivities = async () => {
    const { data, error } = await supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      setError(error.message)
      return
    }

    setActivities(data || [])
  }

  useEffect(() => {
    fetchActivities()
  }, [])

  return (
    <AppLayout
      title="Recent Activity"
      subtitle="Track recent system actions inside your company workspace"
    >
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h3 className="text-xl font-semibold text-slate-800">Activity Logs</h3>
        </div>

        {error && <p className="p-5 text-red-600 text-sm">{error}</p>}

        {!error && activities.length === 0 ? (
          <p className="p-5 text-slate-500">No activity found</p>
        ) : (
          <div className="divide-y divide-slate-200">
            {activities.map((item) => (
              <div key={item.id} className="p-5">
                <p className="text-base font-medium text-slate-800">
                  {item.action}
                </p>
                <p className="text-sm text-slate-500 mt-1 capitalize">
                  {item.entity}
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  {new Date(item.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}

export default Activity