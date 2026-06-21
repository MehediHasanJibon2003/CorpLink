import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import {
  Building,
  Users,
  Shield,
  MessageCircle,
  Briefcase,
  UserCircle,
  RefreshCw,
  Mail,
  Phone,
  ArrowRight,
  Globe,
} from "lucide-react";
import CommunicationPanel from "../corporate/departments/CommunicationPanel";

function MyDepartment() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dept, setDept] = useState(null);
  const [team, setTeam] = useState(null);
  const [lead, setLead] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchData = useCallback(async () => {
    if (!user?.id || !profile?.company_id) return;
    setLoading(true);
    try {
      // 1. Get employee specific data from 'employees' table
      const { data: empData, error: empErr } = await supabase
        .from("employees")
        .select("department_id, team_id")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (empErr) throw empErr;

      if (!empData) {
        setLoading(false);
        return;
      }

      // 2. Fetch Department Details
      if (empData.department_id) {
        const { data: deptData } = await supabase
          .from("departments")
          .select("id, name, head_id")
          .eq("id", empData.department_id)
          .single();
        setDept(deptData);
      }

      // 3. Fetch Team Details
      if (empData.team_id) {
        const { data: teamData } = await supabase
          .from("teams")
          .select("id, name, lead_id")
          .eq("id", empData.team_id)
          .single();
        setTeam(teamData);

        // Fetch Team Lead Profile
        if (teamData?.lead_id) {
          const { data: leadData } = await supabase
            .from("profiles")
            .select("full_name, role, email")
            .eq("id", teamData.lead_id)
            .single();
          setLead(leadData);
        }

        // 4. Fetch Team Members
        const { data: members } = await supabase
          .from("employees")
          .select("id, name, designation, profile_photo")
          .eq("team_id", empData.team_id)
          .limit(10);
        setTeamMembers(members || []);
      }
    } catch (err) {
      console.error("MyDepartment fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-6">
        <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-heading-2 font-black text-slate-400 uppercase tracking-[0.2em]">Synchronizing Department Data...</p>
      </div>
    );
  }

  if (!dept && !team) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-10 bg-white dark:bg-slate-800 rounded-[3rem] border-2 border-slate-200 dark:border-slate-700 shadow-sm">
        <Building className="h-24 w-24 text-slate-300 dark:text-slate-600 mb-6" />
        <h2 className="text-heading-1 font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">Unassigned Personnel</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-4 max-w-md font-bold text-heading-3">
          You are currently not assigned to any department or team. Please contact your Corporate Admin or HR to be assigned to a workflow unit.
        </p>
        <button 
          onClick={() => setRefreshKey(k => k + 1)}
          className="mt-8 px-10 py-4 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
        >
          Check Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10 md:space-y-16">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-blue-600 dark:text-blue-400 font-black uppercase tracking-[0.3em] text-body md:text-body">
            <Globe className="h-5 w-5" />
            <span>Organizational Unit</span>
          </div>
          <h1 className="text-heading-1 md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
            {dept?.name || "Independent"} <br />
            <span className="text-blue-600 drop-shadow-sm">{team?.name || "Unit"}</span>
          </h1>
        </div>
        <button 
          onClick={() => setRefreshKey(k => k + 1)}
          className="flex items-center gap-3 px-8 py-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
        >
          <RefreshCw className="h-5 w-5" />
          Refresh Stats
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-10 md:gap-16">
        {/* Left Column: Team Info & Lead */}
        <div className="lg:col-span-1 space-y-10 md:space-y-12">
          {/* Team Lead Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 rounded-[3rem] p-8 md:p-10 shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-blue-500/20 transition-all duration-500" />
             <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                   <div className="w-12 h-1 bg-blue-500 rounded-full" />
                   <span className="text-blue-400 font-black uppercase tracking-widest text-label">Team Leadership</span>
                </div>
                
                <div className="flex items-center gap-6 mb-10">
                   <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-blue-600 flex items-center justify-center text-white text-heading-1 md:text-heading-1 font-black shadow-xl shadow-blue-500/30 ring-4 ring-white/10">
                      {lead?.full_name?.charAt(0) || "L"}
                   </div>
                   <div>
                      <h3 className="text-heading-1 md:text-heading-1 font-black text-white tracking-tight">{lead?.full_name || "Assigning Lead..."}</h3>
                      <p className="text-blue-400 font-bold uppercase tracking-widest text-label md:text-body mt-1">{lead?.role || "Team Lead"}</p>
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="flex items-center gap-4 text-slate-400 hover:text-white transition-colors cursor-pointer group/item">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center group-hover/item:bg-blue-600 transition-colors">
                         <Mail className="h-5 w-5" />
                      </div>
                      <span className="font-bold text-body md:text-body truncate">{lead?.email || "n/a"}</span>
                   </div>
                   <div className="flex items-center gap-4 text-slate-400 hover:text-white transition-colors cursor-pointer group/item">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center group-hover/item:bg-blue-600 transition-colors">
                         <MessageCircle className="h-5 w-5" />
                      </div>
                      <span className="font-bold text-body md:text-body">Direct Messenger</span>
                   </div>
                </div>

                <button 
                  onClick={() => {
                    if (lead?.email) navigate(`/messages`); // Would pass user ID in real app
                  }}
                  className="w-full mt-10 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-3"
                >
                   Contact Lead
                   <ArrowRight className="h-5 w-5" />
                </button>
             </div>
          </div>

          {/* Team Members Grid */}
          <div className="bg-white dark:bg-slate-800 rounded-[3rem] border-2 border-slate-200 dark:border-slate-700 p-8 md:p-10 shadow-sm">
             <div className="flex items-center justify-between mb-8">
                <h3 className="text-heading-2 md:text-heading-1 font-black text-slate-800 dark:text-white uppercase tracking-tight">Team Members</h3>
                <span className="bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full text-label font-black text-slate-500 dark:text-slate-400">{teamMembers.length} ACTIVE</span>
             </div>
             
             <div className="space-y-6">
                {teamMembers.map(member => (
                   <div key={member.id} className="flex items-center gap-4 group cursor-pointer">
                      <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-slate-100 dark:bg-slate-700 overflow-hidden shrink-0 group-hover:scale-105 transition-transform border-2 border-transparent group-hover:border-blue-500">
                         {member.profile_photo ? (
                            <img src={member.profile_photo} alt={member.name} className="w-full h-full object-cover" />
                         ) : (
                            <div className="w-full h-full flex items-center justify-center font-black text-slate-400">{member.name.charAt(0)}</div>
                         )}
                      </div>
                      <div className="min-w-0">
                         <p className="font-black text-slate-800 dark:text-slate-100 text-body md:text-body truncate group-hover:text-blue-600 transition-colors">{member.name}</p>
                         <p className="text-[10px] md:text-label text-slate-500 font-bold uppercase tracking-widest truncate">{member.designation}</p>
                      </div>
                   </div>
                ))}
             </div>
          </div>
        </div>

        {/* Right Column: Communication Panel */}
        <div className="lg:col-span-2 space-y-8">
           <div className="flex items-center gap-4 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-600">
                 <MessageCircle className="h-6 w-6" />
              </div>
              <h2 className="text-heading-1 md:text-heading-1 font-black text-slate-800 dark:text-white tracking-tight uppercase">Department Comms</h2>
           </div>
           {dept && (
             <CommunicationPanel 
               activeDept={dept} 
               profile={profile} 
             />
           )}
        </div>
      </div>
    </div>
  );
}

export default MyDepartment;

