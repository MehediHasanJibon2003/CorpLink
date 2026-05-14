import { useEffect, useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { 
  User, Bell, Lock, Palette, Globe, Shield, Loader2, 
  CheckCircle2, Building2, Link as LinkIcon, MapPin, 
  Briefcase, Plus, RefreshCw 
} from "lucide-react";

export default function Settings() {
  const { user, profile, setProfile } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  
  const [userForm, setUserForm] = useState({ full_name: "" });
  const [orgForm, setOrgForm] = useState({
    name: "",
    website: "",
    industry: "",
    location: "",
    primary_color: "#2563eb"
  });

  useEffect(() => {
    if (profile) {
      setUserForm({ full_name: profile.full_name || "" });
      fetchOrgDetails();
    }
  }, [profile]);

  const fetchOrgDetails = async () => {
    if (!profile?.company_id) return;
    const { data } = await supabase
      .from("companies")
      .select("*")
      .eq("id", profile.company_id)
      .single();
    
    if (data) {
      setOrgForm({
        name: data.name || "",
        website: data.website || "",
        industry: data.industry || "",
        location: data.location || "",
        primary_color: data.primary_color || "#2563eb"
      });
    }
  };

  const handleUserSave = async () => {
    setLoading(true);
    const { error } = await supabase.from("profiles").update({ full_name: userForm.full_name }).eq("id", user.id);
    if (!error) {
      setProfile({ ...profile, full_name: userForm.full_name });
      setMessage("Profile updated successfully");
      setTimeout(() => setMessage(""), 3000);
    }
    setLoading(false);
  };

  const handleOrgSave = async () => {
    setLoading(true);
    const { error } = await supabase.from("companies").update(orgForm).eq("id", profile.company_id);
    if (!error) {
      setMessage("Organization parameters updated successfully");
      setTimeout(() => setMessage(""), 3000);
    }
    setLoading(false);
  };

  const tabs = [
    { id: "profile", label: "My Profile", icon: User },
    { id: "org", label: "Organization", icon: Shield },
    { id: "appearance", label: "Branding", icon: Palette },
    { id: "notifications", label: "Alerts", icon: Bell },
    { id: "security", label: "Security", icon: Lock },
  ];

  return (
    <AppLayout>
      {/* Header Section */}
      <div className="mb-10 md:mb-16">
        <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-none uppercase">
          System <span className="text-blue-600">Command</span>
        </h1>
        <p className="text-[11px] md:text-label font-black uppercase tracking-[0.3em] text-slate-400 mt-4 flex items-center gap-2">
          <span className="w-8 h-px bg-slate-200 dark:bg-white/10"></span>
          Manage enterprise parameters and personal preferences
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-[3rem] md:rounded-[4rem] shadow-2xl border-2 border-slate-100 dark:border-white/5 flex flex-col xl:flex-row min-h-[800px] overflow-hidden">
        
        {/* Sidebar Navigation */}
        <div className="w-full xl:w-96 border-b-2 xl:border-b-0 xl:border-r-2 border-slate-50 dark:border-white/5 bg-slate-50/30 dark:bg-white/5 p-8 md:p-12">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-10 px-4">Configuration Hub</h3>
          <nav className="space-y-4">
            {tabs.map((tab) => (
              <button
                key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-5 w-full px-8 py-6 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab.id ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl scale-105" : "text-slate-400 hover:text-slate-800 dark:hover:text-white"
                }`}
              >
                <tab.icon className="h-5 w-5" /> {tab.label}
              </button>
            ))}
          </nav>

          <div className="mt-16 xl:mt-32">
             <div className="p-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] text-white shadow-2xl shadow-blue-500/20 relative overflow-hidden group">
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                <p className="text-[9px] font-black uppercase tracking-widest opacity-60">License Tier</p>
                <p className="text-2xl font-black mt-1">Enterprise Plus</p>
                <div className="mt-6 flex items-center gap-3 text-[9px] font-black uppercase tracking-widest bg-white/10 w-fit px-4 py-2 rounded-full">
                   <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Valid: DEC 2026
                </div>
             </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8 md:p-20 overflow-y-auto custom-scrollbar">
          {message && (
            <div className="mb-12 p-8 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border-2 border-emerald-100 dark:border-emerald-500/20 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.2em] flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
              <CheckCircle2 className="h-6 w-6" /> {message}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="max-w-4xl animate-in fade-in slide-in-from-right-6 duration-700">
              <div className="flex items-center gap-6 mb-16">
                 <div className="h-14 w-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white">
                    <User className="h-7 w-7" />
                 </div>
                 <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Identity <span className="text-blue-600">Profile</span></h3>
              </div>
              
              <div className="space-y-16">
                <div className="flex flex-col md:flex-row items-center gap-12">
                   <div className="h-44 w-44 rounded-[3rem] bg-slate-900 text-white flex items-center justify-center text-7xl font-black shadow-2xl border-4 border-white dark:border-slate-700">
                     {profile?.full_name?.charAt(0)}
                   </div>
                   <button className="px-10 py-5 bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/5 rounded-2xl font-black uppercase tracking-widest text-[10px] text-slate-500 hover:text-blue-600 hover:border-blue-500/20 transition-all">Upload New Image</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="md:col-span-2 space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Display Name</label>
                    <input type="text" value={userForm.full_name} onChange={e => setUserForm({full_name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-white/5 rounded-2xl px-8 py-6 text-xl font-bold outline-none focus:border-blue-500 transition-all" />
                  </div>
                  <div className="md:col-span-2 space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Secure Email Address</label>
                    <input type="text" value={user?.email} disabled className="w-full bg-slate-100 dark:bg-slate-900/50 border-2 border-transparent rounded-2xl px-8 py-6 text-xl font-bold opacity-50 cursor-not-allowed" />
                  </div>
                </div>

                <button onClick={handleUserSave} disabled={loading} className="w-full md:w-auto px-16 py-6 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all">
                  {loading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : "Save Changes"}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'org' && (
            <div className="max-w-4xl animate-in fade-in slide-in-from-right-6 duration-700">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
                 <div className="flex items-center gap-6">
                    <div className="h-14 w-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white">
                       <Building2 className="h-7 w-7" />
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Enterprise <span className="text-blue-600">Base</span></h3>
                 </div>
                 <button className="flex items-center gap-3 px-8 py-4 bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/5 rounded-2xl font-black uppercase tracking-widest text-[9px] text-slate-400 hover:text-blue-600 hover:border-blue-500/20 transition-all">
                   <RefreshCw className="h-4 w-4" /> Transfer Ownership
                 </button>
              </div>

              <div className="space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="md:col-span-2 space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Corporate Identity</label>
                    <input type="text" value={orgForm.name} onChange={e => setOrgForm({...orgForm, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-white/5 rounded-2xl px-8 py-6 text-xl font-bold outline-none focus:border-blue-500 transition-all" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Industry Sector</label>
                    <div className="relative">
                      <Briefcase className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input type="text" value={orgForm.industry} onChange={e => setOrgForm({...orgForm, industry: e.target.value})} placeholder="e.g. Technology" className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-white/5 rounded-2xl pl-16 pr-8 py-6 text-xl font-bold outline-none focus:border-blue-500 transition-all" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Digital Portal</label>
                    <div className="relative">
                      <LinkIcon className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input type="text" value={orgForm.website} onChange={e => setOrgForm({...orgForm, website: e.target.value})} placeholder="www.company.com" className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-white/5 rounded-2xl pl-16 pr-8 py-6 text-xl font-bold outline-none focus:border-blue-500 transition-all" />
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Operational HQ</label>
                    <div className="relative">
                      <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input type="text" value={orgForm.location} onChange={e => setOrgForm({...orgForm, location: e.target.value})} placeholder="City, Country" className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-white/5 rounded-2xl pl-16 pr-8 py-6 text-xl font-bold outline-none focus:border-blue-500 transition-all" />
                    </div>
                  </div>
                </div>

                <button onClick={handleOrgSave} disabled={loading} className="w-full md:w-auto px-16 py-6 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all">
                  {loading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : "Deploy Configuration"}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="max-w-4xl animate-in fade-in slide-in-from-right-6 duration-700">
               <div className="flex items-center gap-6 mb-16">
                  <div className="h-14 w-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white">
                     <Palette className="h-7 w-7" />
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Brand <span className="text-blue-600">Identity</span></h3>
               </div>

               <div className="space-y-16">
                  <div className="p-12 bg-slate-50 dark:bg-white/5 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center text-center group cursor-pointer hover:border-blue-500/20 transition-all">
                     <div className="w-32 h-32 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center shadow-2xl mb-8 group-hover:scale-110 transition-transform">
                        <Plus className="h-12 w-12 text-slate-300 group-hover:text-blue-500 transition-colors" />
                     </div>
                     <p className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Upload Master Logo</p>
                     <p className="text-[10px] text-slate-400 font-black mt-4 uppercase tracking-[0.2em]">High fidelity SVG or PNG (512x512)</p>
                  </div>

                  <div className="space-y-8">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-2 block">Enterprise Color Palette</label>
                     <div className="flex flex-wrap gap-6">
                        {['#2563eb', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#0f172a'].map(color => (
                          <button 
                            key={color} onClick={() => setOrgForm({...orgForm, primary_color: color})}
                            className={`h-20 w-20 rounded-[1.5rem] shadow-xl transition-all ${orgForm.primary_color === color ? 'ring-4 ring-blue-500 ring-offset-4 scale-110' : 'hover:scale-105 active:scale-95'}`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                        <input type="color" value={orgForm.primary_color} onChange={e => setOrgForm({...orgForm, primary_color: e.target.value})} className="h-20 w-20 rounded-[1.5rem] cursor-pointer bg-white dark:bg-slate-800 p-3 border-2 border-slate-100 dark:border-white/5 shadow-xl" />
                     </div>
                  </div>

                  <button onClick={handleOrgSave} className="w-full md:w-auto px-16 py-6 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-blue-500/20 active:scale-95 transition-all">Apply Visual Parameters</button>
               </div>
            </div>
          )}

          {(activeTab === 'notifications' || activeTab === 'security') && (
            <div className="h-full flex flex-col items-center justify-center text-center py-32 animate-in zoom-in-95 duration-700">
               <div className="w-32 h-32 bg-slate-50 dark:bg-white/5 rounded-[3rem] flex items-center justify-center mb-10 shadow-inner">
                  {activeTab === 'notifications' ? <Bell className="h-12 w-12 text-slate-300" /> : <Lock className="h-12 w-12 text-slate-300" />}
               </div>
               <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4">Strategic <span className="text-blue-600">Review</span></h3>
               <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] max-w-sm mx-auto leading-loose">This high-security operational sector is currently undergoing a structural audit by the engineering team.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

