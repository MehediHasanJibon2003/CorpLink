import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { logAdminActivity } from "../../utils/logger";
import {
  X,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  MessageSquare,
  Calendar,
  Tag,
} from "lucide-react";

// ─── Toast ─────────────────────────────────────────────────────────
function Toast({ message, type }) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold transition-all
      ${
        type === "success"
          ? "bg-emerald-600 text-white"
          : "bg-red-600 text-white"
      }`}
    >
      {type === "success" ? (
        <CheckCircle2 className="h-4 w-4" />
      ) : (
        <AlertCircle className="h-4 w-4" />
      )}
      {message}
    </div>
  );
}

// ─── Status options available to employee ─────────────────────────
const STATUS_OPTIONS = [
  { value: "in_progress", label: "In Progress" },
  { value: "needs_review", label: "Needs Review (Submit for Approval)" },
  { value: "completed", label: "Completed" },
];

const priorityConfig = {
  high: {
    label: "High",
    class: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
  },
  medium: {
    label: "Medium",
    class:
      "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
  },
  low: {
    label: "Low",
    class:
      "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
  },
};

// ─── Main Component ────────────────────────────────────────────────
function TaskUpdateModal({ task, onClose, onSuccess }) {
  const { user, profile } = useAuth();

  const [newStatus, setNewStatus] = useState(
    STATUS_OPTIONS.find((o) => o.value === task.status)?.value || "in_progress",
  );
  const [progressNote, setProgressNote] = useState(task.progress_note || "");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const pConf = priorityConfig[task.priority] || priorityConfig.low;

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

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
        .eq("company_id", profile.company_id); // Security: ensure same company

      if (updateErr) throw updateErr;

      // Log activity
      await logAdminActivity({
        company_id: profile.company_id,
        user_id: user.id,
        action: `Updated task "${task.title}" → ${newStatus}`,
        entity: "task",
        severity: "info",
        status: "success",
      });

      // Insert notification for task assignee (if there's an assignee manager)
      // Insert a notification record if notifications table exists
      try {
        await supabase.from("notifications").insert([
          {
            user_id: user.id,
            company_id: profile.company_id,
            type: "task_update",
            message: `You updated task "${task.title}" to "${newStatus.replace("_", " ")}"`,
            is_read: false,
            created_at: new Date().toISOString(),
          },
        ]);
      } catch (_) {
        // Notifications table may not exist yet — ignore gracefully
      }

      showToast("Task updated successfully!", "success");
      setTimeout(() => onSuccess?.(), 1000);
    } catch (err) {
      console.error("TaskUpdateModal error:", err);
      showToast(err.message || "Failed to update task.", "error");
    } finally {
      setSaving(false);
    }
  };

  // Prevent background scroll when modal is open
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* Modal Panel */}
        <div className="w-full max-w-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-3xl md:rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-8 md:px-12 py-6 md:py-8 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
            <h2 className="font-black text-2xl md:text-3xl text-slate-800 dark:text-white">
              Update Task
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-3 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Task Details (read-only) */}
          <div className="px-8 md:px-12 py-6 md:py-8 border-b-2 border-slate-100 dark:border-slate-700 bg-blue-50/30 dark:bg-blue-900/10">
            <h3 className="font-black text-slate-800 dark:text-slate-100 mb-3 text-xl md:text-2xl">
              {task.title}
            </h3>
            {task.description && (
              <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 mb-5 leading-relaxed font-medium">
                {task.description}
              </p>
            )}
            <div className="flex flex-wrap gap-4">
              <span
                className={`text-xs md:text-sm font-black px-4 py-1.5 rounded-full uppercase tracking-widest ${pConf.class}`}
              >
                <Tag className="h-4 w-4 inline mr-2" />
                {pConf.label} Priority
              </span>
              {task.deadline && (
                <span className="text-xs md:text-sm font-black text-slate-500 dark:text-slate-400 flex items-center gap-2 bg-slate-100 dark:bg-slate-700 px-4 py-1.5 rounded-full uppercase tracking-widest">
                  <Calendar className="h-4 w-4" />
                  Due: {new Date(task.deadline).toLocaleDateString()}
                </span>
              )}
              <span className="text-xs md:text-sm font-black text-slate-500 dark:text-slate-400 flex items-center gap-2 bg-slate-100 dark:bg-slate-700 px-4 py-1.5 rounded-full uppercase tracking-widest">
                <Clock className="h-4 w-4" />
                Current: {task.status?.replace("_", " ") || "pending"}
              </span>
            </div>
          </div>

          {/* Update Form */}
          <form
            onSubmit={handleSubmit}
            className="px-8 md:px-12 py-8 space-y-8"
          >
            {/* Status Dropdown */}
            <div>
              <label className="block text-sm md:text-base font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">
                Update Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-6 py-4 md:py-5 border-2 border-slate-200 dark:border-slate-700 rounded-2xl md:rounded-[2rem] bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-base md:text-lg font-bold outline-none focus:ring-4 focus:ring-blue-500/20 transition"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Progress Note */}
            <div>
              <label className="block text-sm md:text-base font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 md:h-5 md:w-5" />
                Progress Note / Comment
              </label>
              <textarea
                value={progressNote}
                onChange={(e) => setProgressNote(e.target.value)}
                placeholder="Describe your progress, blockers, or any notes for this update..."
                rows={4}
                className="w-full px-6 py-5 border-2 border-slate-200 dark:border-slate-700 rounded-2xl md:rounded-[2rem] bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-base md:text-lg font-medium outline-none focus:ring-4 focus:ring-blue-500/20 transition resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-6 py-3 md:px-8 md:py-4 text-sm md:text-lg font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl md:rounded-full transition border-2 border-transparent hover:border-slate-200 dark:hover:border-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-3 px-6 py-3 md:px-8 md:py-4 bg-blue-600 hover:bg-blue-700 text-white text-sm md:text-lg font-black uppercase tracking-widest rounded-xl md:rounded-full transition shadow-md shadow-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving && (
                  <Loader2 className="h-5 w-5 md:h-6 md:w-6 animate-spin" />
                )}
                {saving ? "Saving..." : "Submit Update"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </>
  );
}

export default TaskUpdateModal;
