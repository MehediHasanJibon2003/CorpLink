import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { useAuth } from "../context/AuthContext"
import AppLayout from "../components/layout/AppLayout"
import { logAdminActivity } from "../utils/logger"

import TeamsPanel from "../components/departments/TeamsPanel"
import MembersPanel from "../components/departments/MembersPanel"
import CommunicationPanel from "../components/departments/CommunicationPanel"

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
    setError("")
    // Fetch departments normally without PostgREST joins to prevent FK errors
    const { data: deptsData, error: deptsError } = await supabase
      .from("departments")
      .select("*")
      .eq("company_id", profile?.company_id)
      .order("created_at", { ascending: false })

    if (deptsError) {
      console.error(deptsError)
      setError("Failed to load departments.")
      return
    }

    // Manual merge with employees
    const { data: empsData } = await supabase.from("employees").select("id, name").eq("company_id", profile?.company_id)
    
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

  // We fetch employees inside fetchDepartments instead
  const fetchCompanyEmployees = async () => {} 


  useEffect(() => {
    if (profile?.company_id) {
      fetchDepartments()
      fetchCompanyEmployees()
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
    if (!window.confirm(`Are you extremely sure you want to permanently delete the ${name} department? This might affect employees and teams.`)) return
    
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
    // Quick local update
    const empMatch = employees.find(e => e.id === empId)
    setDepartments(prev => prev.map(d => d.id === deptId ? { ...d, head_id: empId, head: empMatch ? { name: empMatch.name } : null } : d))
  }

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-800"><p className="text-lg font-medium text-slate-600 dark:text-slate-300">Loading...</p></div>

  const activeDept = departments.find(d => d.id === activeDeptId)

  return (
    <AppLayout title="Department Management" subtitle="Manage teams, assignments, and organizational workflows">
      <div className="flex flex-col xl:flex-row gap-8 md:gap-12">
        
        {/* Left Sidebar: Master List */}
        <div className="xl:w-[28rem] flex flex-col gap-6 md:gap-8">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 md:p-8">
            <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 mb-4">Add Department</h3>
            <form onSubmit={handleCreateDepartment} className="flex gap-3 md:gap-4">
              <input type="text" value={newDeptName} onChange={e => setNewDeptName(e.target.value)} placeholder="Marketing, IT..." className="flex-1 w-full border-2 border-slate-300 dark:border-slate-600 rounded-xl md:rounded-2xl px-5 py-3 md:px-6 md:py-4 outline-none focus:border-blue-500 text-base md:text-lg transition-colors bg-slate-50 dark:bg-slate-900/50" />
              <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 md:px-8 md:py-4 rounded-xl md:rounded-2xl font-bold text-base md:text-lg w-24 md:w-32 flex items-center justify-center transition shadow-md">
                {loading ? "..." : "Add"}
              </button>
            </form>
            {error && <p className="text-red-500 font-bold text-sm md:text-base mt-3">{error}</p>}
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex-1">
            <div className="px-6 md:px-8 py-5 md:py-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 flex justify-between items-center">
              <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100">Organization</h3>
              <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 text-sm md:text-lg font-black px-4 py-1 rounded-full">{departments.length}</span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-[600px] md:max-h-[800px] overflow-y-auto custom-scrollbar">
              {departments.length === 0 ? (
                <p className="p-8 md:p-10 text-slate-500 dark:text-slate-400 text-center text-base md:text-lg italic font-medium">No departments exist.</p>
              ) : departments.map(dept => (
                <button
                  key={dept.id}
                  onClick={() => setActiveDeptId(dept.id)}
                  className={`w-full text-left p-5 md:p-6 transition border-l-[6px] ${activeDeptId === dept.id ? "border-blue-600 bg-blue-50/50 dark:bg-blue-900/20" : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}
                >
                  <p className={`text-lg md:text-2xl font-bold ${activeDeptId === dept.id ? "text-blue-800 dark:text-blue-400" : "text-slate-700 dark:text-slate-200"}`}>{dept.name}</p>
                  <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-2 font-medium">
                    <span className="text-xl">👑</span> <span>{dept.head?.name || "No Head Assigned"}</span>
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Content: Active Department details */}
        <div className="flex-1">
          {!activeDept ? (
            <div className="bg-white dark:bg-slate-800 rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-700 p-16 md:p-24 flex flex-col items-center justify-center text-center">
              <span className="text-6xl md:text-8xl mb-6 md:mb-8">🏢</span>
              <h3 className="text-2xl md:text-4xl font-black text-slate-800 dark:text-slate-100">No Department Selected</h3>
              <p className="text-lg md:text-2xl text-slate-500 dark:text-slate-400 mt-4 md:mt-6 leading-relaxed max-w-xl">Select a department from the left, or create a new one to start organizing teams.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden min-h-[700px] md:min-h-[850px] flex flex-col">
              
              {/* Dept Header */}
              <div className="px-8 md:px-12 pt-8 md:pt-12 pb-0 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50/50 to-white dark:from-slate-800 dark:to-slate-800">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
                  <div>
                    <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-2 md:mb-4 tracking-tight">{activeDept.name} Department</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-base md:text-xl font-medium">Manage infrastructure, assignments, and workflow.</p>
                  </div>
                  <button onClick={() => handleDeleteDepartment(activeDept.id, activeDept.name)} className="text-base md:text-lg font-bold bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-800/50 px-6 py-3 md:px-8 md:py-4 rounded-xl md:rounded-2xl transition shadow-sm w-full md:w-auto flex items-center justify-center gap-2">
                    <span className="text-xl">🗑️</span> Delete Dept
                  </button>
                </div>
                
                {/* Tabs */}
                <div className="flex gap-8 md:gap-12 mt-8 md:mt-12 overflow-x-auto custom-scrollbar border-b border-slate-200 dark:border-slate-700">
                  {["overview", "teams", "members", "communication"].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`pb-4 md:pb-5 text-base md:text-xl font-bold capitalize transition border-b-4 shrink-0 ${activeTab === tab ? "border-blue-600 text-blue-700 dark:text-blue-400" : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600"}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content Area */}
              <div className="p-8 md:p-12 flex-1 bg-slate-50 dark:bg-slate-900/30">
                {activeTab === "overview" && (
                  <div className="space-y-6 md:space-y-8 animate-in fade-in">
                    <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl border-2 border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div>
                        <h4 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3"><span className="text-2xl md:text-3xl">⭐</span> Department Head</h4>
                        <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-2 font-medium">The primary administrative leader for this department.</p>
                      </div>
                      <select 
                        value={activeDept.head_id || ""}
                        onChange={(e) => handleAssignHead(activeDept.id, e.target.value)}
                        className="border-2 border-slate-200 dark:border-slate-600 rounded-xl md:rounded-2xl px-6 py-3 md:px-8 md:py-4 outline-none focus:border-blue-500 text-base md:text-xl font-bold bg-slate-50 dark:bg-slate-900/50 transition-colors w-full md:w-auto max-w-sm"
                      >
                        <option value="">-- No Head Assigned --</option>
                        {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                      <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl border-2 border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center">
                        <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg font-bold uppercase tracking-widest">Created On</p>
                        <p className="text-2xl md:text-4xl font-black text-slate-800 dark:text-slate-100 mt-2 md:mt-4">{new Date(activeDept.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {activeTab === "teams" && <TeamsPanel activeDept={activeDept} user={user} profile={profile} />}
                
                {activeTab === "members" && <MembersPanel activeDept={activeDept} />}
                
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