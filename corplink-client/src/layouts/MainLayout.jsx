import Navbar from "../components/Navbar";

function MainLayout({ children }) {
  return (
    <div className="w-screen h-screen bg-slate-50 flex flex-col overflow-hidden">
      <Navbar />
      <main className="flex-1 overflow-y-auto w-full">{children}</main>
    </div>
  );
}

export default MainLayout;
