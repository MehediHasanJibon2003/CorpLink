import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
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
} from "lucide-react";

// ─── Skeleton ──────────────────────────────────────────────────────
function Skeleton({ className = "" }) {
  return (
    <div
      className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded-lg ${className}`}
    />
  );
}

// ─── Toast ─────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold
      ${type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}
    >
      {message}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
        ✕
      </button>
    </div>
  );
}

// ─── Status Config ─────────────────────────────────────────────────
const statusConfig = {
  pending: {
    label: "Pending",
    class:
      "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
    icon: Clock,
  },
  accepted: {
    label: "Accepted",
    class:
      "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    class: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
    icon: XCircle,
  },
};

// ─── Main Component ────────────────────────────────────────────────
function CollaborationRequest() {
  const { user, profile } = useAuth();

  const [colleagues, setColleagues] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    receiver_id: "",
    message: "",
    type: "internal",
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    if (user?.id && profile?.company_id) {
      fetchData();
    }
  }, [user, profile, refreshKey]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch colleagues from same company (employees table)
      const { data: colls } = await supabase
        .from("employees")
        .select("id, name, designation, department_id")
        .eq("company_id", profile.company_id)
        .neq("user_id", user.id) // exclude self
        .eq("is_active", true)
        .order("name");

      setColleagues(colls || []);

      // Fetch sent collaboration requests
      const { data: reqs, error: rErr } = await supabase
        .from("collaboration_requests")
        .select("id, receiver_id, type, message, status, created_at")
        .eq("sender_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (rErr && rErr.code !== "42P01") throw rErr;
      setSentRequests(reqs || []);
    } catch (err) {
      console.error("CollaborationRequest fetchData error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.receiver_id || !form.message.trim()) {
      showToast("Please select a recipient and add a message.", "error");
      return;
    }
    setSubmitting(true);

    try {
      const { error } = await supabase.from("collaboration_requests").insert([
        {
          sender_id: user.id,
          receiver_id: form.receiver_id,
          company_id: profile.company_id,
          corporate_id: profile.company_id,
          type: form.type,
          message: form.message.trim(),
          status: "pending",
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      showToast("Collaboration request sent!", "success");
      setForm({ receiver_id: "", message: "", type: "internal" });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error("CollaborationRequest submit error:", err);
      showToast(err.message || "Failed to send request.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const cancelRequest = async (id) => {
    setCancelling(id);
    try {
      await supabase
        .from("collaboration_requests")
        .delete()
        .eq("id", id)
        .eq("sender_id", user.id);
      setSentRequests((prev) => prev.filter((r) => r.id !== id));
      showToast("Request cancelled.", "success");
    } catch (err) {
      showToast("Failed to cancel request.", "error");
    } finally {
      setCancelling(null);
    }
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 1) return "Just now";
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="space-y-8 md:space-y-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 md:gap-8">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white flex items-center gap-4 tracking-tight">
            <Users2 className="h-8 w-8 text-indigo-500" />
            Collaboration Requests
          </h1>
          <p className="text-base md:text-xl text-slate-500 dark:text-slate-400 mt-2 font-bold">
            Send collaboration requests to your colleagues
          </p>
        </div>
        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          className="flex items-center gap-3 text-sm md:text-lg font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 px-6 py-3 md:px-8 md:py-4 rounded-xl md:rounded-full border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
        >
          <RefreshCw className="h-5 w-5 md:h-6 md:w-6" />
          <span className="hidden md:inline">Refresh</span>
        </button>
      </div>

      <div className="grid xl:grid-cols-2 gap-8 md:gap-12">
        {/* ── Send Request Form ── */}
        <div className="border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-3xl md:rounded-[3rem] shadow-sm p-8 md:p-12">
          <h2 className="font-black text-xl md:text-2xl text-slate-800 dark:text-white mb-8 flex items-center gap-3">
            <Send className="h-6 w-6 text-blue-500" />
            New Collaboration Request
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
            {/* Type */}
            <div>
              <label className="block text-sm md:text-base font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">
                Request Type
              </label>
              <div className="flex gap-4">
                {["internal", "external"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, type: t }))}
                    className={`flex-1 py-4 text-base md:text-lg font-black uppercase tracking-widest rounded-2xl md:rounded-[2rem] border-2 transition ${
                      form.type === t
                        ? "bg-blue-600 text-white border-blue-600 shadow-md"
                        : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-300 hover:bg-white dark:hover:bg-slate-800"
                    }`}
                  >
                    {t === "internal" ? "🏢 Internal" : "🌐 External"}
                  </button>
                ))}
              </div>
            </div>

            {/* Recipient */}
            <div>
              <label className="block text-sm md:text-base font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">
                {form.type === "internal"
                  ? "Select Colleague"
                  : "Select Partner Contact"}
              </label>
              {loading ? (
                <Skeleton className="h-16 w-full rounded-2xl md:rounded-[2rem]" />
              ) : (
                <select
                  value={form.receiver_id}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, receiver_id: e.target.value }))
                  }
                  required
                  className="w-full px-6 py-4 md:py-5 border-2 border-slate-200 dark:border-slate-700 rounded-2xl md:rounded-[2rem] bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-base md:text-lg font-bold outline-none focus:ring-4 focus:ring-blue-500/20"
                >
                  <option value="">-- Select a person --</option>
                  {colleagues.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.designation ? `— ${c.designation}` : ""}
                    </option>
                  ))}
                </select>
              )}
              {!loading && colleagues.length === 0 && (
                <p className="text-sm font-bold text-slate-400 mt-2">
                  No colleagues found in the employees table.
                </p>
              )}
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm md:text-base font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">
                Message / Purpose
              </label>
              <textarea
                value={form.message}
                onChange={(e) =>
                  setForm((f) => ({ ...f, message: e.target.value }))
                }
                placeholder="Describe the purpose of this collaboration request..."
                rows={4}
                required
                className="w-full px-6 py-5 border-2 border-slate-200 dark:border-slate-700 rounded-2xl md:rounded-[2rem] bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-base md:text-lg font-medium outline-none focus:ring-4 focus:ring-blue-500/20 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl md:rounded-[2rem] font-black text-lg md:text-xl uppercase tracking-widest transition disabled:opacity-60 shadow-lg shadow-blue-500/20 mt-4"
            >
              {submitting ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <Send className="h-6 w-6" />
              )}
              {submitting ? "Sending..." : "Send Request"}
            </button>
          </form>
        </div>

        {/* ── Sent Requests List ── */}
        <div className="border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-3xl md:rounded-[3rem] shadow-sm overflow-hidden flex flex-col">
          <div className="px-8 md:px-10 py-6 border-b-2 border-slate-100 dark:border-slate-700">
            <h2 className="font-black text-lg md:text-xl text-slate-800 dark:text-white flex items-center gap-3">
              <Clock className="h-5 w-5 text-slate-400" />
              Sent Requests
              <span className="ml-auto text-sm font-black bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-4 py-1.5 rounded-full uppercase tracking-widest">
                {sentRequests.length}
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="p-8 space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-2xl" />
              ))}
            </div>
          ) : sentRequests.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-24 text-slate-400 px-6 text-center">
              <Users2 className="h-16 w-16 mb-4 opacity-30" />
              <p className="text-xl md:text-2xl font-black text-slate-500 dark:text-slate-400">
                No requests sent yet
              </p>
              <p className="text-base md:text-lg font-medium mt-2">
                Your sent requests will appear here
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto divide-y-2 divide-slate-100 dark:divide-slate-700/50 custom-scrollbar">
              {sentRequests.map((req) => {
                const sConf = statusConfig[req.status] || statusConfig.pending;
                const StatusIcon = sConf.icon;
                return (
                  <div
                    key={req.id}
                    className="flex flex-col md:flex-row md:items-center gap-6 px-8 md:px-10 py-8 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-4 flex-wrap mb-4">
                        <span
                          className={`text-xs md:text-sm font-black px-4 py-1.5 rounded-full flex items-center gap-2 uppercase tracking-widest ${sConf.class}`}
                        >
                          <StatusIcon className="h-4 w-4" />
                          {sConf.label}
                        </span>
                        <span className="text-xs md:text-sm font-black bg-slate-100 dark:bg-slate-700 text-slate-500 px-4 py-1.5 rounded-full uppercase tracking-widest">
                          {req.type}
                        </span>
                      </div>
                      <p className="text-base md:text-lg font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                        {req.message}
                      </p>
                      <p className="text-xs md:text-sm font-bold text-slate-400 mt-4 uppercase tracking-widest">
                        {timeAgo(req.created_at)}
                      </p>
                    </div>

                    {req.status === "pending" && (
                      <button
                        onClick={() => cancelRequest(req.id)}
                        disabled={cancelling === req.id}
                        title="Cancel request"
                        className="shrink-0 p-4 text-red-500 hover:text-white hover:bg-red-500 dark:hover:bg-red-500 rounded-xl md:rounded-2xl transition disabled:opacity-50 group-hover:scale-105"
                      >
                        {cancelling === req.id ? (
                          <Loader2 className="h-5 w-5 md:h-6 md:w-6 animate-spin" />
                        ) : (
                          <Trash2 className="h-5 w-5 md:h-6 md:w-6" />
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default CollaborationRequest;
