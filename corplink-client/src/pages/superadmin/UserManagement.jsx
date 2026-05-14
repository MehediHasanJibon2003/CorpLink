import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import SuperAdminLayout from "../../components/superadmin/layout/SuperAdminLayout"
import { 
  Users, Search, Filter, MoreHorizontal, UserX, UserCheck, 
  Mail, Building2, Shield, Trash2, Key, ChevronRight, ChevronDown 
} from "lucide-react"
import { useConfirm } from "../../context/ConfirmContext"

export default function UserManagement() {
  const { showConfirm } = useConfirm()
  const [users, setUsers] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [companyFilter, setCompanyFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [actionLoading, setActionLoading] = useState(null)
  const [openDropdown, setOpenDropdown] = useState(null) // role, company, status

  const fetchData = async () => {
    setLoading(true)
    const { data: profiles, error } = await supabase.from("profiles").select("*, companies(name)").order("created_at", { ascending: false })
    const { data: comps } = await supabase.from("companies").select("id, name")
    if (!error) setUsers(profiles)
    if (comps) setCompanies(comps)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleToggleBlock = async (userId, currentStatus) => {
    setActionLoading(userId)
    await supabase.from("profiles").update({ is_blocked: !currentStatus }).eq("id", userId)
    await fetchData()
    setActionLoading(null)
  }

  const handleDeleteUser = (userId, name) => {
    showConfirm({
      title: "Delete User",
      message: `Are you sure you want to delete ${name}? This action cannot be undone.`,
      onConfirm: async () => {
        setActionLoading(userId)
        await supabase.from("profiles").delete().eq("id", userId)
        await fetchData()
        setActionLoading(null)
      }
    })
  }

  const handleResetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` })
    if (!error) alert(`Sent to ${email}`)
  }

  const handleChangeRole = async (userId, newRole) => {
    setActionLoading(userId)
    await supabase.from("profiles").update({ role: newRole }).eq("id", userId)
    await fetchData()
    setActionLoading(null)
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.full_name || "").toLowerCase().includes(search.toLowerCase()) || (u.email || "").toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === "all" || u.role === roleFilter
    const matchesCompany = companyFilter === "all" || u.company_id === companyFilter
    const matchesStatus = statusFilter === "all" || (statusFilter === "blocked" ? u.is_blocked : !u.is_blocked)
    return matchesSearch && matchesRole && matchesCompany && matchesStatus
  })

  return (
    <SuperAdminLayout title="User Management" subtitle="Manage identity and access platform-wide">
      
      {/* Responsive Filters & Search */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12 items-start">
        <div className="sm:col-span-2 lg:col-span-1 relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search identity..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-14 pr-6 py-4 md:py-5 rounded-xl md:rounded-2xl bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/10 outline-none focus:border-violet-500 font-black text-slate-900 dark:text-white text-badge md:text-heading-3 uppercase tracking-tight"
          />
        </div>
        
        {/* Role Filter */}
        <div className="relative">
          <button 
            onClick={() => setOpenDropdown(openDropdown === 'role' ? null : 'role')}
            className="w-full flex items-center justify-between gap-2 px-6 py-4 md:py-5 rounded-xl md:rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-violet-500/10 text-badge font-black uppercase tracking-widest text-slate-700 dark:text-violet-200"
          >
            <span className="truncate">{roleFilter === 'all' ? 'All Roles' : roleFilter.replace('_', ' ')}</span>
            <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${openDropdown === 'role' ? 'rotate-180' : ''}`} />
          </button>
          {openDropdown === 'role' && (
            <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-violet-500/20 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
              {['all', 'super_admin', 'corporate_admin', 'employee'].map(r => (
                <button key={r} onClick={() => { setRoleFilter(r); setOpenDropdown(null); }} className="w-full text-left px-6 py-4 hover:bg-slate-50 dark:hover:bg-white/5 text-badge font-black uppercase tracking-widest text-slate-600 dark:text-violet-300">
                  {r === 'all' ? 'All Roles' : r.replace('_', ' ')}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Company Filter */}
        <div className="relative">
          <button 
            onClick={() => setOpenDropdown(openDropdown === 'company' ? null : 'company')}
            className="w-full flex items-center justify-between gap-2 px-6 py-4 md:py-5 rounded-xl md:rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-violet-500/10 text-badge font-black uppercase tracking-widest text-slate-700 dark:text-violet-200"
          >
            <span className="truncate">{companyFilter === 'all' ? 'All Corporates' : companies.find(c => c.id === companyFilter)?.name}</span>
            <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${openDropdown === 'company' ? 'rotate-180' : ''}`} />
          </button>
          {openDropdown === 'company' && (
            <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-violet-500/20 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="max-h-[250px] overflow-y-auto no-scrollbar">
                <button onClick={() => { setCompanyFilter('all'); setOpenDropdown(null); }} className="w-full text-left px-6 py-4 hover:bg-slate-50 dark:hover:bg-white/5 text-badge font-black uppercase tracking-widest text-slate-600 dark:text-violet-300">All Corporates</button>
                {companies.map(c => (
                  <button key={c.id} onClick={() => { setCompanyFilter(c.id); setOpenDropdown(null); }} className="w-full text-left px-6 py-4 hover:bg-slate-50 dark:hover:bg-white/5 text-badge font-black uppercase tracking-widest text-slate-600 dark:text-violet-300 truncate">{c.name}</button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Status Filter */}
        <div className="relative">
          <button 
            onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
            className="w-full flex items-center justify-between gap-2 px-6 py-4 md:py-5 rounded-xl md:rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-violet-500/10 text-badge font-black uppercase tracking-widest text-slate-700 dark:text-violet-200"
          >
            <span className="truncate">{statusFilter === 'all' ? 'All Status' : statusFilter}</span>
            <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${openDropdown === 'status' ? 'rotate-180' : ''}`} />
          </button>
          {openDropdown === 'status' && (
            <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-violet-500/20 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
              {['all', 'active', 'blocked'].map(s => (
                <button key={s} onClick={() => { setStatusFilter(s); setOpenDropdown(null); }} className="w-full text-left px-6 py-4 hover:bg-slate-50 dark:hover:bg-white/5 text-badge font-black uppercase tracking-widest text-slate-600 dark:text-violet-300">
                  {s === 'all' ? 'All Status' : s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Responsive Table Container */}
      <div className="rounded-3xl md:rounded-[2.5rem] overflow-hidden bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/15 shadow-sm mb-8 md:mb-12">
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-violet-500/5 border-b-2 border-slate-100 dark:border-violet-500/10">
                <th className="px-10 py-8 text-badge font-black uppercase tracking-widest text-slate-500 dark:text-violet-400">Identity</th>
                <th className="px-10 py-8 text-badge font-black uppercase tracking-widest text-slate-500 dark:text-violet-400">Context</th>
                <th className="px-10 py-8 text-badge font-black uppercase tracking-widest text-slate-500 dark:text-violet-400">Status</th>
                <th className="px-10 py-8 text-badge font-black uppercase tracking-widest text-slate-500 dark:text-violet-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-100 dark:divide-violet-500/5">
              {loading ? (
                <tr><td colSpan={4} className="py-24 text-center font-black text-slate-400 uppercase tracking-widest animate-pulse text-badge">Syncing Identity Data...</td></tr>
              ) : filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-black text-heading-2 shrink-0 shadow-lg shadow-violet-500/20">
                        {user.full_name?.charAt(0) || "U"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-heading-3 font-black text-slate-900 dark:text-white uppercase tracking-tight truncate max-w-[200px]">{user.full_name}</p>
                        <p className="text-badge font-bold text-slate-400 truncate max-w-[200px]">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 text-label font-black text-slate-700 dark:text-white uppercase tracking-widest">
                        <Building2 className="h-4 w-4 text-violet-500 shrink-0" /> {user.companies?.name || "Global Admin"}
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-pink-500 shrink-0" />
                        <select 
                          value={user.role} 
                          disabled={actionLoading === user.id}
                          onChange={(e) => handleChangeRole(user.id, e.target.value)}
                          className="bg-transparent border-none p-0 text-badge font-black uppercase tracking-widest text-slate-500 outline-none cursor-pointer hover:text-violet-500 transition-colors"
                        >
                          <option value="employee">Employee</option>
                          <option value="corporate_admin">Corporate Admin</option>
                          <option value="super_admin">Super Admin</option>
                        </select>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <span className={`px-4 py-1.5 rounded-full text-badge font-black uppercase tracking-widest border-2 ${
                      user.is_blocked ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    }`}>
                      {user.is_blocked ? "Suspended" : "Active"}
                    </span>
                  </td>
                  <td className="px-10 py-8 text-right opacity-0 group-hover:opacity-100 transition-all">
                    <div className="flex items-center justify-end gap-3">
                      <button onClick={() => handleToggleBlock(user.id, user.is_blocked)} disabled={actionLoading === user.id} className={`p-3 rounded-xl border-2 transition-all active:scale-90 ${user.is_blocked ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                        {user.is_blocked ? <UserCheck className="h-5 w-5" /> : <UserX className="h-5 w-5" />}
                      </button>
                      <button onClick={() => handleResetPassword(user.email)} className="p-3 rounded-xl bg-blue-50 border-2 border-blue-100 text-blue-600 transition-all active:scale-90"><Key className="h-5 w-5" /></button>
                      <button onClick={() => handleDeleteUser(user.id, user.full_name)} className="p-3 rounded-xl bg-red-50 border-2 border-red-100 text-red-600 transition-all active:scale-90"><Trash2 className="h-5 w-5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y-2 divide-slate-100 dark:divide-violet-500/5">
           {loading ? (
             <div className="py-24 text-center font-black text-slate-400 uppercase tracking-widest animate-pulse text-badge">Loading Identity Data...</div>
           ) : filteredUsers.map(user => (
             <div key={user.id} className="p-6 space-y-5">
                <div className="flex justify-between items-start">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-black text-heading-3">
                        {user.full_name?.charAt(0) || "U"}
                      </div>
                      <div className="min-w-0">
                         <p className="text-heading-3 font-black text-slate-900 dark:text-white uppercase truncate tracking-tight">{user.full_name}</p>
                         <p className="text-[9px] font-bold text-slate-400 truncate max-w-[150px]">{user.email}</p>
                      </div>
                   </div>
                   <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border-2 ${
                      user.is_blocked ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    }`}>
                      {user.is_blocked ? "Suspended" : "Active"}
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-100 dark:border-white/5">
                   <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Corporate</p>
                      <p className="text-[10px] font-black text-slate-700 dark:text-white uppercase truncate">{user.companies?.name || "Global Admin"}</p>
                   </div>
                   <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Identity Role</p>
                      <select 
                          value={user.role} 
                          onChange={(e) => handleChangeRole(user.id, e.target.value)}
                          className="bg-transparent border-none p-0 text-[10px] font-black uppercase tracking-widest text-violet-500 outline-none"
                        >
                          <option value="employee">Employee</option>
                          <option value="corporate_admin">Corp Admin</option>
                          <option value="super_admin">Super Admin</option>
                        </select>
                   </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                    <button onClick={() => handleToggleBlock(user.id, user.is_blocked)} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-black uppercase text-[9px] tracking-widest transition-all ${user.is_blocked ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                      {user.is_blocked ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                      {user.is_blocked ? "Activate" : "Suspend"}
                    </button>
                    <div className="flex gap-2">
                       <button onClick={() => handleResetPassword(user.email)} className="p-3 rounded-xl bg-blue-50 border-2 border-blue-100 text-blue-600"><Key className="h-4 w-4" /></button>
                       <button onClick={() => handleDeleteUser(user.id, user.full_name)} className="p-3 rounded-xl bg-red-50 border-2 border-red-100 text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                </div>
             </div>
           ))}
        </div>
      </div>
    </SuperAdminLayout>
  )
}

