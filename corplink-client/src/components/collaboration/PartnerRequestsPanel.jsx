import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../context/AuthContext"

function PartnerRequestsPanel() {
  const { user, profile } = useAuth()

  const [received, setReceived] = useState([])
  const [sent, setSent] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const fetchRequests = async () => {
    setLoading(true)

    // Received requests: We are the 'to_company', join with 'from_company' to get their name
    const { data: receivedData, error: err1 } = await supabase
      .from("partner_requests")
      .select(`
        id, status, message, created_at,
        from_company:companies!from_company (id, name)
      `)
      .eq("to_company", profile.company_id)
      .order("created_at", { ascending: false })

    // Sent requests: We are the 'from_company', join with 'to_company' to get their name
    const { data: sentData, error: err2 } = await supabase
      .from("partner_requests")
      .select(`
        id, status, message, created_at,
        to_company:companies!to_company (id, name)
      `)
      .eq("from_company", profile.company_id)
      .order("created_at", { ascending: false })

    if (err1) setError(err1.message)
    if (err2) setError(err2.message)

    setReceived(receivedData || [])
    setSent(sentData || [])
    setLoading(false)
  }

  useEffect(() => {
    if (profile?.company_id) fetchRequests()
  }, [profile?.company_id])

  const handleUpdateStatus = async (requestId, newStatus, fromCompanyName) => {
    setError("")
    setMessage("")

    const { error } = await supabase
      .from("partner_requests")
      .update({ status: newStatus })
      .eq("id", requestId)

    if (error) {
      setError(error.message)
      return
    }

    await supabase.from("activity_logs").insert([{
      company_id: profile.company_id,
      user_id: user.id,
      action: `${newStatus === 'accepted' ? 'Accepted' : 'Rejected'} partnership request from ${fromCompanyName}`,
      entity: "collaboration",
    }])

    setMessage(`Request ${newStatus}!`)
    setTimeout(() => setMessage(""), 3000)
    fetchRequests()
  }

  const statusBadge = (status) => {
    if (status === "accepted") return <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">✅ Partner</span>
    if (status === "pending")  return <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">⏳ Pending</span>
    if (status === "rejected") return <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">❌ Rejected</span>
    return null
  }

  if (loading) return <p className="text-slate-500 text-sm p-4">Loading requests...</p>

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Inbox : Received Requests */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">📥 Received Requests</h3>
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        {message && <p className="text-green-500 text-sm mb-3">{message}</p>}

        <div className="space-y-4">
          {received.length === 0 ? (
            <p className="text-sm text-slate-400">No incoming requests.</p>
          ) : (
            received.map((req) => (
              <div key={req.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-slate-800">{req.from_company?.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{new Date(req.created_at).toLocaleDateString()}</p>
                  </div>
                  {statusBadge(req.status)}
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg text-sm text-slate-600">
                  {req.message}
                </div>

                {req.status === "pending" && (
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => handleUpdateStatus(req.id, "accepted", req.from_company?.name)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium transition"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(req.id, "rejected", req.from_company?.name)}
                      className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:text-slate-200 py-2 rounded-lg text-sm font-medium transition"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Outbox : Sent Requests */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">↗️ Sent Requests</h3>
        
        <div className="space-y-4">
          {sent.length === 0 ? (
            <p className="text-sm text-slate-400">You haven't sent any requests.</p>
          ) : (
            sent.map((req) => (
              <div key={req.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-slate-800">{req.to_company?.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{new Date(req.created_at).toLocaleDateString()}</p>
                  </div>
                  {statusBadge(req.status)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default PartnerRequestsPanel
