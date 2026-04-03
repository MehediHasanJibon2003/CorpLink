import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"

function Register() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    companyName: "",
    adminName: "",
    email: "",
    password: "",
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setMessage("")

    const { companyName, adminName, email, password } = formData

    if (!companyName || !adminName || !email || !password) {
      setError("সব field fill up করো")
      setLoading(false)
      return
    }

    try {
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
        setError("User create হয়নি")
        setLoading(false)
        return
      }

      // 2) create company
      const { data: companyData, error: companyError } = await supabase
        .from("companies")
        .insert([
          {
            name: companyName,
            created_by: user.id,
          },
        ])
        .select()
        .single()

      if (companyError) {
        setError(companyError.message)
        setLoading(false)
        return
      }

      // 3) create profile
      const { error: profileError } = await supabase.from("profiles").insert([
        {
          id: user.id,
          company_id: companyData.id,
          full_name: adminName,
          email,
          role: "corporate_admin",
        },
      ])

      if (profileError) {
        setError(profileError.message)
        setLoading(false)
        return
      }

      setMessage("Registration successful")
      setFormData({
        companyName: "",
        adminName: "",
        email: "",
        password: "",
      })

      setTimeout(() => {
        navigate("/login")
      }, 1200)
    } catch (err) {
      console.error(err)
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-2">Register</h2>
        <p className="text-center text-slate-500 mb-6">
          Create your corporate admin account
        </p>

        <form onSubmit={handleRegister} className="space-y-4">
          <input
            type="text"
            name="companyName"
            placeholder="Company Name"
            value={formData.companyName}
            onChange={handleChange}
            className="w-full border border-slate-300 rounded-lg px-4 py-3 outline-none focus:border-blue-500"
          />

          <input
            type="text"
            name="adminName"
            placeholder="Admin Name"
            value={formData.adminName}
            onChange={handleChange}
            className="w-full border border-slate-300 rounded-lg px-4 py-3 outline-none focus:border-blue-500"
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full border border-slate-300 rounded-lg px-4 py-3 outline-none focus:border-blue-500"
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full border border-slate-300 rounded-lg px-4 py-3 outline-none focus:border-blue-500"
          />

          {error && <p className="text-red-600 text-sm">{error}</p>}
          {message && <p className="text-green-600 text-sm">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-60"
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-600 mt-5">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 font-medium">
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Register