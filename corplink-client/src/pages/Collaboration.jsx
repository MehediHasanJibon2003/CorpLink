import { useState, useEffect } from "react"
import AppLayout from "../components/layout/AppLayout"
import DiscoverPanel from "../components/collaboration/DiscoverPanel"
import PartnerRequestsPanel from "../components/collaboration/PartnerRequestsPanel"
import ProposalsPanel from "../components/collaboration/ProposalsPanel"
import MessagesPanel from "../components/collaboration/MessagesPanel"
import { useAuth } from "../context/AuthContext"
import { logModuleUsage } from "../services/usageService"

const TABS = [
  { id: "discover",  label: "Discover",  icon: "🔍" },
  { id: "requests",  label: "Requests",  icon: "📫" },
  { id: "proposals", label: "Proposals", icon: "📄" },
  { id: "messages",  label: "Messages",  icon: "💬" },
]

function Collaboration() {
  const { user, profile } = useAuth()
  const [activeTab, setActiveTab] = useState("discover")

  useEffect(() => {
    if (profile) {
      logModuleUsage("Collaboration", profile.company_id, user.id)
    }
  }, [profile, user.id])

  return (
    <AppLayout
      title="Collaboration"
      subtitle="Connect with other companies, send proposals and manage corporate partnerships"
    >
      <div className="space-y-8 md:space-y-12">
        
        {/* Tab Navigation */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl md:rounded-[2.5rem] border-2 border-slate-200 dark:border-slate-700 p-3 md:p-4 shadow-sm inline-flex flex-wrap gap-4 md:gap-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 md:gap-4 px-8 py-4 md:py-6 rounded-2xl md:rounded-[1.8rem] text-lg md:text-2xl font-black transition-all ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
              }`}
            >
              <span className="text-2xl md:text-3xl">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[500px]">
          {activeTab === "discover"  && <DiscoverPanel />}
          {activeTab === "requests"  && <PartnerRequestsPanel />}
          {activeTab === "proposals" && <ProposalsPanel />}
          {activeTab === "messages"  && <MessagesPanel />}
        </div>
        
      </div>
    </AppLayout>
  )
}

export default Collaboration
