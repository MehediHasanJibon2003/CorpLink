import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { useAuth } from "../context/AuthContext"
import AppLayout from "../components/layout/AppLayout"
import { logAdminActivity } from "../utils/logger"
import { Building2, Users, ClipboardList, MessageSquare, Plus, Trash2, ShieldCheck, TrendingUp, ChevronRight } from "lucide-react"
import RoleGate from "../components/roles/RoleGate"

import TeamsPanel from "../components/departments/TeamsPanel"
import MembersPanel from "../components/departments/MembersPanel"
import CommunicationPanel from "../components/departments/CommunicationPanel"
import DepartmentTasksPanel from "../components/departments/DepartmentTasksPanel"

function Departments() {
  const { user, profile, loading: authLoading } = useAuth()

  const [departments, setDepartments] = useState([])
  const [employees, setEmployees] = useState([])
  const [newDeptName, setNewDeptName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  
  // Master-Detail State
  const [activeDeptId, setActiveDeptId] = useState(null)
  const [activeTab, setActiveTab] = useState("overview")

  const fetchDepartments = async () => {
    if (!profile?.company_id) return
    setError("")

    const { data: deptsData, error: deptsError } = await supabase
      .from("departments")
      .select("*")
      .eq("company_id", profile.company_id)
      .order("created_at", { ascending: false })

    if (deptsError) {
      setError("Failed to load departments.")
      return
    }

    const { data: empsData } = await supabase.from("employees").select("id, name").eq("company_id", profile.company_id)
    if (empsData) setEmployees(empsData)

    const mappedDepts = deptsData.map(d => {
      const head = empsData?.find(e => e.id === d.head_id)
      return { ...d, head: head ? { name: head.name } : null }
    })

    setDepartments(mappedDepts || [])
    if (mappedDepts && mappedDepts.length > 0 && !activeDeptId) {
      setActiveDeptId(mappedDepts[0].id)
    }
  }

  useEffect(() => {
    if (profile?.company_id) {
      fetchDepartments()
    }
  }, [profile?.company_id])

  const handleCreateDepartment = async (e) => {
    e.preventDefault()
    if (!newDeptName.trim()) return
    setLoading(true)
    
    try {
      const { data: insertData, error: insertError } = await supabase
        .from("departments")
        .insert([{ name: newDeptName.trim(), company_id: profile.company_id, created_by: user.id }])
        .select()

      if (insertError) throw insertError

      await logAdminActivity({
        company_id: profile.company_id, user_id: user.id,
        action: `Created new Department: ${newDeptName.trim()}`, entity: "department"
      })

      setNewDeptName("")
      await fetchDepartments()
      if (insertData && insertData.length > 0) setActiveDeptId(insertData[0].id)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDepartment = async (id, name) => {
    if (!window.confirm(`Delete the ${name} department? This will affect team structure.`)) return
    const { error } = await supabase.from("departments").delete().eq("id", id)
    if (!error) {
       await logAdminActivity({
        company_id: profile.company_id, user_id: user.id,
        action: `Deleted Department: ${name}`, entity: "department", severity: "critical"
      })
      if (activeDeptId === id) setActiveDeptId(null)
      fetchDepartments()
    }
  }

  const handleAssignHead = async (deptId, empId) => {
    await supabase.from("departments").update({ head_id: empId || null }).eq("id", deptId)
    fetchDepartments()
  }

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900"><p className="text-lg font-black text-blue-600 animate-pulse">Initializing Corporate Infrastructure...</p></div>

  const activeDept = departments.find(d => d.id === activeDeptId)

  const TABS = [
    { id: "overview", label: "Overview", icon: Building2 },
    { id: "teams", label: "Teams", icon: Users },
    { id: "members", label: "Employees", icon: ShieldCheck },
    { id: "tasks", label: "Workflow Tracking", icon: ClipboardList },
    { id: "communication", label: "Comm Channel", icon: MessageSquare },
  ]

  return (
    <AppLayout title="Department Command Center" subtitle="Organize organizational hierarchy, teams and workflows.">
      <div className="flex flex-col xl:flex-row gap-8 md:gap-12">
        
        {/* Left Sidebar: Master List */}
        <div className="xl:w-96 flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border-2 border-slate-100 dark:border-violet-500/10 p-8">
            <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-500" /> New Unit
            </h3>
            <form onSubmit={handleCreateDepartment} className="space-y-4">
              <input 
                type="text" value={newDeptName} onChange={e => setNewDeptName(e.target.value)} 
                placeholder="Dept Name (e.g. Sales)" 
                className="w-full border-2 border-slate-100 dark:border-violet-500/10 rounded-2xl px-6 py-4 outline-none focus:border-blue-500 text-sm font-bold bg-slate-50 dark:bg-slate-900/50" 
              />
              <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-all">
                {loading ? "Creating..." : "Add Department"}
              </button>
            </form>
            {error && <p className="text-red-500 font-bold text-xs mt-3">{error}</p>}
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border-2 border-slate-100 dark:border-violet-500/10 overflow-hidden flex-1">
            <div className="px-8 py-6 border-b-2 border-slate-50 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Active Units</h3>
              <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-3 py-1 rounded-full">{departments.length}</span>
            </div>
            <div className="divide-y-2 divide-slate-50 dark:divide-white/5 max-h-[500px] overflow-y-auto custom-scrollbar">
              {departments.length === 0 ? (
                <p className="p-10 text-slate-400 text-center text-sm font-bold italic">No units established.</p>
              ) : departments.map(dept => (
                <button
                  key={dept.id}
                  onClick={() => { setActiveDeptId(dept.id); setActiveTab("overview"); }}
                  className={`w-full text-left p-6 transition-all flex items-center justify-between group ${activeDeptId === dept.id ? "bg-blue-50/50 dark:bg-blue-600/10 border-l-4 border-blue-600" : "hover:bg-slate-50 dark:hover:bg-white/5 border-l-4 border-transparent"}`}
                >
                  <div>
                    <p className={`text-lg font-black tracking-tight ${activeDeptId === dept.id ? "text-blue-600" : "text-slate-700 dark:text-slate-200"}`}>{dept.name}</p>
                    <p className="text-[10px] text-slate-400 font-black uppercase mt-1 tracking-widest">Head: {dept.head?.name || "Unassigned"}</p>
                  </div>
                  <ChevronRight className={`h-5 w-5 transition-transform ${activeDeptId === dept.id ? "text-blue-600 translate-x-1" : "text-slate-300"}`} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Content */}
        <div className="flex-1">
          {!activeDept ? (
            <div className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-sm border-2 border-slate-100 dark:border-violet-500/10 p-20 flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-8">
                 <Building2 className="h-12 w-12 text-slate-300" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Select a Department</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-4 font-medium max-w-sm">Choose an organizational unit from the directory to manage its teams and workflow.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-sm border-2 border-slate-100 dark:border-violet-500/10 overflow-hidden flex flex-col min-h-[700px]">
              
              {/* Dept Header */}
              <div className="p-8 md:p-12 pb-0 border-b-2 border-slate-50 dark:border-white/5">
                <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center text-white shadow-lg">
                      <Building2 className="h-8 w-8 md:h-10 md:w-10" />
                    </div>
                    <div>
                      <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{activeDept.name} Unit</h2>
                      <p className="text-slate-500 font-bold text-sm md:text-base mt-1">Established {new Date(activeDept.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <RoleGate allowedRoles={["admin", "corporate_admin"]}>
                    <button onClick={() => handleDeleteDepartment(activeDept.id, activeDept.name)} className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all">
                      <Trash2 className="h-6 w-6" />
                    </button>
                  </RoleGate>
                </div>
                
                {/* Modern Tabs */}
                <div className="flex gap-6 md:gap-10 mt-10 md:mt-12 overflow-x-auto scrollbar-hide">
                  {TABS.map(tab => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`pb-5 flex items-center gap-3 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] transition-all border-b-4 shrink-0 ${activeTab === tab.id ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}
                      >
                        <Icon className="h-4 w-4 md:h-5 md:w-5" /> {tab.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Content Area */}
              <div className="p-8 md:p-12 bg-slate-50/30 dark:bg-white/5 flex-1">
                {activeTab === "overview" && (
                  <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border-2 border-slate-100 dark:border-white/5 shadow-sm">
                          <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Unit Leadership</h4>
                          <div className="flex items-center gap-6 mb-6">
                             <div className="w-14 h-14 bg-blue-50 dark:bg-blue-600/10 rounded-2xl flex items-center justify-center">
                                <ShieldCheck className="h-7 w-7 text-blue-600" />
                             </div>
                             <div>
                                <p className="text-lg font-black text-slate-800 dark:text-white uppercase">{activeDept.head?.name || "No Head Assigned"}</p>
                                <p className="text-xs font-bold text-slate-500">Department Head</p>
                             </div>
                          </div>
                          <RoleGate allowedRoles={["admin", "corporate_admin"]}>
                            <select 
                              value={activeDept.head_id || ""}
                              onChange={(e) => handleAssignHead(activeDept.id, e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-white/5 rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest outline-none focus:border-blue-500"
                            >
                              <option value="">Reassign Leadership</option>
                              {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                            </select>
                          </RoleGate>
                       </div>

                       <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border-2 border-slate-100 dark:border-white/5 shadow-sm flex flex-col justify-between">
                          <div>
                            <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Unit Performance</h4>
                            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Operational</p>
                          </div>
                          <div className="flex items-center gap-2 text-emerald-500 font-black text-xs uppercase mt-4">
                             <TrendingUp className="h-4 w-4" /> Healthy Growth
                          </div>
                       </div>
                    </div>
                  </div>
                )}
                
                {activeTab === "teams" && <TeamsPanel activeDept={activeDept} user={user} profile={profile} />}
                {activeTab === "members" && <MembersPanel activeDept={activeDept} />}
                {activeTab === "tasks" && <DepartmentTasksPanel activeDept={activeDept} />}
                {activeTab === "communication" && <CommunicationPanel activeDept={activeDept} profile={profile} />}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}

export default Departments