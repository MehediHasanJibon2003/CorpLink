import { useEffect, useState, useCallback } from "react"
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../context/AuthContext"
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
    <div className="space-y-12 animate-in fade-in duration-700">
      
      {/* Discovery Control Header */}
      <div className="bg-white dark:bg-slate-800 rounded-[3rem] p-10 md:p-14 border-2 border-slate-100 dark:border-white/5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
          <div className="space-y-4">
             <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter">
                Discover <br />
                <span className="text-blue-600">Opportunities</span>
             </h2>
             <p className="text-xl text-slate-400 font-bold max-w-md">Connect with industry partners or team colleagues for joint ventures.</p>
          </div>

          <div className="flex bg-slate-50 dark:bg-slate-900 p-3 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800">
            <button 
              onClick={() => setMode("external")}
              className={`flex items-center gap-4 px-10 py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-sm transition-all ${mode === 'external' ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20 scale-105' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
            >
              <Building2 className="h-6 w-6" />
              External Partners
            </button>
            <button 
              onClick={() => setMode("internal")}
              className={`flex items-center gap-4 px-10 py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-sm transition-all ${mode === 'internal' ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 scale-105' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
            >
              <Users className="h-6 w-6" />
              Internal Colleagues
            </button>
          </div>
        </div>

        {/* Search Matrix */}
        <div className="relative mt-12">
          <Search className="absolute left-10 top-1/2 -translate-y-1/2 h-8 w-8 text-slate-400" />
          <input 
            type="text" 
            placeholder={mode === 'external' ? "Search Strategic Enterprises..." : "Search High-Value Assets (Colleagues)..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-900/50 border-4 border-transparent focus:border-blue-500/30 rounded-[2.5rem] py-8 pl-24 pr-10 text-2xl font-black text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-300"
          />
        </div>
      </div>

      {(error || message) && (
        <div className={`p-8 rounded-[2.5rem] font-black uppercase tracking-widest border-4 animate-in slide-in-from-top-4 ${error ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
          {error || message}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 rounded-[3rem] bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-40 text-center border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[4rem]">
          <Search className="h-32 w-32 mx-auto text-slate-100 dark:text-slate-800 mb-10" />
          <h3 className="text-3xl font-black text-slate-400 uppercase tracking-widest">Target not found in range.</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredItems.map((item) => {
            const status = getStatus(item.id)
            const name = mode === 'external' ? item.name : item.full_name
            return (
              <div key={item.id} className="group relative bg-white dark:bg-slate-800 rounded-[3rem] p-10 border-2 border-slate-100 dark:border-white/5 hover:border-blue-500/30 transition-all hover:shadow-2xl overflow-hidden">
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-8">
                       <div className="h-20 w-20 rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 flex items-center justify-center font-black text-3xl text-slate-800 dark:text-white shadow-inner group-hover:scale-110 transition-transform">
                          {name.charAt(0)}
                       </div>
                       {status !== "none" && (
                         <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${status === 'accepted' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {status === 'accepted' ? 'Active' : 'Pending'}
                         </span>
                       )}
                    </div>
                    <h4 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none mb-3">{name}</h4>
                    <p className="text-xs font-black text-blue-600 uppercase tracking-widest">{mode === 'external' ? 'Strategic Partner' : item.role}</p>
                  </div>

                  <div className="mt-12 pt-8 border-t-2 border-slate-50 dark:border-slate-700/50">
                    {status === "none" ? (
                      <button
                        onClick={() => handleConnect(item.id, name)}
                        disabled={sending === item.id}
                        className="w-full flex items-center justify-center gap-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-6 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-600 dark:hover:bg-blue-500 hover:text-white transition-all active:scale-95 shadow-xl"
                      >
                        <Send className="h-5 w-5" />
                        {sending === item.id ? "Transmitting..." : "Initiate Protocol"}
                      </button>
                    ) : status === "accepted" ? (
                      <div className="flex items-center justify-center gap-3 py-6 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 rounded-2xl border-2 border-emerald-100 dark:border-emerald-900/50">
                        <UserCheck className="h-6 w-6" />
                        <span className="font-black uppercase tracking-widest text-xs">Collaborator Active</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-6 bg-amber-50 dark:bg-amber-950/20 text-amber-600 rounded-2xl border-2 border-amber-100 dark:border-amber-900/50">
                        <span className="font-black uppercase tracking-widest text-xs">Awaiting Approval</span>
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
