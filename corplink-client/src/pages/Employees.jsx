    import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { useAuth } from "../context/AuthContext"
import AppLayout from "../components/layout/AppLayout"

function Employees() {
  const { user, profile } = useAuth()

  const [employees, setEmployees] = useState([])
  const [departments, setDepartments] = useState([])
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const [form, setForm] = useState({
    name: "",
    email: "",
    department_id: "",
    role: "employee",
    designation: "",
    joining_date: new Date().toISOString().split('T')[0]
  })

  const fetchEmployees = async () => {
    if (!profile?.company_id) return

    setError("")

    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("company_id", profile.company_id)
      .order("created_at", { ascending: false })

    if (error) {
      setError(error.message)
      return
    }

    setEmployees(data || [])
  }

  const fetchDepartments = async () => {
    if (!profile?.company_id) return

    const { data, error } = await supabase
      .from("departments")
      .select("*")
      .eq("company_id", profile.company_id)
      .order("created_at", { ascending: false })

    if (error) {
      setError(error.message)
      return
    }

    setDepartments(data || [])
  }

  useEffect(() => {
    if (profile?.company_id) {
      fetchEmployees()
      fetchDepartments()
    }
  }, [profile?.company_id])

  const resetForm = () => {
    setForm({
      name: "",
      email: "",
      department_id: "",
      role: "employee",
      designation: "",
      joining_date: new Date().toISOString().split('T')[0]
    })
    setEditingId(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setMessage("")

    if (!form.name.trim() || !form.email.trim()) {
      setError("Name and email দাও")
      return
    }

    if (!profile?.company_id) {
      setError("Company ID পাওয়া যায়নি")
      return
    }

    if (!user?.id) {
      setError("User পাওয়া যায়নি")
      return
    }

    setLoading(true)

    try {
      if (editingId) {
        const { error } = await supabase
          .from("employees")
          .update({
            name: form.name.trim(),
            email: form.email.trim(),
            department_id: form.department_id || null,
            role: form.role,
          })
          .eq("id", editingId)

        if (error) {
          setError(error.message)
          setLoading(false)
          return
        }

        await supabase.from("activity_logs").insert([
          {
            company_id: profile.company_id,
            user_id: user.id,
            action: "Updated Employee",
            entity: "employee",
          },
        ])

        setMessage("Employee updated successfully")
      } else {
        const { error } = await supabase.from("employees").insert([
          {
            name: form.name.trim(),
            email: form.email.trim(),
            department_id: form.department_id || null,
            role: form.role,
            designation: form.designation,
            joining_date: form.joining_date,
            company_id: profile.company_id,
            created_by: user.id,
          },
        ])

        if (error) {
          setError(error.message)
          setLoading(false)
          return
        }

        await supabase.from("activity_logs").insert([
          {
            company_id: profile.company_id,
            user_id: user.id,
            action: "Created Employee",
            entity: "employee",
          },
        ])

        setMessage("Employee added successfully")
      }

      resetForm()
      fetchEmployees()
    } catch (err) {
      console.error(err)
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (emp) => {
    setEditingId(emp.id)
    setForm({
      name: emp.name || "",
      email: emp.email || "",
      department_id: emp.department_id || "",
      role: emp.role || "employee",
      designation: emp.designation || "",
      joining_date: emp.joining_date || new Date().toISOString().split('T')[0]
    })
    setError("")
    setMessage("")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleDelete = async (id) => {
    const ok = window.confirm("Delete this employee?")
    if (!ok) return

    setError("")
    setMessage("")

    const { error } = await supabase.from("employees").delete().eq("id", id)

    if (error) {
      setError(error.message)
      return
    }

    await supabase.from("activity_logs").insert([
      {
        company_id: profile.company_id,
        user_id: user.id,
        action: "Deleted Employee",
        entity: "employee",
      },
    ])

    setMessage("Employee deleted successfully")
    fetchEmployees()
  }

  const getRoleBadge = (role) => {
    if (role === "manager") return "bg-purple-100 text-purple-700"
    return "bg-blue-100 text-blue-700"
  }

  const getDepartmentName = (deptId) => {
    if (!deptId) return null;
    const dept = departments.find((d) => d.id === deptId);
    return dept ? dept.name : null;
  }

  const handleCopyInviteCode = () => {
    if (profile?.company_id) {
      navigator.clipboard.writeText(profile.company_id)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <AppLayout
      title="Employee Management"
      subtitle="Add, update and manage your company employees"
    >
      <div className="space-y-8 md:space-y-12">
        {/* Invite Code Card */}
        <div className="bg-linear-to-r from-blue-600 to-blue-800 rounded-3xl md:rounded-[2.5rem] shadow-2xl p-8 md:p-12 lg:p-16 flex flex-col lg:flex-row items-center justify-between gap-8 md:gap-10 text-white">
          <div className="text-center lg:text-left">
            <h3 className="text-3xl md:text-5xl font-black mb-3 md:mb-4">Company Invite Code</h3>
            <p className="text-blue-200 text-base md:text-2xl font-medium leading-relaxed">
              Share this code with your employees so they can join your workspace.
            </p>
          </div>
          <div className="flex items-center gap-4 bg-black/20 p-3 md:p-4 pl-6 md:pl-8 rounded-2xl border-2 border-white/10 w-full lg:w-auto">
            <code className="font-mono font-bold text-lg md:text-2xl tracking-wide select-all w-full text-center lg:text-left">
              {profile?.company_id || "Loading..."}
            </code>
            <button
              onClick={handleCopyInviteCode}
              className="bg-white text-blue-700 hover:bg-blue-50 px-6 md:px-10 py-3 md:py-4 rounded-xl text-base md:text-xl font-bold transition-all shadow-md hover:shadow-lg shrink-0"
            >
              {copied ? "Copied!" : "Copy Code"}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-700 p-8 md:p-12">
          <h3 className="text-2xl md:text-4xl font-black text-slate-800 dark:text-slate-100 mb-6 md:mb-8">{editingId ? 'Edit Employee' : 'Add New Employee'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            <input
              type="text"
              placeholder="Employee Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border-2 border-slate-200 dark:border-slate-600 px-6 md:px-8 py-4 md:py-5 rounded-2xl outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900/50 text-base md:text-xl transition-colors"
            />

            <input
              type="email"
              placeholder="Employee Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="border-2 border-slate-200 dark:border-slate-600 px-6 md:px-8 py-4 md:py-5 rounded-2xl outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900/50 text-base md:text-xl transition-colors"
            />

            <select
              value={form.department_id}
              onChange={(e) =>
                setForm({ ...form, department_id: e.target.value })
              }
              className="border-2 border-slate-200 dark:border-slate-600 px-6 md:px-8 py-4 md:py-5 rounded-2xl outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900/50 text-base md:text-xl transition-colors"
            >
              <option value="">Select Department</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>

            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="border-2 border-slate-200 dark:border-slate-600 px-6 md:px-8 py-4 md:py-5 rounded-2xl outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900/50 text-base md:text-xl transition-colors"
            >
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
            </select>

            <input
              type="text"
              placeholder="Designation"
              value={form.designation}
              onChange={(e) => setForm({ ...form, designation: e.target.value })}
              className="border-2 border-slate-200 dark:border-slate-600 px-6 md:px-8 py-4 md:py-5 rounded-2xl outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900/50 text-base md:text-xl transition-colors"
            />

            <input
              type="date"
              value={form.joining_date}
              onChange={(e) => setForm({ ...form, joining_date: e.target.value })}
              className="border-2 border-slate-200 dark:border-slate-600 px-6 md:px-8 py-4 md:py-5 rounded-2xl outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900/50 text-base md:text-xl transition-colors"
            />

            <div className="md:col-span-2 lg:col-span-4 flex flex-col md:flex-row gap-4 mt-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 md:px-12 py-4 md:py-5 rounded-2xl font-bold text-base md:text-xl shadow-md transition hover:-translate-y-0.5 w-full md:w-auto"
              >
                {loading ? "Saving..." : editingId ? "Update Employee" : "Add Employee"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-800 dark:text-slate-100 px-8 md:px-12 py-4 md:py-5 rounded-2xl font-bold text-base md:text-xl transition w-full md:w-auto"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          {error && <p className="text-red-600 font-bold text-base md:text-lg mt-6 bg-red-50 p-4 rounded-xl">{error}</p>}
          {message && <p className="text-green-600 font-bold text-base md:text-lg mt-6 bg-green-50 p-4 rounded-xl">{message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 md:p-10 border-b-[8px] border-b-blue-500 flex flex-col items-center text-center">
            <p className="text-base md:text-xl text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Total Employees</p>
            <h3 className="text-5xl md:text-7xl font-black text-slate-800 dark:text-slate-100 mt-4 md:mt-6">
              {employees.length}
            </h3>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 md:p-10 border-b-[8px] border-b-purple-500 flex flex-col items-center text-center">
            <p className="text-base md:text-xl text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Managers</p>
            <h3 className="text-5xl md:text-7xl font-black text-slate-800 dark:text-slate-100 mt-4 md:mt-6">
              {employees.filter((emp) => emp.role === "manager").length}
            </h3>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 md:p-10 border-b-[8px] border-b-emerald-500 flex flex-col items-center text-center">
            <p className="text-base md:text-xl text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Active Members</p>
            <h3 className="text-5xl md:text-7xl font-black text-slate-800 dark:text-slate-100 mt-4 md:mt-6">
              {employees.filter((emp) => emp.role === "employee").length}
            </h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-8 md:px-12 py-6 md:py-8 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30">
            <h3 className="text-2xl md:text-4xl font-black text-slate-800 dark:text-slate-100">Employee Directory</h3>
          </div>

          {employees.length === 0 ? (
            <p className="p-10 text-center text-slate-500 dark:text-slate-400 text-lg md:text-xl font-medium italic">No employees found. Invite some to get started!</p>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {employees.map((emp) => (
                <div
                  key={emp.id}
                  className="p-6 md:p-10 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-2">
                      <h4 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100">
                        {emp.name}
                      </h4>

                      <span
                        className={`text-sm md:text-base px-4 py-1.5 md:px-5 md:py-2 rounded-full font-bold shadow-sm ${getRoleBadge(
                          emp.role
                        )}`}
                      >
                        {emp.role.charAt(0).toUpperCase() + emp.role.slice(1)}
                      </span>

                      {emp.onboarded ? (
                        <span className="text-sm md:text-base px-4 py-1.5 md:px-5 md:py-2 rounded-full font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50 shadow-sm">
                          Active User
                        </span>
                      ) : (
                        <span className="text-sm md:text-base px-4 py-1.5 md:px-5 md:py-2 rounded-full font-bold bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50 shadow-sm">
                          Pending Invite
                        </span>
                      )}
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4 md:gap-6 mt-6 md:mt-8 text-base md:text-xl text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-6 md:p-8 rounded-2xl border-2 border-slate-100 dark:border-slate-700/50">
                      <p className="flex items-center gap-3">
                        <span className="font-bold text-slate-800 dark:text-slate-200 min-w-[120px]">Email:</span> 
                        <span className="font-medium break-all">{emp.email}</span>
                      </p>
                      <p className="flex items-center gap-3">
                        <span className="font-bold text-slate-800 dark:text-slate-200 min-w-[120px]">Department:</span>{" "}
                        <span className="font-medium">{getDepartmentName(emp.department_id) || <span className="text-slate-400 italic">Unassigned</span>}</span>
                      </p>
                      {emp.designation && (
                        <p className="flex items-center gap-3">
                          <span className="font-bold text-slate-800 dark:text-slate-200 min-w-[120px]">Designation:</span> 
                          <span className="font-medium">{emp.designation}</span>
                        </p>
                      )}
                      {emp.joining_date && (
                        <p className="flex items-center gap-3">
                          <span className="font-bold text-slate-800 dark:text-slate-200 min-w-[120px]">Joined:</span> 
                          <span className="font-medium">{new Date(emp.joining_date).toLocaleDateString()}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-row lg:flex-col gap-3 lg:gap-4 lg:w-48">
                    <button
                      onClick={() => handleEdit(emp)}
                      className="flex-1 lg:w-full bg-slate-100 dark:bg-slate-700 hover:bg-blue-600 text-slate-700 dark:text-slate-200 hover:text-white px-6 py-3 md:py-4 rounded-xl md:rounded-2xl font-bold text-base md:text-xl transition-all shadow-sm hover:shadow-md border border-slate-200 dark:border-slate-600 hover:border-blue-600 text-center"
                    >
                      Edit Profile
                    </button>
                    <button
                      onClick={() => handleDelete(emp.id)}
                      className="flex-1 lg:w-full bg-slate-100 dark:bg-slate-700 hover:bg-red-600 text-slate-700 dark:text-slate-200 hover:text-white px-6 py-3 md:py-4 rounded-xl md:rounded-2xl font-bold text-base md:text-xl transition-all shadow-sm hover:shadow-md border border-slate-200 dark:border-slate-600 hover:border-red-600 text-center"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}

export default Employees