import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../context/AuthContext"
import {
  Users2,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Trash2,
  Loader2,
} from "lucide-react"

// ─── Skeleton ──────────────────────────────────────────────────────
function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded-lg ${className}`} />
}

// ─── Toast ─────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  return (
    <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold
      ${type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}
    >
      {message}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">✕</button>
    </div>
  )
}

// ─── Status Config ─────────────────────────────────────────────────
const statusConfig = {
  pending: { label: "Pending", class: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400", icon: Clock },
  accepted: { label: "Accepted", class: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400", icon: CheckCircle2 },
  rejected: { label: "Rejected", class: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400", icon: XCircle },
}

// ─── Main Component ────────────────────────────────────────────────
function CollaborationRequest() {
  const { user, profile } = useAuth()

  const [colleagues, setColleagues] = useState([])
  const [sentRequests, setSentRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [cancelling, setCancelling] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [toast, setToast] = useState(null)

  const [form, setForm] = useState({
    receiver_id: "",
    message: "",
    type: "internal",
  })

  const showToast = (message, type = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  useEffect(() => {
    if (user?.id && profile?.company_id) {
      fetchData()
    }
  }, [user, profile, refreshKey])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch colleagues from same company (employees table)
      const { data: colls } = await supabase
        .from("employees")
        .select("id, name, designation, department_id")
        .eq("company_id", profile.company_id)
        .neq("user_id", user.id) // exclude self
        .eq("is_active", true)
        .order("name")

      setColleagues(colls || [])

      // Fetch sent collaboration requests
      const { data: reqs, error: rErr } = await supabase
        .from("collaboration_requests")
        .select("id, receiver_id, type, message, status, created_at")
        .eq("sender_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20)

      if (rErr && rErr.code !== "42P01") throw rErr
      setSentRequests(reqs || [])
    } catch (err) {
      console.error("CollaborationRequest fetchData error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.receiver_id || !form.message.trim()) {
      showToast("Please select a recipient and add a message.", "error")
      return
    }
    setSubmitting(true)

    try {
      const { error } = await supabase.from("collaboration_requests").insert([{
        sender_id: user.id,
        receiver_id: form.receiver_id,
        company_id: profile.company_id,
        corporate_id: profile.company_id,
        type: form.type,
        message: form.message.trim(),
        status: "pending",
        created_at: new Date().toISOString(),
      }])

      if (error) throw error

      showToast("Collaboration request sent!", "success")
      setForm({ receiver_id: "", message: "", type: "internal" })
      setRefreshKey(k => k + 1)
    } catch (err) {
      console.error("CollaborationRequest submit error:", err)
      showToast(err.message || "Failed to send request.", "error")
    } finally {
      setSubmitting(false)
    }
  }

  const cancelRequest = async (id) => {
    setCancelling(id)
    try {
      await supabase.from("collaboration_requests").delete().eq("id", id).eq("sender_id", user.id)
      setSentRequests(prev => prev.filter(r => r.id !== id))
      showToast("Request cancelled.", "success")
    } catch (err) {
      showToast("Failed to cancel request.", "error")
    } finally {
      setCancelling(null)
    }
  }

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const hrs = Math.floor(diff / 3600000)
    if (hrs < 1) return "Just now"
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Users2 className="h-6 w-6 text-indigo-500" />
            Collaboration Requests
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Send collaboration requests to your colleagues
          </p>
        </div>
        <button
          onClick={() => setRefreshKey(k => k + 1)}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* ── Send Request Form ── */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
          <h2 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Send className="h-4 w-4 text-blue-500" />
            New Collaboration Request
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Request Type
              </label>
              <div className="flex gap-2">
                {["internal", "external"].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, type: t }))}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-xl border transition ${
                      form.type === t
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-300"
                    }`}
                  >
                    {t === "internal" ? "🏢 Internal" : "🌐 External"}
                  </button>
                ))}
              </div>
            </div>

            {/* Recipient */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                {form.type === "internal" ? "Select Colleague" : "Select Partner Contact"}
              </label>
              {loading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <select
                  value={form.receiver_id}
                  onChange={e => setForm(f => ({ ...f, receiver_id: e.target.value }))}
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select a person --</option>
                  {colleagues.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.designation ? `— ${c.designation}` : ""}
                    </option>
                  ))}
                </select>
              )}
              {!loading && colleagues.length === 0 && (
                <p className="text-xs text-slate-400 mt-1">No colleagues found in the employees table.</p>
              )}
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Message / Purpose
              </label>
              <textarea
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                placeholder="Describe the purpose of this collaboration request..."
                rows={4}
                required
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-sm transition disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {submitting ? "Sending..." : "Send Request"}
            </button>
          </form>
        </div>

        {/* ── Sent Requests List ── */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
            <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" />
              Sent Requests
              <span className="ml-auto text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">
                {sentRequests.length}
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : sentRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 px-6 text-center">
              <Users2 className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No requests sent yet</p>
              <p className="text-xs mt-1">Your sent requests will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {sentRequests.map(req => {
                const sConf = statusConfig[req.status] || statusConfig.pending
                const StatusIcon = sConf.icon
                return (
                  <div key={req.id} className="flex items-start gap-3 px-5 py-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${sConf.class}`}>
                          <StatusIcon className="h-3 w-3" />
                          {sConf.label}
                        </span>
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 px-2 py-0.5 rounded-full capitalize">
                          {req.type}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">{req.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{timeAgo(req.created_at)}</p>
                    </div>

                    {req.status === "pending" && (
                      <button
                        onClick={() => cancelRequest(req.id)}
                        disabled={cancelling === req.id}
                        title="Cancel request"
                        className="shrink-0 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition"
                      >
                        {cancelling === req.id
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <Trash2 className="h-4 w-4" />
                        }
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

export default CollaborationRequest
