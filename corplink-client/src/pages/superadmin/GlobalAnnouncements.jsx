import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../context/AuthContext"
import SuperAdminLayout from "../../components/superadmin/layout/SuperAdminLayout"
import { Megaphone, Plus, X, Edit2, Trash2, Eye, EyeOff, Sparkles } from "lucide-react"

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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl relative overflow-hidden"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(139,92,246,0.15)" }}>
          <Megaphone className="h-4 w-4 text-violet-400" />
          <p className="text-sm font-bold text-violet-300">
            {announcements.length} <span className="font-medium text-violet-500">Total Announcement{announcements.length !== 1 ? "s" : ""}</span>
          </p>
        </div>
        
        <button
          onClick={openNew}
          className="group flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 shadow-lg relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #c026d3, #9333ea)", boxShadow: "0 8px 20px rgba(192,38,211,0.3)" }}
        >
          {/* Button Shine Effect */}
          <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <Plus className="h-4 w-4 relative z-10" /> <span className="relative z-10">Compose Broadcast</span>
        </button>
      </div>

      {/* Announcements Grid / List */}
      <div className="grid gap-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-violet-400 font-bold tracking-wide">Loading broadcasts...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-20 rounded-3xl relative overflow-hidden"
            style={{ background: "rgba(255,255,255,0.01)", border: "1px dashed rgba(139,92,246,0.2)" }}>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-fuchsia-500/10 rounded-full blur-3xl" />
            <Sparkles className="h-16 w-16 text-violet-500/40 mx-auto mb-4 relative z-10" />
            <p className="text-violet-300 font-bold text-xl relative z-10">The airwaves are quiet.</p>
            <p className="text-violet-500 text-sm mt-2 relative z-10">Compose your first broadcast to notify all corporate users.</p>
            <button onClick={openNew} className="mt-6 px-6 py-2 rounded-xl text-sm font-bold text-fuchsia-400 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 transition-colors relative z-10 border border-fuchsia-500/20">
              Create Announcement
            </button>
          </div>
        ) : (
          announcements.map(a => (
            <div
              key={a.id}
              className="rounded-2xl p-6 transition-all relative overflow-hidden group"
              style={a.is_active 
                ? { background: "linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))", border: "1px solid rgba(139,92,246,0.2)", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }
                : { background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", opacity: 0.6 }
              }
            >
              {a.is_active && <div className="absolute top-0 left-0 w-1 h-full" style={{ background: "linear-gradient(180deg, #c026d3, #9333ea)" }} />}
              
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <h3 className="text-lg font-black text-white tracking-wide">{a.title}</h3>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md"
                      style={a.is_active 
                        ? { background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }
                        : { background: "rgba(148,163,184,0.1)", border: "1px solid rgba(148,163,184,0.2)" }
                      }>
                      <div className={`w-1.5 h-1.5 rounded-full ${a.is_active ? "bg-emerald-400 shadow-[0_0_6px_#34d399]" : "bg-slate-400"}`} />
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${a.is_active ? "text-emerald-400" : "text-slate-400"}`}>
                        {a.is_active ? "Live" : "Draft / Hidden"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <p className="text-sm text-violet-300/90 leading-relaxed whitespace-pre-wrap">{a.message}</p>
                  </div>
                  
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-[10px] font-bold text-violet-500 uppercase tracking-widest px-2 py-1 rounded bg-black/20">
                      Posted: {new Date(a.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 md:flex-col lg:flex-row bg-black/20 p-1.5 rounded-xl border border-white/5">
                  <button
                    onClick={() => toggleActive(a.id, a.is_active)}
                    title={a.is_active ? "Hide Broadcast" : "Publish Broadcast"}
                    className="p-2.5 rounded-lg transition-all group-hover:opacity-100"
                    style={{ color: a.is_active ? "#a78bfa" : "#34d399" }}
                    onMouseOver={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)" }}
                    onMouseOut={(e) => { e.currentTarget.style.background = "transparent" }}
                  >
                    {a.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <div className="w-px h-4 bg-white/10 hidden lg:block" />
                  <button
                    onClick={() => openEdit(a)}
                    title="Edit Broadcast"
                    className="p-2.5 rounded-lg text-blue-400 transition-all hover:bg-white/10"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <div className="w-px h-4 bg-white/10 hidden lg:block" />
                  <button
                    onClick={() => deleteAnn(a.id)}
                    title="Delete Broadcast"
                    className="p-2.5 rounded-lg text-red-400 transition-all hover:bg-red-500/20 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Compose/Edit Modal (Premium Glassmorphism) */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in">
          <div className="rounded-3xl p-8 w-full max-w-2xl relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, rgba(13,6,34,0.9), rgba(13,6,34,0.95))", border: "1px solid rgba(192,38,211,0.3)", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}>
            
            {/* Modal Ambient Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 opacity-10 -translate-y-20 translate-x-20 blur-3xl" style={{ background: "radial-gradient(circle, #c026d3, transparent)" }} />
            <div className="absolute bottom-0 left-0 w-40 h-40 opacity-10 translate-y-10 -translate-x-10 blur-2xl" style={{ background: "radial-gradient(circle, #7c3aed, transparent)" }} />

            <div className="flex items-center justify-between mb-8 relative z-10">
              <h3 className="text-xl font-black text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #c026d3, #9333ea)", boxShadow: "0 4px 15px rgba(192,38,211,0.4)" }}>
                  {editing ? <Edit2 className="h-4 w-4 text-white" /> : <Megaphone className="h-4 w-4 text-white" />}
                </div>
                {editing ? "Edit Broadcast" : "New Broadcast"}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-violet-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2.5 rounded-xl">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 relative z-10">
              <div>
                <label className="block text-xs font-bold text-violet-400 uppercase tracking-widest mb-2">Headline / Title</label>
                <input
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g., Scheduled Maintenance this Friday"
                  className="w-full rounded-xl px-5 py-4 text-base text-white placeholder-violet-500/50 outline-none transition-all shadow-inner"
                  style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(192,38,211,0.2)" }}
                  onFocus={(e) => { e.target.style.borderColor = "rgba(192,38,211,0.6)"; e.target.style.boxShadow = "0 0 20px rgba(192,38,211,0.1) inset" }}
                  onBlur={(e) => { e.target.style.borderColor = "rgba(192,38,211,0.2)"; e.target.style.boxShadow = "none" }}
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-violet-400 uppercase tracking-widest mb-2">Detailed Message</label>
                <textarea
                  value={form.message}
                  onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                  rows={6}
                  placeholder="Type your message here. Markdown is not supported yet."
                  className="w-full rounded-xl px-5 py-4 text-sm text-white placeholder-violet-500/50 outline-none transition-all resize-none shadow-inner custom-scrollbar"
                  style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(192,38,211,0.2)" }}
                  onFocus={(e) => { e.target.style.borderColor = "rgba(192,38,211,0.6)"; e.target.style.boxShadow = "0 0 20px rgba(192,38,211,0.1) inset" }}
                  onBlur={(e) => { e.target.style.borderColor = "rgba(192,38,211,0.2)"; e.target.style.boxShadow = "none" }}
                />
              </div>
              
              <div className="p-4 rounded-xl flex items-center gap-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                style={{ border: "1px solid rgba(139,92,246,0.1)" }}
                onClick={() => setForm(p => ({ ...p, is_active: !p.is_active }))}>
                <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${form.is_active ? 'bg-fuchsia-500' : 'bg-black/40 border border-violet-500/30'}`}>
                  {form.is_active && <CheckCircle className="h-3.5 w-3.5 text-white" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Publish Immediately</p>
                  <p className="text-xs text-violet-400">If unchecked, this will be saved as a hidden draft.</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 justify-end mt-8 relative z-10 pt-6 border-t border-white/5">
              <button onClick={() => setShowForm(false)} className="px-6 py-3 text-sm font-bold text-violet-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                Discard
              </button>
              <button
                disabled={saving || !form.title.trim() || !form.message.trim()}
                onClick={save}
                className="px-8 py-3 disabled:opacity-50 text-white text-sm font-black tracking-wide rounded-xl transition-all shadow-lg hover:scale-105 active:scale-95 flex items-center gap-2"
                style={{ background: "linear-gradient(135deg, #c026d3, #9333ea)", boxShadow: "0 8px 20px rgba(192,38,211,0.3)" }}
              >
                {saving ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                ) : editing ? "Update Broadcast" : "Publish Broadcast"}
              </button>
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  )
}
