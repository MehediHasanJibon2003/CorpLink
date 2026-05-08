import { useState, useEffect, useRef } from "react";
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
  Paperclip,
  FileText,
  Trash2,
  ExternalLink,
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
  const fileInputRef = useRef();

  const role = profile?.role?.toLowerCase();
  const isManagerial = ["manager", "department_head", "team_leader"].includes(role);

  const STATUS_OPTIONS = [
    { value: "pending", label: "Pending" },
    { value: "in_progress", label: "In Progress" },
    { value: "needs_review", label: "Submit for Review" },
    ...(isManagerial ? [
      { value: "finished", label: "Approve & Finish" },
      { value: "rejected", label: "Reject & Reopen" }
    ] : [])
  ];

  const [newStatus, setNewStatus] = useState(
    STATUS_OPTIONS.find((o) => o.value === task.status)?.value || task.status || "pending",
  );
  const [progressNote, setProgressNote] = useState(task.progress_note || "");
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const pConf = priorityConfig[task.priority] || priorityConfig.low;

  useEffect(() => {
    fetchAttachments();
  }, [task.id]);

  const fetchAttachments = async () => {
    try {
      const { data, error } = await supabase
        .from("task_attachments")
        .select("*")
        .eq("task_id", task.id)
        .order("created_at", { ascending: false });

      if (error && error.code !== "42P01") throw error;
      setAttachments(data || []);
    } catch (err) {
      console.error("fetchAttachments error:", err);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    let successCount = 0;

    for (const file of Array.from(files)) {
      try {
        const fileExt = file.name.split(".").pop();
        const fileName = `${task.id}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `tasks/${task.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("task-attachments")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("task-attachments").getPublicUrl(filePath);

        const { error: dbError } = await supabase
          .from("task_attachments")
          .insert([
            {
              task_id: task.id,
              file_url: publicUrl,
              file_name: file.name,
              uploaded_by: user.id,
            },
          ]);

        if (dbError) throw dbError;
        successCount++;
      } catch (err) {
        console.error("Upload error:", err);
        showToast(`Failed to upload ${file.name}`, "error");
      }
    }

    if (successCount > 0) {
      showToast(`${successCount} file(s) uploaded successfully!`);
      fetchAttachments();
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = async (id) => {
    try {
      const { error } = await supabase
        .from("task_attachments")
        .delete()
        .eq("id", id)
        .eq("uploaded_by", user.id);

      if (error) throw error;
      setAttachments((prev) => prev.filter((a) => a.id !== id));
      showToast("Attachment removed.");
    } catch (err) {
      showToast("Failed to remove attachment.", "error");
    }
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
        .eq("company_id", profile.company_id);

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

      // Notification
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
      } catch (_) {}

      showToast("Task updated successfully!", "success");
      setTimeout(() => onSuccess?.(), 1000);
    } catch (err) {
      console.error("TaskUpdateModal error:", err);
      showToast(err.message || "Failed to update task.", "error");
    } finally {
      setSaving(false);
    }
  };

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
        <div className="w-full max-w-3xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-3xl md:rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-8 md:px-12 py-6 md:py-8 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 shrink-0">
            <h2 className="font-black text-2xl md:text-3xl text-slate-800 dark:text-white">
              Task Workspace
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-3 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {/* Task Details */}
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
                  <span className="text-xs md:text-sm font-black text-slate-500 dark:text-slate-400 flex items-center gap-2 bg-white dark:bg-slate-700 px-4 py-1.5 rounded-full border border-slate-200 dark:border-slate-600 uppercase tracking-widest">
                    <Calendar className="h-4 w-4" />
                    Due: {new Date(task.deadline).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            {/* Update Form */}
            <form
              onSubmit={handleSubmit}
              className="px-8 md:px-12 py-8 space-y-8"
            >
              <div className="grid md:grid-cols-2 gap-8">
                {/* Status Dropdown */}
                <div>
                  <label className="block text-sm md:text-base font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">
                    Update Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-6 py-4 border-2 border-slate-200 dark:border-slate-700 rounded-2xl md:rounded-[1.5rem] bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-base md:text-lg font-bold outline-none focus:ring-4 focus:ring-blue-500/20 transition"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* File Upload Trigger */}
                <div>
                  <label className="block text-sm md:text-base font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">
                    Attachments
                  </label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl md:rounded-[1.5rem] text-slate-500 hover:border-blue-500 hover:text-blue-500 transition-all font-bold"
                  >
                    {uploading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Paperclip className="h-5 w-5" />
                    )}
                    {uploading ? "Uploading..." : "Attach Files"}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
              </div>

              {/* Attachment List */}
              {attachments.length > 0 && (
                <div className="grid sm:grid-cols-2 gap-4">
                  {attachments.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-700 rounded-2xl group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="h-5 w-5 text-blue-500 shrink-0" />
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">
                          {file.file_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={file.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-slate-400 hover:text-blue-500 transition"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() => removeAttachment(file.id)}
                          className="p-2 text-slate-400 hover:text-red-500 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Progress Note */}
              <div>
                <label className="block text-sm md:text-base font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 md:h-5 md:w-5" />
                  Progress Note / Comment
                </label>
                <textarea
                  value={progressNote}
                  onChange={(e) => setProgressNote(e.target.value)}
                  placeholder="Describe your progress, blockers, or any notes..."
                  rows={4}
                  className="w-full px-6 py-5 border-2 border-slate-200 dark:border-slate-700 rounded-2xl md:rounded-[2rem] bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-base md:text-lg font-medium outline-none focus:ring-4 focus:ring-blue-500/20 transition resize-none"
                />
              </div>
            </form>
          </div>

          {/* Footer Actions */}
          <div className="px-8 md:px-12 py-6 md:py-8 border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 shrink-0 flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-6 py-3 md:px-8 md:py-4 text-sm md:text-lg font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl md:rounded-full transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-3 px-6 py-3 md:px-8 md:py-4 bg-blue-600 hover:bg-blue-700 text-white text-sm md:text-lg font-black uppercase tracking-widest rounded-xl md:rounded-full transition shadow-md shadow-blue-500/20 disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-5 w-5" />
              )}
              {saving ? "Saving..." : "Submit Update"}
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </>
  );
}

export default TaskUpdateModal;
