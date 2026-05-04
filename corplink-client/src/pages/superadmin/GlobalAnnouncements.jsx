import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../context/AuthContext"
import SuperAdminLayout from "../../components/superadmin/layout/SuperAdminLayout"
import { Megaphone, Plus, X, Edit2, Trash2, Eye, EyeOff, Sparkles, CheckCircle } from "lucide-react"

export default function GlobalAnnouncements() {
  const { user } = useAuth()
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

  const deleteAnn = async (id) => {
    if (!window.confirm("Are you sure you want to delete this announcement? This action cannot be undone.")) return
    await supabase.from("global_announcements").delete().eq("id", id)
    await fetch()
  }

  const toggleActive = async (id, val) => {
    await supabase.from("global_announcements").update({ is_active: !val }).eq("id", id)
    await fetch()
  }

  return (
    <SuperAdminLayout title="Global Announcements" subtitle="Broadcast platform-wide updates and messages to all corporate organizations">
      
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 mb-12">
        <div className="inline-flex items-center gap-4 px-6 md:px-8 py-4 md:py-5 rounded-2xl md:rounded-3xl relative overflow-hidden bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/15 shadow-sm">
          <Megaphone className="h-5 w-5 md:h-6 md:w-6 text-violet-600 dark:text-violet-400" />
          <p className="text-sm md:text-lg font-black text-slate-700 dark:text-violet-300 uppercase tracking-widest">
            {announcements.length} <span className="opacity-60 font-black ml-2">Total Broadcasts</span>
          </p>
        </div>
        
        <button
          onClick={openNew}
          className="group flex items-center justify-center gap-3 px-8 md:px-12 py-4 md:py-6 rounded-2xl md:rounded-[2rem] text-sm md:text-lg font-black text-white transition-all hover:scale-105 active:scale-95 shadow-xl relative overflow-hidden bg-gradient-to-br from-fuchsia-600 to-purple-600 dark:shadow-[0_12px_30px_rgba(192,38,211,0.4)] uppercase tracking-[0.2em]"
        >
          {/* Button Shine Effect */}
          <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <Plus className="h-5 w-5 md:h-7 md:w-7 relative z-10 stroke-[3px]" /> <span className="relative z-10">Compose Broadcast</span>
        </button>
      </div>

      {/* Announcements Grid / List */}
      <div className="grid gap-6 md:gap-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-6">
            <div className="w-12 h-12 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-600 dark:text-violet-400 font-black uppercase tracking-widest">Broadcasting signals...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-24 md:py-40 rounded-[3rem] relative overflow-hidden bg-white dark:bg-white/5 border-2 border-dashed border-slate-200 dark:border-violet-500/20 shadow-inner">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-fuchsia-500/5 dark:bg-fuchsia-500/10 rounded-full blur-[100px]" />
            <Sparkles className="h-20 w-20 md:h-28 md:w-28 text-slate-200 dark:text-violet-500/20 mx-auto mb-8 relative z-10" />
            <p className="text-slate-700 dark:text-violet-300 font-black text-2xl md:text-4xl uppercase tracking-widest relative z-10">The airwaves are quiet.</p>
            <p className="text-slate-500 dark:text-violet-500 text-sm md:text-lg mt-4 font-bold relative z-10">Compose your first broadcast to notify all corporate users.</p>
            <button onClick={openNew} className="mt-10 px-10 py-4 rounded-2xl text-xs md:text-sm font-black uppercase tracking-[0.2em] text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-50 dark:bg-fuchsia-500/10 hover:bg-fuchsia-100 dark:hover:bg-fuchsia-500/20 transition-all relative z-10 border-2 border-fuchsia-200 dark:border-fuchsia-500/20 hover:scale-105">
              Create Announcement
            </button>
          </div>
        ) : (
          announcements.map(a => (
            <div
              key={a.id}
              className={`rounded-3xl md:rounded-[2.5rem] p-8 md:p-12 transition-all duration-500 relative overflow-hidden group border-2 ${
                a.is_active 
                  ? "bg-white dark:bg-gradient-to-br dark:from-white/[0.05] dark:to-white/[0.01] border-slate-100 dark:border-violet-500/30 shadow-xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:scale-[1.01]"
                  : "bg-slate-50 dark:bg-white/[0.01] border-slate-200 dark:border-white/5 opacity-60"
              }`}
            >
              {a.is_active && <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-fuchsia-600 to-purple-600 dark:from-fuchsia-500 dark:to-purple-500" />}
              
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8 relative z-10">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-4 md:gap-6 mb-6 flex-wrap">
                    <h3 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight">{a.title}</h3>
                    <div className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-xl border-2 ${
                      a.is_active 
                        ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 shadow-[0_0_15px_rgba(52,211,153,0.1)]"
                        : "bg-slate-100 dark:bg-slate-500/10 border-slate-200 dark:border-slate-500/20"
                    }`}>
                      <div className={`w-2.5 h-2.5 rounded-full ${a.is_active ? "bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_12px_#34d399] animate-pulse" : "bg-slate-400"}`} />
                      <span className={`text-[10px] md:text-xs font-black uppercase tracking-widest ${a.is_active ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}`}>
                        {a.is_active ? "Signal Live" : "Broadcast Paused"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="relative mb-8">
                    <p className="text-base md:text-xl text-slate-600 dark:text-violet-300/90 leading-[1.6] whitespace-pre-wrap font-bold">{a.message}</p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border-2 border-slate-200 dark:border-violet-500/10 text-[10px] md:text-xs font-black text-slate-500 dark:text-violet-500 uppercase tracking-widest">
                      <span className="opacity-50">Sent:</span> {new Date(a.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-3 lg:flex-col lg:items-end bg-slate-50/50 dark:bg-black/20 p-2 md:p-3 rounded-2xl border-2 border-slate-100 dark:border-white/5">
                  <button
                    onClick={() => toggleActive(a.id, a.is_active)}
                    title={a.is_active ? "Hide Broadcast" : "Publish Broadcast"}
                    className={`p-3 md:p-4 rounded-xl transition-all hover:bg-white dark:hover:bg-white/10 shadow-sm hover:shadow-md hover:-translate-y-1 ${a.is_active ? "text-violet-600 dark:text-violet-400" : "text-emerald-600 dark:text-emerald-400"}`}
                  >
                    {a.is_active ? <EyeOff className="h-5 w-5 md:h-6 md:w-6" /> : <Eye className="h-5 w-5 md:h-6 md:w-6" />}
                  </button>
                  <button
                    onClick={() => openEdit(a)}
                    title="Edit Broadcast"
                    className="p-3 md:p-4 rounded-xl text-blue-600 dark:text-blue-400 transition-all hover:bg-white dark:hover:bg-white/10 shadow-sm hover:shadow-md hover:-translate-y-1"
                  >
                    <Edit2 className="h-5 w-5 md:h-6 md:w-6" />
                  </button>
                  <button
                    onClick={() => deleteAnn(a.id)}
                    title="Delete Broadcast"
                    className="p-3 md:p-4 rounded-xl text-red-600 dark:text-red-400 transition-all hover:bg-red-50 dark:hover:bg-red-500/20 hover:text-red-700 dark:hover:text-red-300 shadow-sm hover:shadow-md hover:-translate-y-1"
                  >
                    <Trash2 className="h-5 w-5 md:h-6 md:w-6" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Compose/Edit Modal (Premium Glassmorphism) */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 dark:bg-black/90 backdrop-blur-xl transition-all animate-in fade-in duration-300">
          <div className="rounded-[2.5rem] p-10 md:p-14 w-full max-w-4xl relative overflow-hidden bg-white dark:bg-[#0d0622] border-2 border-slate-100 dark:border-fuchsia-500/30 shadow-[0_50px_100px_rgba(0,0,0,0.5)]">
            
            {/* Modal Ambient Glow */}
            <div className="absolute top-0 right-0 w-96 h-96 opacity-10 dark:opacity-20 -translate-y-1/2 translate-x-1/2 blur-[100px]" style={{ background: "radial-gradient(circle, #c026d3, transparent)" }} />
            <div className="absolute bottom-0 left-0 w-64 h-64 opacity-10 dark:opacity-20 translate-y-1/2 -translate-x-1/2 blur-[100px]" style={{ background: "radial-gradient(circle, #7c3aed, transparent)" }} />

            <div className="flex items-center justify-between mb-12 relative z-10">
              <h3 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-6">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem] flex items-center justify-center shadow-xl bg-gradient-to-br from-fuchsia-600 to-purple-600 dark:shadow-[0_12px_30px_rgba(192,38,211,0.5)]">
                  {editing ? <Edit2 className="h-8 w-8 text-white stroke-[3px]" /> : <Megaphone className="h-8 w-8 text-white stroke-[3px]" />}
                </div>
                {editing ? "Edit Signal" : "New Signal"}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 dark:text-violet-400 hover:text-slate-900 dark:hover:text-white transition-all bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 p-4 rounded-2xl hover:rotate-90">
                <X className="h-8 w-8" />
              </button>
            </div>

            <div className="space-y-10 relative z-10">
              <div>
                <label className="block text-xs md:text-sm font-black text-slate-500 dark:text-violet-400 uppercase tracking-[0.2em] mb-4">Broadcast Headline</label>
                <input
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="Headline..."
                  className="w-full rounded-2xl md:rounded-3xl px-8 py-6 md:py-8 text-lg md:text-2xl font-black text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-violet-500/40 outline-none transition-all shadow-inner bg-slate-50 dark:bg-black/40 border-2 border-slate-100 dark:border-fuchsia-500/20 focus:border-fuchsia-500 dark:focus:border-fuchsia-500/60"
                />
              </div>
              
              <div>
                <label className="block text-xs md:text-sm font-black text-slate-500 dark:text-violet-400 uppercase tracking-[0.2em] mb-4">Detailed Message</label>
                <textarea
                  value={form.message}
                  onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                  rows={6}
                  placeholder="The message..."
                  className="w-full rounded-2xl md:rounded-3xl px-8 py-6 md:py-8 text-base md:text-xl font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-violet-500/40 outline-none transition-all resize-none shadow-inner custom-scrollbar bg-slate-50 dark:bg-black/40 border-2 border-slate-100 dark:border-fuchsia-500/20 focus:border-fuchsia-500 dark:focus:border-fuchsia-500/60"
                />
              </div>
              
              <div className="p-6 md:p-8 rounded-3xl flex items-center gap-6 cursor-pointer hover:bg-fuchsia-50 dark:hover:bg-fuchsia-500/5 transition-all border-2 border-slate-100 dark:border-violet-500/10 group"
                onClick={() => setForm(p => ({ ...p, is_active: !p.is_active }))}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-500 ${form.is_active ? 'bg-fuchsia-600 dark:bg-fuchsia-500 shadow-lg shadow-fuchsia-500/50 scale-110' : 'bg-slate-200 dark:bg-black/60 border-2 border-slate-300 dark:border-violet-500/20'}`}>
                  {form.is_active && <CheckCircle className="h-5 w-5 text-white stroke-[3px]" />}
                </div>
                <div>
                  <p className="text-lg md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Signal Live Status</p>
                  <p className="text-sm md:text-base font-bold text-slate-500 dark:text-violet-400 opacity-60">Broadcast immediately to all organizations upon saving.</p>
                </div>
              </div>
            </div>

            <div className="flex gap-6 justify-end mt-12 relative z-10 pt-10 border-t-2 border-slate-50 dark:border-white/5">
              <button onClick={() => setShowForm(false)} className="px-10 py-5 text-sm md:text-lg font-black uppercase tracking-widest text-slate-500 dark:text-violet-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-2xl transition-all">
                Discard
              </button>
              <button
                disabled={saving || !form.title.trim() || !form.message.trim()}
                onClick={save}
                className="px-12 py-5 disabled:opacity-50 text-white text-sm md:text-lg font-black uppercase tracking-[0.2em] rounded-2xl md:rounded-3xl transition-all shadow-2xl hover:scale-105 active:scale-95 flex items-center gap-4 bg-gradient-to-br from-fuchsia-600 to-purple-600 dark:shadow-[0_15px_40px_rgba(192,38,211,0.5)]"
              >
                {saving ? (
                  <><div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" /> Syncing...</>
                ) : editing ? "Update Signal" : "Publish Signal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  )
}
