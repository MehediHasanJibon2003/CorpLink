import { useEffect, useState, useCallback } from "react"
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../context/AuthContext"
import { Inbox, Send, UserCheck, ShieldAlert, Clock, CheckCircle2, XCircle } from "lucide-react"

function PartnerRequestsPanel() {
  const { user, profile } = useAuth()

  const [received, setReceived] = useState([])
  const [sent, setSent] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const fetchRequests = useCallback(async () => {
    if (!profile?.company_id) return
    setLoading(true)

    try {
      // Received requests (I am the receiver or my company is the target)
      const { data: recData } = await supabase
        .from("collaboration_requests")
        .select(`
          *,
          sender:profiles!sender_id (full_name, role),
          partner_corp:corporates!corporate_id (name)
        `)
        .or(`receiver_id.eq.${user.id},corporate_id.eq.${profile.company_id}`)
        .order("created_at", { ascending: false })

      // Sent requests (I am the sender)
      const { data: sentData } = await supabase
        .from("collaboration_requests")
        .select(`
          *,
          receiver:profiles!receiver_id (full_name, role),
          partner_corp:corporates!corporate_id (name)
        `)
        .eq("sender_id", user.id)
        .order("created_at", { ascending: false })

      setReceived(recData || [])
      setSent(sentData || [])
    } catch (err) {
      console.error("Fetch requests error:", err)
      setError("Strategic Data Retrieval Failed.")
    } finally {
      setLoading(false)
    }
  }, [user.id, profile.company_id])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const handleUpdateStatus = async (requestId, newStatus, targetName) => {
    setError("")
    setMessage("")

    const { error } = await supabase
      .from("collaboration_requests")
      .update({ status: newStatus })
      .eq("id", requestId)

    if (error) {
      setError(error.message)
      return
    }

    setMessage(`Protocol ${newStatus === 'accepted' ? 'Authorized' : 'Terminated'}.`)
    setTimeout(() => setMessage(""), 3000)
    fetchRequests()
  }

  const statusConfig = {
    pending: { label: "Pending", class: "bg-amber-100 text-amber-700", icon: Clock },
    accepted: { label: "Accepted", class: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
    rejected: { label: "Rejected", class: "bg-red-100 text-red-700", icon: XCircle },
  }

  const RequestCard = ({ req, isSent }) => {
    const config = statusConfig[req.status] || statusConfig.pending
    const Icon = config.icon
    
    let displayName = ""
    let displayRole = ""
    
    if (req.type === 'internal') {
      const person = isSent ? req.receiver : req.sender
      displayName = person?.full_name || "Colleague"
      displayRole = person?.role || "Team Member"
    } else {
      displayName = req.partner_corp?.name || "Partner Corp"
      displayRole = "Strategic Entity"
    }

    return (
      <div className="group bg-white dark:bg-slate-800 rounded-[2.5rem] border-2 border-slate-100 dark:border-white/5 p-10 hover:border-blue-500/30 transition-all hover:shadow-2xl">
        <div className="flex items-start justify-between mb-8">
           <div className="flex items-center gap-6">
              <div className="h-16 w-16 rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 flex items-center justify-center font-black text-2xl text-slate-800 dark:text-white shadow-inner">
                {displayName.charAt(0)}
              </div>
              <div>
                <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">{displayName}</h4>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-2">{displayRole}</p>
              </div>
           </div>
           <div className={`px-4 py-2 rounded-full flex items-center gap-2 ${config.class}`}>
              <Icon className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">{config.label}</span>
           </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-3xl text-lg text-slate-700 dark:text-slate-300 font-medium italic border-2 border-transparent group-hover:border-slate-200 dark:group-hover:border-slate-700 transition-all">
          "{req.message}"
        </div>

        <div className="mt-8 flex items-center justify-between">
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {new Date(req.created_at).toLocaleDateString()}
           </span>
           
           {!isSent && req.status === 'pending' && (
             <div className="flex gap-4">
                <button 
                  onClick={() => handleUpdateStatus(req.id, 'accepted', displayName)}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg active:scale-95 transition-all"
                >
                  Authorize
                </button>
                <button 
                  onClick={() => handleUpdateStatus(req.id, 'rejected', displayName)}
                  className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-200 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-red-500 hover:text-white transition-all active:scale-95"
                >
                  Terminate
                </button>
             </div>
           )}
        </div>
      </div>
    )
  }

  if (loading) return <div className="p-20 text-center text-slate-400 font-black uppercase tracking-widest animate-pulse">Synchronizing Intelligence...</div>

  return (
    <div className="space-y-16 animate-in fade-in duration-700 pb-20">
      {(error || message) && (
        <div className={`p-8 rounded-[2.5rem] font-black uppercase tracking-widest border-4 ${error ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
          {error || message}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-16 md:gap-24">
        {/* Received Matrix */}
        <div className="space-y-12">
           <div className="flex items-center gap-6">
              <div className="h-20 w-20 rounded-[2rem] bg-blue-600 text-white flex items-center justify-center shadow-2xl shadow-blue-500/30">
                 <Inbox className="h-10 w-10" />
              </div>
              <div>
                 <h3 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter">Incoming <br /> Protocols</h3>
                 <p className="text-sm font-black text-slate-400 uppercase tracking-widest mt-1">Pending Authorization</p>
              </div>
           </div>

           <div className="space-y-8">
              {received.length === 0 ? (
                <div className="py-20 text-center border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem]">
                   <p className="text-2xl font-black text-slate-300 uppercase tracking-widest">Inbound frequency silent.</p>
                </div>
              ) : (
                received.map(req => <RequestCard key={req.id} req={req} isSent={false} />)
              )}
           </div>
        </div>

        {/* Sent Matrix */}
        <div className="space-y-12">
           <div className="flex items-center gap-6">
              <div className="h-20 w-20 rounded-[2rem] bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shadow-2xl">
                 <Send className="h-10 w-10" />
              </div>
              <div>
                 <h3 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter">Transmitted <br /> Requests</h3>
                 <p className="text-sm font-black text-slate-400 uppercase tracking-widest mt-1">Global Broadcast history</p>
              </div>
           </div>

           <div className="space-y-8">
              {sent.length === 0 ? (
                <div className="py-20 text-center border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem]">
                   <p className="text-2xl font-black text-slate-300 uppercase tracking-widest">Outbound queue empty.</p>
                </div>
              ) : (
                sent.map(req => <RequestCard key={req.id} req={req} isSent={true} />)
              )}
           </div>
        </div>
      </div>
    </div>
  )
}

export default PartnerRequestsPanel
