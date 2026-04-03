import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { useAuth } from "../context/AuthContext"
import AppLayout from "../components/layout/AppLayout"

function Departments() {
  const { user, profile, loading: authLoading } = useAuth()

  const [departments, setDepartments] = useState([])
  const [name, setName] = useState("")
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const fetchDepartments = async () => {
    setError("")

    const { data, error } = await supabase
      .from("departments")
      .select("*")
      .eq("company_id", profile?.company_id)
      .order("created_at", { ascending: false })

    console.log("fetch departments data:", data)
    console.log("fetch departments error:", error)

    if (error) {
      setError(error.message)
      return
    }

    setDepartments(data || [])
  }

  useEffect(() => {
    if (profile?.company_id) {
      fetchDepartments()
    }
  }, [profile?.company_id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setMessage("")

    if (!name.trim()) {
      setError("Department name দাও")
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
        const { error: updateError } = await supabase
          .from("departments")
          .update({ name: name.trim() })
          .eq("id", editingId)

        console.log("update department error:", updateError)

        if (updateError) {
          setError(updateError.message)
          setLoading(false)
          return
        }

        const { error: logError } = await supabase.from("activity_logs").insert([
          {
            company_id: profile.company_id,
            user_id: user.id,
            action: "Updated Department",
            entity: "department",
          },
        ])

        console.log("Update department log error:", logError)

        setMessage("Department updated successfully")
        setEditingId(null)
      } else {
        const { data: insertData, error: insertError } = await supabase
          .from("departments")
          .insert([
            {
              name: name.trim(),
              company_id: profile.company_id,
              created_by: user.id,
            },
          ])
          .select()

        console.log("insert department data:", insertData)
        console.log("insert department error:", insertError)

        if (insertError) {
          setError(insertError.message)
          setLoading(false)
          return
        }

        const { error: logError } = await supabase.from("activity_logs").insert([
          {
            company_id: profile.company_id,
            user_id: user.id,
            action: "Created Department",
            entity: "department",
          },
        ])

        console.log("Create department log error:", logError)

        setMessage("Department added successfully")
      }

      setName("")
      await fetchDepartments()
    } catch (err) {
      console.error("Department submit catch error:", err)
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (dept) => {
    setName(dept.name)
    setEditingId(dept.id)
    setError("")
    setMessage("")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Delete this department?")
    if (!confirmDelete) return

    setError("")
    setMessage("")

    const { error: deleteError } = await supabase
      .from("departments")
      .delete()
      .eq("id", id)

    console.log("delete department error:", deleteError)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    const { error: logError } = await supabase.from("activity_logs").insert([
      {
        company_id: profile.company_id,
        user_id: user.id,
        action: "Deleted Department",
        entity: "department",
      },
    ])

    console.log("Delete department log error:", logError)

    setMessage("Department deleted successfully")
    fetchDepartments()
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-lg font-medium text-slate-600">Loading...</p>
      </div>
    )
  }

  return (
    <AppLayout
      title="Department Management"
      subtitle="Create and manage departments for your corporate workspace"
    >
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Department Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 border border-slate-300 px-4 py-3 rounded-xl outline-none focus:border-blue-500"
            />

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium"
              >
                {loading ? "Saving..." : editingId ? "Update Department" : "Add Department"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setName("")
                    setEditingId(null)
                    setError("")
                    setMessage("")
                  }}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-6 py-3 rounded-xl font-medium"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          {error && <p className="text-red-600 text-sm mt-4">{error}</p>}
          {message && <p className="text-green-600 text-sm mt-4">{message}</p>}

          <div className="mt-4 text-sm text-slate-500 space-y-1">
            <p>
              <span className="font-semibold">Company ID:</span>{" "}
              {profile?.company_id || "N/A"}
            </p>
            <p>
              <span className="font-semibold">User ID:</span>{" "}
              {user?.id || "N/A"}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <p className="text-sm text-slate-500">Total Departments</p>
            <h3 className="text-3xl font-bold text-slate-800 mt-2">
              {departments.length}
            </h3>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <p className="text-sm text-slate-500">Current Workspace</p>
            <h3 className="text-xl font-bold text-slate-800 mt-2">
              {profile?.companies?.name || "Company"}
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h3 className="text-xl font-semibold text-slate-800">Department List</h3>
          </div>

          {departments.length === 0 ? (
            <p className="p-5 text-slate-500">No departments yet</p>
          ) : (
            <div className="divide-y divide-slate-200">
              {departments.map((dept) => (
                <div
                  key={dept.id}
                  className="p-5 flex items-center justify-between gap-4"
                >
                  <div>
                    <h4 className="text-lg font-semibold text-slate-800">
                      {dept.name}
                    </h4>
                    <p className="text-sm text-slate-500 mt-1">
                      Created on {new Date(dept.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleEdit(dept)}
                      className="text-blue-600 font-medium hover:underline"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(dept.id)}
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

export default Departments