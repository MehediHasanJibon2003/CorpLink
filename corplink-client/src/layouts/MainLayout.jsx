import Navbar from "../components/Navbar"

function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main>{children}</main>
    </div>
  )
}

export default MainLayout