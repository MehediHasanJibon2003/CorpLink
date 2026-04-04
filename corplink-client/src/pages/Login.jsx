import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"

function Login() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleLogin = async (e) => {
    e.preventDefault()

    if (loading) return

    setLoading(true)
    setError("")

    const { email, password } = formData

    if (!email || !password) {
      setError("Email and password দাও")
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log("login response:", data)
      console.log("login error:", error)

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      if (!data?.user) {
        setError("Login failed")
        setLoading(false)
        return
      }

      // Log the login activity
      try {
        const { data: userProfile } = await supabase.from("profiles").select("company_id").eq("id", data.user.id).single()
        if (userProfile?.company_id) {
          await supabase.from("activity_logs").insert([{
            company_id: userProfile.company_id,
            user_id: data.user.id,
            action: "System Login",
            entity: "auth",
            severity: "info",
            status: "success"
          }])
        }
      } catch (err) {
        console.error("Failed to log auth:", err)
      }

      navigate("/dashboard")
    } catch (err) {
      console.error("Login catch error:", err)
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-2">Login</h2>
        <p className="text-center text-slate-500 mb-6">
          Sign in to your account
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-600 mt-5">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="text-blue-600 font-medium">
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login