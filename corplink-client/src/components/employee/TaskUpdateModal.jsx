import { useState } from "react"
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../context/AuthContext"
import { logAdminActivity } from "../../utils/logger"
import {
  X,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  MessageSquare,
  Calendar,
  Tag,
} from "lucide-react"

// ─── Toast ─────────────────────────────────────────────────────────
function Toast({ message, type }) {
  return (
    <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold transition-all
      ${type === "success"
        ? "bg-emerald-600 text-white"
        : "bg-red-600 text-white"
      }`}
    >
      {type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
      {message}
    </div>
  )
}

// ─── Status options available to employee ─────────────────────────
const STATUS_OPTIONS = [
  { value: "in_progress", label: "In Progress" },
  { value: "needs_review", label: "Needs Review (Submit for Approval)" },
  { value: "completed", label: "Completed" },
]

const priorityConfig = {
  high: { label: "High", class: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" },
  medium: { label: "Medium", class: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" },
  low: { label: "Low", class: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" },
}

// ─── Main Component ────────────────────────────────────────────────
function TaskUpdateModal({ task, onClose, onSuccess }) {
  const { user, profile } = useAuth()

  const [newStatus, setNewStatus] = useState(
    STATUS_OPTIONS.find(o => o.value === task.status)?.value || "in_progress"
  )
  const [progressNote, setProgressNote] = useState(task.progress_note || "")
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  const pConf = priorityConfig[task.priority] || priorityConfig.low

  const showToast = (message, type = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Update the task
      const { error: updateErr } = await supabase
        .from("tasks")
        .update({
          status: newStatus,
          progress_note: progressNote.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", task.id)
        .eq("company_id", profile.company_id) // Security: ensure same company

      if (updateErr) throw updateErr

      // Log activity
      await logAdminActivity({
        company_id: profile.company_id,
        user_id: user.id,
        action: `Updated task "${task.title}" → ${newStatus}`,
        entity: "task",
        severity: "info",
        status: "success",
      })

      // Insert notification for task assignee (if there's an assignee manager)
      // Insert a notification record if notifications table exists
      try {
        await supabase.from("notifications").insert([{
          user_id: user.id,
          company_id: profile.company_id,
          type: "task_update",
          message: `You updated task "${task.title}" to "${newStatus.replace("_", " ")}"`,
          is_read: false,
          created_at: new Date().toISOString(),
        }])
      } catch (_) {
        // Notifications table may not exist yet — ignore gracefully
      }

      showToast("Task updated successfully!", "success")
      setTimeout(() => onSuccess?.(), 1000)
    } catch (err) {
      console.error("TaskUpdateModal error:", err)
      showToast(err.message || "Failed to update task.", "error")
    } finally {
      setSaving(false)
    }
  }

  // Prevent background scroll when modal is open
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={e => { if (e.target === e.currentTarget) onClose() }}
      >
        {/* Modal Panel */}
        <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
            <h2 className="font-bold text-slate-800 dark:text-white text-lg">Update Task</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Task Details (read-only) */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-blue-50/30 dark:bg-blue-900/10">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2 text-base">{task.title}</h3>
            {task.description && (
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">{task.description}</p>
            )}
            <div className="flex flex-wrap gap-2">
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${pConf.class}`}>
                <Tag className="h-3 w-3 inline mr-1" />
                {pConf.label} Priority
              </span>
              {task.deadline && (
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-full">
                  <Calendar className="h-3 w-3" />
                  Due: {new Date(task.deadline).toLocaleDateString()}
                </span>
              )}
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-full">
                <Clock className="h-3 w-3" />
                Current: {task.status?.replace("_", " ") || "pending"}
              </span>
            </div>
          </div>

          {/* Update Form */}
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
            {/* Status Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Update Status
              </label>
              <select
                value={newStatus}
                onChange={e => setNewStatus(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Progress Note */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                Progress Note / Comment
              </label>
              <textarea
                value={progressNote}
                onChange={e => setProgressNote(e.target.value)}
                placeholder="Describe your progress, blockers, or any notes for this update..."
                rows={4}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition shadow-sm shadow-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {saving ? "Saving..." : "Submit Update"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </>
  )
}

export default TaskUpdateModal
