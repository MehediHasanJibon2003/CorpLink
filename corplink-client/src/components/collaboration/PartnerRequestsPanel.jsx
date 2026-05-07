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
        id, status, type, message, created_at,
        from_company:companies!from_company (id, name)
      `)
      .eq("to_company", profile.company_id)
      .order("created_at", { ascending: false })

    // Sent requests: We are the 'from_company', join with 'to_company' to get their name
    const { data: sentData, error: err2 } = await supabase
      .from("partner_requests")
      .select(`
        id, status, type, message, created_at,
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
    if (status === "accepted") return <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full uppercase tracking-widest">✅ Partner</span>
    if (status === "pending")  return <span className="text-[10px] font-black bg-amber-100 text-amber-700 px-3 py-1 rounded-full uppercase tracking-widest">⏳ Pending</span>
    if (status === "rejected") return <span className="text-[10px] font-black bg-red-100 text-red-700 px-3 py-1 rounded-full uppercase tracking-widest">❌ Rejected</span>
    return null
  }

  const typeBadge = (type) => {
    const colors = {
      vendor: "bg-blue-100 text-blue-600",
      client: "bg-purple-100 text-purple-600",
      partner: "bg-indigo-100 text-indigo-600"
    }
    return <span className={`text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-[0.15em] ${colors[type] || 'bg-slate-100 text-slate-500'}`}>{type}</span>
  }

  if (loading) return <p className="text-slate-500 text-sm p-4">Loading requests...</p>

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 md:gap-16">
      {/* Inbox : Received Requests */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl md:rounded-[3rem] border-2 border-slate-200 dark:border-slate-700 p-10 md:p-16 shadow-sm">
        <h3 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-10 md:mb-12 tracking-tight flex items-center gap-4">
           <span className="text-4xl">📥</span> Received Requests
        </h3>
        {error && <p className="p-6 bg-red-50 text-red-600 rounded-2xl font-bold mb-8">{error}</p>}
        {message && <p className="p-6 bg-green-50 text-green-600 rounded-2xl font-bold mb-8">{message}</p>}

        <div className="space-y-8 md:space-y-10">
          {received.length === 0 ? (
            <p className="text-xl md:text-2xl text-slate-400 font-bold italic text-center py-20">No incoming requests in the inbox.</p>
          ) : (
            received.map((req) => (
              <div key={req.id} className="border-2 border-slate-100 dark:border-slate-700 rounded-3xl p-8 md:p-12 flex flex-col gap-8 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                       <h4 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">{req.from_company?.name}</h4>
                       {typeBadge(req.type)}
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(req.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="transform scale-125 origin-top-right">
                    {statusBadge(req.status)}
                  </div>
                </div>

                <div className="bg-slate-100 dark:bg-slate-900/50 p-6 md:p-10 rounded-2xl md:rounded-[2rem] text-lg md:text-2xl text-slate-700 dark:text-slate-200 font-medium leading-relaxed italic shadow-inner">
                  "{req.message}"
                </div>

                {req.status === "pending" && (
                  <div className="flex flex-col sm:flex-row gap-4 md:gap-6 mt-4">
                    <button
                      onClick={() => handleUpdateStatus(req.id, "accepted", req.from_company?.name)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-4 md:py-6 rounded-2xl md:rounded-3xl text-lg md:text-2xl font-black transition-all shadow-lg active:scale-95"
                    >
                      Accept Partnership
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(req.id, "rejected", req.from_company?.name)}
                      className="flex-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 py-4 md:py-6 rounded-2xl md:rounded-3xl text-lg md:text-2xl font-black transition-all"
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
      <div className="bg-white dark:bg-slate-800 rounded-3xl md:rounded-[3rem] border-2 border-slate-200 dark:border-slate-700 p-10 md:p-16 shadow-sm">
        <h3 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-10 md:mb-12 tracking-tight flex items-center gap-4">
           <span className="text-4xl">↗️</span> Sent Requests
        </h3>
        
        <div className="space-y-8 md:space-y-10">
          {sent.length === 0 ? (
            <p className="text-xl md:text-2xl text-slate-400 font-bold italic text-center py-20">You haven't sent any requests yet.</p>
          ) : (
            sent.map((req) => (
              <div key={req.id} className="border-2 border-slate-100 dark:border-slate-700 rounded-3xl p-8 md:p-12 flex flex-col gap-6 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-2xl md:text-4xl font-black text-slate-800 dark:text-slate-100">{req.to_company?.name}</h4>
                    <p className="text-base md:text-xl text-slate-500 dark:text-slate-400 mt-2 font-bold uppercase tracking-widest">{new Date(req.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="transform scale-125 origin-top-right">
                    {statusBadge(req.status)}
                  </div>
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
