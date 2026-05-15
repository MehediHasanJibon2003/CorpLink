import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import AppLayout from "../../components/layout/AppLayout";
import { useAuth } from "../../context/AuthContext";

function Activity() {
  const { profile } = useAuth();

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterModule, setFilterModule] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");

  const fetchActivities = async () => {
    if (!profile?.company_id) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("activity_logs")
      .select(
        `
        *,
        user:profiles!fk_activity_user_profile (full_name, role)
      `,
      )
      .eq("company_id", profile.company_id)
      .order("created_at", { ascending: false })
      .limit(100); // Keep the last 100 for display performance

    if (error) {
      console.error(error);
      setError(
        "Failed to load audit logs. Make sure database migrations are run.",
      );
    } else {
      setActivities(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchActivities();

    // Setup Realtime Subscription
    if (!profile?.company_id) return;
    const channel = supabase
      .channel("schema-db-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "activity_logs",
          filter: `company_id=eq.${profile.company_id}`,
        },
        async (payload) => {
          // Log was freshly inserted! We need to dynamically fetch the user's name though.
          // For realtime, we do a quick single fetch to get the profile data for the new row.
          const { data: newRowWithUser } = await supabase
            .from("activity_logs")
            .select(
              `*, user:profiles!fk_activity_user_profile(full_name, role)`,
            )
            .eq("id", payload.new.id)
            .single();

          if (newRowWithUser) {
            setActivities((prev) => [newRowWithUser, ...prev].slice(0, 100));
          } else {
            // Fallback if joined fetch fails temporarily
            setActivities((prev) => [payload.new, ...prev].slice(0, 100));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.company_id]);

  const filteredActivities = activities.filter((item) => {
    if (filterModule !== "all" && item.entity !== filterModule) return false;
    if (filterSeverity !== "all" && item.severity !== filterSeverity)
      return false;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesAction = (item.action || "")
        .toLowerCase()
        .includes(searchLower);
      const matchesUser = (item.user?.full_name || "")
        .toLowerCase()
        .includes(searchLower);
      if (!matchesAction && !matchesUser) return false;
    }

    return true;
  });

  // Badges & Styles
  const getSeverityBadge = (severity) => {
    switch (severity) {
      case "critical":
        return (
          <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-label font-bold border border-red-200">
            Critical
          </span>
        );
      case "warning":
        return (
          <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-label font-bold border border-orange-200">
            Warning
          </span>
        );
      default:
        return (
          <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-label font-semibold border border-blue-100">
            Info
          </span>
        );
    }
  };

  const getStatusIcon = (status) => {
    if (status === "failed")
      return (
        <span title="Failed" className="text-red-600 font-bold text-heading-3">
          ✕
        </span>
      );
    return (
      <span title="Success" className="text-green-600 font-bold text-heading-3">
        ✓
      </span>
    );
  };

  return (
    <AppLayout
      title="Audit Log & Security"
      subtitle="Real-time monitoring of corporate system activities"
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl md:rounded-[3rem] shadow-sm border-2 border-slate-200 dark:border-slate-700 overflow-hidden mb-12 md:mb-16">
        {/* Top Controls: Search & Filter */}
        <div className="p-6 md:p-12 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-col xl:flex-row gap-4 md:gap-8 items-center justify-between">
          <div className="relative w-full xl:w-[40rem]">
            <span className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 text-lg md:text-heading-1 text-slate-400">
              🔍
            </span>
            <input
              type="text"
              placeholder="Filter by action or user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 md:pl-16 pr-4 md:pr-8 py-4 md:py-8 border-2 border-slate-200 dark:border-slate-700 rounded-xl md:rounded-3xl outline-none focus:border-blue-500 bg-white dark:bg-slate-800 text-[14px] md:text-heading-1 font-black shadow-inner transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 md:gap-6 w-full xl:w-auto">
            <select
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value)}
              className="flex-1 sm:flex-none border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl md:rounded-3xl px-4 md:px-8 py-4 md:py-8 outline-none focus:border-blue-500 text-[13px] md:text-heading-2 font-black text-slate-700 dark:text-slate-200 cursor-pointer shadow-sm"
            >
              <option value="all">Global Modules</option>
              <option value="auth">🔐 Security</option>
              <option value="employee">👥 Workforce</option>
              <option value="department">🏢 Departments</option>
              <option value="task">✅ Task Systems</option>
              <option value="announcement">📢 Corp Feed</option>
              <option value="collaboration">🤝 Partnerships</option>
            </select>

            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="flex-1 sm:flex-none border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl md:rounded-3xl px-4 md:px-8 py-4 md:py-8 outline-none focus:border-blue-500 text-[13px] md:text-heading-2 font-black text-slate-700 dark:text-slate-200 cursor-pointer shadow-sm"
            >
              <option value="all">All Priorities</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        {error ? (
          <div className="p-10 md:p-20 text-center text-red-600 bg-red-50 font-black text-[14px] md:text-heading-1">
            {error}
          </div>
        ) : loading ? (
          <div className="p-16 md:p-32 text-center">
            <div className="animate-spin rounded-full h-12 w-12 md:h-20 md:w-20 border-b-4 border-blue-600 mx-auto mb-6 md:mb-8"></div>
            <p className="text-[14px] md:text-heading-1 text-slate-500 dark:text-slate-400 font-black tracking-tight">
              Decrypting secure audit logs...
            </p>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="p-16 md:p-32 text-center">
            <div className="text-6xl md:text-8xl mb-6 md:mb-8">🛡️</div>
            <h3 className="text-[20px] md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              No Logs Found
            </h3>
            <p className="text-[12px] md:text-heading-1 text-slate-500 dark:text-slate-400 mt-2 md:mt-4 font-medium italic">
              The security vault has no matches for your current parameters.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[1200px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/80 border-b-2 border-slate-200 dark:border-slate-700 text-body uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 font-black">
                    <th className="p-8 w-24 text-center">STS</th>
                    <th className="p-8">Temporal Reference</th>
                    <th className="p-8">Actor / Role</th>
                    <th className="p-8">Module</th>
                    <th className="p-8">Operational Details</th>
                    <th className="p-8 text-right">Priority</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-slate-100 dark:divide-slate-800 text-heading-2">
                  {filteredActivities.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors group"
                    >
                      <td className="p-8 text-center border-r-2 border-slate-50 dark:border-slate-800">
                        <div className="transform scale-150 group-hover:scale-[1.75] transition-transform">
                          {getStatusIcon(log.status)}
                        </div>
                      </td>
                      <td className="p-8">
                        <div className="font-black text-slate-800 dark:text-slate-100 tracking-tight">
                          {new Date(log.created_at).toLocaleDateString(
                            undefined,
                            { month: "short", day: "numeric", year: "numeric" },
                          )}
                        </div>
                        <div className="text-body text-slate-400 font-bold uppercase mt-1">
                          {new Date(log.created_at).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="p-8">
                        <div className="font-black text-slate-900 dark:text-white text-heading-1">
                          {log.user?.full_name || "SYSTEM_DAEMON"}
                        </div>
                        <div className="text-body text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest mt-1">
                          {log.user?.role || "SYSTEM"}
                        </div>
                      </td>
                      <td className="p-8">
                        <span className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-6 py-2 rounded-full text-body font-black uppercase tracking-[0.15em] shadow-md">
                          {log.entity}
                        </span>
                      </td>
                      <td className="p-8 font-black text-slate-700 dark:text-slate-200 leading-tight">
                        {log.action}
                      </td>
                      <td className="p-8 text-right">
                        <div className="inline-block transform scale-125 origin-right">
                          {getSeverityBadge(log.severity)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="block lg:hidden divide-y-2 divide-slate-100 dark:divide-slate-800">
              {filteredActivities.map((log) => (
                <div key={log.id} className="p-5 md:p-8 space-y-4 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="transform scale-110 md:scale-125">
                        {getStatusIcon(log.status)}
                      </div>
                      <div>
                        <div className="font-black text-slate-900 dark:text-white text-[14px] md:text-heading-2">
                          {log.user?.full_name || "SYSTEM_DAEMON"}
                        </div>
                        <div className="text-[10px] md:text-[12px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest mt-0.5">
                          {log.user?.role || "SYSTEM"}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 transform scale-90 md:scale-100 origin-top-right">
                       {getSeverityBadge(log.severity)}
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-3 md:p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="text-[13px] md:text-[15px] font-black text-slate-700 dark:text-slate-200 leading-tight">
                      {log.action}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                     <span className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-3 md:px-4 py-1.5 md:py-2 rounded-full text-[9px] md:text-[11px] font-black uppercase tracking-[0.15em] shadow-sm">
                       {log.entity}
                     </span>
                     <div className="text-right">
                       <div className="font-black text-slate-800 dark:text-slate-300 text-[11px] md:text-[13px] tracking-tight">
                         {new Date(log.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                       </div>
                       <div className="text-[9px] md:text-[11px] text-slate-400 font-bold uppercase mt-0.5">
                         {new Date(log.created_at).toLocaleTimeString()}
                       </div>
                     </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}

export default Activity;
