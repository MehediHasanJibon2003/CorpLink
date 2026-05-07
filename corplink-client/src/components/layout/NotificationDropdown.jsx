import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../context/AuthContext"
import { Bell, CheckCircle2, Clock, Trash2, X } from "lucide-react"

export default function NotificationDropdown() {
  const { profile } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [showNotifs, setShowNotifs] = useState(false)

  const fetchNotifs = async () => {
    if (!profile?.id) return
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(5)
    setNotifications(data || [])
  }

  useEffect(() => {
    if (!profile?.id) return
    fetchNotifs()

    const channel = supabase
      .channel(`notifs_realtime_${profile.id}`)
      .on("postgres_changes", 
        { 
          event: "INSERT", 
          schema: "public", 
          table: "notifications", 
          filter: `user_id=eq.${profile.id}` 
        }, 
        (payload) => {
          console.log("New notification received:", payload.new);
          setNotifications(prev => [payload.new, ...prev].slice(0, 5));
        }
      )
      .subscribe((status) => {
        console.log("Realtime status:", status);
      });

    return () => { 
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  const handleMarkAsRead = async (id) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id)
    fetchNotifs()
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="relative">
      <button 
        onClick={() => setShowNotifs(!showNotifs)}
        className="p-2.5 md:p-3 rounded-xl bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/10 relative group hover:border-violet-500/50 transition-all"
      >
        <Bell className="h-6 w-6 text-slate-500 dark:text-violet-400 group-hover:scale-110 transition-transform" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center animate-bounce shadow-lg ring-4 ring-white dark:ring-[#0d0622]">
            {unreadCount}
          </span>
        )}
      </button>

      {showNotifs && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />
          <div className="absolute right-0 mt-4 w-80 md:w-96 bg-white dark:bg-[#0d0622] border-2 border-slate-100 dark:border-violet-500/20 rounded-[2rem] shadow-2xl p-6 z-50 animate-in slide-in-from-top-4 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black uppercase tracking-widest text-slate-900 dark:text-white text-sm">Recent Alerts</h3>
              <span className="text-[10px] font-black bg-violet-600 text-white px-3 py-1 rounded-full uppercase">{unreadCount} New</span>
            </div>
            
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="py-10 text-center opacity-50 font-bold uppercase text-xs">All clear! No alerts</div>
              ) : notifications.map(n => (
                <div 
                  key={n.id} 
                  onClick={() => handleMarkAsRead(n.id)} 
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative group ${
                    n.is_read 
                      ? 'bg-slate-50 dark:bg-white/5 border-transparent opacity-60' 
                      : 'bg-violet-50 dark:bg-violet-500/10 border-violet-100 dark:border-violet-500/30 shadow-md'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${n.is_read ? 'bg-slate-300' : 'bg-violet-500 shadow-[0_0_8px_#8b5cf6]'}`} />
                    <div className="flex-1">
                      <p className="font-black text-xs uppercase tracking-wide text-slate-900 dark:text-white leading-tight">{n.title}</p>
                      <p className="text-[11px] font-bold text-slate-500 dark:text-violet-300 mt-1 line-clamp-2">{n.message}</p>
                      <div className="flex items-center gap-2 mt-3 opacity-50 text-[9px] font-black uppercase tracking-tighter">
                        <Clock className="h-3 w-3" />
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
