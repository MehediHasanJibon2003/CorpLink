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
  Inbox,
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
      className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-body font-semibold
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
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("incoming");
  const [updatingId, setUpdatingId] = useState(null);
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
        .select("id, user_id, name, designation, department_id")
        .eq("company_id", profile.company_id)
        .neq("user_id", user.id) // exclude self
        .not("user_id", "is", null)
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

      // Fetch received collaboration requests
      const { data: recs, error: recErr } = await supabase
        .from("collaboration_requests")
        .select(`
          id, 
          sender_id, 
          type, 
          message, 
          status, 
          created_at,
          sender:profiles!sender_id (full_name, role)
        `)
        .eq("receiver_id", user.id)
        .order("created_at", { ascending: false });

      if (recErr && recErr.code !== "42P01") throw recErr;
      setReceivedRequests(recs || []);
    } catch (err) {
      console.error("CollaborationRequest fetchData error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (requestId, newStatus) => {
    setUpdatingId(requestId);
    try {
      const { error } = await supabase
        .from("collaboration_requests")
        .update({ status: newStatus })
        .eq("id", requestId);

      if (error) throw error;

      showToast(`Request ${newStatus === "accepted" ? "accepted" : "declined"}.`, "success");
      
      // Update local state immediately
      setReceivedRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status: newStatus } : r))
      );
      
      // Send notification to the sender
      const targetReq = receivedRequests.find((r) => r.id === requestId);
      if (newStatus === "accepted" && targetReq && targetReq.sender_id) {
        await supabase.from("notifications").insert([
          {
            user_id: targetReq.sender_id,
            company_id: profile.company_id,
            type: "collaboration",
            message: `${profile.full_name || "A colleague"} accepted your collaboration request!`,
            is_read: false,
            created_at: new Date().toISOString(),
          },
        ]);
      }
    } catch (err) {
      showToast("Failed to update status: " + err.message, "error");
    } finally {
      setUpdatingId(null);
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

      // Create notification for the receiver
      try {
        await supabase.from("notifications").insert([
          {
            user_id: form.receiver_id,
            company_id: profile?.company_id || null,
            type: "collaboration",
            message: `${profile?.full_name || "A colleague"} sent you a collaboration request!`,
            is_read: false,
            created_at: new Date().toISOString(),
          }
        ]);
      } catch (nErr) {
        console.error("Failed to insert collaboration notification:", nErr);
      }

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
          <h1 className="text-heading-1 md:text-5xl font-black text-slate-900 dark:text-white flex items-center gap-4 tracking-tight">
            <Users2 className="h-8 w-8 text-indigo-500" />
            Collaboration Requests
          </h1>
          <p className="text-body md:text-heading-2 text-slate-500 dark:text-slate-400 mt-2 font-bold">
            Send collaboration requests to your colleagues
          </p>
        </div>
        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          className="flex items-center gap-3 text-body md:text-heading-3 font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 px-6 py-3 md:px-8 md:py-4 rounded-xl md:rounded-full border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
        >
          <RefreshCw className="h-5 w-5 md:h-6 md:w-6" />
          <span className="hidden md:inline">Refresh</span>
        </button>
      </div>

      <div className="grid xl:grid-cols-2 gap-8 md:gap-12">
        {/* ── Send Request Form ── */}
        <div className="border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-3xl md:rounded-[3rem] shadow-sm p-8 md:p-12">
          <h2 className="font-black text-heading-2 md:text-heading-1 text-slate-800 dark:text-white mb-8 flex items-center gap-3">
            <Send className="h-6 w-6 text-blue-500" />
            New Collaboration Request
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
            {/* Type */}
            <div>
              <label className="block text-body md:text-body font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">
                Request Type
              </label>
              <div className="flex gap-4">
                {["internal", "external"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, type: t }))}
                    className={`flex-1 py-4 text-body md:text-heading-3 font-black uppercase tracking-widest rounded-2xl md:rounded-[2rem] border-2 transition ${
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
              <label className="block text-body md:text-body font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">
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
                  className="w-full px-6 py-4 md:py-5 border-2 border-slate-200 dark:border-slate-700 rounded-2xl md:rounded-[2rem] bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-body md:text-heading-3 font-bold outline-none focus:ring-4 focus:ring-blue-500/20"
                >
                  <option value="">-- Select a person --</option>
                  {colleagues.map((c) => (
                    <option key={c.id} value={c.user_id}>
                      {c.name} {c.designation ? `— ${c.designation}` : ""}
                    </option>
                  ))}
                </select>
              )}
              {!loading && colleagues.length === 0 && (
                <p className="text-body font-bold text-slate-400 mt-2">
                  No colleagues found in the employees table.
                </p>
              )}
            </div>

            {/* Message */}
            <div>
              <label className="block text-body md:text-body font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">
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
                className="w-full px-6 py-5 border-2 border-slate-200 dark:border-slate-700 rounded-2xl md:rounded-[2rem] bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-body md:text-heading-3 font-medium outline-none focus:ring-4 focus:ring-blue-500/20 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl md:rounded-[2rem] font-black text-heading-3 md:text-heading-2 uppercase tracking-widest transition disabled:opacity-60 shadow-lg shadow-blue-500/20 mt-4"
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

        {/* ── Requests Manager (Right Column) ── */}
        <div className="border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-3xl md:rounded-[3rem] shadow-sm overflow-hidden flex flex-col">
          {/* Tab Selector */}
          <div className="flex border-b-2 border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30">
            <button
              onClick={() => setActiveTab("incoming")}
              className={`flex-1 py-6 font-black uppercase tracking-widest text-[11px] md:text-body flex items-center justify-center gap-3 border-b-4 transition-all ${
                activeTab === "incoming"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800"
                  : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              }`}
            >
              <Inbox className="h-5 w-5" />
              Incoming Requests
              {receivedRequests.filter(r => r.status === "pending").length > 0 && (
                <span className="bg-blue-600 text-white text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center animate-pulse">
                  {receivedRequests.filter(r => r.status === "pending").length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("sent")}
              className={`flex-1 py-6 font-black uppercase tracking-widest text-[11px] md:text-body flex items-center justify-center gap-3 border-b-4 transition-all ${
                activeTab === "sent"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800"
                  : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              }`}
            >
              <Send className="h-5 w-5" />
              Sent Requests
              <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">
                {sentRequests.length}
              </span>
            </button>
          </div>

          {activeTab === "incoming" ? (
            loading ? (
              <div className="p-8 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                ))}
              </div>
            ) : receivedRequests.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-24 text-slate-400 px-6 text-center">
                <Inbox className="h-16 w-16 mb-4 opacity-30" />
                <p className="text-heading-2 md:text-heading-1 font-black text-slate-500 dark:text-slate-400">
                  No incoming requests
                </p>
                <p className="text-body md:text-heading-3 font-medium mt-2">
                  Collaboration requests sent by colleagues will show up here
                </p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto divide-y-2 divide-slate-100 dark:divide-slate-700/50 custom-scrollbar">
                {receivedRequests.map((req) => {
                  const sConf = statusConfig[req.status] || statusConfig.pending;
                  const StatusIcon = sConf.icon;
                  const senderName = req.sender?.full_name || "Colleague";
                  const senderRole = req.sender?.role || "Team Member";
                  
                  return (
                    <div
                      key={req.id}
                      className="flex flex-col md:flex-row md:items-start gap-6 px-8 md:px-10 py-8 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-4 flex-wrap mb-4">
                          <span
                            className={`text-label md:text-body font-black px-4 py-1.5 rounded-full flex items-center gap-2 uppercase tracking-widest ${sConf.class}`}
                          >
                            <StatusIcon className="h-4 w-4" />
                            {sConf.label}
                          </span>
                          <span className="text-body md:text-heading-3 font-black text-slate-800 dark:text-slate-100">
                            From: {senderName}
                          </span>
                          <span className="text-label md:text-body font-black bg-slate-100 dark:bg-slate-700 text-slate-500 px-4 py-1.5 rounded-full uppercase tracking-widest leading-none">
                            {senderRole}
                          </span>
                        </div>
                        <p className="text-body md:text-heading-3 font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                          {req.message}
                        </p>
                        <p className="text-label md:text-body font-bold text-slate-400 mt-4 uppercase tracking-widest">
                          {timeAgo(req.created_at)}
                        </p>
                      </div>

                      {req.status === "pending" && (
                        <div className="flex gap-2 shrink-0 md:self-center">
                          <button
                            onClick={() => handleUpdateStatus(req.id, "accepted")}
                            disabled={updatingId === req.id}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-body font-black uppercase tracking-widest transition flex items-center gap-2"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(req.id, "rejected")}
                            disabled={updatingId === req.id}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-body font-black uppercase tracking-widest transition flex items-center gap-2"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            loading ? (
              <div className="p-8 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                ))}
              </div>
            ) : sentRequests.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-24 text-slate-400 px-6 text-center">
                <Users2 className="h-16 w-16 mb-4 opacity-30" />
                <p className="text-heading-2 md:text-heading-1 font-black text-slate-500 dark:text-slate-400">
                  No requests sent yet
                </p>
                <p className="text-body md:text-heading-3 font-medium mt-2">
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
                            className={`text-label md:text-body font-black px-4 py-1.5 rounded-full flex items-center gap-2 uppercase tracking-widest ${sConf.class}`}
                          >
                            <StatusIcon className="h-4 w-4" />
                            {sConf.label}
                          </span>
                          <span className="text-label md:text-body font-black bg-slate-100 dark:bg-slate-700 text-slate-500 px-4 py-1.5 rounded-full uppercase tracking-widest">
                            {req.type}
                          </span>
                        </div>
                        <p className="text-body md:text-heading-3 font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                          {req.message}
                        </p>
                        <p className="text-label md:text-body font-bold text-slate-400 mt-4 uppercase tracking-widest">
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
            )
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

