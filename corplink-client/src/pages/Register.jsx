import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"

function Register() {
  const navigate = useNavigate()

  const [mode, setMode] = useState("create") // 'create' or 'join'

  const [formData, setFormData] = useState({
    companyName: "",
    companyId: "", // used for join
    fullName: "",
    email: "",
    password: "",
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setMessage("")

    const { companyName, companyId, fullName, email, password } = formData

    if (!fullName || !email || !password) {
      setError("Please fill required fields")
      setLoading(false)
      return
    }

    if (mode === 'create' && !companyName) {
      setError("Company Name is required")
      setLoading(false); return;
    }
    if (mode === 'join' && !companyId) {
      setError("Company ID (Invite Code) is required")
      setLoading(false); return;
    }

    try {
      // If JOIN: Pre-flight check if Admin added them!
      let employeeData = null;
      if (mode === 'join') {
        const { data: cData, error: cErr } = await supabase.from("companies").select("id").eq("id", companyId).single()
        if (cErr || !cData) {
          setError("Invalid Company Code")
          setLoading(false); return;
        }

        const { data: eData } = await supabase.from("employees").select("*").eq("email", email).eq("company_id", companyId).single()
        if (!eData) {
          setError("Your email was not found. Please ask your HR/Admin to add you to the directory first.")
          setLoading(false); return;
        }
        employeeData = eData
      }

      // 1) create auth user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }

      const user = signUpData?.user

      if (!user) {
        setError("Failed to create user account.")
        setLoading(false)
        return
      }

      if (mode === 'create') {
        // 2) create company
        const { data: companyData, error: companyError } = await supabase
          .from("companies")
          .insert([{ name: companyName, created_by: user.id }])
          .select().single()

        if (companyError) {
          setError(companyError.message)
          setLoading(false); return;
        }

        // 3) create profile for Admin
        await supabase.from("profiles").insert([{
          id: user.id, company_id: companyData.id, full_name: fullName, email, role: "corporate_admin",
        }])

      } else if (mode === 'join') {
        // Create profile for Employee
        await supabase.from("profiles").insert([{
          id: user.id, company_id: companyId, full_name: fullName, email, role: employeeData.role,
        }])
        // Mark employee as onboarded
        await supabase.from("employees").update({ onboarded: true }).eq("id", employeeData.id)
      }

      setMessage("Registration successful! Redirecting...")
      setTimeout(() => { navigate("/login") }, 1200)

    } catch (err) {
      console.error(err)
      setError("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-2">Register</h2>
        
        {/* Mode Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
          <button type="button" onClick={() => {setMode("create"); setError("")}} className={`flex-1 py-2 text-sm font-semibold rounded-md transition ${mode==='create' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>Create Corporate</button>
          <button type="button" onClick={() => {setMode("join"); setError("")}} className={`flex-1 py-2 text-sm font-semibold rounded-md transition ${mode==='join' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>Join via Invite</button>
        </div>

        <p className="text-center text-slate-500 mb-6 text-sm">
          {mode === 'create' ? "Register a new company workspace." : "Join an existing workspace with your Invite ID."}
        </p>

        <form onSubmit={handleRegister} className="space-y-4">
          
          {mode === 'create' && (
            <input type="text" name="companyName" placeholder="Company Name" value={formData.companyName} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-4 py-3 outline-none focus:border-blue-500" />
          )}

          {mode === 'join' && (
            <div>
              <input type="text" name="companyId" placeholder="Company ID (Invite Code)" value={formData.companyId} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-4 py-3 outline-none focus:border-blue-500" />
              <p className="text-[11px] text-slate-400 mt-1 ml-1">Ask your HR or Admin for the Company ID</p>
            </div>
          )}

          <input type="text" name="fullName" placeholder="Your Full Name" value={formData.fullName} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-4 py-3 outline-none focus:border-blue-500" />
          
          <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-4 py-3 outline-none focus:border-blue-500" />
          
          <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-4 py-3 outline-none focus:border-blue-500" />

          {error && <p className="text-red-600 text-sm">{error}</p>}
          {message && <p className="text-green-600 text-sm">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-60"
          >
            {loading ? "Processing..." : mode === 'create' ? "Register Workspace" : "Join Workspace"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-600 mt-5">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 font-medium">Login</Link>
        </p>
      </div>
    </div>
  )
}

export default Register