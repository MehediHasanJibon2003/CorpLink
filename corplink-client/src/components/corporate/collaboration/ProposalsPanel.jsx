import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../context/AuthContext";
import {
  Rocket,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRightLeft,
  UserCircle,
  Building2,
} from "lucide-react";

function ProposalsPanel() {
  const { user, profile } = useAuth();

  const [partners, setPartners] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    target_id: "",
    title: "",
    description: "",
    proposal_type: "project",
  });

  const fetchData = useCallback(async () => {
    if (!profile?.company_id) return;
    setLoading(true);

    try {
      // 1. Fetch established partners from collaboration_requests (Accepted status)
      const { data: collabData } = await supabase
        .from("collaboration_requests")
        .select(
          `
          id, type, sender_id, receiver_id, corporate_id,
          sender:profiles!sender_id (id, full_name),
          receiver:profiles!receiver_id (id, full_name),
          partner_corp:companies!corporate_id (id, name)
        `,
        )
        .eq("status", "accepted")
        .or(
          `sender_id.eq.${user.id},receiver_id.eq.${user.id},corporate_id.eq.${profile.company_id}`,
        );

      const partnerList =
        collabData?.map((c) => {
          if (c.type === "internal") {
            const person = c.sender_id === user.id ? c.receiver : c.sender;
            return { id: person.id, name: person.full_name, type: "internal" };
          } else {
            return {
              id: c.partner_corp.id,
              name: c.partner_corp.name,
              type: "external",
            };
          }
        }) || [];

      setPartners(partnerList);

      // 2. Fetch proposals involving this user
      const { data: propData } = await supabase
        .from("collaboration_proposals")
        .select(
          `
          *,
          tc:companies!to_company (id, name),
          fc:companies!from_company (id, name),
          tp:profiles!to_profile_id (id, full_name),
          fp:profiles!from_profile_id (id, full_name)
        `,
        )
        .or(`from_profile_id.eq.${user.id},to_profile_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      setProposals(propData || []);
    } catch (err) {
      console.error("Proposal fetch error:", err);
      setError("Intelligence Sync Failed.");
    } finally {
      setLoading(false);
    }
  }, [user.id, profile.company_id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSendProposal = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!form.target_id) {
      setError("Select a Collaborator");
      return;
    }
    if (!form.title.trim()) {
      setError("Protocol Title required");
      return;
    }

    setSaving(true);

    const target = partners.find((p) => p.id === form.target_id);
    const payload = {
      from_profile_id: user.id,
      title: form.title.trim(),
      description: form.description.trim() || null,
      proposal_type: form.proposal_type,
      status: "pending",
    };

    if (target.type === "external") {
      payload.to_company = target.id;
      payload.from_company = profile.company_id;
    } else {
      payload.to_profile_id = target.id;
    }

    const { error: insErr } = await supabase
      .from("collaboration_proposals")
      .insert([payload]);

    if (insErr) {
      setError(insErr.message);
    } else {
      setMessage("Strategic Proposal Transmitted!");
      setForm({
        target_id: "",
        title: "",
        description: "",
        proposal_type: "project",
      });
      setTimeout(() => setMessage(""), 3000);
      fetchData();
    }
    setSaving(false);
  };

  const handleUpdateStatus = async (proposalId, newStatus) => {
    const { error: updErr } = await supabase
      .from("collaboration_proposals")
      .update({ status: newStatus })
      .eq("id", proposalId);

    if (!updErr) fetchData();
  };

  if (loading)
    return (
      <div className="p-20 text-center text-slate-400 font-black uppercase tracking-widest animate-pulse">
        Retaining Strategic Proposals...
      </div>
    );

  return (
    <div className="space-y-12 md:space-y-16 pb-20 animate-in fade-in duration-700">
      {/* Write Proposal Matrix */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl md:rounded-[3rem] p-6 md:p-16 border-2 border-slate-100 dark:border-white/5 shadow-sm">
        <div className="flex items-center gap-4 md:gap-6 mb-8 md:mb-12">
          <div className="h-14 w-14 md:h-20 md:w-20 rounded-2xl md:rounded-[2rem] bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-500/30 shrink-0">
            <Rocket className="h-7 w-7 md:h-10 md:w-10" />
          </div>
          <div>
            <h3 className="text-2xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">
              Draft <br className="hidden md:block" /> Proposal
            </h3>
            <p className="text-[10px] md:text-body font-black text-slate-400 uppercase tracking-widest mt-1">
              Strategic Agreement
            </p>
          </div>
        </div>

        {error && (
          <p className="p-4 md:p-6 bg-red-50 text-red-600 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[9px] md:text-[10px] mb-6 md:mb-8">
            {error}
          </p>
        )}
        {message && (
          <p className="p-4 md:p-6 bg-emerald-50 text-emerald-600 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[9px] md:text-[10px] mb-6 md:mb-8">
            {message}
          </p>
        )}

        <form
          onSubmit={handleSendProposal}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10"
        >
          <div className="space-y-2 md:space-y-3">
            <label className="text-[9px] md:text-label font-black text-slate-400 uppercase tracking-widest px-2">
              Collaborator
            </label>
            <select
              value={form.target_id}
              onChange={(e) => setForm({ ...form, target_id: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-white/5 px-6 md:px-8 py-4 md:py-6 rounded-xl md:rounded-3xl outline-none focus:border-blue-500 text-[14px] md:text-heading-3 font-black text-slate-800 dark:text-white transition-all cursor-pointer"
            >
              <option value="">-- Select Active --</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.type.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 md:space-y-3">
            <label className="text-[9px] md:text-label font-black text-slate-400 uppercase tracking-widest px-2">
              Agreement Tier
            </label>
            <select
              value={form.proposal_type}
              onChange={(e) =>
                setForm({ ...form, proposal_type: e.target.value })
              }
              className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-white/5 px-6 md:px-8 py-4 md:py-6 rounded-xl md:rounded-3xl outline-none focus:border-blue-500 text-[14px] md:text-heading-3 font-black text-slate-800 dark:text-white transition-all cursor-pointer"
            >
              <option value="project">Project Venture</option>
              <option value="service">Service Exchange</option>
              <option value="partnership">Strategic Alliance</option>
              <option value="resource">Resource Sharing</option>
            </select>
          </div>

          <div className="md:col-span-2 space-y-2 md:space-y-3">
            <label className="text-[9px] md:text-label font-black text-slate-400 uppercase tracking-widest px-2">
              Operational Title
            </label>
            <input
              type="text"
              placeholder="Designate the protocol name..."
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-white/5 px-6 md:px-10 py-4 md:py-6 rounded-xl md:rounded-3xl outline-none focus:border-blue-500 text-[16px] md:text-heading-1 font-black text-slate-900 dark:text-white transition-all"
            />
          </div>

          <div className="md:col-span-2 space-y-2 md:space-y-3">
            <label className="text-[9px] md:text-label font-black text-slate-400 uppercase tracking-widest px-2">
              Scope of Operations
            </label>
            <textarea
              placeholder="Detail the strategic objectives..."
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={4}
              className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-white/5 px-6 md:px-10 py-5 md:py-8 rounded-xl md:rounded-[2rem] outline-none focus:border-blue-500 text-[14px] md:text-heading-2 font-medium text-slate-700 dark:text-slate-200 resize-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={saving || partners.length === 0}
            className="md:col-span-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-6 md:py-8 rounded-xl md:rounded-[2rem] text-[16px] md:text-heading-1 font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 disabled:opacity-50"
          >
            {partners.length === 0
              ? "Establish Connection"
              : "Transmit Proposal"}
          </button>
        </form>
      </div>

      {/* History Matrix */}
      <div className="space-y-8 md:space-y-10">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="h-12 w-12 md:h-16 md:w-16 rounded-xl md:rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center">
            <FileText className="h-6 w-6 md:h-8 md:w-8 text-slate-400" />
          </div>
          <h3 className="text-xl md:text-heading-1 font-black text-slate-900 dark:text-white tracking-tight uppercase">
            Protocol Log
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-6 md:gap-8">
          {proposals.length === 0 ? (
            <div className="py-12 md:py-20 text-center bg-slate-50 dark:bg-slate-900/20 rounded-2xl md:rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
              <p className="text-[14px] md:text-heading-2 font-black text-slate-300 uppercase tracking-widest">
                No active protocols.
              </p>
            </div>
          ) : (
            proposals.map((prop) => {
              const isSent = prop.from_profile_id === user.id;
              const other = isSent
                ? prop.tc?.name || prop.tp?.full_name
                : prop.fc?.name || prop.fp?.full_name;

              return (
                <div
                  key={prop.id}
                  className="bg-white dark:bg-slate-800 rounded-2xl md:rounded-[3rem] p-6 md:p-10 border-2 border-slate-100 dark:border-white/5 flex flex-col gap-6 md:gap-8 group hover:border-blue-500/30 transition-all"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div className="space-y-2 w-full md:w-auto">
                      <div className="flex flex-wrap items-center gap-2 md:gap-3">
                        <span
                          className={`px-3 py-0.5 md:px-4 md:py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest ${isSent ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}`}
                        >
                          {isSent ? "Outbound" : "Inbound"}
                        </span>
                        <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <ArrowRightLeft className="h-3 w-3" />
                          {other}
                        </span>
                      </div>
                      <h4 className="text-[16px] md:text-heading-1 font-black text-slate-900 dark:text-white tracking-tight leading-tight uppercase">
                        {prop.title}
                      </h4>
                    </div>
                    <div
                      className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-2 w-fit ${prop.status === "accepted" ? "bg-emerald-100 text-emerald-700" : prop.status === "rejected" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}
                    >
                      {prop.status === "accepted" ? (
                        <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4" />
                      ) : prop.status === "rejected" ? (
                        <XCircle className="h-3 w-3 md:h-4 md:w-4" />
                      ) : (
                        <Clock className="h-3 w-3 md:h-4 md:w-4" />
                      )}
                      {prop.status}
                    </div>
                  </div>

                  {prop.description && (
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-6 md:p-8 rounded-2xl md:rounded-3xl text-[13px] md:text-heading-3 text-slate-700 dark:text-slate-300 font-medium italic border-2 border-transparent group-hover:border-slate-100 dark:group-hover:border-slate-700 transition-all">
                      "{prop.description}"
                    </div>
                  )}

                  {!isSent && prop.status === "pending" && (
                    <div className="flex gap-2 md:gap-4 w-full sm:w-auto">
                      <button
                        onClick={() => handleUpdateStatus(prop.id, "accepted")}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 md:py-5 rounded-lg md:rounded-2xl font-black uppercase tracking-widest text-[9px] md:text-label shadow-lg active:scale-95 transition-all"
                      >
                        Authorize
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(prop.id, "rejected")}
                        className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-500 py-3 md:py-5 rounded-lg md:rounded-2xl font-black uppercase tracking-widest text-[9px] md:text-label hover:bg-red-500 hover:text-white transition-all"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default ProposalsPanel;
