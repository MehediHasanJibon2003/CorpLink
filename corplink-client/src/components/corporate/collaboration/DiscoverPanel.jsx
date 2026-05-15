import { useEffect, useState, useCallback } from "react"
import { supabase } from "../../../lib/supabase"
import { useAuth } from "../../../context/AuthContext"
import { Building2, Users, Handshake, ShieldCheck, Zap, Search, Send, UserCheck } from "lucide-react"

function DiscoverPanel() {
  const { user, profile } = useAuth()

  const [mode, setMode]               = useState("external") // internal, external
  const [items, setItems]             = useState([])
  const [requests, setRequests]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [sending, setSending]         = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [error, setError]             = useState("")
  const [message, setMessage]         = useState("")

  const fetchData = useCallback(async () => {
    if (!profile?.company_id) return
    setLoading(true)
    setError("")

    try {
      if (mode === "external") {
        // Fetch Other Companies
        const { data: cos } = await supabase
          .from("corporates")
          .select("id, name")
          .neq("id", profile.company_id)
          .order("name")
        setItems(cos || [])

        // Fetch External Requests
        const { data: reqs } = await supabase
          .from("collaboration_requests")
          .select("*")
          .eq("type", "external")
        setRequests(reqs || [])
      } else {
        // Fetch Colleagues (Internal)
        const { data: employees } = await supabase
          .from("profiles")
          .select("id, full_name, role")
          .eq("company_id", profile.company_id)
          .neq("id", user.id)
          .order("full_name")
        setItems(employees || [])

        // Fetch Internal Requests
        const { data: reqs } = await supabase
          .from("collaboration_requests")
          .select("*")
          .eq("type", "internal")
        setRequests(reqs || [])
      }
    } catch (err) {
      console.error("Discovery error:", err)
      setError("Failed to sync with corporate network.")
    } finally {
      setLoading(false)
    }
  }, [mode, profile, user.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleConnect = async (targetId, targetName) => {
    setError("")
    setMessage("")
    setSending(targetId)

    const payload = {
      sender_id: user.id,
      company_id: profile.company_id,
      type: mode,
      message: `${profile.full_name} from ${profile.companies?.name || "the team"} requested collaboration.`,
      status: "pending"
    }

    if (mode === "external") {
      payload.corporate_id = targetId
    } else {
      payload.receiver_id = targetId
    }

    const { error } = await supabase.from("collaboration_requests").insert([payload])

    if (error) {
      setError(error.message)
    } else {
      setMessage(`Collaboration request transmitted to ${targetName}!`)
      setTimeout(() => setMessage(""), 3000)
      fetchData()
    }
    setSending(null)
  }

  const getStatus = (targetId) => {
    const req = requests.find(r => 
      (mode === "external" ? r.corporate_id === targetId : r.receiver_id === targetId) &&
      r.sender_id === user.id
    )
    return req ? req.status : "none"
  }

  const filteredItems = items.filter(item => 
    (mode === "external" ? item.name : item.full_name).toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6 md:space-y-12 animate-in fade-in duration-700">
      
      {/* Discovery Control Header */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl md:rounded-[3rem] p-6 md:p-14 border-2 border-slate-100 dark:border-white/5 shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 md:gap-10">
          <div className="space-y-2 md:space-y-4">
             <h2 className="text-[28px] md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight">
                Discover <br className="hidden md:block" />
                <span className="text-blue-600">Opportunities</span>
             </h2>
             <p className="text-[14px] md:text-heading-2 text-slate-400 font-bold max-w-md">Connect with industry partners or team colleagues.</p>
          </div>

          <div className="flex flex-col sm:flex-row bg-slate-50 dark:bg-slate-900 p-2 md:p-3 rounded-2xl md:rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 gap-2">
            <button 
              onClick={() => setMode("external")}
              className={`flex items-center justify-center gap-3 md:gap-4 px-6 md:px-10 py-3 md:py-5 rounded-xl md:rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] md:text-body transition-all ${mode === 'external' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 scale-[1.02] md:scale-105' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
            >
              <Building2 className="h-4 w-4 md:h-6 md:w-6" />
              External
            </button>
            <button 
              onClick={() => setMode("internal")}
              className={`flex items-center justify-center gap-3 md:gap-4 px-6 md:px-10 py-3 md:py-5 rounded-xl md:rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] md:text-body transition-all ${mode === 'internal' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 scale-[1.02] md:scale-105' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
            >
              <Users className="h-4 w-4 md:h-6 md:w-6" />
              Internal
            </button>
          </div>
        </div>

        {/* Search Matrix */}
        <div className="relative mt-8 md:mt-12">
          <Search className="absolute left-6 md:left-10 top-1/2 -translate-y-1/2 h-5 w-5 md:h-8 md:w-8 text-slate-400" />
          <input 
            type="text" 
            placeholder={mode === 'external' ? "Search Strategic Enterprises..." : "Search High-Value Assets..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-900/50 border-2 md:border-4 border-transparent focus:border-blue-500/30 rounded-xl md:rounded-[2.5rem] py-4 md:py-8 pl-14 md:pl-24 pr-6 md:pr-10 text-[16px] md:text-heading-1 font-black text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-300"
          />
        </div>
      </div>

      {(error || message) && (
        <div className={`p-6 md:p-8 rounded-xl md:rounded-[2.5rem] font-black uppercase tracking-widest border-2 md:border-4 animate-in slide-in-from-top-4 text-[10px] md:text-label ${error ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
          {error || message}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 rounded-2xl md:rounded-[3rem] bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-20 md:py-40 text-center border-2 md:border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl md:rounded-[4rem]">
          <Search className="h-16 w-16 md:h-32 md:w-32 mx-auto text-slate-100 dark:text-slate-800 mb-6 md:mb-10" />
          <h3 className="text-[14px] md:text-heading-1 font-black text-slate-400 uppercase tracking-widest">No targets found.</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
          {filteredItems.map((item) => {
            const status = getStatus(item.id)
            const name = mode === 'external' ? item.name : item.full_name
            return (
              <div key={item.id} className="group relative bg-white dark:bg-slate-800 rounded-2xl md:rounded-[3rem] p-6 md:p-10 border-2 border-slate-100 dark:border-white/5 hover:border-blue-500/30 transition-all hover:shadow-xl overflow-hidden">
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-6 md:mb-8">
                       <div className="h-14 w-14 md:h-20 md:w-20 rounded-xl bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 flex items-center justify-center font-black text-[20px] md:text-heading-1 text-slate-800 dark:text-white shadow-inner group-hover:scale-110 transition-transform">
                          {name.charAt(0)}
                       </div>
                       {status !== "none" && (
                         <span className={`px-3 py-1 md:px-4 md:py-2 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest ${status === 'accepted' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {status === 'accepted' ? 'Active' : 'Pending'}
                         </span>
                       )}
                    </div>
                    <h4 className="text-[18px] md:text-heading-1 font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none mb-2 md:mb-3 truncate">{name}</h4>
                    <p className="text-[10px] md:text-label font-black text-blue-600 uppercase tracking-widest">{mode === 'external' ? 'Strategic Partner' : item.role}</p>
                  </div>

                  <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t-2 border-slate-50 dark:border-slate-700/50">
                    {status === "none" ? (
                      <button
                        onClick={() => handleConnect(item.id, name)}
                        disabled={sending === item.id}
                        className="w-full flex items-center justify-center gap-3 md:gap-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 md:py-6 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-label hover:bg-blue-600 dark:hover:bg-blue-500 hover:text-white transition-all active:scale-95 shadow-lg"
                      >
                        <Send className="h-4 w-4 md:h-5 md:w-5" />
                        {sending === item.id ? "Transmitting..." : "Initiate"}
                      </button>
                    ) : status === "accepted" ? (
                      <div className="flex items-center justify-center gap-2 md:gap-3 py-4 md:py-6 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 rounded-xl md:rounded-2xl border-2 border-emerald-100 dark:border-emerald-900/50">
                        <UserCheck className="h-5 w-5 md:h-6 md:w-6" />
                        <span className="font-black uppercase tracking-widest text-[10px] md:text-label text-center">Active</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-4 md:py-6 bg-amber-50 dark:bg-amber-950/20 text-amber-600 rounded-xl md:rounded-2xl border-2 border-amber-100 dark:border-amber-900/50">
                        <span className="font-black uppercase tracking-widest text-[10px] md:text-label">Awaiting Approval</span>
                      </div>
                    )}
                  </div>
                </div>
                {/* Visual Accent */}
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${mode === 'external' ? 'from-blue-500/10 to-indigo-500/10' : 'from-emerald-500/10 to-teal-500/10'} -mr-16 -mt-16 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity`} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default DiscoverPanel

