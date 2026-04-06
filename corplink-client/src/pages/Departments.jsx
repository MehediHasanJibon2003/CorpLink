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
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Sidebar: Master List */}
        <div className="lg:w-1/3 flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">Add Department</h3>
            <form onSubmit={handleCreateDepartment} className="flex gap-2">
              <input type="text" value={newDeptName} onChange={e => setNewDeptName(e.target.value)} placeholder="Marketing, IT..." className="flex-1 w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 outline-none focus:border-blue-500 text-sm" />
              <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 rounded-lg font-medium text-sm w-16 flex items-center justify-center">
                {loading ? "..." : "Add"}
              </button>
            </form>
            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex-1">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">Organization</h3>
              <span className="bg-slate-200 text-slate-600 dark:text-slate-300 text-xs font-bold px-2 py-0.5 rounded">{departments.length}</span>
            </div>
            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {departments.length === 0 ? (
                <p className="p-5 text-slate-500 dark:text-slate-400 text-center text-sm">No departments exist.</p>
              ) : departments.map(dept => (
                <button
                  key={dept.id}
                  onClick={() => setActiveDeptId(dept.id)}
                  className={`w-full text-left p-4 transition border-l-4 ${activeDeptId === dept.id ? "border-blue-600 bg-blue-50/50" : "border-transparent hover:bg-slate-50 dark:bg-slate-900/50"}`}
                >
                  <p className={`font-semibold ${activeDeptId === dept.id ? "text-blue-800" : "text-slate-700 dark:text-slate-200"}`}>{dept.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                    <span>👑 {dept.head?.name || "No Head Assigned"}</span>
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Content: Active Department details */}
        <div className="lg:w-2/3">
          {!activeDept ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-16 flex flex-col items-center justify-center text-center">
              <span className="text-5xl mb-4">🏢</span>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">No Department Selected</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-2">Select a department from the left, or create a new one to start organizing teams.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden min-h-[600px] flex flex-col">
              
              {/* Dept Header */}
              <div className="px-6 pt-6 pb-0 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-blue-50 to-white dark:from-slate-800 dark:to-slate-800">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{activeDept.name} Department</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage infrastructure, assignments, and workflow.</p>
                  </div>
                  <button onClick={() => handleDeleteDepartment(activeDept.id, activeDept.name)} className="text-red-500 hover:bg-red-50 p-2 rounded transition">
                    🗑️ Delete Dept
                  </button>
                </div>
                
                {/* Tabs */}
                <div className="flex gap-6 mt-6 border-b border-slate-200 dark:border-slate-700">
                  {["overview", "teams", "members", "communication"].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`pb-3 text-sm font-semibold capitalize transition border-b-2 ${activeTab === tab ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:border-slate-600"}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content Area */}
              <div className="p-6 flex-1 bg-slate-50 dark:bg-slate-900/50">
                {activeTab === "overview" && (
                  <div className="space-y-6 animate-in fade-in">
                    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">⭐ Department Head</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">The primary administrative leader for this department.</p>
                      </div>
                      <select 
                        value={activeDept.head_id || ""}
                        onChange={(e) => handleAssignHead(activeDept.id, e.target.value)}
                        className="border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 outline-none focus:border-blue-500 text-sm font-medium"
                      >
                        <option value="">-- No Head Assigned --</option>
                        {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Created On</p>
                        <p className="font-semibold text-slate-800 dark:text-slate-100 mt-1">{new Date(activeDept.created_at).toLocaleDateString()}</p>
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