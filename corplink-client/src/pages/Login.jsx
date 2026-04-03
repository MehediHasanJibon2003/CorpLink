function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-6">Login</h2>
        <form className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full border border-slate-300 rounded-lg px-4 py-3 outline-none"
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full border border-slate-300 rounded-lg px-4 py-3 outline-none"
          />
          <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold">
            Login
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login