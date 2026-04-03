import { Link } from "react-router-dom"
import MainLayout from "../layouts/MainLayout"

function Landing() {
  return (
    <MainLayout>
      <div className="min-h-screen text-slate-900">

        {/* Hero */}
        <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:px-10">
          
          <div>
            <h2 className="text-5xl font-extrabold mb-6">
              Manage your company in one platform
            </h2>

            <p className="text-gray-600 mb-6">
              Employees, tasks, departments and collaboration in one place.
            </p>

            <Link
              to="/register"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg"
            >
              Start Now
            </Link>
          </div>

        </section>

      </div>
    </MainLayout>
  )
}

export default Landing