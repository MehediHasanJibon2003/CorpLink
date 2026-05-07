import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../context/AuthContext"
import { Building2, Handshake, ShieldCheck, Zap } from "lucide-react"

function DiscoverPanel() {
  const { user, profile } = useAuth()

  const [companies, setCompanies]   = useState([])
  const [requests, setRequests]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [sending, setSending]       = useState(null)
  const [error, setError]           = useState("")
  const [message, setMessage]       = useState("")
  const [connType, setConnType]     = useState("partner") // partner, vendor, client

  const fetchData = async () => {
    setLoading(true)
    const { data: allCompanies } = await supabase.from("companies").select("id, name").neq("id", profile.company_id).order("name")
    const { data: allRequests } = await supabase.from("partner_requests").select("*")
    setCompanies(allCompanies || [])
    setRequests(allRequests || [])
    setLoading(false)
  }

  useEffect(() => {
    if (profile?.company_id) fetchData()
  }, [profile?.company_id])

  const getStatus = (companyId) => {
    const sent = requests.find(r => r.from_company === profile.company_id && r.to_company === companyId)
    const received = requests.find(r => r.from_company === companyId && r.to_company === profile.company_id)
    const req = sent || received
    return req ? req.status : "none"
  }

  const handleConnect = async (targetCompanyId, targetName) => {
    setError("")
    setMessage("")
    setSending(targetCompanyId)

    const { error } = await supabase.from("partner_requests").insert([{
      from_company: profile.company_id,
      to_company:   targetCompanyId,
      status:       "pending",
      type:         connType,
      message:      `${profile.companies?.name || "A company"} wants to connect with you as a ${connType.toUpperCase()}.`,
    }])

    if (error) {
      setError(error.message)
    } else {
      await supabase.from("activity_logs").insert([{
        company_id: profile.company_id,
        user_id:    user.id,
        action:     `Sent ${connType} request to ${targetName}`,
        entity:     "collaboration",
      }])
      setMessage(`Partnership request sent to ${targetName}!`)
      setTimeout(() => setMessage(""), 3000)
      fetchData()
    }
    setSending(null)
  }

  const statusBadge = (status) => {
    if (status === "accepted") return <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full uppercase tracking-widest">✅ Partner</span>
    if (status === "pending")  return <span className="text-[10px] font-black bg-amber-100 text-amber-700 px-3 py-1 rounded-full uppercase tracking-widest">⏳ Pending</span>
    if (status === "rejected") return <span className="text-[10px] font-black bg-red-100 text-red-700 px-3 py-1 rounded-full uppercase tracking-widest">❌ Rejected</span>
    return null
  }

  if (loading) return <div className="p-20 text-center text-slate-400 font-black uppercase tracking-widest animate-pulse">Scanning Corporate Network...</div>

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {error   && <p className="text-red-600 text-sm bg-red-50 p-4 rounded-2xl font-bold border-2 border-red-100">{error}</p>}
      {message && <p className="text-emerald-600 text-sm bg-emerald-50 p-4 rounded-2xl font-bold border-2 border-emerald-100">{message}</p>}

      {companies.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-white/10 p-20 text-center">
          <Building2 className="h-20 w-20 mx-auto text-slate-200 mb-6" />
          <p className="text-slate-400 font-black uppercase tracking-widest">No other corporations found yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 md:gap-10">
          {companies.map((company) => {
            const status = getStatus(company.id)
            return (
              <div key={company.id} className="bg-white dark:bg-slate-800 rounded-[2.5rem] border-2 border-slate-100 dark:border-white/5 p-10 flex flex-col justify-between hover:border-blue-500/30 transition-all hover:shadow-2xl group">
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center font-black text-4xl text-slate-400 group-hover:text-blue-600 transition-colors">
                      {company.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{company.name}</h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Strategic Entity</p>
                    </div>
                  </div>
                  {statusBadge(status)}
                </div>

                {status === "none" && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Collaboration Type</label>
                       <select 
                         value={connType} 
                         onChange={(e) => setConnType(e.target.value)}
                         className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-white/5 rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest outline-none focus:border-blue-500 transition-all cursor-pointer"
                       >
                          <option value="partner">Strategic Partner</option>
                          <option value="vendor">Service Vendor</option>
                          <option value="client">Enterprise Client</option>
                       </select>
                    </div>
                    <button
                      onClick={() => handleConnect(company.id, company.name)}
                      disabled={sending === company.id}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
                    >
                      {sending === company.id ? "Sending..." : "🤝 Establish Connection"}
                    </button>
                  </div>
                )}

                {status === "rejected" && (
                  <button
                    onClick={() => handleConnect(company.id, company.name)}
                    disabled={sending === company.id}
                    className="w-full bg-slate-100 dark:bg-slate-700 text-slate-500 py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all"
                  >
                    Retry Connection
                  </button>
                )}
                
                {status === "accepted" && (
                   <div className="bg-emerald-50 dark:bg-emerald-600/10 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-500/20 text-center">
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Active Partnership Established</p>
                   </div>
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
