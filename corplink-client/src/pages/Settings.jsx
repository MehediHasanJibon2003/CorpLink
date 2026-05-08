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
    <AppLayout title="System Configuration" subtitle="Manage enterprise parameters and personal preferences">
      <div className="bg-white dark:bg-slate-800 rounded-3xl md:rounded-[3rem] shadow-sm border-2 border-slate-100 dark:border-white/5 flex flex-col xl:flex-row min-h-[850px] overflow-hidden">
        
        {/* Sidebar */}
        <div className="w-full xl:w-96 border-b-2 xl:border-b-0 xl:border-r-2 border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/30 p-10 flex flex-col">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] mb-12">Settings Hub</h3>
          <nav className="space-y-4">
            {tabs.map((tab) => (
              <button
                key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-5 w-full px-8 py-6 rounded-3xl font-black uppercase tracking-widest text-sm transition-all ${
                  activeTab === tab.id ? "bg-blue-600 text-white shadow-xl scale-105" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <tab.icon className="h-6 w-6" /> {tab.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-10">
             <div className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl text-white shadow-lg">
                <p className="text-xs font-black uppercase tracking-widest opacity-60">Corporate License</p>
                <p className="text-xl font-black mt-1">Enterprise Plan</p>
                <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase">
                   <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Valid till Dec 2026
                </div>
             </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-12 md:p-20 overflow-y-auto custom-scrollbar">
          {message && (
            <div className="mb-10 p-6 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-2 border-emerald-100 dark:border-emerald-800/50 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
              <CheckCircle2 className="h-6 w-6" /> {message}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="max-w-4xl animate-in fade-in slide-in-from-right-4 duration-500">
              <h3 className="text-4xl font-black text-slate-900 dark:text-white mb-16 tracking-tight flex items-center gap-4">
                 <User className="h-10 w-10 text-blue-600" /> Personal Identity
              </h3>
              
              <div className="space-y-12">
                <div className="flex items-center gap-10">
                   <div className="h-40 w-40 rounded-[2.5rem] bg-slate-900 text-white flex items-center justify-center text-6xl font-black shadow-2xl border-4 border-white dark:border-slate-700">
                     {profile?.full_name?.charAt(0)}
                   </div>
                   <button className="px-10 py-5 bg-slate-100 dark:bg-white/5 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-slate-200 transition-all">Change Avatar</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="md:col-span-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block">Full Name</label>
                    <input type="text" value={userForm.full_name} onChange={e => setUserForm({full_name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-white/5 rounded-2xl px-8 py-6 text-xl font-black outline-none focus:border-blue-500 transition-all" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block">Corporate Email</label>
                    <input type="text" value={user?.email} disabled className="w-full bg-slate-100 dark:bg-slate-900/50 border-2 border-transparent rounded-2xl px-8 py-6 text-xl font-black opacity-50 cursor-not-allowed" />
                  </div>
                </div>

                <button onClick={handleUserSave} disabled={loading} className="px-12 py-6 bg-blue-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">
                  {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : "Update Profile"}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'org' && (
            <div className="max-w-4xl animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center justify-between mb-16">
                 <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-4">
                   <Building2 className="h-10 w-10 text-blue-600" /> Organization Profile
                 </h3>
                 <button className="flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-white/5 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-600 hover:text-white transition-all">
                   <RefreshCw className="h-4 w-4" /> Switch Company
                 </button>
              </div>

              <div className="space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="md:col-span-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block">Company Name</label>
                    <input type="text" value={orgForm.name} onChange={e => setOrgForm({...orgForm, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-white/5 rounded-2xl px-8 py-6 text-xl font-black outline-none focus:border-blue-500 transition-all" />
                  </div>
                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block text-emerald-500">Industry</label>
                    <div className="relative">
                      <Briefcase className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400" />
                      <input type="text" value={orgForm.industry} onChange={e => setOrgForm({...orgForm, industry: e.target.value})} placeholder="e.g. Technology" className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-white/5 rounded-2xl pl-16 pr-8 py-6 text-xl font-black outline-none focus:border-blue-500 transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block text-blue-500">Website</label>
                    <div className="relative">
                      <LinkIcon className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400" />
                      <input type="text" value={orgForm.website} onChange={e => setOrgForm({...orgForm, website: e.target.value})} placeholder="www.company.com" className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-white/5 rounded-2xl pl-16 pr-8 py-6 text-xl font-black outline-none focus:border-blue-500 transition-all" />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block text-rose-500">Headquarters</label>
                    <div className="relative">
                      <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400" />
                      <input type="text" value={orgForm.location} onChange={e => setOrgForm({...orgForm, location: e.target.value})} placeholder="City, Country" className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-white/5 rounded-2xl pl-16 pr-8 py-6 text-xl font-black outline-none focus:border-blue-500 transition-all" />
                    </div>
                  </div>
                </div>

                <button onClick={handleOrgSave} disabled={loading} className="px-12 py-6 bg-blue-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">
                  {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : "Save Enterprise Data"}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="max-w-4xl animate-in fade-in slide-in-from-right-4 duration-500">
               <h3 className="text-4xl font-black text-slate-900 dark:text-white mb-16 tracking-tight flex items-center gap-4">
                 <Palette className="h-10 w-10 text-blue-600" /> Brand Identity
               </h3>

               <div className="space-y-16">
                  <div className="p-10 bg-slate-50 dark:bg-white/5 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center text-center">
                     <div className="w-32 h-32 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center shadow-xl mb-6">
                        <Plus className="h-12 w-12 text-slate-300" />
                     </div>
                     <p className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Upload Corporate Logo</p>
                     <p className="text-sm text-slate-500 font-bold mt-2 uppercase tracking-widest">Transparent PNG recommended (512x512)</p>
                  </div>

                  <div>
                     <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8 block">Brand Primary Color</label>
                     <div className="flex flex-wrap gap-6">
                        {['#2563eb', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#0f172a'].map(color => (
                          <button 
                            key={color} onClick={() => setOrgForm({...orgForm, primary_color: color})}
                            className={`h-20 w-20 rounded-2xl shadow-lg transition-all ${orgForm.primary_color === color ? 'ring-4 ring-blue-500 ring-offset-4 scale-110' : 'hover:scale-105'}`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                        <input type="color" value={orgForm.primary_color} onChange={e => setOrgForm({...orgForm, primary_color: e.target.value})} className="h-20 w-20 rounded-2xl cursor-pointer bg-white dark:bg-slate-800 p-2 border-2 border-slate-100 dark:border-white/5" />
                     </div>
                  </div>

                  <button onClick={handleOrgSave} className="px-12 py-6 bg-blue-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl">Apply Brand Theme</button>
               </div>
            </div>
          )}

          {(activeTab === 'notifications' || activeTab === 'security') && (
            <div className="h-full flex flex-col items-center justify-center text-center py-20">
               <div className="w-24 h-24 bg-slate-100 dark:bg-white/5 rounded-[2rem] flex items-center justify-center mb-6">
                  {activeTab === 'notifications' ? <Bell className="h-10 w-10 text-slate-300" /> : <Lock className="h-10 w-10 text-slate-300" />}
               </div>
               <h3 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-4">Under Strategic Review</h3>
               <p className="text-xl text-slate-500 dark:text-slate-400 font-medium max-w-md">This high-security section is currently undergoing a structural audit.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
