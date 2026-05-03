import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../context/AuthContext"

// DiscoverPanel — shows all other companies and lets user send a partnership request
function DiscoverPanel() {
  const { user, profile } = useAuth()

  const [companies, setCompanies]   = useState([])
  const [requests, setRequests]     = useState([])   // existing requests (to track status)
  const [loading, setLoading]       = useState(true)
  const [sending, setSending]       = useState(null) // company id currently being requested
  const [error, setError]           = useState("")
  const [message, setMessage]       = useState("")

  const fetchData = async () => {
    setLoading(true)

    // All companies except ours
    const { data: allCompanies } = await supabase
      .from("companies")
      .select("id, name")
      .neq("id", profile.company_id)
      .order("name")

    // All requests involving our company
    const { data: allRequests } = await supabase
      .from("partner_requests")
      .select("*")

    setCompanies(allCompanies || [])
    setRequests(allRequests || [])
    setLoading(false)
  }

  useEffect(() => {
    if (profile?.company_id) fetchData()
  }, [profile?.company_id])

  // What is our relationship status with a given company?
  const getStatus = (companyId) => {
    const sent = requests.find(
      (r) => r.from_company === profile.company_id && r.to_company === companyId
    )
    const received = requests.find(
      (r) => r.from_company === companyId && r.to_company === profile.company_id
    )
    const req = sent || received
    if (!req) return "none"
    return req.status // 'pending' | 'accepted' | 'rejected'
  }

  const handleConnect = async (targetCompanyId, targetName) => {
    setError("")
    setMessage("")
    setSending(targetCompanyId)

    const { error } = await supabase.from("partner_requests").insert([{
      from_company: profile.company_id,
      to_company:   targetCompanyId,
      status:       "pending",
      message:      `${profile.companies?.name || "A company"} wants to connect with you.`,
    }])

    if (error) {
      setError(error.message)
    } else {
      await supabase.from("activity_logs").insert([{
        company_id: profile.company_id,
        user_id:    user.id,
        action:     `Sent partnership request to ${targetName}`,
        entity:     "collaboration",
      }])
      setMessage(`Partnership request sent to ${targetName}!`)
      setTimeout(() => setMessage(""), 3000)
      fetchData()
    }

    setSending(null)
  }

  const statusBadge = (status) => {
    if (status === "accepted") return <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">✅ Partner</span>
    if (status === "pending")  return <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">⏳ Pending</span>
    if (status === "rejected") return <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">❌ Rejected</span>
    return null
  }

  if (loading) return <p className="text-slate-500 text-sm p-4">Loading companies...</p>

  return (
    <div className="space-y-4">
      {error   && <p className="text-red-600 text-sm bg-red-50 px-4 py-2 rounded-xl border border-red-100">{error}</p>}
      {message && <p className="text-green-600 text-sm bg-green-50 px-4 py-2 rounded-xl border border-green-100">{message}</p>}

      {companies.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-10 text-center">
          <div className="text-4xl mb-3">🏢</div>
          <p className="text-slate-500 text-sm">No other companies found on CorpLink yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 md:gap-10">
          {companies.map((company) => {
            const status = getStatus(company.id)
            return (
              <div
                key={company.id}
                className="bg-white dark:bg-slate-800 rounded-3xl md:rounded-[2.5rem] shadow-sm border-2 border-slate-200 dark:border-slate-700 p-8 md:p-12 flex flex-col gap-8 transition-all hover:shadow-xl hover:-translate-y-1"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-3xl md:text-4xl shadow-md border-2 border-white dark:border-slate-700">
                      {company.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 dark:text-slate-100 text-2xl md:text-3xl tracking-tight leading-tight">{company.name}</h4>
                      <p className="text-sm md:text-lg text-slate-400 font-bold uppercase tracking-widest mt-1">Corporate Company</p>
                    </div>
                  </div>
                  <div className="transform scale-125 origin-top-right">
                    {statusBadge(status)}
                  </div>
                </div>

                {status === "none" && (
                  <button
                    onClick={() => handleConnect(company.id, company.name)}
                    disabled={sending === company.id}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-5 md:py-6 rounded-2xl md:rounded-3xl text-lg md:text-2xl font-black transition-all shadow-lg active:scale-95"
                  >
                    {sending === company.id ? "Sending..." : "🤝 Connect"}
                  </button>
                )}

                {status === "rejected" && (
                  <button
                    onClick={() => handleConnect(company.id, company.name)}
                    disabled={sending === company.id}
                    className="w-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 py-5 md:py-6 rounded-2xl md:rounded-3xl text-lg md:text-2xl font-black transition-all"
                  >
                    Retry Request
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default DiscoverPanel
