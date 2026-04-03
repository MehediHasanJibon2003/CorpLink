function Landing() {
  return (
    <div className="min-h-screen bg-white">
      
      {/* Navbar */}
      <div className="flex justify-between items-center p-5 shadow">
        <h1 className="text-2xl font-bold text-blue-600">CorpLink</h1>
        <div className="space-x-4">
          <button className="text-gray-600">Login</button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded">
            Register
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="text-center mt-20 px-4">
        <h2 className="text-4xl font-bold mb-4">
          Unified Corporate Platform
        </h2>
        <p className="text-gray-600 mb-6">
          Manage employees, tasks, and collaboration in one place.
        </p>

        <button className="bg-blue-600 text-white px-6 py-3 rounded">
          Get Started
        </button>
      </div>

    </div>
  )
}

export default Landing