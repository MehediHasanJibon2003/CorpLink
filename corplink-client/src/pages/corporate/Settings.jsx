import { useEffect, useState } from "react";
import AppLayout from "../../components/layout/AppLayout";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import {
  User, Bell, Lock, Palette, Globe, Shield, Loader2, 
  CheckCircle2, Building2, Link as LinkIcon, MapPin, 
  Briefcase, Plus, RefreshCw, ChevronDown
} from "lucide-react";

export default function Settings() {
  const { user, profile, setProfile } = useAuth();
  const [activeTab, setActiveTab] = useState("org");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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

  // Notifications State
  const [notifications, setNotifications] = useState({
    email_tasks: true,
    email_updates: false,
    push_messages: true,
    push_mentions: true,
  });

  // Security State
  const [passwordForm, setPasswordForm] = useState({ newPassword: "", confirmPassword: "" });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

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

  const handleToggleNotification = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    // In a real app, you would save this to the database or local storage here.
    setMessage("Preferences updated");
    setTimeout(() => setMessage(""), 2000);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }

    setPasswordLoading(true);
    setPasswordError("");
    setPasswordSuccess("");

    const { error } = await supabase.auth.updateUser({
      password: passwordForm.newPassword
    });

    if (error) {
      setPasswordError(error.message);
    } else {
      setPasswordSuccess("Password updated successfully.");
      setPasswordForm({ newPassword: "", confirmPassword: "" });
    }
    setPasswordLoading(false);
  };

  const tabs = [
    { id: "org", label: "Organization", icon: Shield },
    { id: "appearance", label: "Branding", icon: Palette },
    { id: "notifications", label: "Alerts", icon: Bell },
    { id: "security", label: "Security", icon: Lock },
  ];

  const currentTab = tabs.find(t => t.id === activeTab);

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
        <div className="w-full xl:w-96 border-b-2 xl:border-b-0 xl:border-r-2 border-slate-50 dark:border-white/5 bg-slate-50/30 dark:bg-white/5 p-6 md:p-12">
          
          {/* Mobile Dropdown */}
          <div className="xl:hidden relative mb-2">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-6 py-5 text-[12px] font-black uppercase tracking-widest outline-none focus:ring-2 ring-blue-500/20 shadow-sm"
            >
              <div className="flex items-center gap-4 text-blue-600 dark:text-blue-400">
                {currentTab && <currentTab.icon className="h-6 w-6" />}
                <span className="text-slate-900 dark:text-white">{currentTab?.label}</span>
              </div>
              <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${isDropdownOpen ? "rotate-180 text-blue-600" : "text-slate-400"}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-4 px-6 py-5 text-[12px] font-black uppercase tracking-widest transition-all border-b last:border-0 border-slate-100 dark:border-slate-700/50 ${
                      activeTab === tab.id
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    }`}
                  >
                    <tab.icon className="h-5 w-5" />
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Desktop Nav */}
          <div className="hidden xl:block">
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
          </div>

          <div className="mt-8 xl:mt-32">
             <div className="p-6 md:p-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] md:rounded-[2.5rem] text-white shadow-2xl shadow-blue-500/20 relative overflow-hidden group">
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest opacity-60">License Tier</p>
                <p className="text-xl md:text-2xl font-black mt-1">Enterprise Plus</p>
                <div className="mt-4 md:mt-6 flex items-center gap-3 text-[8px] md:text-[9px] font-black uppercase tracking-widest bg-white/10 w-fit px-4 py-2 rounded-full">
                   <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Valid: DEC 2026
                </div>
             </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 md:p-20 overflow-y-auto custom-scrollbar">
          {message && (
            <div className="mb-8 md:mb-12 p-6 md:p-8 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border-2 border-emerald-100 dark:border-emerald-500/20 rounded-[1.5rem] md:rounded-[2rem] font-black uppercase text-[9px] md:text-[10px] tracking-[0.2em] flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
              <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6" /> {message}
            </div>
          )}

          {activeTab === 'org' && (
            <div className="max-w-4xl animate-in fade-in slide-in-from-right-6 duration-700">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-8 mb-10 md:mb-16">
                 <div className="flex items-center gap-4 md:gap-6">
                    <div className="h-12 w-12 md:h-14 md:w-14 bg-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center text-white shrink-0">
                       <Building2 className="h-6 w-6 md:h-7 md:w-7" />
                    </div>
                    <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Enterprise <span className="text-blue-600">Base</span></h3>
                 </div>
                 <button className="flex items-center justify-center gap-3 px-6 md:px-8 py-4 bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/5 rounded-2xl font-black uppercase tracking-widest text-[8px] md:text-[9px] text-slate-400 hover:text-blue-600 hover:border-blue-500/20 transition-all w-full md:w-auto">
                   <RefreshCw className="h-3 w-3 md:h-4 w-4" /> Transfer Ownership
                 </button>
              </div>

              <div className="space-y-8 md:space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                  <div className="md:col-span-2 space-y-2 md:space-y-3">
                    <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Corporate Identity</label>
                    <input type="text" value={orgForm.name} onChange={e => setOrgForm({...orgForm, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-white/5 rounded-2xl px-6 py-5 md:px-8 md:py-6 text-lg md:text-xl font-bold outline-none focus:border-blue-500 transition-all" />
                  </div>
                  <div className="space-y-2 md:space-y-3">
                    <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Industry Sector</label>
                    <div className="relative">
                      <Briefcase className="absolute left-5 md:left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input type="text" value={orgForm.industry} onChange={e => setOrgForm({...orgForm, industry: e.target.value})} placeholder="e.g. Technology" className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-white/5 rounded-2xl pl-14 md:pl-16 pr-6 md:pr-8 py-5 md:py-6 text-lg md:text-xl font-bold outline-none focus:border-blue-500 transition-all" />
                    </div>
                  </div>
                  <div className="space-y-2 md:space-y-3">
                    <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Digital Portal</label>
                    <div className="relative">
                      <LinkIcon className="absolute left-5 md:left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input type="text" value={orgForm.website} onChange={e => setOrgForm({...orgForm, website: e.target.value})} placeholder="www.company.com" className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-white/5 rounded-2xl pl-14 md:pl-16 pr-6 md:pr-8 py-5 md:py-6 text-lg md:text-xl font-bold outline-none focus:border-blue-500 transition-all" />
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-2 md:space-y-3">
                    <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Operational HQ</label>
                    <div className="relative">
                      <MapPin className="absolute left-5 md:left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input type="text" value={orgForm.location} onChange={e => setOrgForm({...orgForm, location: e.target.value})} placeholder="City, Country" className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-white/5 rounded-2xl pl-14 md:pl-16 pr-6 md:pr-8 py-5 md:py-6 text-lg md:text-xl font-bold outline-none focus:border-blue-500 transition-all" />
                    </div>
                  </div>
                </div>

                <button onClick={handleOrgSave} disabled={loading} className="w-full md:w-auto px-10 md:px-16 py-5 md:py-6 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-[11px] shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all">
                  {loading ? <Loader2 className="h-5 w-5 md:h-6 md:w-6 animate-spin mx-auto" /> : "Deploy Configuration"}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="max-w-4xl animate-in fade-in slide-in-from-right-6 duration-700">
               <div className="flex items-center gap-4 md:gap-6 mb-10 md:mb-16">
                  <div className="h-12 w-12 md:h-14 md:w-14 bg-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center text-white shrink-0">
                     <Palette className="h-6 w-6 md:h-7 md:w-7" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Brand <span className="text-blue-600">Identity</span></h3>
               </div>

               <div className="space-y-10 md:space-y-16">
                  <div className="p-8 md:p-12 bg-slate-50 dark:bg-white/5 rounded-[2rem] md:rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center text-center group cursor-pointer hover:border-blue-500/20 transition-all">
                     <div className="w-24 h-24 md:w-32 md:h-32 bg-white dark:bg-slate-800 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-2xl mb-6 md:mb-8 group-hover:scale-110 transition-transform">
                        <Plus className="h-10 w-10 md:h-12 md:w-12 text-slate-300 group-hover:text-blue-500 transition-colors" />
                     </div>
                     <p className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Upload Master Logo</p>
                     <p className="text-[9px] md:text-[10px] text-slate-400 font-black mt-3 md:mt-4 uppercase tracking-[0.2em]">High fidelity SVG or PNG (512x512)</p>
                  </div>

                  <div className="space-y-6 md:space-y-8">
                     <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-2 block">Enterprise Color Palette</label>
                     <div className="flex flex-wrap gap-4 md:gap-6">
                        {['#2563eb', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#0f172a'].map(color => (
                          <button 
                            key={color} onClick={() => setOrgForm({...orgForm, primary_color: color})}
                            className={`h-16 w-16 md:h-20 md:w-20 rounded-xl md:rounded-[1.5rem] shadow-xl transition-all ${orgForm.primary_color === color ? 'ring-4 ring-blue-500 ring-offset-4 scale-110' : 'hover:scale-105 active:scale-95'}`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                        <input type="color" value={orgForm.primary_color} onChange={e => setOrgForm({...orgForm, primary_color: e.target.value})} className="h-16 w-16 md:h-20 md:w-20 rounded-xl md:rounded-[1.5rem] cursor-pointer bg-white dark:bg-slate-800 p-2 md:p-3 border-2 border-slate-100 dark:border-white/5 shadow-xl" />
                     </div>
                  </div>

                  <button onClick={handleOrgSave} className="w-full md:w-auto px-10 md:px-16 py-5 md:py-6 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-[11px] shadow-xl shadow-blue-500/20 active:scale-95 transition-all">Apply Visual Parameters</button>
               </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="max-w-4xl animate-in fade-in slide-in-from-right-6 duration-700">
               <div className="flex items-center gap-4 md:gap-6 mb-10 md:mb-16">
                  <div className="h-12 w-12 md:h-14 md:w-14 bg-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center text-white shrink-0">
                     <Bell className="h-6 w-6 md:h-7 md:w-7" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Alert <span className="text-blue-600">Preferences</span></h3>
               </div>

               <div className="space-y-10">
                 {/* Email Notifications */}
                 <div className="bg-slate-50 dark:bg-white/5 rounded-[2rem] p-8 md:p-10 border-2 border-slate-100 dark:border-white/5">
                   <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Email Alerts</h4>
                   <div className="space-y-6">
                     <div className="flex items-center justify-between gap-4">
                       <div>
                         <p className="text-[14px] font-bold text-slate-800 dark:text-slate-200">Task Assignments</p>
                         <p className="text-[10px] text-slate-400 font-medium mt-1">Get notified when a task is assigned to you.</p>
                       </div>
                       <button 
                         onClick={() => handleToggleNotification('email_tasks')}
                         className={`w-12 h-6 md:w-14 md:h-7 rounded-full relative transition-colors duration-300 ${notifications.email_tasks ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                       >
                         <span className={`absolute top-1 left-1 bg-white w-4 h-4 md:w-5 md:h-5 rounded-full transition-transform duration-300 ${notifications.email_tasks ? 'translate-x-6' : 'translate-x-0'}`} />
                       </button>
                     </div>
                     <div className="h-px bg-slate-200 dark:bg-slate-700/50 w-full" />
                     <div className="flex items-center justify-between gap-4">
                       <div>
                         <p className="text-[14px] font-bold text-slate-800 dark:text-slate-200">System Updates</p>
                         <p className="text-[10px] text-slate-400 font-medium mt-1">Receive weekly summaries and major system updates.</p>
                       </div>
                       <button 
                         onClick={() => handleToggleNotification('email_updates')}
                         className={`w-12 h-6 md:w-14 md:h-7 rounded-full relative transition-colors duration-300 ${notifications.email_updates ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                       >
                         <span className={`absolute top-1 left-1 bg-white w-4 h-4 md:w-5 md:h-5 rounded-full transition-transform duration-300 ${notifications.email_updates ? 'translate-x-6' : 'translate-x-0'}`} />
                       </button>
                     </div>
                   </div>
                 </div>

                 {/* Push Notifications */}
                 <div className="bg-slate-50 dark:bg-white/5 rounded-[2rem] p-8 md:p-10 border-2 border-slate-100 dark:border-white/5">
                   <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Platform Notifications</h4>
                   <div className="space-y-6">
                     <div className="flex items-center justify-between gap-4">
                       <div>
                         <p className="text-[14px] font-bold text-slate-800 dark:text-slate-200">Direct Messages</p>
                         <p className="text-[10px] text-slate-400 font-medium mt-1">In-app alerts for new direct messages.</p>
                       </div>
                       <button 
                         onClick={() => handleToggleNotification('push_messages')}
                         className={`w-12 h-6 md:w-14 md:h-7 rounded-full relative transition-colors duration-300 ${notifications.push_messages ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                       >
                         <span className={`absolute top-1 left-1 bg-white w-4 h-4 md:w-5 md:h-5 rounded-full transition-transform duration-300 ${notifications.push_messages ? 'translate-x-6' : 'translate-x-0'}`} />
                       </button>
                     </div>
                     <div className="h-px bg-slate-200 dark:bg-slate-700/50 w-full" />
                     <div className="flex items-center justify-between gap-4">
                       <div>
                         <p className="text-[14px] font-bold text-slate-800 dark:text-slate-200">Mentions & Tags</p>
                         <p className="text-[10px] text-slate-400 font-medium mt-1">Alerts when you are mentioned in comments or feeds.</p>
                       </div>
                       <button 
                         onClick={() => handleToggleNotification('push_mentions')}
                         className={`w-12 h-6 md:w-14 md:h-7 rounded-full relative transition-colors duration-300 ${notifications.push_mentions ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                       >
                         <span className={`absolute top-1 left-1 bg-white w-4 h-4 md:w-5 md:h-5 rounded-full transition-transform duration-300 ${notifications.push_mentions ? 'translate-x-6' : 'translate-x-0'}`} />
                       </button>
                     </div>
                   </div>
                 </div>
               </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="max-w-4xl animate-in fade-in slide-in-from-right-6 duration-700">
               <div className="flex items-center gap-4 md:gap-6 mb-10 md:mb-16">
                  <div className="h-12 w-12 md:h-14 md:w-14 bg-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center text-white shrink-0">
                     <Lock className="h-6 w-6 md:h-7 md:w-7" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Security <span className="text-blue-600">Protocols</span></h3>
               </div>

               <div className="space-y-12">
                 {/* Password Reset */}
                 <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-8 md:p-10 border-2 border-slate-100 dark:border-white/5 shadow-sm">
                   <h4 className="text-[14px] font-black uppercase tracking-[0.2em] text-slate-800 dark:text-white mb-6">Change Password</h4>
                   <form onSubmit={handlePasswordChange} className="space-y-6 max-w-xl">
                     <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">New Password</label>
                       <input 
                         type="password" 
                         value={passwordForm.newPassword} 
                         onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} 
                         className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-white/5 rounded-2xl px-6 py-4 text-md font-bold outline-none focus:border-blue-500 transition-all" 
                         placeholder="Min. 6 characters"
                       />
                     </div>
                     <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Confirm Password</label>
                       <input 
                         type="password" 
                         value={passwordForm.confirmPassword} 
                         onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} 
                         className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-white/5 rounded-2xl px-6 py-4 text-md font-bold outline-none focus:border-blue-500 transition-all" 
                         placeholder="Re-enter password"
                       />
                     </div>
                     
                     {passwordError && <p className="text-red-500 text-[11px] font-bold bg-red-50 dark:bg-red-500/10 px-4 py-2 rounded-lg">{passwordError}</p>}
                     {passwordSuccess && <p className="text-emerald-500 text-[11px] font-bold bg-emerald-50 dark:bg-emerald-500/10 px-4 py-2 rounded-lg">{passwordSuccess}</p>}

                     <button type="submit" disabled={passwordLoading} className="px-8 py-4 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center min-w-[160px]">
                       {passwordLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Password"}
                     </button>
                   </form>
                 </div>

                 {/* Active Sessions */}
                 <div className="bg-slate-50 dark:bg-white/5 rounded-[2rem] p-8 md:p-10 border-2 border-slate-100 dark:border-white/5">
                    <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Active Sessions</h4>
                    <div className="flex items-center justify-between p-4 md:p-6 bg-white dark:bg-slate-800 rounded-xl md:rounded-2xl border-2 border-emerald-100 dark:border-emerald-500/20 shadow-sm">
                      <div>
                        <p className="text-[14px] font-bold text-slate-800 dark:text-white flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          Current Session
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-widest">Windows • Chrome • IP: 192.168.x.x</p>
                      </div>
                      <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 text-[9px] font-black uppercase tracking-widest rounded-lg">Active Now</span>
                    </div>
                 </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

