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
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {companies.map((company) => {
            const status = getStatus(company.id)
            return (
              <div
                key={company.id}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                      {company.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{company.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Corporate Company</p>
                    </div>
                  </div>
                  {statusBadge(status)}
                </div>

                {status === "none" && (
                  <button
                    onClick={() => handleConnect(company.id, company.name)}
                    disabled={sending === company.id}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded-xl text-sm font-medium transition"
                  >
                    {sending === company.id ? "Sending..." : "🤝 Connect"}
                  </button>
                )}

                {status === "rejected" && (
                  <button
                    onClick={() => handleConnect(company.id, company.name)}
                    disabled={sending === company.id}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 dark:text-slate-300 py-2 rounded-xl text-sm font-medium transition"
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
