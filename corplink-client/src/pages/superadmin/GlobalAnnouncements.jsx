import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../context/AuthContext"
import SuperAdminLayout from "../../components/superadmin/layout/SuperAdminLayout"
import { Megaphone, PlusCircle, X, Edit2, Trash2, Eye, EyeOff, Sparkles, CheckCircle } from "lucide-react"
import { useConfirm } from "../../context/ConfirmContext"

export default function GlobalAnnouncements() {
  const { user } = useAuth()
  const { showConfirm } = useConfirm()
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading]  = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState(null)
  const [form, setForm]         = useState({ title: "", message: "", is_active: true })
  const [saving, setSaving]     = useState(false)

  const fetch = async () => {
    setLoading(true)
    const { data } = await supabase.from("global_announcements").select("*").order("created_at", { ascending: false })
    setAnnouncements(data || [])
    setLoading(false)
  }

  useEffect(() => { fetch() }, [])

  const openNew  = () => { setEditing(null); setForm({ title: "", message: "", is_active: true }); setShowForm(true) }
  const openEdit = (a) => { setEditing(a); setForm({ title: a.title, message: a.message, is_active: a.is_active }); setShowForm(true) }

  const save = async () => {
    if (!form.title.trim() || !form.message.trim()) return
    setSaving(true)
    if (editing) {
      await supabase.from("global_announcements").update({ ...form }).eq("id", editing.id)
    } else {
      await supabase.from("global_announcements").insert([{ ...form, created_by: user.id }])
    }
    await fetch()
    setSaving(false)
    setShowForm(false)
  }

  const deleteAnn = (id) => {
    showConfirm({
      title: "Delete Announcement",
      message: "Are you sure you want to delete this announcement? This action cannot be undone.",
      onConfirm: async () => {
        await supabase.from("global_announcements").delete().eq("id", id)
        await fetch()
      }
    })
  }

  const toggleActive = async (id, val) => {
    await supabase.from("global_announcements").update({ is_active: !val }).eq("id", id)
    await fetch()
  }

  return (
    <SuperAdminLayout title="Global Announcements" subtitle="Broadcast platform-wide updates and messages to all corporate organizations">
      
      {/* Header Actions */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6 mb-8 md:mb-12">
        <div className="inline-flex items-center gap-4 px-6 md:px-8 py-4 md:py-5 rounded-2xl md:rounded-3xl relative overflow-hidden bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/15 shadow-sm w-full lg:w-auto">
          <Megaphone className="h-5 w-5 md:h-6 md:w-6 text-violet-600 dark:text-violet-400 shrink-0" />
          <p className="text-badge md:text-heading-3 font-black text-slate-700 dark:text-violet-300 uppercase tracking-widest truncate">
            {announcements.length} <span className="opacity-60 font-black ml-1">Broadcasts</span>
          </p>
        </div>
        
        <button
          onClick={openNew}
          className="w-full lg:w-auto px-8 py-4 bg-violet-600 text-white rounded-xl md:rounded-2xl font-black uppercase text-badge md:text-label tracking-widest shadow-xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95"
        >
          <PlusCircle className="h-5 w-5" /> New Signal
        </button>
      </div>

      {/* Announcements Grid - Responsive */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {loading ? (
          <div className="col-span-full flex flex-col items-center justify-center py-24 gap-6">
            <div className="w-12 h-12 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-600 dark:text-violet-400 font-black uppercase tracking-widest text-badge">Broadcasting...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="col-span-full text-center py-24 md:py-40 rounded-3xl md:rounded-[3rem] relative overflow-hidden bg-white dark:bg-white/5 border-2 border-dashed border-slate-200 dark:border-violet-500/20 shadow-inner">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-fuchsia-500/5 dark:bg-fuchsia-500/10 rounded-full blur-[100px]" />
            <Sparkles className="h-16 w-16 md:h-28 md:w-28 text-slate-200 dark:text-violet-500/20 mx-auto mb-8 relative z-10" />
            <p className="text-slate-700 dark:text-violet-300 font-black text-heading-3 md:text-heading-1 uppercase tracking-widest relative z-10 px-6">The airwaves are quiet.</p>
            <button onClick={openNew} className="mt-8 px-8 py-4 rounded-xl text-badge md:text-body font-black uppercase tracking-[0.2em] text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-50 dark:bg-fuchsia-500/10 hover:bg-fuchsia-100 dark:hover:bg-fuchsia-500/20 transition-all relative z-10 border-2 border-fuchsia-200 dark:border-fuchsia-500/20 active:scale-95">
              Create Signal
            </button>
          </div>
        ) : (
          announcements.map(a => (
            <div
              key={a.id}
              className={`rounded-3xl md:rounded-[2.5rem] p-6 md:p-12 transition-all duration-500 relative overflow-hidden group border-2 ${
                a.is_active 
                  ? "bg-white dark:bg-gradient-to-br dark:from-white/[0.05] dark:to-white/[0.01] border-slate-100 dark:border-violet-500/30 shadow-xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:scale-[1.01]"
                  : "bg-slate-50 dark:bg-white/[0.01] border-slate-200 dark:border-white/5 opacity-60"
              }`}
            >
              {a.is_active && <div className="absolute top-0 left-0 w-1 md:w-2 h-full bg-gradient-to-b from-fuchsia-600 to-purple-600 dark:from-fuchsia-500 dark:to-purple-500" />}
              
              <div className="flex flex-col items-stretch justify-between h-full gap-6 relative z-10">
                <div>
                  <div className="flex flex-col gap-4 mb-6">
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 w-fit ${
                      a.is_active 
                        ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 shadow-sm"
                        : "bg-slate-100 dark:bg-slate-500/10 border-slate-200 dark:border-slate-500/20"
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${a.is_active ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                      <span className={`text-[9px] font-black uppercase tracking-widest ${a.is_active ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}`}>
                        {a.is_active ? "Signal Live" : "Broadcast Paused"}
                      </span>
                    </div>
                    <h3 className="text-heading-3 md:text-heading-1 font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight">{a.title}</h3>
                  </div>
                  
                  <div className="relative mb-6">
                    <p className="text-badge md:text-heading-2 text-slate-600 dark:text-violet-300/90 leading-relaxed whitespace-pre-wrap font-bold line-clamp-[8]">{a.message}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t-2 border-slate-50 dark:border-white/5">
                  <div className="text-[9px] font-black text-slate-400 dark:text-violet-500/60 uppercase tracking-widest">
                    {new Date(a.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>

                  {/* Actions Group */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleActive(a.id, a.is_active)}
                      className={`p-2.5 rounded-xl transition-all border-2 ${a.is_active ? "text-violet-600 border-violet-100 bg-violet-50/50" : "text-emerald-600 border-emerald-100 bg-emerald-50/50"}`}
                    >
                      {a.is_active ? <EyeOff className="h-4 w-4 md:h-5 md:w-5" /> : <Eye className="h-4 w-4 md:h-5 md:w-5" />}
                    </button>
                    <button
                      onClick={() => openEdit(a)}
                      className="p-2.5 rounded-xl text-blue-600 border-2 border-blue-100 bg-blue-50/50 transition-all active:scale-90"
                    >
                      <Edit2 className="h-4 w-4 md:h-5 md:w-5" />
                    </button>
                    <button
                      onClick={() => deleteAnn(a.id)}
                      className="p-2.5 rounded-xl text-red-600 border-2 border-red-100 bg-red-50/50 transition-all active:scale-90"
                    >
                      <Trash2 className="h-4 w-4 md:h-5 md:w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Compose/Edit Modal (Premium Glassmorphism) */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-slate-900/60 dark:bg-black/90 backdrop-blur-xl transition-all animate-in fade-in duration-300">
          <div className="rounded-3xl md:rounded-[2.5rem] p-8 md:p-14 w-full max-w-4xl max-h-[95vh] overflow-y-auto no-scrollbar relative bg-white dark:bg-[#0d0622] border-2 border-slate-100 dark:border-fuchsia-500/30 shadow-2xl">
            
            {/* Modal Ambient Glow */}
            <div className="absolute top-0 right-0 w-96 h-96 opacity-10 dark:opacity-20 -translate-y-1/2 translate-x-1/2 blur-[100px]" style={{ background: "radial-gradient(circle, #c026d3, transparent)" }} />

            <div className="flex items-center justify-between mb-8 md:mb-12 relative z-10">
              <h3 className="text-heading-3 md:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-4 md:gap-6">
                <div className="w-12 h-12 md:w-20 md:h-20 rounded-xl md:rounded-[1.5rem] flex items-center justify-center shadow-xl bg-gradient-to-br from-fuchsia-600 to-purple-600">
                  {editing ? <Edit2 className="h-5 w-5 md:h-8 md:w-8 text-white stroke-[3px]" /> : <Megaphone className="h-5 w-5 md:h-8 md:w-8 text-white stroke-[3px]" />}
                </div>
                {editing ? "Edit Signal" : "New Signal"}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 dark:text-violet-400 bg-slate-100 dark:bg-white/10 p-3 md:p-4 rounded-xl hover:rotate-90 transition-all">
                <X className="h-6 w-6 md:h-8 md:w-8" />
              </button>
            </div>

            <div className="space-y-6 md:space-y-10 relative z-10">
              <div>
                <label className="block text-badge md:text-body font-black text-slate-500 dark:text-violet-400 uppercase tracking-[0.2em] mb-3 md:mb-4">Headline</label>
                <input
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="Broadcast Title..."
                  className="w-full rounded-xl md:rounded-3xl px-6 md:px-8 py-4 md:py-8 text-body md:text-heading-1 font-black text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-violet-500/40 outline-none transition-all shadow-inner bg-slate-50 dark:bg-black/40 border-2 border-slate-100 dark:border-fuchsia-500/20 focus:border-fuchsia-500"
                />
              </div>
              
              <div>
                <label className="block text-badge md:text-body font-black text-slate-500 dark:text-violet-400 uppercase tracking-[0.2em] mb-3 md:mb-4">Message</label>
                <textarea
                  value={form.message}
                  onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                  rows={4}
                  placeholder="Detailed broadcast content..."
                  className="w-full rounded-xl md:rounded-3xl px-6 md:px-8 py-4 md:py-8 text-badge md:text-heading-2 font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-violet-500/40 outline-none transition-all resize-none shadow-inner bg-slate-50 dark:bg-black/40 border-2 border-slate-100 dark:border-fuchsia-500/20 focus:border-fuchsia-500"
                />
              </div>
              
              <div className="p-5 md:p-8 rounded-2xl md:rounded-3xl flex items-center gap-4 md:gap-6 cursor-pointer hover:bg-fuchsia-50 dark:hover:bg-fuchsia-500/5 transition-all border-2 border-slate-100 dark:border-violet-500/10 group"
                onClick={() => setForm(p => ({ ...p, is_active: !p.is_active }))}>
                <div className={`w-7 h-7 md:w-8 md:h-8 rounded-lg md:rounded-xl flex items-center justify-center transition-all duration-500 ${form.is_active ? 'bg-fuchsia-600 shadow-lg scale-110' : 'bg-slate-200 dark:bg-black/60 border-2 border-slate-300 dark:border-violet-500/20'}`}>
                  {form.is_active && <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-white stroke-[3px]" />}
                </div>
                <div className="flex-1">
                  <p className="text-badge md:text-heading-1 font-black text-slate-900 dark:text-white uppercase tracking-tight">Broadcast Status</p>
                  <p className="text-[9px] md:text-body font-bold text-slate-500 dark:text-violet-400 opacity-60">Notify all users immediately.</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-end mt-10 md:mt-12 relative z-10 pt-8 md:pt-10 border-t-2 border-slate-50 dark:border-white/5">
              <button onClick={() => setShowForm(false)} className="px-8 py-4 text-badge md:text-heading-3 font-black uppercase tracking-widest text-slate-500 dark:text-violet-400 hover:text-slate-900 dark:hover:text-white transition-all order-2 sm:order-1">
                Cancel
              </button>
              <button
                disabled={saving || !form.title.trim() || !form.message.trim()}
                onClick={save}
                className="px-10 py-4 disabled:opacity-50 text-white text-badge md:text-heading-3 font-black uppercase tracking-[0.2em] rounded-xl md:rounded-3xl transition-all shadow-xl bg-gradient-to-br from-fuchsia-600 to-purple-600 order-1 sm:order-2 active:scale-95"
              >
                {saving ? "Syncing..." : editing ? "Update Signal" : "Publish Signal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  )
}

