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

  const [form, setForm] = useState({
    name: "",
    email: "",
    department_id: "",
    role: "employee",
    designation: "",
    joining_date: new Date().toISOString().split('T')[0]
  })

  const fetchEmployees = async () => {
    setError("")

    const { data, error } = await supabase
      .from("employees")
      .select("*, departments(name)")
      .order("created_at", { ascending: false })

    if (error) {
      setError(error.message)
      return
    }

    setEmployees(data || [])
  }

  const fetchDepartments = async () => {
    const { data, error } = await supabase
      .from("departments")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      setError(error.message)
      return
    }

    setDepartments(data || [])
  }

  useEffect(() => {
    fetchEmployees()
    fetchDepartments()
  }, [])

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

  return (
    <AppLayout
      title="Employee Management"
      subtitle="Add, update and manage your company employees"
    >
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <form onSubmit={handleSubmit} className="grid md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Employee Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border border-slate-300 dark:border-slate-600 px-4 py-3 rounded-xl outline-none focus:border-blue-500"
            />

            <input
              type="email"
              placeholder="Employee Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="border border-slate-300 dark:border-slate-600 px-4 py-3 rounded-xl outline-none focus:border-blue-500"
            />

            <select
              value={form.department_id}
              onChange={(e) =>
                setForm({ ...form, department_id: e.target.value })
              }
              className="border border-slate-300 dark:border-slate-600 px-4 py-3 rounded-xl outline-none focus:border-blue-500"
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
              className="border border-slate-300 dark:border-slate-600 px-4 py-3 rounded-xl outline-none focus:border-blue-500"
            >
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
            </select>

            <input
              type="text"
              placeholder="Designation"
              value={form.designation}
              onChange={(e) => setForm({ ...form, designation: e.target.value })}
              className="border border-slate-300 dark:border-slate-600 px-4 py-3 rounded-xl outline-none focus:border-blue-500"
            />

            <input
              type="date"
              value={form.joining_date}
              onChange={(e) => setForm({ ...form, joining_date: e.target.value })}
              className="border border-slate-300 dark:border-slate-600 px-4 py-3 rounded-xl outline-none focus:border-blue-500"
            />

            <div className="md:col-span-4 flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium"
              >
                {loading ? "Saving..." : editingId ? "Update Employee" : "Add Employee"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-800 dark:text-slate-100 px-6 py-3 rounded-xl font-medium"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          {error && <p className="text-red-600 text-sm mt-4">{error}</p>}
          {message && <p className="text-green-600 text-sm mt-4">{message}</p>}
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Employees</p>
            <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-2">
              {employees.length}
            </h3>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
            <p className="text-sm text-slate-500 dark:text-slate-400">Managers</p>
            <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-2">
              {employees.filter((emp) => emp.role === "manager").length}
            </h3>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
            <p className="text-sm text-slate-500 dark:text-slate-400">Employees</p>
            <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-2">
              {employees.filter((emp) => emp.role === "employee").length}
            </h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Employee List</h3>
          </div>

          {employees.length === 0 ? (
            <p className="p-5 text-slate-500 dark:text-slate-400">No employees yet</p>
          ) : (
            <div className="divide-y divide-slate-200">
              {employees.map((emp) => (
                <div
                  key={emp.id}
                  className="p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                        {emp.name}
                      </h4>

                      <span
                        className={`text-xs px-3 py-1 rounded-full font-medium ${getRoleBadge(
                          emp.role
                        )}`}
                      >
                        {emp.role.charAt(0).toUpperCase() + emp.role.slice(1)}
                      </span>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3 mt-3 text-sm text-slate-600 dark:text-slate-300">
                      <p>
                        <span className="font-semibold">Email:</span> {emp.email}
                      </p>
                      <p>
                        <span className="font-semibold">Department:</span>{" "}
                        {emp.departments?.name || "No Department"}
                      </p>
                      {emp.designation && (
                        <p>
                          <span className="font-semibold">Designation:</span> {emp.designation}
                        </p>
                      )}
                      {emp.joining_date && (
                        <p>
                          <span className="font-semibold">Joined:</span> {new Date(emp.joining_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleEdit(emp)}
                      className="text-blue-600 font-medium hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(emp.id)}
                      className="text-red-600 font-medium hover:underline"
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